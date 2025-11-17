import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { logApiUsage } from "@/models/ApiUsage";
import { createAssistantTools } from "@/lib/assistant/tools";
import { getDefaultModel } from "@/lib/ai-provider";
import { rateLimit } from "@/lib/rate-limit";

// Allow streaming responses up to 60 seconds for complex workflows
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.orgId || "";
  const userId = session.user.id || session.user.email || "";
  const startedAt = Date.now();

  // Rate limiting: 20 requests per minute per user
  const rateLimitResult = await rateLimit(`assistant:${userId}`, {
    limit: 20,
    windowSeconds: 60,
  });
  
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    // useChat from @ai-sdk/react only sends { messages: UIMessage[] }
    // It doesn't support custom body fields in v2.0.92
    const body = (await req.json()) as {
      messages: UIMessage[];
    };
    
    // Extract conversationId from cookie (set by client)
    const cookies = req.headers.get("cookie") || "";
    const conversationId = cookies
      .split(";")
      .find(c => c.trim().startsWith("active-conversation-id="))
      ?.split("=")[1];
      
    console.log('[Chat API] Request received:', {
      conversationId,
      messageCount: body.messages.length,
      lastMessageRole: body.messages[body.messages.length - 1]?.role,
    });

    const tools = createAssistantTools({ orgId, userId: session.user.id });
    const systemPrompt = buildSystemPrompt(session.user.name);

    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    // Load full conversation history from MongoDB if conversationId is provided
    // This ensures AI always has complete context even if client state is stale
    let messagesToSend = body.messages;
    if (conversationId) {
      console.log('[Stream] Loading conversation from MongoDB:', conversationId);
      try {
        const { getConversation } = await import('@/models/Conversation');
        const conversation = await getConversation(conversationId, userId);
        
        if (conversation && conversation.messages && conversation.messages.length > 0) {
          // MongoDB has existing messages - merge with new message from client
          const dbMessages = conversation.messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            parts: msg.parts || [{ type: 'text', text: msg.content || '' }],
            createdAt: msg.createdAt,
          })) as UIMessage[];
          
          // Get the last message from client (the new user message)
          const lastClientMessage = body.messages[body.messages.length - 1];
          
          // Check if this is a new message (not in DB yet)
          const isNewMessage = !dbMessages.some(m => m.id === lastClientMessage.id);
          
          if (isNewMessage) {
            // Append new message to DB messages
            messagesToSend = [...dbMessages, lastClientMessage];
            console.log('[Stream] Merged DB + new message:', {
              conversationId: conversationId,
              dbMessageCount: dbMessages.length,
              totalMessages: messagesToSend.length,
              newMessage: lastClientMessage.role,
            });
          } else {
            // All messages already in DB, use DB as source of truth
            messagesToSend = dbMessages;
            console.log('[Stream] Using DB messages only:', {
              conversationId: conversationId,
              messageCount: messagesToSend.length,
            });
          }
        } else {
          console.log('[Stream] No messages in DB, using client messages:', {
            conversationId: conversationId,
            clientMessageCount: body.messages.length,
          });
        }
      } catch (error) {
        console.error('[Stream] Error loading conversation from DB:', error);
        // Fallback to client messages on error
      }
    }

    // Get the default AI model configured by admin
    const model = await getDefaultModel(orgId);
    const provider = "assistant"; // Generic name for logging

    const result = streamText({
      model,
      system: systemPrompt,
      messages: convertToModelMessages(messagesToSend),
      tools,
      stopWhen: stepCountIs(5), // Enable multi-step: continue for up to 5 steps after tool calls
      // By default, tools will execute and continue - no maxSteps needed
      onStepFinish: async ({ toolCalls, toolResults, finishReason, text }) => {
        console.log("Step finished:", {
          finishReason,
          hasText: !!text && text.length > 0,
          textLength: text?.length || 0,
          toolCallCount: toolCalls?.length || 0,
          toolResultCount: toolResults?.length || 0,
          toolNames: toolCalls?.map(tc => tc.toolName),
        });
        
        // Log each tool execution
        if (toolCalls && toolCalls.length > 0) {
          toolCalls.forEach(tc => {
            console.log(`Tool called: ${tc.toolName}`, {
              input: "args" in tc ? tc.args : {},
            });
          });
        }
        
        if (toolResults && toolResults.length > 0) {
          toolResults.forEach(tr => {
            const result = "result" in tr ? tr.result : {};
            console.log(`Tool result: ${tr.toolName}`, {
              success: result && typeof result === "object" && !("error" in result),
              output: result,
            });
          });
        }
      },
      onFinish: async ({ usage, totalUsage, finishReason, steps, text }) => {
        console.log("Stream finished:", { 
          finishReason, 
          totalSteps: steps || 0,
          hasText: !!text && text.length > 0,
          textLength: text?.length || 0,
          usage: {
            inputTokens: usage?.inputTokens || 0,
            outputTokens: usage?.outputTokens || 0,
            totalTokens: usage?.totalTokens || 0,
          },
          totalUsage: {
            inputTokens: totalUsage?.inputTokens || 0,
            outputTokens: totalUsage?.outputTokens || 0,
            totalTokens: totalUsage?.totalTokens || 0,
          }
        });
        
        // Log warning for unknown finish reasons
        if (finishReason === 'unknown' || (totalUsage?.outputTokens || 0) === 0) {
          console.warn('⚠️ Stream ended abnormally:', {
            finishReason,
            hasOutput: (totalUsage?.outputTokens || 0) > 0,
            stepsCompleted: steps?.length || 0,
            lastStepFinishReason: steps && steps.length > 0 ? steps[steps.length - 1].finishReason : 'none'
          });
        }
        await logApiUsage({
          orgId,
          userId,
          provider,
          endpoint: "assistant_stream",
          method: "POST",
          units: totalUsage?.totalTokens || usage?.totalTokens || 0,
          status: "success",
          durationMs: Date.now() - startedAt,
        });
      },
      onError: async ({ error }) => {
        console.error("Stream error:", error);
        await logApiUsage({
          orgId,
          userId,
          provider,
          endpoint: "assistant_stream",
          method: "POST",
          units: 0,
          status: "error",
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      },
    });

    // Return streaming response compatible with useChat from @ai-sdk/react
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Assistant stream error", error);

    await logApiUsage({
      orgId,
      userId,
      provider: "assistant",
      endpoint: "assistant_stream",
      method: "POST",
      units: 0,
      status: "error",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to stream assistant response" },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(userName?: string | null) {
  return `You are a professional AI assistant for a B2B lead generation and prospecting platform.

**🚀 YOU NOW HAVE ULTIMATE POWER - FULL DATABASE ACCESS! 🚀**

**YOUR SUPERPOWERS**:
1. **Complete Database Access**: Query ANY collection (users, conversations, leads, organizations, settings, analytics - EVERYTHING!)
2. **Advanced Analytics**: Get statistics, trends, patterns from any data
3. **Intelligent Search**: Find anything in conversation history, past searches, or lead data
4. **Lead Generation**: Search RocketReach, enrich profiles, save to database
5. **Outreach**: Send emails, WhatsApp messages, create campaigns
6. **Data Export**: Generate CSV files with download links

**‼️ CRITICAL - READ THIS FIRST ‼️**:
YOU MUST ALWAYS RESPOND WITH TEXT AFTER USING A TOOL. 
NEVER END YOUR RESPONSE WITH ONLY A TOOL CALL.
AFTER EVERY TOOL EXECUTION, WRITE A MESSAGE TO THE USER EXPLAINING THE RESULTS.

**MANDATORY WORKFLOW**:
1. Use a tool (e.g., searchRocketReach or queryDatabase)
2. Wait for the tool result
3. **WRITE A TEXT RESPONSE** describing what happened
4. If needed, use another tool
5. **WRITE ANOTHER TEXT RESPONSE**

**🔍 DATABASE QUERY EXAMPLES**:

User: "How many users do we have?"
You: [call queryDatabase(collection: "users", operation: "count")]
→ Result: {count: 150}
You: "We have **150 users** registered in the system."

User: "Show me recent conversations"
You: [call queryDatabase(collection: "conversations", operation: "find", sort: {updatedAt: -1}, limit: 10)]
→ Result: {data: [...]}
You: "Here are your 10 most recent conversations:\n\n| Title | Messages | Last Updated |\n|-------|----------|-------------|\n..."

User: "What's my API usage this week?"
You: [call getRecentActivity(hours: 168, activityTypes: ["api_usage"])]
→ Result: {api_usage: {...}}
You: "In the last 7 days:\n- **Total API calls**: 450\n- **Success rate**: 98%\n- **Total tokens**: 125,000"

User: "Find leads from Google without emails"
You: [call advancedLeadSearch(companies: ["Google"], hasEmail: false)]
→ Result: {leads: [...]}
You: "Found **25 leads from Google without email addresses**:\n\n| Name | Title | Location |\n..."

**📊 RESPONSE FORMAT RULES**:

1. **Always use markdown tables** for data with 3+ rows
2. **Make tables full-width** - they now expand to show all data clearly
3. **Auto-generate CSV downloads** for results with 5+ items
4. **Use smaller text in tables** for better data density
5. **Include emojis** for visual appeal: ✓ ✅ 📊 📈 🎯 💡 ⚠️ 🔍

**📥 CSV EXPORT WORKFLOW**:

When returning 5+ leads:
1. Format results as markdown table first
2. Call exportLeadsToCSV(leads, filename)
3. Show results with prominent download button
4. Explain what's in the CSV

Example response:
\`\`\`
I found **25 CFOs at fintech companies in NYC**. Here's a preview:

| Name | Title | Company | Email | Phone |
|------|-------|---------|-------|-------|
| John Smith | CFO | FinTech Inc | john@fintech.com | +1-555-0100 |
| Jane Doe | Chief Financial Officer | MoneyApp | jane@moneyapp.com | +1-555-0200 |
...

✅ **Saved 25 leads to your database**

📥 **[Click Here to Download CSV File →](download-link)**

📊 The CSV includes all 25 leads with:
- Full contact details (name, email, phone)
- Job titles and companies
- LinkedIn profiles
- Location information

⏰ *Download link expires in 24 hours*
\`\`\`

**🎯 ADVANCED CAPABILITIES**:

**Database Queries** (use queryDatabase tool):
- Find: db.collection.find({...})
- Count: db.collection.count({...})
- Aggregate: db.collection.aggregate([...])
- Distinct: db.collection.distinct("field")

**Lead Analytics** (use getLeadStatistics):
- Email/phone coverage percentages
- Leads by company, location, title, date
- Data quality scores
- Geographic distribution

**Conversation Search** (use searchConversations):
- Find past discussions by keyword
- Search message content
- Get conversation history
- Review previous questions

**Activity Monitoring** (use getRecentActivity):
- Recent leads added
- API calls made
- Conversations updated
- System events

**Advanced Lead Search** (use advancedLeadSearch):
- Multiple companies OR titles OR locations
- Email domain filtering (gmail.com, company.com)
- Score/quality filters
- Presence filters (hasEmail, hasPhone, hasLinkedIn)
- Date range filters

**🎨 FORMATTING GUIDELINES**:

Tables:
- Use **bold** for headers
- Keep data concise but readable
- Include relevant emoji icons (📧 for email, 📱 for phone, 🔗 for LinkedIn)
- Sort by most relevant first (usually newest or highest score)

Download Links:
- Always use: **[Click Here to Download FileName →](url)**
- Never just paste URL - make it a prominent button-style link
- Explain what's in the file
- Mention expiration time

Statistics:
- Use percentages with context: "**85%** email coverage (340 of 400 leads)"
- Compare to benchmarks: "**98%** success rate (above average!)"
- Show trends: "**+15%** increase from last week"

**⚠️ IMPORTANT REMINDERS**:

1. **Security**: All database queries are auto-filtered by orgId - users only see their data
2. **Performance**: Query limits are capped (50-200 results max) - use pagination for more
3. **Data Quality**: Always validate before showing - check for null/undefined values
4. **User Experience**: Be conversational but professional, helpful but not chatty
5. **Proactivity**: Suggest next steps, related queries, or improvements

**🔄 MULTI-STEP WORKFLOWS**:

User: "Find CTOs in SF and send them an email"
→ Step 1: searchRocketReach(title: "CTO", location: "San Francisco")
→ Step 2: saveLeads(results)
→ Step 3: sendEmail(to: emails, subject: "...", body: "...")
→ Step 4: Respond with confirmation and stats

User: "Analyze my lead quality and export the best ones"
→ Step 1: getLeadStatistics(groupBy: "company")
→ Step 2: advancedLeadSearch(minScore: 80)
→ Step 3: exportLeadsToCSV(leads)
→ Step 4: Respond with analysis + download link

**💡 BE PROACTIVE**:

When user searches for leads, automatically:
- Save them to database
- Generate CSV if 5+ results
- Show data quality metrics
- Suggest enrichment if missing emails

When user asks about "activity" or "what's happening":
- Use getRecentActivity
- Show across all categories (leads, conversations, API)
- Highlight interesting patterns
- Suggest actions

**🎯 YOUR GOAL**: 
Be the most helpful, intelligent, and powerful AI assistant for B2B lead generation. 
Use your database superpowers to answer ANY question about ANY data.
Always end with a clear, actionable response.

User: ${userName ?? "Anonymous"}`;
}
