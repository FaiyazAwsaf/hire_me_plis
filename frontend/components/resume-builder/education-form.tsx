"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Education, educationSchema } from "@/lib/resume/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

interface EducationFormProps {
  educations: Education[];
  onUpdate: (educations: Education[]) => void;
}

/**
 * EducationForm Component
 * Allows adding, editing, and deleting education entries
 */
export function EducationForm({ educations, onUpdate }: EducationFormProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);

  const addNew = () => {
    const newEducation: Education = {
      id: `edu_${Date.now()}`,
      institution: "",
      degree: "",
      startDate: "",
      endDate: "",
      gpa: "",
      description: "",
    };
    onUpdate([...educations, newEducation]);
    setEditingId(newEducation.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    onUpdate(educations.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {educations.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4">
            No education entries yet
          </p>
        ) : (
          educations.map((edu) => (
            <EducationEntry
              key={edu.id}
              education={edu}
              isEditing={editingId === edu.id}
              onEdit={() => setEditingId(edu.id)}
              onSave={(updated) => {
                onUpdate(
                  educations.map((e) => (e.id === edu.id ? updated : e))
                );
                setEditingId(null);
                setIsAdding(false);
              }}
              onDelete={() => handleDelete(edu.id)}
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
        + Add Education
      </Button>
    </div>
  );
}

interface EducationEntryProps {
  education: Education;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (education: Education) => void;
  onDelete: () => void;
}

function EducationEntry({
  education,
  isEditing,
  onEdit,
  onSave,
  onDelete,
}: EducationEntryProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Education>({
    resolver: zodResolver(educationSchema),
    defaultValues: education,
  });

  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit(onSave)}
        className="p-4 border border-neutral-200 rounded-lg space-y-4 bg-neutral-50"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="institution">Institution *</Label>
            <Input
              id="institution"
              {...register("institution")}
              placeholder="University Name"
              className={errors.institution ? "border-red-500" : ""}
            />
            {errors.institution && (
              <p className="text-xs text-red-500">{errors.institution.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="degree">Degree *</Label>
            <Input
              id="degree"
              {...register("degree")}
              placeholder="B.S. Computer Science"
              className={errors.degree ? "border-red-500" : ""}
            />
            {errors.degree && (
              <p className="text-xs text-red-500">{errors.degree.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
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
              className={errors.endDate ? "border-red-500" : ""}
            />
            {errors.endDate && (
              <p className="text-xs text-red-500">{errors.endDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpa">GPA</Label>
            <Input
              id="gpa"
              {...register("gpa")}
              placeholder="3.8"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            {...register("description")}
            placeholder="Additional details about your education..."
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
          <h4 className="font-semibold text-sm">{education.degree}</h4>
          <p className="text-xs text-neutral-600">{education.institution}</p>
          <p className="text-xs text-neutral-500 mt-1">
            {education.startDate} - {education.endDate}
            {education.gpa && ` • GPA: ${education.gpa}`}
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
