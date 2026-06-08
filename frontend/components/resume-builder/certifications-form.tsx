"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Certification, certificationSchema } from "@/lib/resume/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

interface CertificationsFormProps {
  certifications: Certification[];
  onUpdate: (certifications: Certification[]) => void;
}

/**
 * CertificationsForm Component
 * Allows adding, editing, and deleting certification entries
 */
export function CertificationsForm({
  certifications,
  onUpdate,
}: CertificationsFormProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const addNew = () => {
    const newCert: Certification = {
      id: `cert_${Date.now()}`,
      name: "",
      issuer: "",
      date: "",
      link: "",
    };
    onUpdate([...certifications, newCert]);
    setEditingId(newCert.id);
  };

  const handleDelete = (id: string) => {
    onUpdate(certifications.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {certifications.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4">
            No certifications yet
          </p>
        ) : (
          certifications.map((cert) => (
            <CertificationEntry
              key={cert.id}
              certification={cert}
              isEditing={editingId === cert.id}
              onEdit={() => setEditingId(cert.id)}
              onSave={(updated) => {
                onUpdate(
                  certifications.map((c) => (c.id === cert.id ? updated : c))
                );
                setEditingId(null);
              }}
              onDelete={() => handleDelete(cert.id)}
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
        + Add Certification
      </Button>
    </div>
  );
}

interface CertificationEntryProps {
  certification: Certification;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (certification: Certification) => void;
  onDelete: () => void;
}

function CertificationEntry({
  certification,
  isEditing,
  onEdit,
  onSave,
  onDelete,
}: CertificationEntryProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Certification>({
    resolver: zodResolver(certificationSchema),
    defaultValues: certification,
  });

  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit(onSave)}
        className="p-4 border border-neutral-200 rounded-lg space-y-4 bg-neutral-50"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Certification Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="AWS Solutions Architect"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuer">Issuer *</Label>
            <Input
              id="issuer"
              {...register("issuer")}
              placeholder="Amazon Web Services"
              className={errors.issuer ? "border-red-500" : ""}
            />
            {errors.issuer && (
              <p className="text-xs text-red-500">{errors.issuer.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Issue Date *</Label>
            <Input
              id="date"
              type="month"
              {...register("date")}
              className={errors.date ? "border-red-500" : ""}
            />
            {errors.date && (
              <p className="text-xs text-red-500">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Credential Link</Label>
            <Input
              id="link"
              type="url"
              {...register("link")}
              placeholder="https://credentials.example.com"
              className={errors.link ? "border-red-500" : ""}
            />
            {errors.link && (
              <p className="text-xs text-red-500">{errors.link.message}</p>
            )}
          </div>
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
          <h4 className="font-semibold text-sm">{certification.name}</h4>
          <p className="text-xs text-neutral-600">{certification.issuer}</p>
          <p className="text-xs text-neutral-500 mt-1">{certification.date}</p>
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
