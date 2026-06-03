"use client";

import React from "react";
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
}

/**
 * PersonalInfoForm Component
 * Handles editing of personal information section
 * Includes: name, email, phone, address, social links, summary
 */
export function PersonalInfoForm({ data, onSave }: PersonalInfoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: data,
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-5">
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

      <Separator className="my-4" />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Social & Web</h3>

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

      <Separator className="my-4" />

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

      <Button type="submit" className="w-full">
        Save Personal Info
      </Button>
    </form>
  );
}
