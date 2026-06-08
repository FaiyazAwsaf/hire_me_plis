"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus, X } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCvStore, type CvProfile, type CvStatus } from "@/store/cv";

const STATUS_LABEL: Record<CvStatus, string> = {
  pending: "Queued",
  processing: "Extracting…",
  embedding: "Embedding…",
  done: "Ready",
  error: "Error",
};

const STATUS_COLOR: Record<CvStatus, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-400",
  processing: "bg-blue-100 text-blue-900 border-blue-400",
  embedding: "bg-purple-100 text-purple-900 border-purple-400",
  done: "bg-emerald-100 text-emerald-900 border-emerald-500",
  error: "bg-rose-100 text-rose-900 border-rose-500",
};
export default function CvPage() {
  const {
    meta,
    profile,
    isUploading,
    setMeta,
    setStatus,
    setProfile,
    setUploading,
  } = useCvStore();

  const [noCv, setNoCv] = useState(false);
  const [noProfile, setNoProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editSection, setEdit] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api
      .get<{
        cv_id: string;
        filename: string;
        uploaded_at: string;
        status: CvStatus;
      }>("/cv")
      .then(async (r) => {
        setMeta({
          cvId: r.data.cv_id,
          filename: r.data.filename,
          uploadedAt: r.data.uploaded_at,
          status: r.data.status,
        });
        if (r.data.status === "done") {
          try {
            const p = await api.get<CvProfile>("/cv/profile");
            setProfile(p.data);
          } catch (err) {
            const axErr = err as { response?: { status: number } };
            if (axErr?.response?.status === 404) setNoProfile(true);
          }
        } else if (r.data.status !== "error") {
          startPolling();
        }
      })
      .catch((err) => {
        if (err?.response?.status === 404) setNoCv(true);
      })
      .finally(() => setLoading(false));

    return () => stopPolling();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const r = await api.get<{ cv_id: string; status: CvStatus }>(
          "/cv/status",
        );
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

  async function handleExport() {
    setExporting(true);
    try {
      const r = await api.post<{ download_url: string }>("/cv/export");
      window.open(r.data.download_url, "_blank", "noopener");
    } catch {
      alert("Export failed.");
    } finally {
      setExporting(false);
    }
  }

  async function handlePatchSection(
    section: keyof Omit<CvProfile, "updated_at">,
    value: unknown,
  ) {
    try {
      const r = await api.patch<CvProfile>("/cv/profile", { [section]: value });
      setProfile(r.data);
      setEdit(null);
    } catch {
      alert("Save failed.");
    }
  }

  const isProcessing = !!meta && meta.status !== "done" && meta.status !== "error";

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-linear-to-r from-[#EBF0EC] via-[#FDFBF9] to-[#F9F3EE] p-6 md:p-10 text-[#1A1A1A] antialiased">
      <div className="mx-auto max-w-4xl space-y-6">

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center min-h-75">
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-400 animate-pulse">
            Loading profile…
          </span>
        </div>
      )}

      {/* ── No CV ───────────────────────────────────────────────────────────── */}
      {!loading && noCv && (
        <div className="flex flex-col items-center justify-center min-h-100">
          <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full text-center">
            <h2 className="font-mono font-black text-sm uppercase tracking-wider text-black mb-2">
              No Resume on File
            </h2>
            <p className="text-xs font-sans text-neutral-500 mb-5">
              Upload your CV to see your extracted profile here.
            </p>
            <Link
              href="/cv/upload"
              className="inline-flex items-center gap-2 rounded-none border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)]"
            >
              Upload Resume
            </Link>
          </div>
        </div>
      )}

      {/* ── Processing ──────────────────────────────────────────────────────── */}
      {!loading && isProcessing && (
        <div className="flex flex-col items-center justify-center min-h-100">
          <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full text-center">
            <span className="inline-block h-2 w-2 rounded-none bg-amber-400 animate-pulse mb-4" />
            <h2 className="font-mono font-black text-sm uppercase tracking-wider text-black mb-1">
              Processing Resume
            </h2>
            <p className="text-xs font-sans text-neutral-500">
              {meta && STATUS_LABEL[meta.status]} — this usually takes under a minute.
            </p>
          </div>
        </div>
      )}

      {/* ── Full profile view ────────────────────────────────────────────────── */}
      {!loading && !noCv && !isProcessing && (
        <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-black text-black tracking-tight">
            Resume Profile
          </h1>
          {meta && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="font-mono text-xs text-neutral-500">
                {meta.filename}
              </span>
              <span
                className={cn(
                  "border px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider",
                  STATUS_COLOR[meta.status],
                )}
              >
                {STATUS_LABEL[meta.status]}
              </span>
              {isUploading && (
                <span className="text-xs text-neutral-400 animate-pulse font-mono">
                  Syncing…
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {meta?.status === "done" && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="rounded-none border-2 border-black bg-white px-4 py-2 font-mono text-xs font-black uppercase tracking-wider text-black hover:bg-black hover:text-white transition-colors disabled:opacity-40 shadow-[2px_2px_0px_rgba(0,0,0,1)]"
            >
              {exporting ? "Generating…" : "Export PDF"}
            </button>
          )}
          <Link
            href="/cv/upload"
            className="rounded-none border-2 border-black bg-neutral-900 px-4 py-2 font-mono text-xs font-black uppercase tracking-wider text-white hover:bg-black transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          >
            Upload New
          </Link>
        </div>
      </div>

      {/* No profile data despite CV being done — pipeline may have stalled */}
      {noProfile && !profile && (
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] p-6 text-center">
          <h2 className="font-mono font-black text-sm uppercase tracking-wider text-black mb-2">
            Profile Data Not Found
          </h2>
          <p className="text-xs font-sans text-neutral-500 mb-5">
            Your CV was processed but the extracted profile could not be loaded.
            Try re-uploading your resume to rebuild it.
          </p>
          <Link
            href="/cv/upload"
            className="inline-flex items-center gap-2 rounded-none border-2 border-black bg-black px-4 py-2 font-mono text-xs font-black uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          >
            Re-upload CV
          </Link>
        </div>
      )}

      {/* Profile sections */}
      {profile && (
        <div className="space-y-4">
          {/* Personal */}
          <ProfileSection
            title="Personal Info"
            onEdit={() =>
              setEdit(editSection === "personal" ? null : "personal")
            }
            isEditing={editSection === "personal"}
          >
            {editSection === "personal" ? (
              <PersonalEditor
                profile={profile}
                onSave={(v) => handlePatchSection("personal", v)}
                onCancel={() => setEdit(null)}
              />
            ) : (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
                {(
                  [
                    "name",
                    "email",
                    "phone",
                    "location",
                    "linkedin",
                    "github",
                  ] as const
                ).map((k) =>
                  profile.personal[k] ? (
                    <div key={k}>
                      <dt className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
                        {k}
                      </dt>
                      <dd className="font-sans text-xs font-medium text-black truncate">
                        {profile.personal[k]}
                      </dd>
                    </div>
                  ) : null,
                )}
                {profile.personal.summary && (
                  <div className="col-span-2 mt-1">
                    <dt className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
                      Summary
                    </dt>
                    <dd className="font-sans text-xs text-neutral-700 leading-relaxed mt-0.5">
                      {profile.personal.summary}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </ProfileSection>

          {/* Skills */}
          <ProfileSection
            title="Skills"
            onEdit={() => setEdit(editSection === "skills" ? null : "skills")}
            isEditing={editSection === "skills"}
          >
            {editSection === "skills" ? (
              <SkillsEditor
                skills={profile.skills}
                onSave={(v) => handlePatchSection("skills", v)}
                onCancel={() => setEdit(null)}
              />
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => (
                  <span
                    key={s}
                    className="border border-black px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-black bg-neutral-100"
                  >
                    {s}
                  </span>
                ))}
                {profile.skills.length === 0 && (
                  <p className="text-xs font-sans text-neutral-400">
                    None listed.
                  </p>
                )}
              </div>
            )}
          </ProfileSection>

          {/* Experience */}
          <ProfileSection
            title="Experience"
            onEdit={() =>
              setEdit(editSection === "experience" ? null : "experience")
            }
            isEditing={editSection === "experience"}
          >
            {editSection === "experience" ? (
              <ExperienceEditor
                entries={profile.experience}
                onSave={(v) => handlePatchSection("experience", v)}
                onCancel={() => setEdit(null)}
              />
            ) : (
              <div className="space-y-4">
                {profile.experience.map((exp) => (
                  <div key={exp.id} className="border-l-2 border-black pl-3">
                    <p className="font-sans text-sm font-bold text-black">
                      {exp.role}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 mt-0.5">
                      {exp.company} · {exp.start_date} –{" "}
                      {exp.end_date ?? "Present"}
                    </p>
                    {exp.description && (
                      <p className="font-sans text-xs text-neutral-600 mt-1 leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
                {profile.experience.length === 0 && (
                  <p className="text-xs font-sans text-neutral-400">
                    No experience entries.
                  </p>
                )}
              </div>
            )}
          </ProfileSection>

          {/* Education */}
          <ProfileSection
            title="Education"
            onEdit={() =>
              setEdit(editSection === "education" ? null : "education")
            }
            isEditing={editSection === "education"}
          >
            {editSection === "education" ? (
              <EducationEditor
                entries={profile.education}
                onSave={(v) => handlePatchSection("education", v)}
                onCancel={() => setEdit(null)}
              />
            ) : (
              <div className="space-y-3">
                {profile.education.map((edu) => (
                  <div key={edu.id} className="border-l-2 border-black pl-3">
                    <p className="font-sans text-sm font-bold text-black">
                      {edu.degree}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 mt-0.5">
                      {edu.institution} · {edu.start_date} –{" "}
                      {edu.end_date ?? "Present"}
                    </p>
                    {edu.grade && (
                      <p className="font-mono text-[10px] text-neutral-400 mt-0.5">
                        {edu.grade}
                      </p>
                    )}
                  </div>
                ))}
                {profile.education.length === 0 && (
                  <p className="text-xs font-sans text-neutral-400">
                    No education entries.
                  </p>
                )}
              </div>
            )}
          </ProfileSection>

          {/* Projects */}
          <ProfileSection
            title="Projects"
            onEdit={() =>
              setEdit(editSection === "projects" ? null : "projects")
            }
            isEditing={editSection === "projects"}
          >
            {editSection === "projects" ? (
              <ProjectsEditor
                entries={profile.projects}
                onSave={(v) => handlePatchSection("projects", v)}
                onCancel={() => setEdit(null)}
              />
            ) : (
              <div className="space-y-4">
                {profile.projects.map((p) => (
                  <div key={p.id}>
                    <div className="flex items-center gap-2">
                      <p className="font-sans text-sm font-bold text-black">
                        {p.name}
                      </p>
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-0.5 font-mono text-[9px] uppercase tracking-wider text-neutral-500 hover:text-black"
                        >
                          <ExternalLink className="h-2.5 w-2.5" />
                          Link
                        </a>
                      )}
                    </div>
                    <p className="font-sans text-xs text-neutral-600 leading-relaxed mt-0.5">
                      {p.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {p.tech_stack.map((t) => (
                        <span
                          key={t}
                          className="border border-neutral-300 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-neutral-600 bg-neutral-50"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {profile.projects.length === 0 && (
                  <p className="text-xs font-sans text-neutral-400">
                    No projects listed.
                  </p>
                )}
              </div>
            )}
          </ProfileSection>

          {/* Certifications */}
          <ProfileSection
            title="Certifications"
            onEdit={() =>
              setEdit(
                editSection === "certifications" ? null : "certifications",
              )
            }
            isEditing={editSection === "certifications"}
          >
            {editSection === "certifications" ? (
              <CertificationsEditor
                entries={profile.certifications}
                onSave={(v) => handlePatchSection("certifications", v)}
                onCancel={() => setEdit(null)}
              />
            ) : (
              <div className="space-y-2">
                {profile.certifications.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="font-sans text-sm font-bold text-black">
                        {c.name}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                        {c.issuer} · {c.date}
                      </p>
                    </div>
                    {c.url && (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-0.5 font-mono text-[9px] uppercase tracking-wider text-neutral-500 hover:text-black shrink-0"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        Link
                      </a>
                    )}
                  </div>
                ))}
                {profile.certifications.length === 0 && (
                  <p className="text-xs font-sans text-neutral-400">
                    No certifications listed.
                  </p>
                )}
              </div>
            )}
          </ProfileSection>
        </div>
      )}
        </div>
      )}

      </div>
    </div>
  );
}

// ── Shared editor styles ────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-none border border-black bg-white px-3 py-1.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-black placeholder:text-neutral-400";
const labelCls =
  "block font-mono text-[9px] uppercase tracking-widest text-neutral-500 mb-1";
const btnPrimary =
  "rounded-none border-2 border-black bg-black px-4 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors";
const btnSecondary =
  "rounded-none border border-black bg-white px-4 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-black hover:bg-neutral-100 transition-colors";
const btnDanger =
  "rounded-none border border-rose-600 bg-white p-1 text-rose-600 hover:bg-rose-50 transition-colors";
const btnAdd =
  "flex items-center gap-1 rounded-none border border-dashed border-black px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-neutral-600 hover:text-black hover:border-solid hover:bg-neutral-50 transition-all";

// ── ProfileSection wrapper ──────────────────────────────────────────────────

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
    <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between border-b-2 border-black bg-neutral-50 px-4 py-3">
        <h2 className="font-mono font-black text-xs uppercase tracking-wider text-black">
          {title}
        </h2>
        <button
          onClick={onEdit}
          className="rounded-none border border-black bg-white px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-black hover:bg-black hover:text-white transition-colors shadow-[1px_1px_0px_rgba(0,0,0,1)]"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Personal editor ─────────────────────────────────────────────────────────

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
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        {(
          ["name", "email", "phone", "location", "linkedin", "github"] as const
        ).map((k) => (
          <div key={k}>
            <label className={labelCls}>{k}</label>
            <input
              className={inputCls}
              value={form[k] ?? ""}
              onChange={(e) => set(k, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div>
        <label className={labelCls}>Summary</label>
        <textarea
          value={form.summary ?? ""}
          onChange={(e) => set("summary", e.target.value)}
          rows={3}
          className={cn(inputCls, "resize-none")}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" className={btnPrimary}>
          Save
        </button>
        <button type="button" className={btnSecondary} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Skills editor ───────────────────────────────────────────────────────────

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
    onSave(
      text
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div>
        <label className={labelCls}>Skills (comma-separated)</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className={cn(inputCls, "resize-none")}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" className={btnPrimary}>
          Save
        </button>
        <button type="button" className={btnSecondary} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Experience editor ───────────────────────────────────────────────────────

function ExperienceEditor({
  entries,
  onSave,
  onCancel,
}: {
  entries: CvProfile["experience"];
  onSave: (v: CvProfile["experience"]) => void;
  onCancel: () => void;
}) {
  type Item = CvProfile["experience"][number];
  const [items, setItems] = useState<Item[]>(entries.map((e) => ({ ...e })));

  function update(idx: number, field: string, value: unknown) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? ({ ...item, [field]: value } as Item) : item,
      ),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "",
        company: "",
        start_date: "",
        end_date: null,
        current: false,
        description: "",
      },
    ]);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(items);
      }}
      className="space-y-4"
    >
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="border border-black p-3 space-y-3 bg-neutral-50"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
              Entry {idx + 1}
            </span>
            <button
              type="button"
              onClick={() =>
                setItems((prev) => prev.filter((_, i) => i !== idx))
              }
              className={btnDanger}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Role</label>
              <input
                className={inputCls}
                value={item.role}
                onChange={(e) => update(idx, "role", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Company</label>
              <input
                className={inputCls}
                value={item.company}
                onChange={(e) => update(idx, "company", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Start Date (YYYY-MM)</label>
              <input
                className={inputCls}
                value={item.start_date}
                placeholder="2023-01"
                onChange={(e) => update(idx, "start_date", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>End Date (YYYY-MM)</label>
              <input
                className={inputCls}
                value={item.end_date ?? ""}
                placeholder="Leave blank if current"
                disabled={item.current}
                onChange={(e) =>
                  update(idx, "end_date", e.target.value || null)
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`current-${idx}`}
              checked={item.current}
              onChange={(e) => {
                update(idx, "current", e.target.checked);
                if (e.target.checked) update(idx, "end_date", null);
              }}
            />
            <label
              htmlFor={`current-${idx}`}
              className="font-mono text-[9px] uppercase tracking-widest text-neutral-500"
            >
              Currently working here
            </label>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              className={cn(inputCls, "resize-none")}
              rows={3}
              value={item.description}
              onChange={(e) => update(idx, "description", e.target.value)}
            />
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem} className={btnAdd}>
        <Plus className="h-3.5 w-3.5" /> Add Entry
      </button>
      <div className="flex gap-2 pt-1">
        <button type="submit" className={btnPrimary}>
          Save
        </button>
        <button type="button" className={btnSecondary} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Education editor ────────────────────────────────────────────────────────

function EducationEditor({
  entries,
  onSave,
  onCancel,
}: {
  entries: CvProfile["education"];
  onSave: (v: CvProfile["education"]) => void;
  onCancel: () => void;
}) {
  type Item = CvProfile["education"][number];
  const [items, setItems] = useState<Item[]>(entries.map((e) => ({ ...e })));

  function update(idx: number, field: string, value: unknown) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? ({ ...item, [field]: value } as Item) : item,
      ),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        degree: "",
        institution: "",
        start_date: "",
        end_date: null,
        grade: null,
      },
    ]);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(items);
      }}
      className="space-y-4"
    >
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="border border-black p-3 space-y-3 bg-neutral-50"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
              Entry {idx + 1}
            </span>
            <button
              type="button"
              onClick={() =>
                setItems((prev) => prev.filter((_, i) => i !== idx))
              }
              className={btnDanger}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Degree</label>
              <input
                className={inputCls}
                value={item.degree}
                onChange={(e) => update(idx, "degree", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Institution</label>
              <input
                className={inputCls}
                value={item.institution}
                onChange={(e) => update(idx, "institution", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Start Date (YYYY-MM)</label>
              <input
                className={inputCls}
                value={item.start_date}
                placeholder="2020-01"
                onChange={(e) => update(idx, "start_date", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>End Date (YYYY-MM)</label>
              <input
                className={inputCls}
                value={item.end_date ?? ""}
                placeholder="Leave blank if current"
                onChange={(e) =>
                  update(idx, "end_date", e.target.value || null)
                }
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Grade / GPA (optional)</label>
              <input
                className={inputCls}
                value={item.grade ?? ""}
                onChange={(e) => update(idx, "grade", e.target.value || null)}
              />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem} className={btnAdd}>
        <Plus className="h-3.5 w-3.5" /> Add Entry
      </button>
      <div className="flex gap-2 pt-1">
        <button type="submit" className={btnPrimary}>
          Save
        </button>
        <button type="button" className={btnSecondary} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Projects editor ─────────────────────────────────────────────────────────

function ProjectsEditor({
  entries,
  onSave,
  onCancel,
}: {
  entries: CvProfile["projects"];
  onSave: (v: CvProfile["projects"]) => void;
  onCancel: () => void;
}) {
  // _tech is a local comma-separated string — stripped before saving
  type Draft = CvProfile["projects"][number] & { _tech: string };
  const [items, setItems] = useState<Draft[]>(
    entries.map((e) => ({ ...e, _tech: e.tech_stack.join(", ") })),
  );

  function update(idx: number, field: string, value: unknown) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? ({ ...item, [field]: value } as Draft) : item,
      ),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        url: null,
        tech_stack: [],
        _tech: "",
      },
    ]);
  }

  function handleSave(e: { preventDefault(): void }) {
    e.preventDefault();
    onSave(
      items.map(({ _tech, ...rest }) => ({
        ...rest,
        tech_stack: _tech
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      })),
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="border border-black p-3 space-y-3 bg-neutral-50"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
              Entry {idx + 1}
            </span>
            <button
              type="button"
              onClick={() =>
                setItems((prev) => prev.filter((_, i) => i !== idx))
              }
              className={btnDanger}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Project Name</label>
              <input
                className={inputCls}
                value={item.name}
                onChange={(e) => update(idx, "name", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>URL (optional)</label>
              <input
                className={inputCls}
                value={item.url ?? ""}
                onChange={(e) => update(idx, "url", e.target.value || null)}
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Description</label>
              <textarea
                className={cn(inputCls, "resize-none")}
                rows={2}
                value={item.description}
                onChange={(e) => update(idx, "description", e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Tech Stack (comma-separated)</label>
              <input
                className={inputCls}
                value={item._tech}
                placeholder="React, Python, Postgres"
                onChange={(e) => update(idx, "_tech", e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem} className={btnAdd}>
        <Plus className="h-3.5 w-3.5" /> Add Entry
      </button>
      <div className="flex gap-2 pt-1">
        <button type="submit" className={btnPrimary}>
          Save
        </button>
        <button type="button" className={btnSecondary} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Certifications editor ───────────────────────────────────────────────────

function CertificationsEditor({
  entries,
  onSave,
  onCancel,
}: {
  entries: CvProfile["certifications"];
  onSave: (v: CvProfile["certifications"]) => void;
  onCancel: () => void;
}) {
  type Item = CvProfile["certifications"][number];
  const [items, setItems] = useState<Item[]>(entries.map((e) => ({ ...e })));

  function update(idx: number, field: string, value: unknown) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? ({ ...item, [field]: value } as Item) : item,
      ),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", issuer: "", date: "", url: null },
    ]);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(items);
      }}
      className="space-y-4"
    >
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="border border-black p-3 space-y-3 bg-neutral-50"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
              Entry {idx + 1}
            </span>
            <button
              type="button"
              onClick={() =>
                setItems((prev) => prev.filter((_, i) => i !== idx))
              }
              className={btnDanger}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Certification Name</label>
              <input
                className={inputCls}
                value={item.name}
                onChange={(e) => update(idx, "name", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Issuer</label>
              <input
                className={inputCls}
                value={item.issuer}
                onChange={(e) => update(idx, "issuer", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Date (YYYY-MM)</label>
              <input
                className={inputCls}
                value={item.date}
                placeholder="2024-06"
                onChange={(e) => update(idx, "date", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>URL (optional)</label>
              <input
                className={inputCls}
                value={item.url ?? ""}
                onChange={(e) => update(idx, "url", e.target.value || null)}
              />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem} className={btnAdd}>
        <Plus className="h-3.5 w-3.5" /> Add Entry
      </button>
      <div className="flex gap-2 pt-1">
        <button type="submit" className={btnPrimary}>
          Save
        </button>
        <button type="button" className={btnSecondary} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
