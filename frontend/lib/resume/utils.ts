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

export function calculateYearsExperience(
  experiences: Array<{ startDate: string; endDate: string }>
): number {
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
  } else if (template === "professional") {
    return generateProfessionalTemplate(resume);
  } else {
    return generateModernTemplate(resume);
  }
}

function escapeHtml(value: string | undefined): string {
  return (value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function externalHref(url: string | undefined): string {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function linesToList(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length
    ? `<ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
    : "";
}

function documentShell(title: string, styles: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #ffffff; color: #111827; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    a { color: inherit; text-decoration: none; }
    ul { margin: 4px 0 0; padding-left: 16px; }
    li { margin-bottom: 2px; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; overflow: hidden; }
    .section-title { margin: 0 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; font-size: 14px; font-weight: 700; }
    .dates { color: #525252; font-weight: 700; }
    @media print {
      html, body { width: 210mm; min-height: 297mm; overflow: hidden; }
      .page { margin: 0; box-shadow: none; page-break-after: avoid; }
    }
    ${styles}
  </style>
</head>
<body>${body}</body>
</html>`;
}

function contactLine(resume: Resume): string {
  const { personalInfo } = resume;
  const links = [
    { label: "LinkedIn", href: personalInfo.linkedin },
    { label: "GitHub", href: personalInfo.github },
    { label: "Portfolio", href: personalInfo.portfolio },
  ].filter((link) => link.href);

  return [
    personalInfo.email ? `<span>${escapeHtml(personalInfo.email)}</span>` : "",
    personalInfo.phone ? `<span>${escapeHtml(personalInfo.phone)}</span>` : "",
    personalInfo.address ? `<span>${escapeHtml(personalInfo.address)}</span>` : "",
    ...links.map(
      (link) =>
        `<a href="${escapeHtml(externalHref(link.href))}" target="_blank" rel="noopener noreferrer">${link.label}</a>`
    ),
  ]
    .filter(Boolean)
    .join("");
}

function employmentEntries(resume: Resume, compact = false): string {
  return resume.experience
    .map(
      (exp) => `
        <div class="entry">
          <div class="dates">${formatDate(exp.startDate)} - ${formatDate(exp.endDate)}</div>
          <div>
            <div class="entry-head">
              <strong>${escapeHtml(exp.position)}</strong>
              <span>${escapeHtml(exp.company)}</span>
            </div>
            ${compact ? `<p>${escapeHtml(exp.responsibilities)}</p>` : linesToList(exp.responsibilities)}
          </div>
        </div>`
    )
    .join("");
}

function educationEntries(resume: Resume): string {
  return resume.education
    .map(
      (edu) => `
        <div class="entry">
          <div class="dates">${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}</div>
          <div>
            <strong>${escapeHtml(edu.degree)}</strong>
            <p>${escapeHtml(edu.institution)}</p>
            ${edu.gpa ? `<p>GPA: ${escapeHtml(edu.gpa)}</p>` : ""}
            ${edu.description ? `<p>${escapeHtml(edu.description)}</p>` : ""}
          </div>
        </div>`
    )
    .join("");
}

function skillEntries(resume: Resume): string {
  return resume.skills.map((skill) => `<li>${escapeHtml(skill.name)}</li>`).join("");
}

function projectEntries(resume: Resume): string {
  return resume.projects
    .map(
      (project) => `
        <div class="project">
          <p>
            <strong>
              ${
                project.link
                  ? `<a href="${escapeHtml(externalHref(project.link))}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.name)}</a>`
                  : escapeHtml(project.name)
              }
            </strong>
          </p>
          <p>${escapeHtml(project.description)}</p>
          ${project.technologies.length ? `<p class="muted">${project.technologies.map((tech) => escapeHtml(tech)).join(", ")}</p>` : ""}
        </div>`
    )
    .join("");
}

function certificationEntries(resume: Resume): string {
  return resume.certifications
    .map(
      (cert) => `
        <div class="certification">
          <div class="entry-head">
            <strong>${escapeHtml(cert.name)}</strong>
            <span>${formatDate(cert.date)}</span>
          </div>
          <p>${escapeHtml(cert.issuer)}</p>
          ${
            cert.link
              ? `<a class="muted" href="${escapeHtml(externalHref(cert.link))}" target="_blank" rel="noopener noreferrer">View credential</a>`
              : ""
          }
        </div>`
    )
    .join("");
}

function generateModernTemplate(resume: Resume): string {
  const { personalInfo, skills, education, experience, projects, certifications } = resume;
  const styles = `
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.42; }
    .page { display: grid; grid-template-columns: 62mm 1fr; }
    aside { background: #a10f58; color: white; padding: 18mm 8mm; }
    main { padding: 18mm 10mm; }
    h1 { margin: 0; font-size: 22px; line-height: 1.1; }
    aside h2 { margin: 18px 0 8px; border-bottom: 1px solid rgba(255,255,255,.35); padding-bottom: 4px; font-size: 13px; }
    .section { margin-bottom: 18px; }
    .section-title { color: #111827; }
    .contact p, aside li { margin: 0 0 8px; }
    .avatar { width: 24mm; height: 24mm; border-radius: 999px; object-fit: cover; border: 2px solid rgba(255,255,255,.7); margin-bottom: 8mm; }
    .entry { display: grid; grid-template-columns: 28mm 1fr; gap: 8mm; margin-bottom: 12px; }
    .entry-head { display: flex; justify-content: space-between; gap: 12px; }
    .entry-head span { color: #a10f58; font-size: 10px; }
    .skills { padding-left: 13px; }
    .contact { display: flex; flex-direction: column; gap: 5px; }
    .contact a { color: white; text-decoration: underline; text-underline-offset: 2px; }
    .muted { color: #525252; }
    .project, .certification { margin-bottom: 10px; }
  `;
  const body = `
    <div class="page">
      <aside>
        ${personalInfo.avatar ? `<img class="avatar" src="${personalInfo.avatar}" alt="" />` : ""}
        <h1>${escapeHtml(personalInfo.fullName || "Your Name")}</h1>
        ${personalInfo.summary ? `<p>${escapeHtml(personalInfo.summary)}</p>` : ""}
        <h2>Personal details</h2>
        <div class="contact">
          ${contactLine(resume)}
        </div>
        ${skills.length ? `<h2>Skills</h2><ul class="skills">${skillEntries(resume)}</ul>` : ""}
      </aside>
      <main>
        ${experience.length ? `<section class="section"><h2 class="section-title">Employment</h2>${employmentEntries(resume)}</section>` : ""}
        ${education.length ? `<section class="section"><h2 class="section-title">Education</h2>${educationEntries(resume)}</section>` : ""}
        ${projects.length ? `<section class="section"><h2 class="section-title">Projects</h2>${projectEntries(resume)}</section>` : ""}
        ${certifications.length ? `<section class="section"><h2 class="section-title">Certifications</h2>${certificationEntries(resume)}</section>` : ""}
      </main>
    </div>`;

  return documentShell(resume.title, styles, body);
}

function generateClassicTemplate(resume: Resume): string {
  const { personalInfo, education, experience, skills, projects, certifications } = resume;
  const styles = `
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.45; }
    .page { padding: 14mm 18mm; }
    header { text-align: center; margin-bottom: 12mm; }
    h1 { margin: 0; color: #000; font-size: 22px; }
    .avatar { width: 22mm; height: 22mm; border-radius: 999px; object-fit: cover; border: 1px solid #d4d4d4; margin-bottom: 4mm; }
    .box { border: 1px solid #6ab0a6; margin-bottom: 7mm; }
    .box-title { margin: 0; background: #2f8d7f; color: white; padding: 4px 8px; font-size: 13px; }
    .box-content { padding: 8px; }
    .details { display: grid; grid-template-columns: 42mm 1fr; gap: 6px; }
    .entry { display: grid; grid-template-columns: 42mm 1fr; gap: 8mm; margin-bottom: 10px; }
    .entry-head { display: block; }
    .entry-head span { display: block; color: #444; }
    .links { display: flex; gap: 8px; flex-wrap: wrap; }
    .project, .certification { margin-bottom: 10px; }
    .muted { color: #525252; }
    p { margin: 0 0 4px; }
  `;
  const body = `
    <div class="page">
      <header>
        ${personalInfo.avatar ? `<img class="avatar" src="${personalInfo.avatar}" alt="" />` : ""}
        <h1>${escapeHtml(personalInfo.fullName || "Your Name")}</h1>
        ${personalInfo.summary ? `<p>${escapeHtml(personalInfo.summary)}</p>` : ""}
        <div class="links">${contactLine(resume)}</div>
      </header>
      <section class="box">
        <h2 class="box-title">Personal details</h2>
        <div class="box-content details">
          <strong>Email address</strong><span>${escapeHtml(personalInfo.email)}</span>
          <strong>Phone number</strong><span>${escapeHtml(personalInfo.phone)}</span>
          <strong>Address</strong><span>${escapeHtml(personalInfo.address)}</span>
          <strong>Links</strong><span class="links">${contactLine(resume)}</span>
        </div>
      </section>
      ${experience.length ? `<section class="box"><h2 class="box-title">Employment</h2><div class="box-content">${employmentEntries(resume)}</div></section>` : ""}
      ${education.length ? `<section class="box"><h2 class="box-title">Education</h2><div class="box-content">${educationEntries(resume)}</div></section>` : ""}
      ${skills.length ? `<section class="box"><h2 class="box-title">Skills</h2><div class="box-content"><ul>${skillEntries(resume)}</ul></div></section>` : ""}
      ${projects.length ? `<section class="box"><h2 class="box-title">Projects</h2><div class="box-content">${projectEntries(resume)}</div></section>` : ""}
      ${certifications.length ? `<section class="box"><h2 class="box-title">Certifications</h2><div class="box-content">${certificationEntries(resume)}</div></section>` : ""}
    </div>`;

  return documentShell(resume.title, styles, body);
}

function generateProfessionalTemplate(resume: Resume): string {
  const { personalInfo, experience, education, skills, certifications, projects } = resume;
  const styles = `
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.42; }
    header { background: #6b347e; color: white; padding: 13mm 17mm; }
    .hero { display: flex; align-items: center; gap: 8mm; }
    .avatar { width: 22mm; height: 22mm; border-radius: 999px; object-fit: cover; border: 2px solid rgba(255,255,255,.6); flex: none; }
    h1 { margin: 0; font-size: 24px; }
    .contact { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px; font-size: 10px; opacity: .82; }
    .body { display: grid; grid-template-columns: 1fr 54mm; gap: 10mm; padding: 12mm 17mm; }
    aside { border-left: 1px solid #e5e7eb; padding-left: 8mm; }
    .section { margin-bottom: 16px; }
    .section-title, aside h2 { color: #6b347e; }
    aside h2 { margin: 0 0 8px; font-size: 13px; }
    .entry { display: grid; grid-template-columns: 27mm 1fr; gap: 6mm; margin-bottom: 10px; }
    .entry-head { display: flex; justify-content: space-between; gap: 8px; }
    .entry-head span { color: #525252; font-size: 10px; }
    .project, .certification { margin-bottom: 10px; }
    .muted { color: #525252; }
    p { margin: 0 0 4px; }
  `;
  const body = `
    <div class="page">
      <header>
        <div class="hero">
          ${personalInfo.avatar ? `<img class="avatar" src="${personalInfo.avatar}" alt="" />` : ""}
          <div>
            <h1>${escapeHtml(personalInfo.fullName || "Your Name")}</h1>
            ${personalInfo.summary ? `<p>${escapeHtml(personalInfo.summary)}</p>` : ""}
            <div class="contact">${contactLine(resume)}</div>
          </div>
        </div>
      </header>
      <div class="body">
        <main>
          ${experience.length ? `<section class="section"><h2 class="section-title">Employment</h2>${employmentEntries(resume)}</section>` : ""}
          ${education.length ? `<section class="section"><h2 class="section-title">Education</h2>${educationEntries(resume)}</section>` : ""}
          ${projects.length ? `<section class="section"><h2 class="section-title">Projects</h2>${projectEntries(resume)}</section>` : ""}
          ${certifications.length ? `<section class="section"><h2 class="section-title">Certifications</h2>${certificationEntries(resume)}</section>` : ""}
        </main>
        <aside>
          ${skills.length ? `<section class="section"><h2>Skills</h2><ul>${skillEntries(resume)}</ul></section>` : ""}
        </aside>
      </div>
    </div>`;

  return documentShell(resume.title, styles, body);
}
