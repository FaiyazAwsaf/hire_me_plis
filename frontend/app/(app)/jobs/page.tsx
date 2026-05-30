import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// TODO: wire up POST /jobs/search → useJobsStore

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Job Hunter</h1>

      {/* Search bar */}
      <div className="flex gap-2 max-w-2xl">
        <Input placeholder="e.g. ML internships in Dhaka this month" className="flex-1" />
        <Button type="button">Search</Button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed h-64 text-muted-foreground">
        <p className="font-medium">No results yet</p>
        <p className="text-sm mt-1">Enter a natural-language query and hit Search</p>
      </div>

      {/* Results grid — placeholder cards */}
      {/* TODO: render results grid here once search is wired up */}
      <div className="hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <JobCard key={i} />
        ))}
      </div>
    </div>
  );
}

function JobCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">Software Engineer</CardTitle>
          <Badge>82</Badge>
        </div>
        <CardDescription>Acme Corp · Dhaka, BD</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-1">
        <p>$60k – $80k · Deadline: 2025-07-01</p>
        <p className="line-clamp-2">
          Strong match on Python and FastAPI. Missing cloud experience.
        </p>
        <a
          href="#"
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2 w-full")}
        >
          View posting
        </a>
      </CardContent>
    </Card>
  );
}
