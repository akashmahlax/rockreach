import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "30d";
  const orgId = searchParams.get("orgId") || session.user.orgId || "";

  try {
    const db = await getDb();

    // Calculate date range
    const now = new Date();
    let startDate = new Date(0);
    
    if (period === "24h") {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (period === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get AI API usage by user
    const aiUsageByUser = await db.collection(Collections.API_USAGE).aggregate([
      {
        $match: {
          orgId,
          provider: "assistant",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$userId",
          totalTokens: { $sum: "$units" },
          totalCalls: { $sum: 1 },
          successCalls: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
          errorCalls: { $sum: { $cond: [{ $eq: ["$status", "error"] }, 1, 0] } },
          avgDurationMs: { $avg: "$durationMs" },
        },
      },
      {
        $lookup: {
          from: Collections.USERS,
          localField: "_id",
          foreignField: "id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          userId: "$_id",
          userName: "$user.name",
          userEmail: "$user.email",
          totalTokens: 1,
          totalCalls: 1,
          successCalls: 1,
          errorCalls: 1,
          avgDurationMs: { $round: "$avgDurationMs" },
          estimatedCost: { $multiply: [{ $divide: ["$totalTokens", 1000] }, 0.045] },
        },
      },
      {
        $sort: { totalTokens: -1 },
      },
    ]).toArray();

    // Get RocketReach API usage by user
    const rocketReachUsageByUser = await db.collection(Collections.API_USAGE).aggregate([
      {
        $match: {
          orgId,
          provider: "rocketreach",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$userId",
          totalCalls: { $sum: 1 },
          searchCalls: { $sum: { $cond: [{ $eq: ["$endpoint", "search"] }, 1, 0] } },
          lookupCalls: { $sum: { $cond: [{ $eq: ["$endpoint", "lookup"] }, 1, 0] } },
          successCalls: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: Collections.USERS,
          localField: "_id",
          foreignField: "id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          userId: "$_id",
          userName: "$user.name",
          userEmail: "$user.email",
          totalCalls: 1,
          searchCalls: 1,
          lookupCalls: 1,
          successCalls: 1,
        },
      },
      {
        $sort: { totalCalls: -1 },
      },
    ]).toArray();

    // Get conversation stats by user
    const conversationStatsByUser = await db.collection(Collections.CONVERSATIONS).aggregate([
      {
        $match: {
          orgId,
          createdAt: { $gte: startDate },
          deletedAt: { $exists: false },
        },
      },
      {
        $group: {
          _id: "$userId",
          totalConversations: { $sum: 1 },
          totalMessages: { $sum: { $size: "$messages" } },
        },
      },
      {
        $lookup: {
          from: Collections.USERS,
          localField: "_id",
          foreignField: "id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          userId: "$_id",
          userName: "$user.name",
          userEmail: "$user.email",
          totalConversations: 1,
          totalMessages: 1,
        },
      },
      {
        $sort: { totalMessages: -1 },
      },
    ]).toArray();

    // Overall summary
    const summary = {
      totalUsers: aiUsageByUser.length,
      totalAICost: aiUsageByUser.reduce((sum, u) => sum + (u.estimatedCost || 0), 0),
      totalAITokens: aiUsageByUser.reduce((sum, u) => sum + u.totalTokens, 0),
      totalAICalls: aiUsageByUser.reduce((sum, u) => sum + u.totalCalls, 0),
      totalRocketReachCalls: rocketReachUsageByUser.reduce((sum, u) => sum + u.totalCalls, 0),
      totalConversations: conversationStatsByUser.reduce((sum, u) => sum + u.totalConversations, 0),
      totalMessages: conversationStatsByUser.reduce((sum, u) => sum + u.totalMessages, 0),
    };

    return NextResponse.json({
      period,
      summary,
      aiUsageByUser,
      rocketReachUsageByUser,
      conversationStatsByUser,
    });
  } catch (error) {
    console.error("Error fetching admin analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
