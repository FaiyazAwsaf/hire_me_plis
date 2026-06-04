"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, RotateCw, X } from "lucide-react";
import { z } from "zod";
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

type PersonalInfoFormInput = z.input<typeof personalInfoSchema>;

const cropSize = 240;

interface CropPosition {
  x: number;
  y: number;
}

function cropImageToDataUrl(
  image: HTMLImageElement,
  zoom: number,
  rotation: number,
  position: CropPosition
): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = cropSize;
  canvas.height = cropSize;

  if (!ctx) return image.src;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cropSize, cropSize);
  ctx.translate(cropSize / 2 + position.x, cropSize / 2 + position.y);
  ctx.rotate((rotation * Math.PI) / 180);

  const baseScale = Math.max(cropSize / image.naturalWidth, cropSize / image.naturalHeight);
  const scale = baseScale * zoom;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;

  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  return canvas.toDataURL("image/jpeg", 0.92);
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
    reset,
    formState: { errors },
  } = useForm<PersonalInfoFormInput, unknown, PersonalInfo>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: data,
  });

  const [cropSource, setCropSource] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropPosition, setCropPosition] = useState<CropPosition>({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: cropSize, height: cropSize });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cropImageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{
    pointerId: number;
    pointerX: number;
    pointerY: number;
    imageX: number;
    imageY: number;
  } | null>(null);

  useEffect(() => {
    reset(data);
  }, [data, reset]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setCropSource(result);
      setZoom(1);
      setRotation(0);
      setCropPosition({ x: 0, y: 0 });
      setImageSize({ width: cropSize, height: cropSize });
    };
    reader.readAsDataURL(file);
  };

  const buildPersonalInfo = (avatar: string): PersonalInfo => {
    const values = getValues();

    return {
      fullName: values.fullName || "",
      email: values.email || "",
      phone: values.phone || "",
      address: values.address || "",
      linkedin: values.linkedin || "",
      github: values.github || "",
      portfolio: values.portfolio || "",
      summary: values.summary || "",
      avatar,
    };
  };

  const handleConfirmCrop = () => {
    const image = cropImageRef.current;
    if (!image) return;

    const result = cropImageToDataUrl(image, zoom, rotation, cropPosition);
    setCropSource(null);
    onSave(buildPersonalInfo(result));
  };

  const handleCropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      imageX: cropPosition.x,
      imageY: cropPosition.y,
    };
  };

  const handleCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;

    setCropPosition({
      x: dragStart.imageX + event.clientX - dragStart.pointerX,
      y: dragStart.imageY + event.clientY - dragStart.pointerY,
    });
  };

  const handleCropPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current?.pointerId === event.pointerId) {
      dragStartRef.current = null;
    }
  };

  const handleRemoveAvatar = () => {
    onSave(buildPersonalInfo(""));
  };

  const baseScale = Math.max(cropSize / imageSize.width, cropSize / imageSize.height);
  const previewWidth = imageSize.width * baseScale * zoom;
  const previewHeight = imageSize.height * baseScale * zoom;

  return (
    <form onSubmit={handleSubmit((vals) => onSave({ ...vals, avatar: data.avatar || "" }))} className="flex flex-col h-full">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto space-y-5 p-4">
        {/* Avatar Upload Section */}
        <div className="flex flex-col items-start gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-neutral-200">
              {data.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.avatar} alt="avatar" className="w-full h-full object-cover" />
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
            <label htmlFor="avatar-input" className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-blue-600 hover:underline">
              <Camera className="h-4 w-4" />
              Upload Photo
            </label>
            {data.avatar && (
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

      {cropSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-neutral-900">Photo</h2>
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                aria-label="Close photo cropper"
                onClick={() => setCropSource(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex h-80 items-center justify-center overflow-hidden bg-neutral-500">
              <div
                className="relative h-60 w-60 cursor-grab overflow-hidden bg-white active:cursor-grabbing"
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerEnd}
                onPointerCancel={handleCropPointerEnd}
                style={{ touchAction: "none" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={cropImageRef}
                  src={cropSource}
                  alt="Crop preview"
                  draggable={false}
                  onLoad={(event) => {
                    setImageSize({
                      width: event.currentTarget.naturalWidth,
                      height: event.currentTarget.naturalHeight,
                    });
                  }}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                  style={{
                    width: `${previewWidth}px`,
                    height: `${previewHeight}px`,
                    transform: `translate(-50%, -50%) translate(${cropPosition.x}px, ${cropPosition.y}px) rotate(${rotation}deg)`,
                  }}
                />
                <div className="pointer-events-none absolute inset-0 border border-white/60" />
                <div className="pointer-events-none absolute left-0 right-0 top-1/3 border-t border-white/35" />
                <div className="pointer-events-none absolute left-0 right-0 top-2/3 border-t border-white/35" />
                <div className="pointer-events-none absolute bottom-0 top-0 left-1/3 border-l border-white/35" />
                <div className="pointer-events-none absolute bottom-0 top-0 left-2/3 border-l border-white/35" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-[120px_1fr] gap-x-4 gap-y-3">
              <Label className="text-base font-semibold text-neutral-700">Rotate</Label>
              <Label className="text-base font-semibold text-neutral-700">Zoom</Label>
              <Button
                type="button"
                variant="ghost"
                className="w-fit"
                onClick={() => setRotation((value) => (value + 90) % 360)}
              >
                <RotateCw className="h-5 w-5" />
              </Button>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-[#4c19c8]"
              />
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="button" size="lg" onClick={handleConfirmCrop} className="bg-[#4c19c8] px-6 hover:bg-[#3b139d]">
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
