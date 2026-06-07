"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useCvStore, type CvProfile, type CvStatus } from "@/store/cv";

const STATUS_LABEL: Record<CvStatus, string> = {
  pending:    "Queued…",
  processing: "Extracting text…",
  embedding:  "Embedding chunks…",
  done:       "Ready",
  error:      "Processing failed",
};

export default function CvPage() {
  const { meta, profile, isUploading, setMeta, setStatus, setProfile, setUploading } =
    useCvStore();

  const [noCv, setNoCv]           = useState(false);
  const [editSection, setEdit]    = useState<string | null>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const pollRef                   = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef              = useRef<HTMLInputElement>(null);

  // On mount: check if CV exists and load profile
  useEffect(() => {
    api
      .get<{ cv_id: string; filename: string; uploaded_at: string; status: CvStatus }>("/cv")
      .then((r) => {
        setMeta({ cvId: r.data.cv_id, filename: r.data.filename, uploadedAt: r.data.uploaded_at, status: r.data.status });
        if (r.data.status === "done") {
          api.get<CvProfile>("/cv/profile").then((p) => setProfile(p.data)).catch(console.error);
        } else if (r.data.status !== "error") {
          startPolling();
        }
      })
      .catch((err) => {
        if (err?.response?.status === 404) setNoCv(true);
      });

    return () => stopPolling();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.get<{ cv_id: string; status: CvStatus }>("/cv/status");
        setStatus(r.data.status);
        if (r.data.status === "done") {
          stopPolling();
          setUploading(false);
          const p = await api.get<CvProfile>("/cv/profile");
          setProfile(p.data);
          setNoCv(false);
        } else if (r.data.status === "error") {
          stopPolling();
          setUploading(false);
        }
      } catch {
        stopPolling();
        setUploading(false);
      }
    }, 2000);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);

    try {
      const r = await api.post<{ cv_id: string; status: CvStatus }>("/cv/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMeta({ cvId: r.data.cv_id, filename: file.name, uploadedAt: new Date().toISOString(), status: r.data.status });
      setNoCv(false);
      startPolling();
    } catch {
      setUploading(false);
      alert("Upload failed. Check file type (PDF/DOCX, max 10 MB).");
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const r = await api.post<{ download_url: string }>("/cv/export");
      setExportUrl(r.data.download_url);
      window.open(r.data.download_url, "_blank", "noopener");
    } catch {
      alert("Export failed.");
    } finally {
      setExporting(false);
    }
  }

  async function handlePatchSection(section: keyof Omit<CvProfile, "updated_at">, value: unknown) {
    try {
      const r = await api.patch<CvProfile>("/cv/profile", { [section]: value });
      setProfile(r.data);
      setEdit(null);
    } catch {
      alert("Save failed.");
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">CV Builder</h1>
        {meta?.status === "done" && (
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? "Generating…" : "Export PDF"}
          </Button>
        )}
      </div>

      {/* Upload zone */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Upload CV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {meta ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{meta.filename}</span>
              <Badge
                variant={meta.status === "done" ? "default" : meta.status === "error" ? "destructive" : "secondary"}
              >
                {STATUS_LABEL[meta.status]}
              </Badge>
              {isUploading && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Processing…
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {noCv ? "No CV uploaded yet." : "Checking…"}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {meta ? "Re-upload" : "Upload PDF / DOCX"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile sections */}
      {profile && (
        <div className="space-y-4">

          {/* Personal */}
          <ProfileSection
            title="Personal"
            onEdit={() => setEdit(editSection === "personal" ? null : "personal")}
            isEditing={editSection === "personal"}
          >
            {editSection === "personal"
              ? <PersonalEditor profile={profile} onSave={(v) => handlePatchSection("personal", v)} onCancel={() => setEdit(null)} />
              : (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {(["name","email","phone","location","linkedin","github"] as const).map((k) => (
                    profile.personal[k] && (
                      <div key={k}>
                        <dt className="text-xs text-muted-foreground capitalize">{k}</dt>
                        <dd className="truncate">{profile.personal[k]}</dd>
                      </div>
                    )
                  ))}
                  {profile.personal.summary && (
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">Summary</dt>
                      <dd className="text-muted-foreground/80 leading-relaxed">{profile.personal.summary}</dd>
                    </div>
                  )}
                </dl>
              )
            }
          </ProfileSection>

          {/* Skills */}
          <ProfileSection
            title="Skills"
            onEdit={() => setEdit(editSection === "skills" ? null : "skills")}
            isEditing={editSection === "skills"}
          >
            {editSection === "skills"
              ? <SkillsEditor skills={profile.skills} onSave={(v) => handlePatchSection("skills", v)} onCancel={() => setEdit(null)} />
              : (
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                  {profile.skills.length === 0 && <p className="text-sm text-muted-foreground">None listed.</p>}
                </div>
              )
            }
          </ProfileSection>

          {/* Experience */}
          <ProfileSection title="Experience" onEdit={() => setEdit(null)} isEditing={false}>
            <div className="space-y-3">
              {profile.experience.map((exp) => (
                <div key={exp.id} className="border-l-2 border-border pl-3">
                  <p className="text-sm font-medium">{exp.role}</p>
                  <p className="text-xs text-muted-foreground">{exp.company} · {exp.start_date} – {exp.end_date ?? "Present"}</p>
                  <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed">{exp.description}</p>
                </div>
              ))}
              {profile.experience.length === 0 && <p className="text-sm text-muted-foreground">No experience entries.</p>}
            </div>
          </ProfileSection>

          {/* Education */}
          <ProfileSection title="Education" onEdit={() => setEdit(null)} isEditing={false}>
            <div className="space-y-3">
              {profile.education.map((edu) => (
                <div key={edu.id} className="border-l-2 border-border pl-3">
                  <p className="text-sm font-medium">{edu.degree}</p>
                  <p className="text-xs text-muted-foreground">{edu.institution} · {edu.start_date} – {edu.end_date ?? "Present"}</p>
                  {edu.grade && <p className="text-xs text-muted-foreground/60 mt-0.5">{edu.grade}</p>}
                </div>
              ))}
              {profile.education.length === 0 && <p className="text-sm text-muted-foreground">No education entries.</p>}
            </div>
          </ProfileSection>

          {/* Projects */}
          <ProfileSection title="Projects" onEdit={() => setEdit(null)} isEditing={false}>
            <div className="space-y-3">
              {profile.projects.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{p.name}</p>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                        Link ↗
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">{p.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.tech_stack.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                  </div>
                </div>
              ))}
              {profile.projects.length === 0 && <p className="text-sm text-muted-foreground">No projects listed.</p>}
            </div>
          </ProfileSection>

          {/* Certifications */}
          {profile.certifications.length > 0 && (
            <ProfileSection title="Certifications" onEdit={() => setEdit(null)} isEditing={false}>
              <div className="space-y-2">
                {profile.certifications.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.issuer} · {c.date}</span>
                  </div>
                ))}
              </div>
            </ProfileSection>
          )}

        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────

function ProfileSection({
  title,
  onEdit,
  isEditing,
  children,
}: {
  title: string;
  onEdit: () => void;
  isEditing: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onEdit}>
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function PersonalEditor({
  profile,
  onSave,
  onCancel,
}: {
  profile: CvProfile;
  onSave: (v: CvProfile["personal"]) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...profile.personal });

  function set(k: keyof typeof form, v: string) {
    setForm((prev) => ({ ...prev, [k]: v || null }));
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        {(["name","email","phone","location","linkedin","github"] as const).map((k) => (
          <div key={k} className="space-y-1">
            <Label htmlFor={`p-${k}`} className="capitalize">{k}</Label>
            <Input
              id={`p-${k}`}
              value={form[k] ?? ""}
              onChange={(e) => set(k, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Label htmlFor="p-summary">Summary</Label>
        <textarea
          id="p-summary"
          value={form.summary ?? ""}
          onChange={(e) => set("summary", e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">Save</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function SkillsEditor({
  skills,
  onSave,
  onCancel,
}: {
  skills: string[];
  onSave: (v: string[]) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(skills.join(", "));

  function handleSave(e: { preventDefault(): void }) {
    e.preventDefault();
    const parsed = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onSave(parsed);
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="skills-input">Skills (comma-separated)</Label>
        <textarea
          id="skills-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">Save</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
