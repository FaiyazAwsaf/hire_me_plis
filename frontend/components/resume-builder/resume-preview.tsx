"use client";

import React from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { Resume, ResumeTemplateId } from "@/lib/resume/types";
import { formatDate } from "@/lib/resume/utils";

interface ResumePreviewProps {
  resume: Resume;
  templateId?: ResumeTemplateId;
}

const splitLines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

function EmptyState({ resume }: { resume: Resume }) {
  if (resume.personalInfo.fullName) return null;

  return (
    <div className="py-12 text-center text-sm text-neutral-500">
      Start filling in your information to see the preview
    </div>
  );
}

function externalHref(url: string) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function ContactLinks({ resume, tone = "dark" }: { resume: Resume; tone?: "dark" | "light" }) {
  const { personalInfo } = resume;
  const linkClass = tone === "light" ? "text-white/90 hover:text-white" : "text-neutral-700 hover:text-neutral-950";
  const links = [
    { label: "LinkedIn", href: personalInfo.linkedin },
    { label: "GitHub", href: personalInfo.github },
    { label: "Portfolio", href: personalInfo.portfolio },
  ].filter((link): link is { label: string; href: string } => !!link.href);

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {links.map((link) => (
        <a
          key={link.label}
          href={externalHref(link.href)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkClass} underline-offset-2 hover:underline`}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

function ExperienceBlock({ resume }: { resume: Resume }) {
  if (resume.experience.length === 0) return null;

  return (
    <section>
      <h2 className="resume-section-title">Employment</h2>
      <div className="space-y-4">
        {resume.experience.map((exp) => (
          <div key={exp.id} className="grid grid-cols-[95px_1fr] gap-4 text-[11px]">
            <div className="font-semibold text-neutral-700">
              {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-xs font-bold text-neutral-950">{exp.position}</h3>
                <span className="text-[10px] text-neutral-500">{exp.company}</span>
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-neutral-800">
                {splitLines(exp.responsibilities).map((item, index) => (
                  <li key={`${exp.id}-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EducationBlock({ resume }: { resume: Resume }) {
  if (resume.education.length === 0) return null;

  return (
    <section>
      <h2 className="resume-section-title">Education</h2>
      <div className="space-y-3">
        {resume.education.map((edu) => (
          <div key={edu.id} className="grid grid-cols-[95px_1fr] gap-4 text-[11px]">
            <div className="font-semibold text-neutral-700">
              {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
            </div>
            <div>
              <h3 className="text-xs font-bold text-neutral-950">{edu.degree}</h3>
              <p className="text-[11px] text-neutral-600">{edu.institution}</p>
              {edu.gpa && <p className="text-[11px] text-neutral-600">GPA: {edu.gpa}</p>}
              {edu.description && <p className="mt-1 text-neutral-800">{edu.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkillsBlock({ resume, accent = "neutral" }: { resume: Resume; accent?: "neutral" | "purple" | "white" }) {
  if (resume.skills.length === 0) return null;

  const dotClass = {
    neutral: "bg-neutral-800",
    purple: "bg-[#6b347e]",
    white: "bg-white",
  }[accent];

  return (
    <section>
      <h2 className="resume-section-title">Skills</h2>
      <ul className="space-y-1.5 text-[11px]">
        {resume.skills.map((skill) => (
          <li key={skill.id} className="flex gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 ${dotClass}`} />
            {skill.name}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProjectBlock({ resume }: { resume: Resume }) {
  if (resume.projects.length === 0) return null;

  return (
    <section>
      <h2 className="resume-section-title">Projects</h2>
      <div className="space-y-3">
        {resume.projects.map((project) => (
          <div key={project.id} className="text-[11px]">
            <h3 className="text-xs font-bold text-neutral-950">
              {project.link ? (
                <a
                  href={externalHref(project.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  {project.name}
                </a>
              ) : (
                project.name
              )}
            </h3>
            <p className="mt-1 text-neutral-800">{project.description}</p>
            {project.technologies.length > 0 && (
              <p className="mt-1 text-neutral-600">{project.technologies.join(", ")}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function CertificationBlock({ resume }: { resume: Resume }) {
  if (resume.certifications.length === 0) return null;

  return (
    <section>
      <h2 className="resume-section-title">Certifications</h2>
      <div className="space-y-3">
        {resume.certifications.map((cert) => (
          <div key={cert.id} className="text-[11px]">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-xs font-bold text-neutral-950">{cert.name}</h3>
              <span className="text-[10px] text-neutral-500">{formatDate(cert.date)}</span>
            </div>
            <p className="text-neutral-700">{cert.issuer}</p>
            {cert.link && (
              <a
                href={externalHref(cert.link)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-neutral-700 underline-offset-2 hover:text-neutral-950 hover:underline"
              >
                View credential
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ModernTemplate({ resume }: { resume: Resume }) {
  const { personalInfo } = resume;

  return (
    <div className="mx-auto grid min-h-[880px] w-[680px] grid-cols-[220px_1fr] overflow-hidden bg-white shadow-sm">
      <aside className="bg-[#a10f58] p-7 text-white">
        {personalInfo.avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={personalInfo.avatar}
            alt=""
            className="mb-5 h-24 w-24 rounded-full border-2 border-white/70 object-cover"
          />
        )}
        <h1 className="text-xl font-bold leading-tight">{personalInfo.fullName || "Your Name"}</h1>
        <p className="mt-2 text-[11px] font-medium opacity-90">{personalInfo.summary}</p>

        <div className="mt-7 space-y-5">
          <section>
            <h2 className="border-b border-white/35 pb-1 text-sm font-bold">Personal details</h2>
            <div className="mt-3 space-y-3 text-[11px]">
              {personalInfo.email && <p className="flex gap-2"><Mail className="mt-0.5 h-3 w-3" />{personalInfo.email}</p>}
              {personalInfo.phone && <p className="flex gap-2"><Phone className="mt-0.5 h-3 w-3" />{personalInfo.phone}</p>}
              {personalInfo.address && <p className="flex gap-2"><MapPin className="mt-0.5 h-3 w-3" />{personalInfo.address}</p>}
              <ContactLinks resume={resume} tone="light" />
            </div>
          </section>

          <div className="text-white [&_.resume-section-title]:border-white/35 [&_.resume-section-title]:text-white">
            <SkillsBlock resume={resume} accent="white" />
          </div>
        </div>
      </aside>

      <main className="space-y-5 p-7 text-neutral-900">
        <ExperienceBlock resume={resume} />
        <EducationBlock resume={resume} />
        <ProjectBlock resume={resume} />
        <CertificationBlock resume={resume} />
        <EmptyState resume={resume} />
      </main>
    </div>
  );
}

function ClassicTemplate({ resume }: { resume: Resume }) {
  const { personalInfo } = resume;
  const boxClass = "border border-[#6ab0a6]";

  return (
    <div className="mx-auto min-h-[880px] w-[680px] bg-white p-8 shadow-sm">
      <header className="text-center">
        {personalInfo.avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={personalInfo.avatar}
            alt=""
            className="mx-auto mb-3 h-20 w-20 rounded-full border border-neutral-300 object-cover"
          />
        )}
        <h1 className="text-2xl font-bold text-black">{personalInfo.fullName || "Your Name"}</h1>
        {personalInfo.summary && <p className="mt-1 text-[11px] text-neutral-700">{personalInfo.summary}</p>}
        <div className="mt-2 text-[11px]">
          <ContactLinks resume={resume} />
        </div>
      </header>

      <main className="mt-7 space-y-5">
        <section className={boxClass}>
          <h2 className="bg-[#2f8d7f] px-3 py-1 text-sm font-bold text-white">Personal details</h2>
          <div className="grid grid-cols-[150px_1fr] gap-y-2 p-3 text-[11px]">
            <span className="font-bold">Email address</span><span>{personalInfo.email}</span>
            <span className="font-bold">Phone number</span><span>{personalInfo.phone}</span>
            <span className="font-bold">Address</span><span>{personalInfo.address}</span>
            <span className="font-bold">Links</span><div><ContactLinks resume={resume} /></div>
          </div>
        </section>

        {resume.experience.length > 0 && <section className={`${boxClass} p-3`}><ExperienceBlock resume={resume} /></section>}
        {resume.education.length > 0 && <section className={`${boxClass} p-3`}><EducationBlock resume={resume} /></section>}
        {resume.skills.length > 0 && <section className={`${boxClass} p-3`}><SkillsBlock resume={resume} /></section>}
        {resume.projects.length > 0 && <section className={`${boxClass} p-3`}><ProjectBlock resume={resume} /></section>}
        {resume.certifications.length > 0 && <section className={`${boxClass} p-3`}><CertificationBlock resume={resume} /></section>}
        <EmptyState resume={resume} />
      </main>
    </div>
  );
}

function ProfessionalTemplate({ resume }: { resume: Resume }) {
  const { personalInfo } = resume;

  return (
    <div className="mx-auto min-h-[880px] w-[680px] overflow-hidden bg-white shadow-sm">
      <header className="bg-[#6b347e] px-8 py-6 text-white">
        <div className="flex items-center gap-5">
          {personalInfo.avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={personalInfo.avatar}
              alt=""
              className="h-20 w-20 rounded-full border-2 border-white/60 object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{personalInfo.fullName || "Your Name"}</h1>
            {personalInfo.summary && <p className="mt-1 text-xs opacity-85">{personalInfo.summary}</p>}
            <div className="mt-4 flex flex-wrap gap-4 text-[10px] opacity-80">
              {personalInfo.email && <span>{personalInfo.email}</span>}
              {personalInfo.phone && <span>{personalInfo.phone}</span>}
              {personalInfo.address && <span>{personalInfo.address}</span>}
              <ContactLinks resume={resume} tone="light" />
            </div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-[1fr_205px] gap-7 px-8 py-7">
        <div className="space-y-5">
          <ExperienceBlock resume={resume} />
          <EducationBlock resume={resume} />
          <ProjectBlock resume={resume} />
          <CertificationBlock resume={resume} />
          <EmptyState resume={resume} />
        </div>

        <aside className="space-y-5 border-l border-neutral-200 pl-6">
          <div className="[&_.resume-section-title]:text-[#6b347e]">
            <SkillsBlock resume={resume} accent="purple" />
          </div>
        </aside>
      </main>
    </div>
  );
}

function ResumePreviewComponent({ resume, templateId = "modern" }: ResumePreviewProps) {
  const activeTemplate = templateId === "professional" ? "professional" : templateId;

  return (
    <div className="w-full">
      <style>{`.resume-section-title{margin-bottom:.5rem;border-bottom:1px solid #e5e7eb;padding-bottom:.25rem;font-size:.875rem;font-weight:700;color:#171717}`}</style>
      {activeTemplate === "classic" && <ClassicTemplate resume={resume} />}
      {activeTemplate === "professional" && <ProfessionalTemplate resume={resume} />}
      {activeTemplate === "modern" && <ModernTemplate resume={resume} />}
    </div>
  );
}

export const ResumePreview = React.memo(ResumePreviewComponent);