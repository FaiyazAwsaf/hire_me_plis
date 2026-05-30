import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// TODO: fetch GET /applications → render dnd-kit Kanban
// TODO: PATCH /applications/:id/status on drag-and-drop

const COLUMNS = [
  { id: "applied",      label: "Applied",      color: "bg-blue-500" },
  { id: "interviewing", label: "Interviewing",  color: "bg-yellow-500" },
  { id: "offer",        label: "Offer",         color: "bg-green-500" },
  { id: "rejected",     label: "Rejected",      color: "bg-red-500" },
] as const;

export default function TrackerPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Application Tracker</h1>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add application
        </Button>
      </div>

      {/* Kanban board skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((col) => (
          <div key={col.id} className="flex flex-col gap-3 min-w-[260px]">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
              <span className="font-medium text-sm">{col.label}</span>
              <Badge variant="secondary" className="ml-auto">0</Badge>
            </div>

            {/* Drop zone — cards added here by dnd-kit */}
            <div className="flex-1 min-h-[200px] rounded-lg border border-dashed bg-muted/20 p-2 space-y-2">
              <Card className="opacity-40 cursor-not-allowed select-none">
                <CardHeader className="pb-1 pt-3 px-3">
                  <CardTitle className="text-sm">Software Engineer</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 text-xs text-muted-foreground">
                  Acme Corp · applied today
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
