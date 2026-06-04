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
  return [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.address,
    personalInfo.linkedin ? "LinkedIn" : "",
    personalInfo.github ? "GitHub" : "",
  ]
    .filter(Boolean)
    .map((item) => `<span>${escapeHtml(item)}</span>`)
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

function generateModernTemplate(resume: Resume): string {
  const { personalInfo, skills, education, experience, projects } = resume;
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
    .entry { display: grid; grid-template-columns: 28mm 1fr; gap: 8mm; margin-bottom: 12px; }
    .entry-head { display: flex; justify-content: space-between; gap: 12px; }
    .entry-head span { color: #a10f58; font-size: 10px; }
    .skills { padding-left: 13px; }
  `;
  const body = `
    <div class="page">
      <aside>
        <h1>${escapeHtml(personalInfo.fullName || "Your Name")}</h1>
        ${personalInfo.summary ? `<p>${escapeHtml(personalInfo.summary)}</p>` : ""}
        <h2>Personal details</h2>
        <div class="contact">
          ${personalInfo.email ? `<p>${escapeHtml(personalInfo.email)}</p>` : ""}
          ${personalInfo.phone ? `<p>${escapeHtml(personalInfo.phone)}</p>` : ""}
          ${personalInfo.address ? `<p>${escapeHtml(personalInfo.address)}</p>` : ""}
        </div>
        ${skills.length ? `<h2>Skills</h2><ul class="skills">${skills.map((skill) => `<li>${escapeHtml(skill.name)}</li>`).join("")}</ul>` : ""}
      </aside>
      <main>
        ${personalInfo.summary ? `<section class="section"><h2 class="section-title">Profile</h2><p>${escapeHtml(personalInfo.summary)}</p></section>` : ""}
        ${experience.length ? `<section class="section"><h2 class="section-title">Employment</h2>${employmentEntries(resume)}</section>` : ""}
        ${education.length ? `<section class="section"><h2 class="section-title">Education</h2>${educationEntries(resume)}</section>` : ""}
        ${projects.length ? `<section class="section"><h2 class="section-title">Projects</h2>${projects.map((project) => `<p><strong>${escapeHtml(project.name)}</strong><br>${escapeHtml(project.description)}</p>`).join("")}</section>` : ""}
      </main>
    </div>`;

  return documentShell(resume.title, styles, body);
}

function generateClassicTemplate(resume: Resume): string {
  const { personalInfo, education, experience, skills } = resume;
  const styles = `
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.45; }
    .page { padding: 14mm 18mm; }
    header { text-align: center; margin-bottom: 12mm; }
    h1 { margin: 0; color: #000; font-size: 22px; }
    .box { border: 1px solid #6ab0a6; margin-bottom: 7mm; }
    .box-title { margin: 0; background: #2f8d7f; color: white; padding: 4px 8px; font-size: 13px; }
    .box-content { padding: 8px; }
    .details { display: grid; grid-template-columns: 42mm 1fr; gap: 6px; }
    .entry { display: grid; grid-template-columns: 42mm 1fr; gap: 8mm; margin-bottom: 10px; }
    .entry-head { display: block; }
    .entry-head span { display: block; color: #444; }
    p { margin: 0 0 4px; }
  `;
  const body = `
    <div class="page">
      <header>
        <h1>${escapeHtml(personalInfo.fullName || "Your Name")}</h1>
        ${personalInfo.summary ? `<p>${escapeHtml(personalInfo.summary)}</p>` : ""}
      </header>
      <section class="box">
        <h2 class="box-title">Personal details</h2>
        <div class="box-content details">
          <strong>Email address</strong><span>${escapeHtml(personalInfo.email)}</span>
          <strong>Phone number</strong><span>${escapeHtml(personalInfo.phone)}</span>
          <strong>Address</strong><span>${escapeHtml(personalInfo.address)}</span>
        </div>
      </section>
      ${personalInfo.summary ? `<section class="box"><h2 class="box-title">Profile</h2><div class="box-content"><p>${escapeHtml(personalInfo.summary)}</p></div></section>` : ""}
      ${experience.length ? `<section class="box"><h2 class="box-title">Employment</h2><div class="box-content">${employmentEntries(resume)}</div></section>` : ""}
      ${education.length ? `<section class="box"><h2 class="box-title">Education</h2><div class="box-content">${educationEntries(resume)}</div></section>` : ""}
      ${skills.length ? `<section class="box"><h2 class="box-title">Skills</h2><div class="box-content">${skills.map((skill) => escapeHtml(skill.name)).join(", ")}</div></section>` : ""}
    </div>`;

  return documentShell(resume.title, styles, body);
}

function generateProfessionalTemplate(resume: Resume): string {
  const { personalInfo, experience, education, skills, certifications, projects } = resume;
  const styles = `
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.42; }
    header { background: #6b347e; color: white; padding: 13mm 17mm; }
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
    p { margin: 0 0 4px; }
  `;
  const body = `
    <div class="page">
      <header>
        <h1>${escapeHtml(personalInfo.fullName || "Your Name")}</h1>
        ${personalInfo.summary ? `<p>${escapeHtml(personalInfo.summary)}</p>` : ""}
        <div class="contact">${contactLine(resume)}</div>
      </header>
      <div class="body">
        <main>
          ${personalInfo.summary ? `<section class="section"><h2 class="section-title">Profile</h2><p>${escapeHtml(personalInfo.summary)}</p></section>` : ""}
          ${experience.length ? `<section class="section"><h2 class="section-title">Employment</h2>${employmentEntries(resume)}</section>` : ""}
          ${education.length ? `<section class="section"><h2 class="section-title">Education</h2>${educationEntries(resume)}</section>` : ""}
          ${projects.length ? `<section class="section"><h2 class="section-title">Projects</h2>${projects.map((project) => `<p><strong>${escapeHtml(project.name)}</strong><br>${escapeHtml(project.description)}</p>`).join("")}</section>` : ""}
        </main>
        <aside>
          ${certifications.length ? `<section class="section"><h2>Professional Affiliations</h2>${certifications.map((cert) => `<p><strong>${escapeHtml(cert.name)}</strong><br>${escapeHtml(cert.issuer)}<br>${formatDate(cert.date)}</p>`).join("")}</section>` : ""}
          ${skills.length ? `<section class="section"><h2>Skills</h2><ul>${skills.map((skill) => `<li>${escapeHtml(skill.name)}</li>`).join("")}</ul></section>` : ""}
        </aside>
      </div>
    </div>`;

  return documentShell(resume.title, styles, body);
}
