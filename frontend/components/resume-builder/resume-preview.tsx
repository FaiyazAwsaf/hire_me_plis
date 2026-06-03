"use client";

import React from "react";
import { Resume } from "@/lib/resume/types";
import { formatDate } from "@/lib/resume/utils";

interface ResumePreviewProps {
  resume: Resume;
  templateId?: "modern" | "classic" | "minimal";
}

/**
 * ResumePreview Component
 * Displays a saved preview snapshot of the resume
 */
function ResumePreviewComponent({ resume, templateId = "modern" }: ResumePreviewProps) {
  const templateStyles = {
    modern: {
      headerBorder: "border-b-2 border-blue-600",
      headerName: "text-2xl font-bold text-blue-900",
      sectionHeader: "text-sm font-bold text-blue-900 uppercase border-b border-gray-300",
      linkColor: "text-blue-600",
    },
    classic: {
      headerBorder: "border-b-2 border-gray-800",
      headerName: "text-2xl font-bold text-gray-900",
      sectionHeader: "text-sm font-bold text-gray-900 uppercase border-b-2 border-gray-800",
      linkColor: "text-gray-700",
    },
    minimal: {
      headerBorder: "border-b border-gray-300",
      headerName: "text-xl font-semibold text-gray-900",
      sectionHeader: "text-xs font-semibold text-gray-900 uppercase border-b border-gray-200",
      linkColor: "text-gray-600",
    },
  };

  const styles = templateStyles[templateId as keyof typeof templateStyles] || templateStyles.modern;

  return (
    <div className="flex-1 bg-white rounded-lg border border-neutral-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
        <h2 className="text-lg font-semibold text-neutral-900">Preview</h2>
        <p className="text-xs text-neutral-600 mt-1">
          Updates after you save
        </p>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
          {/* Header Section */}
          <div className={`mb-6 pb-4 ${styles.headerBorder}`}>
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {resume.personalInfo.avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resume.personalInfo.avatar}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-neutral-200 shrink-0"
                />
              )}
              <div>
                <h1 className={`${styles.headerName} mb-1`}>
                  {resume.personalInfo.fullName || "Your Name"}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {resume.personalInfo.email && (
                    <span>{resume.personalInfo.email}</span>
                  )}
                  {resume.personalInfo.phone && (
                    <span>{resume.personalInfo.phone}</span>
                  )}
                  {resume.personalInfo.address && (
                    <span>{resume.personalInfo.address}</span>
                  )}
                </div>
                <div className={`flex flex-wrap gap-4 text-sm ${styles.linkColor} mt-2`}>
                  {resume.personalInfo.linkedin && (
                    <a
                      href={resume.personalInfo.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      LinkedIn
                    </a>
                  )}
                  {resume.personalInfo.github && (
                    <a
                      href={resume.personalInfo.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      GitHub
                    </a>
                  )}
                  {resume.personalInfo.portfolio && (
                    <a
                      href={resume.personalInfo.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Portfolio
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          {resume.personalInfo.summary && (
            <section className="mb-5">
              <h2 className={`${styles.sectionHeader} pb-1 mb-2`}>
                Professional Summary
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                {resume.personalInfo.summary}
              </p>
            </section>
          )}

          {/* Experience */}
          {resume.experience.length > 0 && (
            <section className="mb-5">
              <h2 className={`${styles.sectionHeader} pb-1 mb-3`}>
                Experience
              </h2>
              <div className="space-y-3">
                {resume.experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-sm text-gray-900">
                        {exp.position}
                      </h3>
                      <span className="text-xs text-gray-600">
                        {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 italic">
                      {exp.company}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {exp.responsibilities}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {resume.education.length > 0 && (
            <section className="mb-5">
              <h2 className={`${styles.sectionHeader} pb-1 mb-3`}>
                Education
              </h2>
              <div className="space-y-3">
                {resume.education.map((edu) => (
                  <div key={edu.id}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-sm text-gray-900">
                        {edu.degree}
                      </h3>
                      <span className="text-xs text-gray-600">
                        {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 italic">
                      {edu.institution}
                    </p>
                    {edu.gpa && (
                      <p className="text-xs text-gray-600">GPA: {edu.gpa}</p>
                    )}
                    {edu.description && (
                      <p className="text-sm text-gray-700 mt-1">
                        {edu.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {resume.skills.length > 0 && (
            <section className="mb-5">
              <h2 className={`${styles.sectionHeader} pb-1 mb-3`}>
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded font-medium"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {resume.projects.length > 0 && (
            <section className="mb-5">
              <h2 className={`${styles.sectionHeader} pb-1 mb-3`}>
                Projects
              </h2>
              <div className="space-y-3">
                {resume.projects.map((proj) => (
                  <div key={proj.id}>
                    <h3 className="font-semibold text-sm text-gray-900">
                      {proj.name}
                    </h3>
                    <p className="text-sm text-gray-700 mt-1">
                      {proj.description}
                    </p>
                    {proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {proj.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {resume.certifications.length > 0 && (
            <section>
              <h2 className={`${styles.sectionHeader} pb-1 mb-3`}>
                Certifications
              </h2>
              <div className="space-y-3">
                {resume.certifications.map((cert) => (
                  <div key={cert.id}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-sm text-gray-900">
                        {cert.name}
                      </h3>
                      <span className="text-xs text-gray-600">
                        {formatDate(cert.date)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 italic">
                      {cert.issuer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {!resume.personalInfo.fullName && (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-sm">
                Start filling in your information to see the preview
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const ResumePreview = React.memo(ResumePreviewComponent);