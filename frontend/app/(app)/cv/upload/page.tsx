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
import { Upload, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

// TODO: wire up POST /cv/upload → poll GET /cv/status → useCvStore

export default function UploadPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resume Uploader</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Upload your existing resume to get started
          </p>
        </div>
        <Link href="/cv/builder">
          <Button className="flex items-center gap-2">
            New Resume
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

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

      <div>
        <h2 className="font-semibold mb-4">How it works</h2>
        <ul className="space-y-3 text-sm text-neutral-700">
          <li className="flex gap-3">
            <Badge variant="outline" className="mt-1 flex-shrink-0">1</Badge>
            <span>Upload your resume PDF or DOCX file</span>
          </li>
          <li className="flex gap-3">
            <Badge variant="outline" className="mt-1 flex-shrink-0">2</Badge>
            <span>We parse and classify it into sections</span>
          </li>
          <li className="flex gap-3">
            <Badge variant="outline" className="mt-1 flex-shrink-0">3</Badge>
            <span>Content is embedded and stored in our vector database</span>
          </li>
          <li className="flex gap-3">
            <Badge variant="outline" className="mt-1 flex-shrink-0">4</Badge>
            <span>Your resume is now ready for AI-powered matching and insights</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
