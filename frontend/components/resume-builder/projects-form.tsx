"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Project, projectSchema, Skill } from "@/lib/resume/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, X } from "lucide-react";

interface ProjectsFormProps {
  projects: Project[];
  onUpdate: (projects: Project[]) => void;
}

/**
 * ProjectsForm Component
 * Allows adding, editing, and deleting project entries
 * Includes dynamic technology tags
 */
export function ProjectsForm({ projects, onUpdate }: ProjectsFormProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const addNew = () => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: "",
      description: "",
      technologies: [],
      link: "",
    };
    onUpdate([...projects, newProject]);
    setEditingId(newProject.id);
  };

  const handleDelete = (id: string) => {
    onUpdate(projects.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {projects.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4">
            No projects yet
          </p>
        ) : (
          projects.map((proj) => (
            <ProjectEntry
              key={proj.id}
              project={proj}
              isEditing={editingId === proj.id}
              onEdit={() => setEditingId(proj.id)}
              onSave={(updated) => {
                onUpdate(
                  projects.map((p) => (p.id === proj.id ? updated : p))
                );
                setEditingId(null);
              }}
              onDelete={() => handleDelete(proj.id)}
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
        + Add Project
      </Button>
    </div>
  );
}

interface ProjectEntryProps {
  project: Project;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (project: Project) => void;
  onDelete: () => void;
}

function ProjectEntry({
  project,
  isEditing,
  onEdit,
  onSave,
  onDelete,
}: ProjectEntryProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<Project>({
    resolver: zodResolver(projectSchema),
    defaultValues: project,
  });

  const technologies = watch("technologies");
  const [techInput, setTechInput] = React.useState("");

  const addTech = () => {
    if (techInput.trim() && !technologies.includes(techInput.trim())) {
      setValue("technologies", [...technologies, techInput.trim()]);
      setTechInput("");
    }
  };

  const removeTech = (tech: string) => {
    setValue("technologies", technologies.filter((t) => t !== tech));
  };

  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit(onSave)}
        className="p-4 border border-neutral-200 rounded-lg space-y-4 bg-neutral-50"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Project Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="E-commerce Platform"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <textarea
            id="description"
            {...register("description")}
            placeholder="Brief overview of the project..."
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? "border-red-500" : "border-neutral-300"
            }`}
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="link">Project Link</Label>
          <Input
            id="link"
            type="url"
            {...register("link")}
            placeholder="https://project-link.com"
            className={errors.link ? "border-red-500" : ""}
          />
          {errors.link && (
            <p className="text-xs text-red-500">{errors.link.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="techInput">Technologies</Label>
          <div className="flex gap-2">
            <Input
              id="techInput"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTech();
                }
              }}
              placeholder="React, Node.js, PostgreSQL"
            />
            <Button
              type="button"
              onClick={addTech}
              variant="outline"
              size="sm"
            >
              Add
            </Button>
          </div>

          {technologies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {technologies.map((tech) => (
                <div
                  key={tech}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-blue-100 text-blue-900 text-xs"
                >
                  {tech}
                  <button
                    onClick={() => removeTech(tech)}
                    className="hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
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
          <h4 className="font-semibold text-sm">{project.name}</h4>
          <p className="text-xs text-neutral-600 mt-1">{project.description}</p>
          {project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {project.technologies.map((tech) => (
                <span key={tech} className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                  {tech}
                </span>
              ))}
            </div>
          )}
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
