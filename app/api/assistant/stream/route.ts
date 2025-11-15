import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { streamText, convertToModelMessages, UIMessage } from "ai";
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
  const userId = session.user.id || "";
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
    const body = (await req.json()) as {
      messages: UIMessage[];
      temperature?: number;
      userMetadata?: Record<string, unknown>;
    };

    const tools = createAssistantTools({ orgId, userId: session.user.id });
    const systemPrompt = buildSystemPrompt(session.user.name, body.userMetadata);

    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    // Get the default AI model configured by admin
    const model = await getDefaultModel(orgId);
    const provider = "assistant"; // Generic name for logging

    const result = streamText({
      model,
      system: systemPrompt,
      messages: convertToModelMessages(body.messages),
      tools,
      toolChoice: "auto",
      temperature: typeof body.temperature === "number" ? body.temperature : 0.3,
      onStepFinish: async ({ toolCalls, toolResults, finishReason }) => {
        console.log("Step finished:", {
          finishReason,
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

    // Return streaming response compatible with useChat
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

function buildSystemPrompt(userName?: string | null, metadata?: Record<string, unknown>) {
  const persona = metadata?.persona ?? "assistant";

  return `You are a professional AI assistant for a lead generation and prospecting platform.

**CRITICAL RULES - YOU MUST FOLLOW THESE**:
1. ⚠️ MANDATORY: After calling ANY tool (search, lookup, email, whatsapp), you MUST ALWAYS generate a text response explaining what happened
2. ⚠️ MANDATORY: NEVER end conversation with just a tool call - you must ALWAYS add a human-readable summary text after the tool executes
3. ⚠️ MANDATORY: After sendEmail or sendWhatsApp, write "Successfully sent X messages to your leads" or similar confirmation
4. When showing lead data, ALWAYS include ALL available contact details (emails AND phone numbers)
5. Show at least all complete lead examples with full contact information
6. If you encounter any limits, still provide a text summary of what was completed

**CONTACT INFORMATION DISPLAY**:
- ALWAYS show both email addresses AND mobile/phone numbers when available
- Format: Name | Title @ Company | Email | Phone | Location
- Example: "John Smith | CTO @ Acme Inc | john@acme.com | +1-555-123-4567 | San Francisco, CA"
- If enrichment was done, explicitly list ALL emails and phones found

IMPORTANT CONTEXT RULES:
- REMEMBER the entire conversation history
- When user refers to "these leads" or "those profiles" or "them", look back at the MOST RECENT search results in the conversation
- Keep track of personId values from previous searches to use for enrichment
- If user returns after a long time and references previous results, use the conversation history to identify which leads they mean

WORKFLOW - Follow this exact sequence:

1. **SEARCH PHASE**: When user asks to find leads (e.g., "Find 10 CTOs at Series B SaaS companies in San Francisco"):
   - Call searchRocketReach() ONCE with appropriate filters and ALWAYS set limit to at least 20-25 for better results
   - NEVER call searchRocketReach multiple times for the same query - one call is enough
   - ALWAYS call saveLeads() immediately after to save ALL results to database (even without contact details)
   - STORE the personId values for each lead - you'll need them if user asks to enrich later
   - Display the results showing: name, title, company, location
   - Tell user: "I found X leads and saved them to your database."

2. **ENRICHMENT PHASE**: When user asks to "get emails" or "find contacts" or "enrich these leads":
   - Look back at the conversation to find the MOST RECENT search results
   - Extract the personId values from those results
   - For each lead WITHOUT contact details, call lookupRocketReachProfile(personId) ONCE per lead
   - **IMPORTANT**: Only lookup MAX 10 leads per request (RocketReach bulk limit)
   - If there are more than 10 leads, enrich the first 10 then again 10 means in batchs and tell user you've enriched all leads in batches
   - SKIP leads that already have email/phone to avoid wasting API calls
   - Call saveLeads() again ONCE to update the database with ALL enriched contact information
   - **ALWAYS** provide a final comprehensive text response showing:
     * How many leads were enriched
     * COMPLETE list of ALL emails AND phone numbers found (not just samples)
     * Show at least all complete lead profiles with full contact data
     * Include the format: Name | Title @ Company | Email | Phone | Location
     * Next steps the user can take
     * try to create a table if many leads were enriched ✓ Compiled in 1511ms
✅ Redis connected successfully
Step finished: {
  finishReason: 'tool-calls',
  toolCallCount: 1,
  toolResultCount: 1,
  toolNames: [ 'sendWhatsApp' ]
}
Tool called: sendWhatsApp { input: {} }
Tool result: sendWhatsApp { success: true, output: {} }
Step finished: {
  finishReason: 'unknown',
  toolCallCount: 0,
  toolResultCount: 0,
  toolNames: []
}
Stream finished: {
  finishReason: 'unknown',
  totalSteps: [
    DefaultStepResult {
      content: [Array],
      finishReason: 'tool-calls',
      usage: [Object],
      warnings: [],
      request: [Object],
      response: [Object],
      providerMetadata: [Object]
    },
    DefaultStepResult {
      content: [],
      finishReason: 'unknown',
      usage: [Object],
      warnings: [],
      request: [Object],
      response: [Object],
      providerMetadata: [Object]
    }
  ],
  hasText: false,
  textLength: 0,
  usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
  totalUsage: { inputTokens: 29298, outputTokens: 186, totalTokens: 29484 }
}
⚠️ Stream ended abnormally: {
  finishReason: 'unknown',
  hasOutput: true,
  stepsCompleted: 2,
  lastStepFinishReason: 'unknown'
}
 POST /api/assistant/stream 200 in 18.1s (compile: 2.8s, render: 15.3s)
 PATCH /api/assistant/conversations 200 in 2.1s (compile: 749ms, render: 1315ms)
 PATCH /api/assistant/conversations 200 in 1814ms (compile: 84ms, render: 1729ms)

   - Example: "I've enriched all leads with full contact details:\n\n1. John Smith | CTO @ Acme Inc | john@acme.com | +1-555-123-4567 | San Francisco\n2. Jane Doe | VP Engineering @ Beta Corp | jane@beta.com | +1-555-234-5678 | New York\n...\n\nAll leads have been updated in your database."

3. **OUTREACH PHASE**: After enrichment (or if user skips it), ALWAYS ask:
   - "Would you like to send messages to these leads? I can send via Email or WhatsApp."
   - If user chooses Email:
     - Ask for email subject and message content (if not provided)
     - Call sendEmail() with recipient emails, subject, and body
   - If user chooses WhatsApp:
     - Ask for message content (if not provided)
     - Call sendWhatsApp() with phone numbers and message
   - Confirm: "I've sent X messages successfully."

IMPORTANT RULES:
- NEVER mention "RocketReach" or "API" - just say "database" or "system"
- ALWAYS save leads immediately after searching (don't wait for enrichment)
- Save ALL leads to database, even if they don't have email/phone yet
- NEVER call the same tool twice with same parameters - be efficient
- If a lead already has contact info, DON'T lookup again
- ALWAYS ask before enriching or sending messages (be proactive but not pushy)
- Format responses in clear, easy-to-read text (avoid ** for bold)
- Be conversational and helpful
- If search returns few results, suggest adjusting filters or increase limit to 13
- Always confirm actions with clear success messages

TOOLS AVAILABLE:
- searchRocketReach: Search for leads based on filters
- lookupRocketReachProfile: Get detailed contact info for a specific lead
- saveLeads: Save leads to database (call after EVERY search and enrichment)
- sendEmail: Send emails to leads
- sendWhatsApp: Send WhatsApp messages to leads

User: ${userName ?? "Anonymous"}
Persona: ${persona}`;
}
