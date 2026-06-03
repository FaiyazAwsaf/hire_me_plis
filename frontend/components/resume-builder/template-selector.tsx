"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TemplateSelectorProps {
  selectedTemplate: "modern" | "classic" | "minimal";
  onSelectTemplate: (template: "modern" | "classic" | "minimal") => void;
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
      description: "Clean, contemporary design with accent colors",
    },
    {
      id: "classic" as const,
      name: "Classic",
      description: "Traditional professional format",
    },
    {
      id: "minimal" as const,
      name: "Minimal",
      description: "Simplistic, distraction-free layout",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Resume Template</h3>
      <div className="grid grid-cols-3 gap-3">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              selectedTemplate === template.id
                ? "border-blue-500 bg-blue-50"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <div className="font-medium text-sm">{template.name}</div>
            <div className="text-xs text-neutral-600 mt-1">
              {template.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
