"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PersonalInfo, personalInfoSchema } from "@/lib/resume/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface PersonalInfoFormProps {
  data: PersonalInfo;
  onSave: (data: PersonalInfo) => void;
  onDelete: () => void;
}

/**
 * PersonalInfoForm Component
 * Handles editing of personal information section
 * Includes: name, email, phone, address, social links, summary
 */
export function PersonalInfoForm({ data, onSave, onDelete }: PersonalInfoFormProps) {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: data,
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(data.avatar || null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setAvatarPreview(result);
      // Immediately propagate avatar change to the store so the preview updates
      onSave({ ...getValues(), avatar: result });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    // Immediately propagate avatar removal to the store so the preview updates
    onSave({ ...getValues(), avatar: "" });
  };

  return (
    <form onSubmit={handleSubmit((vals) => onSave({ ...vals, avatar: avatarPreview || "" }))} className="flex flex-col h-full">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto space-y-5 p-4">
        {/* Avatar Upload Section */}
        <div className="flex flex-col items-start gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-neutral-200">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-neutral-400 text-center px-2">No Photo</span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="avatar-input"
            />
            <label htmlFor="avatar-input" className="text-sm text-blue-600 cursor-pointer font-medium hover:underline">
              Upload Photo
            </label>
            {avatarPreview && (
              <button type="button" onClick={handleRemoveAvatar} className="text-sm text-red-500 font-medium hover:text-red-700">
                Remove
              </button>
            )}
          </div>
        </div>

        <Separator />

        {/* Name and Phone */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              {...register("fullName")}
              placeholder="John Doe"
              className={errors.fullName ? "border-red-500" : ""}
            />
            {errors.fullName && (
              <p className="text-xs text-red-500">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="+1 (555) 123-4567"
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* Email and Address */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="john@example.com"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="City, Country"
            />
          </div>
        </div>

        <Separator />

        {/* Social & Web Links */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900">Social & Web</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                {...register("linkedin")}
                placeholder="https://linkedin.com/in/..."
                type="url"
                className={errors.linkedin ? "border-red-500" : ""}
              />
              {errors.linkedin && (
                <p className="text-xs text-red-500">{errors.linkedin.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="github">GitHub URL</Label>
              <Input
                id="github"
                {...register("github")}
                placeholder="https://github.com/..."
                type="url"
                className={errors.github ? "border-red-500" : ""}
              />
              {errors.github && (
                <p className="text-xs text-red-500">{errors.github.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfolio Website</Label>
            <Input
              id="portfolio"
              {...register("portfolio")}
              placeholder="https://yourportfolio.com"
              type="url"
              className={errors.portfolio ? "border-red-500" : ""}
            />
            {errors.portfolio && (
              <p className="text-xs text-red-500">{errors.portfolio.message}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Professional Summary */}
        <div className="space-y-2">
          <Label htmlFor="summary">Professional Summary</Label>
          <textarea
            id="summary"
            {...register("summary")}
            placeholder="Brief overview of your professional background and goals..."
            rows={4}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.summary && (
            <p className="text-xs text-red-500">{errors.summary.message}</p>
          )}
        </div>
      </div>

      {/* Sticky Footer with Save/Delete */}
      <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-4 flex gap-2 shadow-md">
        <Button type="submit" className="flex-1">
          Save Personal Info
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete()}
        >
          Delete
        </Button>
      </div>
    </form>
  );
}