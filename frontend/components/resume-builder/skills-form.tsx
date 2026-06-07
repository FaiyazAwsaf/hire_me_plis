"use client";

import React, { useState } from "react";
import { Skill } from "@/lib/resume/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface SkillsFormProps {
  skills: Skill[];
  onUpdate: (skills: Skill[]) => void;
}

/**
 * SkillsForm Component
 * Dynamic tag-based input for skills
 * Press Enter to add a skill
 */
export function SkillsForm({ skills, onUpdate }: SkillsFormProps) {
  const [input, setInput] = useState("");

  const addSkill = () => {
    if (input.trim()) {
      const newSkill: Skill = {
        id: `skill_${Date.now()}`,
        name: input.trim(),
      };
      onUpdate([...skills, newSkill]);
      setInput("");
    }
  };

  const removeSkill = (id: string) => {
    onUpdate(skills.filter((s) => s.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="skillInput">Add Skills (Press Enter to add)</Label>
        <div className="flex gap-2">
          <Input
            id="skillInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Python, React, Node.js"
            className="flex-1"
          />
          <Button
            type="button"
            onClick={addSkill}
            variant="outline"
          >
            Add
          </Button>
        </div>
      </div>

      {skills.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-neutral-600 font-medium">Your Skills</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-sm text-blue-900"
              >
                {skill.name}
                <button
                  onClick={() => removeSkill(skill.id)}
                  className="ml-1 text-blue-600 hover:text-blue-800 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
