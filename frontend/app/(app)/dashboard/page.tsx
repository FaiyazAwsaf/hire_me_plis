import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// TODO: fetch GET /dashboard/stats on load

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Applications" value="—" badge="total" />
        <StatCard title="Interviewing" value="—" badge="active" />
        <StatCard title="Goals" value="—" badge="completion" />
        <StatCard title="Streak" value="—" badge="days" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications by status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Chart coming in Pillar 4
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Nudges</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No nudges yet — add a CV and start applying
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, badge }: { title: string; value: string; badge: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <span className="text-3xl font-bold">{value}</span>
        <Badge variant="secondary" className="mb-1">{badge}</Badge>
      </CardContent>
    </Card>
  );
}
