"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Save,
  Settings,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { useResumeStore } from "@/store/resume";
import { Resume, ResumeTemplateId, defaultResume } from "@/lib/resume/types";
import { generateResumeId } from "@/lib/resume/utils";
import { ToastMessage, ToastViewport } from "@/components/ui/toast";

import { PersonalInfoForm } from "@/components/resume-builder/personal-info-form";
import { EducationForm } from "@/components/resume-builder/education-form";
import { ExperienceForm } from "@/components/resume-builder/experience-form";
import { SkillsForm } from "@/components/resume-builder/skills-form";
import { ProjectsForm } from "@/components/resume-builder/projects-form";
import { CertificationsForm } from "@/components/resume-builder/certifications-form";
import { ResumePreview } from "@/components/resume-builder/resume-preview";
import { TemplateSelector } from "@/components/resume-builder/template-selector";
import { ExportOptions } from "@/components/resume-builder/export-options";
import { ResumeManagement } from "@/components/resume-builder/resume-management";

const emptyPersonalInfo = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  linkedin: "",
  github: "",
  portfolio: "",
  summary: "",
  avatar: "",
};

const normalizeTemplate = (template: string): ResumeTemplateId => {
  if (template === "classic" || template === "professional" || template === "modern") {
    return template;
  }
  return "professional";
};

const normalizeResume = (resume: Resume): Resume => ({
  ...resume,
  templateId: normalizeTemplate(resume.templateId),
});

export default function ResumeBuilderPage() {
  const {
    currentResume,
    setCurrentResume,
    updateCurrentResume,
    savedResumes,
    setSavedResumes,
    addSavedResume,
    removeSavedResume,
    selectedTemplate,
    setSelectedTemplate,
  } = useResumeStore();

  const [isSaving, setIsSaving] = useState(false);
  const [resumeTitle, setResumeTitle] = useState(currentResume.title);
  const [showManagement, setShowManagement] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  
  // Adjusted baseline scale initialization to start at 100%
  const [zoomScale, setZoomScale] = useState<number>(100);

  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 10, 160));
  // Hard floor set to 100% minimum boundary constraint
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 10, 100));
  const handleResetZoom = () => setZoomScale(100);

  const notify = (toast: Omit<ToastMessage, "id">) => {
    const id = Date.now();
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  };

  const dismissToast = (id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  };

  const syncPreviewResume = (resume: Resume) => {
    setCurrentResume(resume);
  };

  useEffect(() => {
    const saved = localStorage.getItem("resumes");
    if (saved) {
      try {
        const parsedResumes = JSON.parse(saved) as Resume[];
        setSavedResumes(parsedResumes.map(normalizeResume));
      } catch (error) {
        console.error("Failed to load saved resumes:", error);
      }
    }
  }, [setSavedResumes]);

  useEffect(() => {
    localStorage.setItem("resumes", JSON.stringify(savedResumes));
  }, [savedResumes]);

  const handleSaveResume = async () => {
    setIsSaving(true);
    try {
      const updatedResume = {
        ...currentResume,
        title: resumeTitle || "My Resume",
        templateId: selectedTemplate,
        updatedAt: new Date().toISOString(),
      };

      const existingIndex = savedResumes.findIndex(
        (r) => r.id === currentResume.id
      );

      if (existingIndex >= 0) {
        const updated = [...savedResumes];
        updated[existingIndex] = updatedResume;
        setSavedResumes(updated);
      } else {
        addSavedResume(updatedResume);
      }

      syncPreviewResume(updatedResume);
      notify({ title: "Resume saved", tone: "success" });
    } catch (error) {
      console.error("Error saving resume:", error);
      notify({
        title: "Failed to save resume",
        description: "Please try again in a moment.",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewResume = () => {
    const newResume: Resume = {
      ...defaultResume,
      id: generateResumeId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    syncPreviewResume(newResume);
    setResumeTitle("My Resume");
    setSelectedTemplate(newResume.templateId);
    setShowManagement(false);
  };

  const handleDuplicateResume = (resume: Resume) => {
    const duplicated: Resume = {
      ...resume,
      id: generateResumeId(),
      title: `${resume.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addSavedResume(duplicated);
    syncPreviewResume(duplicated);
    setShowManagement(false);
  };

  const handleDeleteResume = (id: string) => {
    removeSavedResume(id);
    if (currentResume.id === id) {
      handleNewResume();
    }
    setPendingDeleteId(null);
    notify({ title: "Resume deleted", tone: "success" });
  };

  const handleSelectResume = (resume: Resume) => {
    const normalizedResume = normalizeResume(resume);
    setCurrentResume(normalizedResume);
    setResumeTitle(normalizedResume.title);
    setSelectedTemplate(normalizedResume.templateId);
    setShowManagement(false);
  };

  const handleSavePersonalInfo = (data: Resume["personalInfo"]) => {
    updateCurrentResume({ personalInfo: data });
  };

  const handleDeletePersonalInfo = () => {
    updateCurrentResume({ personalInfo: emptyPersonalInfo });
  };

  return (
    <div className="w-full min-h-screen text-[#1A1A1A] antialiased relative select-none text-left flex flex-col pb-12">

      <ToastViewport toasts={toasts} onDismiss={dismissToast} />

      {/* Grid Pattern Background layer */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #1A1A1A 1px, transparent 1px),
            linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── TOP CONTROL BAR ── */}
      <div className="relative z-10 shrink-0 flex items-end gap-3 border-b-2 border-black bg-white px-6 py-3">
        <div className="flex flex-col min-w-[240px]">
          <Label
            htmlFor="resumeTitle"
            className="text-[9px] font-mono font-black uppercase tracking-widest text-neutral-400 mb-1"
          >
            Resume Title
          </Label>
          <Input
            id="resumeTitle"
            value={resumeTitle}
            onChange={(e) => setResumeTitle(e.target.value)}
            placeholder="My Resume"
            className="h-8 text-xs font-mono font-black rounded-none border border-black bg-white px-3 focus-visible:ring-0 shadow-[1px_1px_0px_rgba(0,0,0,1)]"
          />
        </div>

        <div className="h-8 w-px bg-black/20 mx-1" />

        <div className="flex flex-col">
          <span className="text-[9px] text-transparent mb-1 select-none pointer-events-none">&nbsp;</span>
          <div className="flex items-center gap-2">
            {showManagement ? (
              <Button
                onClick={handleNewResume}
                className="flex h-8 items-center gap-2 rounded-none border border-black bg-white px-4 text-xs font-mono font-black uppercase text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3px]" />
                New Resume
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setShowManagement(true)}
                  className="flex h-8 items-center gap-2 rounded-none border border-black bg-white px-4 text-xs font-mono font-black uppercase text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Manage
                </Button>
                <Button
                  onClick={handleSaveResume}
                  disabled={isSaving}
                  className="flex h-8 items-center gap-2 rounded-none border border-black bg-black px-4 text-xs font-mono font-black uppercase text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-neutral-800 transition-colors disabled:opacity-30"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? "Saving..." : "Commit Changes"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT HUB ── */}
      <div className="relative z-10 flex flex-1 w-full overflow-visible">

        {showManagement ? (
          <div className="flex-1 p-8">
            <Card className="rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] p-6 max-w-3xl mx-auto">
              <div className="mb-4 border-b border-dashed border-neutral-200 pb-2">
                <h2 className="text-xs font-mono font-black uppercase tracking-widest text-black">
                  Saved Resumes
                </h2>
              </div>
              <ResumeManagement
                resumes={savedResumes}
                onSelectResume={handleSelectResume}
                onDuplicate={handleDuplicateResume}
                onDelete={setPendingDeleteId}
                currentResumeId={currentResume.id}
              />
            </Card>
          </div>
        ) : (
          <>
            {/* ── LEFT: Form Editor Panel (Static locked width) ── */}
            <div className="w-[520px] shrink-0 flex flex-col border-r-2 border-black bg-white">
              <Tabs defaultValue="personal" className="w-full flex flex-col">

                {/* Tab selector menu */}
                <div className="shrink-0 border-b border-black overflow-x-auto bg-neutral-50">
                  <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 flex">
                    {[
                      { val: "personal",      label: "PERSONAL" },
                      { val: "experience",    label: "EXP" },
                      { val: "education",      label: "EDU" },
                      { val: "skills",         label: "SKILLS" },
                      { val: "projects",       label: "PROJ" },
                      { val: "certifications", label: "CERTS" },
                    ].map((tab) => (
                      <TabsTrigger
                        key={tab.val}
                        value={tab.val}
                        className="rounded-none border-b-2 border-r border-black border-b-transparent px-3 py-2.5 text-[9px] font-mono font-black uppercase tracking-wider text-neutral-400 data-[state=active]:border-b-black data-[state=active]:bg-white data-[state=active]:text-black transition-all flex-1 text-center"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* Personal Tab Layout View */}
                <TabsContent
                  value="personal"
                  className="w-full flex flex-col mt-0 data-[state=inactive]:hidden"
                >
                  <div className="shrink-0 px-5 pt-4 pb-3 bg-neutral-50/60 border-b border-dashed border-neutral-200">
                    <TemplateSelector
                      selectedTemplate={selectedTemplate}
                      onSelectTemplate={setSelectedTemplate}
                    />
                  </div>
                  <div className="w-full flex flex-col">
                    <PersonalInfoForm
                      data={currentResume.personalInfo}
                      onSave={handleSavePersonalInfo}
                      onDelete={handleDeletePersonalInfo}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="experience" className="w-full p-5 mt-0 data-[state=inactive]:hidden">
                  <ExperienceForm
                    experiences={currentResume.experience}
                    onUpdate={(data) => updateCurrentResume({ experience: data })}
                  />
                </TabsContent>

                <TabsContent value="education" className="w-full p-5 mt-0 data-[state=inactive]:hidden">
                  <EducationForm
                    educations={currentResume.education}
                    onUpdate={(data) => updateCurrentResume({ education: data })}
                  />
                </TabsContent>

                <TabsContent value="skills" className="w-full p-5 mt-0 data-[state=inactive]:hidden">
                  <SkillsForm
                    skills={currentResume.skills}
                    onUpdate={(data) => updateCurrentResume({ skills: data })}
                  />
                </TabsContent>

                <TabsContent value="projects" className="w-full p-5 mt-0 data-[state=inactive]:hidden">
                  <ProjectsForm
                    projects={currentResume.projects}
                    onUpdate={(data) => updateCurrentResume({ projects: data })}
                  />
                </TabsContent>

                <TabsContent value="certifications" className="w-full p-5 mt-0 data-[state=inactive]:hidden">
                  <CertificationsForm
                    certifications={currentResume.certifications}
                    onUpdate={(data) => updateCurrentResume({ certifications: data })}
                  />
                </TabsContent>

                <div className="shrink-0 border-t-2 border-black p-4 bg-neutral-50">
                  <ExportOptions
                    resume={currentResume}
                    templateId={selectedTemplate}
                    onNotify={notify}
                  />
                </div>
              </Tabs>
            </div>

            {/* ── RIGHT: Live Preview Canvas Context Container ── */}
            <div className="flex-1 min-w-0 flex flex-col bg-neutral-100 border-b border-black">

              {/* Action Ribbon header for canvas frame configurations */}
              <div className="shrink-0 flex items-center justify-between border-b-2 border-black bg-black px-5 py-2">
                <span className="flex items-center gap-2 text-[10px] font-mono font-black uppercase tracking-widest text-white">
                  <span className="h-1.5 w-1.5 bg-emerald-400 inline-block animate-pulse" />
                  Live Preview
                </span>
                <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-700 px-1 py-0.5">
                  <button type="button" onClick={handleZoomOut} className="p-1 text-neutral-400 hover:text-white transition-colors" title="Zoom out">
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={handleResetZoom} className="px-2 text-[10px] font-mono font-bold text-neutral-300 hover:text-white transition-colors border-x border-neutral-700 min-w-[42px] text-center" title="Reset zoom">
                    {zoomScale}%
                  </button>
                  <button type="button" onClick={handleZoomIn} className="p-1 text-neutral-400 hover:text-white transition-colors" title="Zoom in">
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* 
                Isolated Box Scroll Canvas layer
                Using standard overflow-auto bounds ensures visual scaling triggers scrollbars 
                locally inside the right pane rather than bursting across panels.
              */}
              <div className="flex-1 w-full overflow-auto flex justify-start items-start p-0 m-0 bg-neutral-100">
                <div
                  className="origin-top-left transition-transform duration-150 ease-out select-text"
                  style={{ transform: `scale(${zoomScale / 100})` }}
                >
                  <style>{`
                    /* Force immediate elimination of subcomponent titles and descriptions natively */
                    .preview-header-container,
                    [id*="preview-title"],
                    h2.text-xl,
                    p.text-muted-foreground,
                    p.text-sm:contains("Updates after you save") {
                      display: none !important;
                      opacity: 0 !important;
                      visibility: hidden !important;
                      height: 0 !important;
                      margin: 0 !important;
                      padding: 0 !important;
                    }
                  `}</style>
                  <ResumePreview resume={currentResume} templateId={selectedTemplate} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[1px]">
          <div className="w-full max-w-sm rounded-none border-2 border-black bg-white p-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-sm font-mono font-black uppercase text-black tracking-tight">Delete resume?</h2>
            <p className="mt-2 text-xs text-neutral-500">
              This permanently removes the resume from your browser storage.
            </p>
            <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-dashed border-neutral-200">
              <Button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="h-8 rounded-none border border-black bg-white px-4 text-xs font-mono font-black uppercase text-black shadow-[1px_1px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleDeleteResume(pendingDeleteId)}
                className="h-8 rounded-none border border-black bg-rose-600 px-4 text-xs font-mono font-black uppercase text-white shadow-[1px_1px_0px_rgba(0,0,0,1)] hover:bg-rose-700 transition-colors"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}