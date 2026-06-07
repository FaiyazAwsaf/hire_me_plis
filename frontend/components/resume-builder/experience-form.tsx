"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Experience, experienceSchema } from "@/lib/resume/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

interface ExperienceFormProps {
  experiences: Experience[];
  onUpdate: (experiences: Experience[]) => void;
}

/**
 * ExperienceForm Component
 * Allows adding, editing, and deleting work experience entries
 */
export function ExperienceForm({ experiences, onUpdate }: ExperienceFormProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const addNew = () => {
    const newExperience: Experience = {
      id: `exp_${Date.now()}`,
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      responsibilities: "",
    };
    onUpdate([...experiences, newExperience]);
    setEditingId(newExperience.id);
  };

  const handleDelete = (id: string) => {
    onUpdate(experiences.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {experiences.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4">
            No experience entries yet
          </p>
        ) : (
          experiences.map((exp) => (
            <ExperienceEntry
              key={exp.id}
              experience={exp}
              isEditing={editingId === exp.id}
              onEdit={() => setEditingId(exp.id)}
              onSave={(updated) => {
                onUpdate(
                  experiences.map((e) => (e.id === exp.id ? updated : e))
                );
                setEditingId(null);
              }}
              onDelete={() => handleDelete(exp.id)}
            />
          ))
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addNew}
        className="w-full"
      >
        + Add Experience
      </Button>
    </div>
  );
}

interface ExperienceEntryProps {
  experience: Experience;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (experience: Experience) => void;
  onDelete: () => void;
}

function ExperienceEntry({
  experience,
  isEditing,
  onEdit,
  onSave,
  onDelete,
}: ExperienceEntryProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Experience>({
    resolver: zodResolver(experienceSchema),
    defaultValues: experience,
  });

  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit(onSave)}
        className="p-4 border border-neutral-200 rounded-lg space-y-4 bg-neutral-50"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              {...register("company")}
              placeholder="Company Name"
              className={errors.company ? "border-red-500" : ""}
            />
            {errors.company && (
              <p className="text-xs text-red-500">{errors.company.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position *</Label>
            <Input
              id="position"
              {...register("position")}
              placeholder="Software Engineer"
              className={errors.position ? "border-red-500" : ""}
            />
            {errors.position && (
              <p className="text-xs text-red-500">{errors.position.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="month"
              {...register("startDate")}
              className={errors.startDate ? "border-red-500" : ""}
            />
            {errors.startDate && (
              <p className="text-xs text-red-500">{errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date *</Label>
            <Input
              id="endDate"
              type="month"
              {...register("endDate")}
              placeholder="Leave empty if current"
              className={errors.endDate ? "border-red-500" : ""}
            />
            {errors.endDate && (
              <p className="text-xs text-red-500">{errors.endDate.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsibilities">Responsibilities *</Label>
          <textarea
            id="responsibilities"
            {...register("responsibilities")}
            placeholder="Describe your key responsibilities and achievements..."
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.responsibilities ? "border-red-500" : "border-neutral-300"
            }`}
          />
          {errors.responsibilities && (
            <p className="text-xs text-red-500">{errors.responsibilities.message}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="sm" className="flex-1">
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onDelete()}
            className="text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div
      onClick={onEdit}
      className="p-4 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50 transition"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{experience.position}</h4>
          <p className="text-xs text-neutral-600">{experience.company}</p>
          <p className="text-xs text-neutral-500 mt-1">
            {experience.startDate} - {experience.endDate}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-neutral-400 hover:text-red-500 transition"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
