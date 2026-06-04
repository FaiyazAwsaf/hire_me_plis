"use client";

import React from "react";
import { Resume } from "@/lib/resume/types";
import { Card } from "@/components/ui/card";
import { Copy, Trash2, Calendar } from "lucide-react";

interface ResumeManagementProps {
  resumes: Resume[];
  onSelectResume: (resume: Resume) => void;
  onDuplicate: (resume: Resume) => void;
  onDelete: (id: string) => void;
  currentResumeId?: string;
}

/**
 * ResumeManagement Component
 * Displays a list of saved resumes with options to:
 * - View/Edit
 * - Duplicate
 * - Delete
 */
export function ResumeManagement({
  resumes,
  onSelectResume,
  onDuplicate,
  onDelete,
  currentResumeId,
}: ResumeManagementProps) {
  if (resumes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-500 text-sm">No resumes yet</p>
        <p className="text-neutral-400 text-xs mt-1">
          Start creating your first resume
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {resumes.map((resume) => (
        <Card
          key={resume.id}
          className={`p-4 cursor-pointer border-2 transition-all ${
            currentResumeId === resume.id
              ? "border-blue-500 bg-blue-50"
              : "border-neutral-200 hover:border-neutral-300"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={() => onSelectResume(resume)}
              className="flex-1 text-left"
            >
              <h4 className="font-semibold text-sm text-neutral-900">
                {resume.title}
              </h4>
              <div className="flex items-center gap-2 mt-2 text-xs text-neutral-600">
                <Calendar className="h-3 w-3" />
                <span>
                  Updated{" "}
                  {new Date(resume.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </button>

            <div className="flex gap-1">
              <button
                onClick={() => onDuplicate(resume)}
                className="p-2 rounded hover:bg-neutral-100 transition text-neutral-600 hover:text-neutral-900"
                title="Duplicate resume"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(resume.id)}
                className="p-2 rounded hover:bg-red-50 transition text-neutral-600 hover:text-red-600"
                title="Delete resume"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
