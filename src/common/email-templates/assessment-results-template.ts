/**
 * Assessment results PDF template.
 * Professional layout: school header, statistics dashboard, class breakdown,
 * and a paginated student results table.
 * Built with pdfkit, following the same design language as the report card template.
 */

import * as PDFDocumentModule from 'pdfkit';
const PDFDocument = (PDFDocumentModule as any).default ?? PDFDocumentModule;

// ─── Design Constants ────────────────────────────────────────────────
const D = {
  brandPrimary: '#5C4BDE',
  brandPrimaryDark: '#4a3bb8',
  brandHeading: '#1e293b',
  brandMuted: '#64748b',
  white: '#ffffff',
  rowEven: '#f8f7fe',
  rowOdd: '#f0eefc',
  tableBorder: '#d4cff5',
  summaryBg: '#f0eefc',
  summaryBorder: '#b8aef0',
  passedColor: '#16a34a',
  failedColor: '#dc2626',
  notAttemptedColor: '#9ca3af',
  pageMargin: 40,
  rowHeight: 22,
  headerRowHeight: 24,
  logoMaxWidth: 60,
  logoMaxHeight: 60,
};

const WATERMARK = 'Built, Managed, and Maintained by Smart-Edu-Hub';

// ─── Interfaces ──────────────────────────────────────────────────────
export interface AssessmentResultsPdfStudent {
  sn: number;
  studentName: string;
  email: string;
  className: string;
  status: 'Passed' | 'Failed' | 'Not Attempted';
  score: string; // e.g. "95% (95/100)"
  percentage: number;
  submitted: string; // formatted date string
  position: string; // e.g. "1st"
}

export interface AssessmentResultsPdfClass {
  className: string;
  totalStudents: number;
  studentsAttempted: number;
  studentsNotAttempted: number;
  completion: number; // percentage
}

export interface AssessmentResultsPdfData {
  school: {
    school_name: string;
    school_address?: string | null;
    school_phone?: string | null;
    school_email?: string | null;
    school_logo?: Buffer | null;
  };
  assessment: {
    title: string;
    subject?: string | null;
    topic?: string | null;
    totalPoints?: number | null;
    passingScore?: number | null;
  };
  statistics: {
    totalStudents: number;
    studentsAttempted: number;
    studentsNotAttempted: number;
    totalAttempts: number;
    averageScore: number;
    completionRate: number;
  };
  classes: AssessmentResultsPdfClass[];
  students: AssessmentResultsPdfStudent[];
}

// ─── Helpers ─────────────────────────────────────────────────────────
function toTitleCase(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function getOrdinal(n: number): string {
  const s = String(n);
  const last = s.slice(-1);
  const last2 = s.slice(-2);
  if (last2 === '11' || last2 === '12' || last2 === '13') return 'th';
  if (last === '1') return 'st';
  if (last === '2') return 'nd';
  if (last === '3') return 'rd';
  return 'th';
}

// ─── PDF Builder ─────────────────────────────────────────────────────
export function buildAssessmentResultsPdf(
  data: AssessmentResultsPdfData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: D.pageMargin,
      bufferPages: true,
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = D.pageMargin;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const right = pageWidth - D.pageMargin;
    const width = right - left;

    // ═══════════════════════════════════════════════════════════════
    // Page 1: Header, Stats, Class Breakdown, start of table
    // ═══════════════════════════════════════════════════════════════
    let y = D.pageMargin;

    // Top accent bar
    doc.rect(0, 0, pageWidth, 5).fill(D.brandPrimaryDark);

    // ─── School Header ───────────────────────────────────────────
    const logoSize = { w: D.logoMaxWidth, h: D.logoMaxHeight };
    const hasLogo =
      data.school.school_logo &&
      Buffer.isBuffer(data.school.school_logo) &&
      data.school.school_logo.length > 0;

    if (hasLogo) {
      try {
        doc.image(data.school.school_logo as Buffer, left, y, {
          fit: [logoSize.w, logoSize.h],
          align: 'center',
          valign: 'center',
        });
      } catch {
        /* fallback: no logo */
      }
    }

    // School name + contact (centered)
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor(D.brandPrimary)
      .text(
        toTitleCase(data.school.school_name) || data.school.school_name,
        left,
        y,
        { width, align: 'center' },
      );
    y += 22;

    doc.fontSize(9).font('Helvetica').fillColor(D.brandMuted);
    const contactParts: string[] = [];
    if (data.school.school_address)
      contactParts.push(data.school.school_address);
    if (data.school.school_phone)
      contactParts.push(`Tel: ${data.school.school_phone}`);
    if (data.school.school_email) contactParts.push(data.school.school_email);
    if (contactParts.length) {
      doc.text(contactParts.join('  |  '), left, y, { width, align: 'center' });
      y += 14;
    }
    y = Math.max(y + 4, D.pageMargin + logoSize.h + 8);

    // ─── Banner: ASSESSMENT RESULTS ──────────────────────────────
    doc.rect(left, y, width, 30).fill(D.brandPrimary);
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor(D.white)
      .text('ASSESSMENT RESULTS', left, y + 8, { width, align: 'center' });
    y += 38;

    // ─── Assessment Info ─────────────────────────────────────────
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(D.brandHeading)
      .text(data.assessment.title, left, y, { width });
    y += 16;

    doc.fontSize(9).font('Helvetica').fillColor(D.brandMuted);
    const infoParts: string[] = [];
    if (data.assessment.subject)
      infoParts.push(`Subject: ${data.assessment.subject}`);
    if (data.assessment.topic)
      infoParts.push(`Topic: ${data.assessment.topic}`);
    if (data.assessment.totalPoints != null)
      infoParts.push(`Total Points: ${data.assessment.totalPoints}`);
    if (data.assessment.passingScore != null)
      infoParts.push(`Passing Score: ${data.assessment.passingScore}`);
    if (infoParts.length) {
      doc.text(infoParts.join('   |   '), left, y, { width });
      y += 16;
    }

    // ─── Statistics Dashboard ────────────────────────────────────
    y += 4;
    const stats = data.statistics;
    const statItems = [
      { label: 'Total Students', value: String(stats.totalStudents) },
      { label: 'Attempted', value: String(stats.studentsAttempted) },
      { label: 'Not Attempted', value: String(stats.studentsNotAttempted) },
      { label: 'Total Attempts', value: String(stats.totalAttempts) },
      { label: 'Avg Score', value: `${stats.averageScore}%` },
      { label: 'Completion', value: `${stats.completionRate}%` },
    ];

    const statBoxW = Math.floor(width / statItems.length);
    const statBoxH = 36;
    doc
      .rect(left, y, width, statBoxH)
      .fill(D.summaryBg)
      .stroke(D.summaryBorder);

    for (let i = 0; i < statItems.length; i++) {
      const bx = left + i * statBoxW;
      // Vertical separator
      if (i > 0) {
        doc
          .moveTo(bx, y + 6)
          .lineTo(bx, y + statBoxH - 6)
          .stroke(D.summaryBorder);
      }
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(D.brandMuted)
        .text(statItems[i].label, bx + 8, y + 6, {
          width: statBoxW - 16,
          align: 'center',
        });
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(D.brandHeading)
        .text(statItems[i].value, bx + 8, y + 18, {
          width: statBoxW - 16,
          align: 'center',
        });
    }
    y += statBoxH + 10;

    // ─── Class Breakdown ─────────────────────────────────────────
    if (data.classes.length > 0) {
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(D.brandHeading)
        .text('Class Breakdown', left, y);
      y += 14;

      const cbHeaders = [
        'Class',
        'Students',
        'Attempted',
        'Not Attempted',
        'Completion',
      ];
      const cbColW = [140, 80, 80, 100, 80];
      const cbTotalW = cbColW.reduce((a, b) => a + b, 0);

      // Header row
      doc.rect(left, y, cbTotalW, D.headerRowHeight).fill(D.brandPrimary);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(D.white);
      let cx = left;
      for (let i = 0; i < cbHeaders.length; i++) {
        doc.text(cbHeaders[i], cx + 6, y + 7, { width: cbColW[i] - 12 });
        cx += cbColW[i];
      }
      y += D.headerRowHeight;

      // Data rows
      doc.font('Helvetica').fontSize(8).fillColor(D.brandHeading);
      for (let i = 0; i < data.classes.length; i++) {
        const cls = data.classes[i];
        const bg = i % 2 === 0 ? D.rowEven : D.rowOdd;
        doc.rect(left, y, cbTotalW, D.rowHeight).fill(bg);
        doc.rect(left, y, cbTotalW, D.rowHeight).stroke(D.tableBorder);
        doc.fillColor(D.brandHeading);

        cx = left;
        const vals = [
          cls.className,
          String(cls.totalStudents),
          String(cls.studentsAttempted),
          String(cls.studentsNotAttempted),
          `${cls.completion}%`,
        ];
        for (let j = 0; j < vals.length; j++) {
          doc.text(vals[j], cx + 6, y + 6, { width: cbColW[j] - 12 });
          cx += cbColW[j];
        }
        y += D.rowHeight;
      }
      y += 12;
    }

    // ─── Student Results Table ───────────────────────────────────
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(D.brandHeading)
      .text(`Student Attempts (${data.students.length})`, left, y);
    y += 14;

    const headers = [
      'S/N',
      'Student Name',
      'Email',
      'Class',
      'Status',
      'Score',
      'Submitted',
      'Position',
    ];
    const colW = [30, 140, 190, 80, 72, 110, 120, 60];
    const tableW = colW.reduce((a, b) => a + b, 0);

    const drawTableHeader = (startY: number) => {
      doc.rect(left, startY, tableW, D.headerRowHeight).fill(D.brandPrimary);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(D.white);
      let hx = left;
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], hx + 4, startY + 7, { width: colW[i] - 8 });
        hx += colW[i];
      }
      return startY + D.headerRowHeight;
    };

    y = drawTableHeader(y);

    // Draw student rows with pagination
    const bottomMargin = D.pageMargin + 20; // space for watermark
    doc.font('Helvetica').fontSize(8);

    for (let i = 0; i < data.students.length; i++) {
      // Check if we need a new page
      if (y + D.rowHeight > pageHeight - bottomMargin) {
        addWatermark(doc, pageWidth, pageHeight);
        doc.addPage({ layout: 'landscape' });
        doc.rect(0, 0, pageWidth, 5).fill(D.brandPrimaryDark);
        y = D.pageMargin + 10;
        y = drawTableHeader(y);
        doc.font('Helvetica').fontSize(8);
      }

      const student = data.students[i];
      const bg = i % 2 === 0 ? D.rowEven : D.rowOdd;
      doc.rect(left, y, tableW, D.rowHeight).fill(bg);
      doc.rect(left, y, tableW, D.rowHeight).stroke(D.tableBorder);

      // Status color
      let statusColor = D.brandHeading;
      if (student.status === 'Passed') statusColor = D.passedColor;
      else if (student.status === 'Failed') statusColor = D.failedColor;
      else statusColor = D.notAttemptedColor;

      let rx = left;
      doc.fillColor(D.brandHeading);
      doc.text(String(student.sn), rx + 4, y + 6, { width: colW[0] - 8 });
      rx += colW[0];
      doc.text(student.studentName, rx + 4, y + 6, { width: colW[1] - 8 });
      rx += colW[1];
      doc
        .fontSize(7)
        .text(student.email, rx + 4, y + 7, { width: colW[2] - 8 });
      doc.fontSize(8);
      rx += colW[2];
      doc.text(student.className, rx + 4, y + 6, { width: colW[3] - 8 });
      rx += colW[3];
      doc
        .fillColor(statusColor)
        .font('Helvetica-Bold')
        .text(student.status, rx + 4, y + 6, { width: colW[4] - 8 });
      doc.font('Helvetica').fillColor(D.brandHeading);
      rx += colW[4];
      doc.text(student.score, rx + 4, y + 6, { width: colW[5] - 8 });
      rx += colW[5];
      doc.text(student.submitted, rx + 4, y + 6, { width: colW[6] - 8 });
      rx += colW[6];
      doc
        .font('Helvetica-Bold')
        .text(student.position, rx + 4, y + 6, { width: colW[7] - 8 });
      doc.font('Helvetica');

      y += D.rowHeight;
    }

    // Watermark on last page
    addWatermark(doc, pageWidth, pageHeight);

    doc.end();
  });
}

function addWatermark(doc: any, pageWidth: number, pageHeight: number) {
  doc.save();
  doc.opacity(0.3);
  doc.fontSize(14).font('Helvetica').fillColor(D.brandMuted);
  doc.translate(pageWidth / 2, pageHeight / 2);
  doc.rotate(30, { origin: [0, 0] });
  doc.text(WATERMARK, -pageWidth / 2, -10, {
    width: pageWidth,
    align: 'center',
  });
  doc.restore();
}
