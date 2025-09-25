import { getRAGStatsForAdmin } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  HardDrive,
  MessageSquare,
  Calendar,
  CalendarDays,
} from "lucide-react";
import { formatBytes } from "@/lib/app-utils";

async function AdminStats() {
  try {
    const result = await getRAGStatsForAdmin();

    if (!result.success) {
      return (
        <div className="space-y-6">
          {/* Hero Metrics - Loading State */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Documents
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">
                  --
                </div>
                <p className="text-xs text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Requests
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">
                  --
                </div>
                <p className="text-xs text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    const {
      totalDocuments,
      totalStorageUsed,
      totalRequests,
      requests7Days,
      requests30Days,
    } = result.data || {
      totalDocuments: 0,
      totalStorageUsed: 0,
      totalRequests: 0,
      requests7Days: 0,
      requests30Days: 0,
    };

    return (
      <div className="space-y-6">
        {/* Hero Metrics - Most Important */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Documents
              </CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totalDocuments}
              </div>
              <p className="text-xs text-muted-foreground">Across all users</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Requests
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">
                {totalRequests}
              </div>
              <p className="text-xs text-muted-foreground">All time usage</p>
            </CardContent>
          </Card>
        </div>

        {/* Supporting Metrics - Secondary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Storage Used
              </CardTitle>
              <HardDrive className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatBytes(totalStorageUsed)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total file storage
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                7 Day Activity
              </CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {requests7Days}
              </div>
              <p className="text-xs text-muted-foreground">Recent requests</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                30 Day Activity
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {requests30Days}
              </div>
              <p className="text-xs text-muted-foreground">Monthly usage</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load admin statistics</p>
      </div>
    );
  }
}

export default function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor RAG platform health and document processing analytics.
        </p>
      </div>

      <AdminStats />
    </div>
  );
}
