import { z } from "zod";

/**
 * Resume Schema Definitions
 * Comprehensive type definitions for all resume sections
 */

export const personalInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  email: z.string().email("Invalid email"),
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().optional().default(""),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  github: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  portfolio: z.string().url("Invalid portfolio URL").optional().or(z.literal("")),
  avatar: z.string().optional().or(z.literal("")),
  summary: z.string().max(500, "Summary must be under 500 characters").optional().default(""),
});

export const educationSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  gpa: z.string().optional().default(""),
  description: z.string().optional().default(""),
}).refine(
  (data) => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
);

export const experienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  responsibilities: z.string().min(1, "Responsibilities are required"),
}).refine(
  (data) => !data.startDate || !data.endDate || new Date(data.startDate) <= new Date(data.endDate),
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
);

export const skillSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Skill name is required"),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Description is required"),
  technologies: z.array(z.string()),
  link: z.string().url("Invalid project URL").optional().or(z.literal("")),
});

export const certificationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Certification name is required"),
  issuer: z.string().min(1, "Issuer is required"),
  date: z.string().min(1, "Issue date is required"),
  link: z.string().url("Invalid certification URL").optional().or(z.literal("")),
});

export const resumeTemplateSchema = z.enum(["modern", "classic", "professional"]);
export type ResumeTemplateId = z.infer<typeof resumeTemplateSchema>;

export const resumeSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Resume title is required").max(100),
  templateId: resumeTemplateSchema,
  personalInfo: personalInfoSchema,
  education: z.array(educationSchema),
  experience: z.array(experienceSchema),
  skills: z.array(skillSchema),
  projects: z.array(projectSchema),
  certifications: z.array(certificationSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// TypeScript types derived from schemas
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type Resume = z.infer<typeof resumeSchema>;

/**
 * Default Resume Template
 */
export const defaultResume: Resume = {
  id: "",
  title: "My Resume",
  templateId: "modern",
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    linkedin: "",
    github: "",
    portfolio: "",
    avatar: "",
    summary: "",
  },
  education: [],
  experience: [],
  skills: [],
  projects: [],
  certifications: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
