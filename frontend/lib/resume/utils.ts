import { Resume } from "./types";

/**
 * Resume utility functions
 */

export function generateResumeId(): string {
  return `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  } catch {
    return dateString;
  }
}

export function calculateYearsExperience(experiences: any[]): number {
  if (!experiences.length) return 0;

  let totalMonths = 0;
  experiences.forEach((exp) => {
    try {
      const start = new Date(exp.startDate);
      const end = new Date(exp.endDate);
      const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
      totalMonths += months;
    } catch {
      // Skip invalid dates
    }
  });

  return Math.round((totalMonths / 12) * 10) / 10;
}

export function exportResumeAsJSON(resume: Resume): string {
  return JSON.stringify(resume, null, 2);
}

export function downloadJSON(resume: Resume): void {
  const jsonString = exportResumeAsJSON(resume);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${resume.title}-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate HTML for resume (for PDF export and preview)
 */
export function generateResumeHTML(resume: Resume, templateId?: string): string {
  const template = templateId || resume.templateId;

  if (template === "classic") {
    return generateClassicTemplate(resume);
  } else if (template === "minimal") {
    return generateMinimalTemplate(resume);
  } else {
    return generateModernTemplate(resume);
  }
}

function generateModernTemplate(resume: Resume): string {
  const { personalInfo, experience, education, skills, projects, certifications } = resume;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${resume.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }

    .container {
      max-width: 8.5in;
      height: 11in;
      margin: 20px auto;
      padding: 40px;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }

    header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e5e7eb;
      flex-shrink: 0;
    }

    .header-info {
      flex: 1;
    }

    h1 {
      font-size: 28px;
      color: #1e40af;
      margin-bottom: 5px;
    }

    .contact-info {
      font-size: 12px;
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      color: #666;
    }

    .contact-info a {
      color: #2563eb;
      text-decoration: none;
    }

    h2 {
      font-size: 14px;
      font-weight: bold;
      color: #1e40af;
      text-transform: uppercase;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 5px;
      margin-top: 15px;
      margin-bottom: 10px;
    }

    .section {
      margin-bottom: 15px;
    }

    .entry {
      margin-bottom: 12px;
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }

    .entry-title {
      font-weight: bold;
      font-size: 13px;
    }

    .entry-title a {
      color: inherit;
      text-decoration: none;
    }

    .entry-title a:hover {
      text-decoration: underline;
    }

    .entry-subtitle {
      font-style: italic;
      color: #666;
      font-size: 12px;
    }

    .entry-dates {
      font-size: 12px;
      color: #666;
    }

    .entry-description {
      font-size: 12px;
      color: #555;
      line-height: 1.5;
    }

    .credential-link {
      font-size: 11px;
      color: #2563eb;
      text-decoration: none;
      margin-top: 2px;
      display: inline-block;
    }

    .credential-link:hover {
      text-decoration: underline;
    }

    .summary {
      font-size: 12px;
      line-height: 1.5;
      margin-bottom: 10px;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .skill-tag {
      background: #e0e7ff;
      color: #3730a3;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      ${personalInfo.avatar ? `<img class="avatar" src="${personalInfo.avatar}" alt="Profile" />` : ""}
      <div class="header-info">
        <h1>${personalInfo.fullName}</h1>
        <div class="contact-info">
          ${personalInfo.email ? `<span>${personalInfo.email}</span>` : ""}
          ${personalInfo.phone ? `<span>${personalInfo.phone}</span>` : ""}
          ${personalInfo.address ? `<span>${personalInfo.address}</span>` : ""}
          ${personalInfo.linkedin ? `<span><a href="${personalInfo.linkedin}">LinkedIn</a></span>` : ""}
          ${personalInfo.github ? `<span><a href="${personalInfo.github}">GitHub</a></span>` : ""}
        </div>
      </div>
    </header>

    ${personalInfo.summary ? `
      <section class="section">
        <h2>Professional Summary</h2>
        <p class="summary">${personalInfo.summary}</p>
      </section>
    ` : ""}

    ${experience.length > 0 ? `
      <section class="section">
        <h2>Experience</h2>
        ${experience.map(exp => `
          <div class="entry">
            <div class="entry-header">
              <span class="entry-title">${exp.position}</span>
              <span class="entry-dates">${formatDate(exp.startDate)} - ${formatDate(exp.endDate)}</span>
            </div>
            <div class="entry-subtitle">${exp.company}</div>
            <div class="entry-description">${exp.responsibilities}</div>
          </div>
        `).join("")}
      </section>
    ` : ""}

    ${education.length > 0 ? `
      <section class="section">
        <h2>Education</h2>
        ${education.map(edu => `
          <div class="entry">
            <div class="entry-header">
              <span class="entry-title">${edu.degree}</span>
              <span class="entry-dates">${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}</span>
            </div>
            <div class="entry-subtitle">${edu.institution}</div>
            ${edu.gpa ? `<div class="entry-description">GPA: ${edu.gpa}</div>` : ""}
            ${edu.description ? `<div class="entry-description">${edu.description}</div>` : ""}
          </div>
        `).join("")}
      </section>
    ` : ""}

    ${skills.length > 0 ? `
      <section class="section">
        <h2>Skills</h2>
        <div class="skills-list">
          ${skills.map(skill => `<span class="skill-tag">${skill.name}</span>`).join("")}
        </div>
      </section>
    ` : ""}

    ${projects.length > 0 ? `
      <section class="section">
        <h2>Projects</h2>
        ${projects.map(proj => `
          <div class="entry">
            <div class="entry-title">
              ${proj.link ? `<a href="${proj.link}" target="_blank">${proj.name}</a>` : proj.name}
            </div>
            <div class="entry-description">${proj.description}</div>
            ${proj.technologies.length > 0 ? `<div class="entry-description"><strong>Tech:</strong> ${proj.technologies.join(", ")}</div>` : ""}
          </div>
        `).join("")}
      </section>
    ` : ""}

    ${certifications.length > 0 ? `
      <section class="section">
        <h2>Certifications</h2>
        ${certifications.map(cert => `
          <div class="entry">
            <div class="entry-header">
              <span class="entry-title">${cert.name}</span>
              <span class="entry-dates">${formatDate(cert.date)}</span>
            </div>
            <div class="entry-subtitle">${cert.issuer}</div>
            ${cert.link ? `<a class="credential-link" href="${cert.link}" target="_blank">View Credential</a>` : ""}
          </div>
        `).join("")}
      </section>
    ` : ""}
  </div>
</body>
</html>
  `;
}

function generateClassicTemplate(resume: Resume): string {
  return generateModernTemplate(resume);
}

function generateMinimalTemplate(resume: Resume): string {
  return generateModernTemplate(resume);
}