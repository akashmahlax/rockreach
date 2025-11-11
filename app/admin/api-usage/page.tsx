import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb, Collections } from "@/lib/db";
import { BarChart3, Activity, TrendingUp, Clock } from "lucide-react";

interface ApiUsageRecord {
  _id?: unknown;
  endpoint?: string;
  status?: string;
  userId?: string;
  orgId?: string;
  createdAt?: Date;
  durationMs?: number;
}

export default async function APIUsagePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // Get API usage stats with aggregation
  const db = await getDb();
  
  // Get total count
  const totalCount = await db.collection(Collections.API_USAGE).countDocuments({});
  
  // Get last 100 records for recent activity
  const recentRecords = await db
    .collection(Collections.API_USAGE)
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  // Today's stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayStats = await db.collection(Collections.API_USAGE).aggregate([
    { $match: { createdAt: { $gte: todayStart } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        successful: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
        avgDuration: { $avg: '$durationMs' },
      }
    }
  ]).toArray();

  // Week's stats  
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  
  const weekStats = await db.collection(Collections.API_USAGE).aggregate([
    { $match: { createdAt: { $gte: weekStart } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        successful: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
      }
    }
  ]).toArray();

  // Endpoint breakdown
  const endpointStats = await db.collection(Collections.API_USAGE).aggregate([
    {
      $group: {
        _id: '$endpoint',
        count: { $sum: 1 },
        successful: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
        avgDuration: { $avg: '$durationMs' },
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]).toArray();

  const today = todayStats[0] || { total: 0, successful: 0, avgDuration: 0 };
  const week = weekStats[0] || { total: 0, successful: 0 };
  const successRate = totalCount > 0 
    ? Math.round((recentRecords.filter(r => r.status === 'success').length / recentRecords.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#37322F] font-serif">API Usage Monitor</h1>
          <p className="text-[#605A57] mt-2">
            Track API usage and monitor system activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{today.total}</div>
              <p className="text-xs text-[#605A57] mt-1">
                {today.successful} successful • {Math.round(today.avgDuration)}ms avg
              </p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                This Week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{week.total}</div>
              <p className="text-xs text-[#605A57] mt-1">{week.successful} successful calls</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                All Time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{totalCount}</div>
              <p className="text-xs text-[#605A57] mt-1">Total API calls</p>
            </CardContent>
          </Card>

          <Card className="border-[rgba(55,50,47,0.12)] bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[#605A57] text-xs font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Success Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-[#37322F]">{successRate}%</div>
              <p className="text-xs text-[#605A57] mt-1">Last 100 calls</p>
            </CardContent>
          </Card>
        </div>

        {/* Endpoint Breakdown */}
        <Card className="border-[rgba(55,50,47,0.12)] bg-white mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-[#37322F]">Top Endpoints</CardTitle>
            <CardDescription className="text-[#605A57]">
              Most frequently called API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            {endpointStats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#605A57]">No endpoint data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {endpointStats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-[rgba(55,50,47,0.12)] rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-[#37322F]">{stat._id || 'Unknown'}</div>
                      <div className="text-xs text-[#605A57] mt-1">
                        {stat.count} calls • {stat.successful}/{stat.count} successful • {Math.round(stat.avgDuration)}ms avg
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[#37322F]">
                        {Math.round((stat.successful / stat.count) * 100)}%
                      </div>
                      <div className="text-xs text-[#605A57]">success</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Chart Placeholder */}
        <Card className="border-[rgba(55,50,47,0.12)] bg-white mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-[#37322F]">Usage Over Time</CardTitle>
            <CardDescription className="text-[#605A57]">
              API call volume by day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border border-[rgba(55,50,47,0.12)] rounded-lg bg-[#F7F5F3]">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-[#605A57] mx-auto mb-2" />
                <p className="text-[#605A57]">Chart visualization coming soon</p>
                <p className="text-xs text-[#605A57] mt-1">
                  Install a charting library like recharts to visualize usage data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-[rgba(55,50,47,0.12)] bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-[#37322F]">Recent API Calls</CardTitle>
            <CardDescription className="text-[#605A57]">
              Latest API activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRecords.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-[#605A57] mx-auto mb-4" />
                <p className="text-[#605A57]">No API usage recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRecords.slice(0, 20).map((record: ApiUsageRecord, index: number) => (
                  <div
                    key={record._id?.toString() || index}
                    className="flex items-center justify-between p-3 border border-[rgba(55,50,47,0.12)] rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#37322F]">
                          {record.endpoint || "Unknown"}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            record.status === "success"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {record.status || "unknown"}
                        </span>
                      </div>
                      <p className="text-xs text-[#605A57] mt-1">
                        User: {record.userId || "System"} • Org: {record.orgId || "default"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#605A57]">
                        {record.createdAt ? new Date(record.createdAt).toLocaleString() : 'N/A'}
                      </p>
                      {record.durationMs && (
                        <p className="text-xs text-[#605A57] mt-1">
                          {record.durationMs}ms
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
