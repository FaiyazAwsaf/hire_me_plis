"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  Plus,
  Save,
  Settings,
} from "lucide-react";
import Link from "next/link";

import { useResumeStore } from "@/store/resume";
import { Resume, defaultResume } from "@/lib/resume/types";
import { generateResumeId } from "@/lib/resume/utils";

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

/**
 * Resume Builder Page
 * Main component for building and editing resumes
 * Features:
 * - Split-screen layout (form on left, preview on right)
 * - Real-time preview updates
 * - Template selection
 * - PDF export
 * - Resume management (save, duplicate, delete)
 */
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

  // Load saved resumes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("resumes");
    if (saved) {
      try {
        const parsedResumes = JSON.parse(saved);
        setSavedResumes(parsedResumes);
      } catch (error) {
        console.error("Failed to load saved resumes:", error);
      }
    }
  }, []);

  // Save current resume to localStorage whenever it changes
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

      // Check if resume already exists
      const existingIndex = savedResumes.findIndex(
        (r) => r.id === currentResume.id
      );

      if (existingIndex >= 0) {
        // Update existing
        const updated = [...savedResumes];
        updated[existingIndex] = updatedResume;
        setSavedResumes(updated);
      } else {
        // Add new
        addSavedResume(updatedResume);
      }

      setCurrentResume(updatedResume);
      alert("Resume saved successfully!");
    } catch (error) {
      console.error("Error saving resume:", error);
      alert("Failed to save resume");
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
    setCurrentResume(newResume);
    setResumeTitle("My Resume");
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
    setCurrentResume(duplicated);
    setShowManagement(false);
  };

  const handleDeleteResume = (id: string) => {
    if (confirm("Are you sure you want to delete this resume?")) {
      removeSavedResume(id);
      if (currentResume.id === id) {
        handleNewResume();
      }
    }
  };

  const handleSelectResume = (resume: Resume) => {
    setCurrentResume(resume);
    setResumeTitle(resume.title);
    setSelectedTemplate(resume.templateId);
    setShowManagement(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/cv/upload" className="text-neutral-600 hover:text-neutral-900">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex-1">
                <Label htmlFor="resumeTitle" className="text-xs text-neutral-600 block mb-1">
                  Resume Title
                </Label>
                <Input
                  id="resumeTitle"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  placeholder="My Resume"
                  className="max-w-xs h-8 text-sm font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleNewResume}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New
              </Button>

              <Button
                onClick={() => setShowManagement(!showManagement)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Manage
              </Button>

              <Button
                onClick={handleSaveResume}
                disabled={isSaving}
                size="sm"
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        {showManagement ? (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Saved Resumes</h2>
              <Button onClick={() => setShowManagement(false)} variant="outline">
                Close
              </Button>
            </div>
            <ResumeManagement
              resumes={savedResumes}
              onSelectResume={handleSelectResume}
              onDuplicate={handleDuplicateResume}
              onDelete={handleDeleteResume}
              currentResumeId={currentResume.id}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
            {/* Left Side: Form Editor */}
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden flex flex-col">
              <Tabs defaultValue="personal" className="flex-1 flex flex-col">
                {/* Tabs Header */}
                <div className="border-b border-neutral-200 overflow-x-auto">
                  <TabsList className="w-full justify-start rounded-none bg-neutral-50 p-0 h-auto">
                    <TabsTrigger
                      value="personal"
                      className="rounded-none border-b-2 border-b-transparent px-4 py-3 data-[state=active]:border-b-blue-500 data-[state=active]:bg-white"
                    >
                      Personal
                    </TabsTrigger>
                    <TabsTrigger
                      value="experience"
                      className="rounded-none border-b-2 border-b-transparent px-4 py-3 data-[state=active]:border-b-blue-500 data-[state=active]:bg-white"
                    >
                      Experience
                    </TabsTrigger>
                    <TabsTrigger
                      value="education"
                      className="rounded-none border-b-2 border-b-transparent px-4 py-3 data-[state=active]:border-b-blue-500 data-[state=active]:bg-white"
                    >
                      Education
                    </TabsTrigger>
                    <TabsTrigger
                      value="skills"
                      className="rounded-none border-b-2 border-b-transparent px-4 py-3 data-[state=active]:border-b-blue-500 data-[state=active]:bg-white"
                    >
                      Skills
                    </TabsTrigger>
                    <TabsTrigger
                      value="projects"
                      className="rounded-none border-b-2 border-b-transparent px-4 py-3 data-[state=active]:border-b-blue-500 data-[state=active]:bg-white"
                    >
                      Projects
                    </TabsTrigger>
                    <TabsTrigger
                      value="certifications"
                      className="rounded-none border-b-2 border-b-transparent px-4 py-3 data-[state=active]:border-b-blue-500 data-[state=active]:bg-white"
                    >
                      Certs
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tabs Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <TabsContent value="personal" className="space-y-4">
                    <TemplateSelector
                      selectedTemplate={selectedTemplate}
                      onSelectTemplate={setSelectedTemplate}
                    />
                    <Separator />
                    <PersonalInfoForm
                      data={currentResume.personalInfo}
                      onSave={(data) =>
                        updateCurrentResume({ personalInfo: data })
                      }
                    />
                  </TabsContent>

                  <TabsContent value="experience">
                    <ExperienceForm
                      experiences={currentResume.experience}
                      onUpdate={(data) =>
                        updateCurrentResume({ experience: data })
                      }
                    />
                  </TabsContent>

                  <TabsContent value="education">
                    <EducationForm
                      educations={currentResume.education}
                      onUpdate={(data) =>
                        updateCurrentResume({ education: data })
                      }
                    />
                  </TabsContent>

                  <TabsContent value="skills">
                    <SkillsForm
                      skills={currentResume.skills}
                      onUpdate={(data) => updateCurrentResume({ skills: data })}
                    />
                  </TabsContent>

                  <TabsContent value="projects">
                    <ProjectsForm
                      projects={currentResume.projects}
                      onUpdate={(data) =>
                        updateCurrentResume({ projects: data })
                      }
                    />
                  </TabsContent>

                  <TabsContent value="certifications">
                    <CertificationsForm
                      certifications={currentResume.certifications}
                      onUpdate={(data) =>
                        updateCurrentResume({ certifications: data })
                      }
                    />
                  </TabsContent>
                </div>

                {/* Footer with Export Options */}
                <div className="border-t border-neutral-200 p-6 bg-neutral-50">
                  <ExportOptions resume={currentResume} />
                </div>
              </Tabs>
            </div>

            {/* Right Side: Preview */}
            <ResumePreview resume={currentResume} />
          </div>
        )}
      </div>
    </div>
  );
}
