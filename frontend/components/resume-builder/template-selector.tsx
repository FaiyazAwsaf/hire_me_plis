"use client";

import React from "react";
import { Check } from "lucide-react";
import { ResumeTemplateId } from "@/lib/resume/types";

interface TemplateSelectorProps {
  selectedTemplate: ResumeTemplateId;
  onSelectTemplate: (template: ResumeTemplateId) => void;
}

/**
 * TemplateSelector Component
 * Allows users to select one of the predefined resume templates
 */
export function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const templates = [
    {
      id: "modern" as const,
      name: "Modern",
      description: "Colour-contrast two-column layout",
      preview: "bg-[#a10f58]",
    },
    {
      id: "classic" as const,
      name: "Classic",
      description: "Readable boxed single-column format",
      preview: "bg-[#2f8d7f]",
    },
    {
      id: "professional" as const,
      name: "Professional",
      description: "Polished two-column executive look",
      preview: "bg-[#6b347e]",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Resume Template</h3>
      <div className="grid grid-cols-3 gap-3">
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.id;

          return (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className={`relative min-h-28 rounded-lg border-2 p-3 text-left transition-all ${
              isSelected
                ? "border-neutral-900 bg-neutral-50"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            {isSelected && (
              <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-white">
                <Check className="h-3 w-3" />
              </span>
            )}
            <div className="mb-3 flex h-10 overflow-hidden rounded border border-neutral-200 bg-white">
              <span className={`block w-1/3 ${template.preview}`} />
              <span className="flex flex-1 flex-col justify-center gap-1 px-2">
                <span className="block h-1.5 w-2/3 rounded bg-neutral-800" />
                <span className="block h-1 w-full rounded bg-neutral-200" />
                <span className="block h-1 w-4/5 rounded bg-neutral-200" />
              </span>
            </div>
            <div className="font-medium text-sm text-neutral-950">{template.name}</div>
            <div className="text-xs text-neutral-600 mt-1">
              {template.description}
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}
