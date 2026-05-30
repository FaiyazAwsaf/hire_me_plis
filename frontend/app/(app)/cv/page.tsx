import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, CheckCircle2 } from "lucide-react";

// TODO: wire up POST /cv/upload → poll GET /cv/status → useCvStore

export default function CvPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">CV Builder</h1>

      {/* Upload section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload your CV</CardTitle>
          <CardDescription>
            PDF or DOCX, max 10 MB. We'll parse, classify, and embed it automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-center rounded-lg border border-dashed h-36 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8" />
              <span className="text-sm">Click or drag to upload</span>
            </div>
          </div>

          {/* Processing status badge — shown while pipeline runs */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground hidden">
            <span className="animate-pulse h-2 w-2 rounded-full bg-yellow-400" />
            Processing… this takes about 30 seconds
          </div>

          <div className="flex items-center gap-2 text-sm text-green-600 hidden">
            <CheckCircle2 className="h-4 w-4" />
            CV embedded and ready
          </div>

          <Button type="button" className="w-full" disabled>
            Upload
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Profile sections — all read-only placeholders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Your Profile</h2>
          <Badge variant="outline">No CV yet</Badge>
        </div>

        {(["Personal", "Experience", "Education", "Skills", "Projects", "Certifications"] as const).map(
          (section) => (
            <Card key={section}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">{section}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground pb-4">
                {/* TODO: render PATCH /cv/profile section editor */}
                Upload a CV or add entries manually to populate this section.
              </CardContent>
            </Card>
          )
        )}
      </div>

      <Button variant="outline" disabled className="w-full">
        Export PDF
      </Button>
    </div>
  );
}
