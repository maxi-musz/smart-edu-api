/**
 * Report card PDF template design.
 * Professional layout with rich colors, 12-row subject table, and clear hierarchy.
 * Used for download result as PDF and can be reused for email attachments.
 */

// pdfkit is CommonJS; default export may not be available after compile
import * as PDFDocumentModule from 'pdfkit';
const PDFDocument = (PDFDocumentModule as any).default ?? PDFDocumentModule;

/** Number of subject rows to always show in the table (fixed layout for up to 12 subjects) */
export const REPORT_CARD_SUBJECT_ROWS = 12;

// ----- Design constants: Smart Edu Hub brand (purple #5C4BDE) and layout -----
export const REPORT_CARD_DESIGN = {
  /** Primary brand – header banner, table header, school name */
  brandPrimary: '#5C4BDE',
  /** Darker accent for top bar and borders */
  brandPrimaryDark: '#4a3bb8',
  /** Secondary – subtle accents */
  brandSecondary: '#6b5ce8',
  /** Heading and body text */
  brandHeading: '#1e293b',
  /** Muted text */
  brandMuted: '#64748b',
  /** Alternating row light */
  rowEven: '#f8f7fe',
  /** Alternating row slightly darker */
  rowOdd: '#f0eefc',
  /** Table border */
  tableBorder: '#d4cff5',
  /** White for header text */
  tableHeaderColor: '#ffffff',
  /** Summary box background */
  summaryBg: '#f0eefc',
  /** Summary box border */
  summaryBorder: '#b8aef0',
  pageMargin: 44,
  rowHeight: 24,
  bannerHeight: 36,
  bannerTitleFontSize: 15,
  schoolNameFontSize: 22,
  bodyFontSize: 10,
  tableFontSize: 9,
  summaryFontSize: 11,
  tableHeaderFontSize: 9,
  /** Fixed table height for 12 rows (rowHeight * REPORT_CARD_SUBJECT_ROWS) */
  tableDataHeight: 24 * REPORT_CARD_SUBJECT_ROWS,
  /** Watermark: opacity and font size (drawn on top, diagonal lower-left to upper-right) */
  watermarkOpacity: 0.35,
  watermarkFontSize: 16,
  /** School logo max dimensions (width, height) in PDF points */
  logoMaxWidth: 72,
  logoMaxHeight: 72,
  /** Placeholder text when logo is missing */
  logoPlaceholderText: 'School Logo',
  logoPlaceholderFontSize: 8,
} as const;

/** Watermark text (professional wording) */
const REPORT_CARD_WATERMARK = 'Built, Managed, and Maintained by Smart-Edu-Hub';

/** Subject result item (matches Result.subject_results JSON shape) */
export interface ReportCardSubjectResult {
  subject_id?: string;
  subject_code?: string;
  subject_name?: string;
  ca_score?: number | null;
  exam_score?: number | null;
  ca1?: number | null;
  ca2?: number | null;
  total_score?: number;
  total_max_score?: number;
  percentage?: number;
  grade?: string | null;
}

/** Data shape for the report card template (decoupled from Prisma) */
export interface ReportCardTemplateData {
  school: {
    school_name: string;
    school_address?: string | null;
    school_phone?: string | null;
    school_email?: string | null;
    /** School logo image buffer (e.g. from S3); when null/undefined, placeholder "School Logo" is shown */
    school_logo?: Buffer | null;
  };
  class?: { name: string } | null;
  academicSession: {
    academic_year: string;
    term: string;
  };
  total_students?: number | null;
  class_position?: number | null;
  subject_results: ReportCardSubjectResult[];
  total_score?: number | null;
  overall_percentage?: number | null;
  overall_grade?: string | null;
}

function termLabel(term: string): string {
  const t = String(term).toLowerCase();
  if (t === 'first') return 'First Term';
  if (t === 'second') return 'Second Term';
  if (t === 'third') return 'Third Term';
  return term;
}

/** Capitalize first letter of each word for display (school name, subject name, etc.) */
function toTitleCase(s: string | null | undefined): string {
  if (s == null || s === '' || s === '—') return s === '—' ? '—' : '';
  return String(s)
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Builds the report card PDF buffer from template data.
 * Professional layout: top accent bar, school header, banner, 12-row subject table with borders, summary box.
 */
export function buildReportCardPdf(data: ReportCardTemplateData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: REPORT_CARD_DESIGN.pageMargin,
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const {
      brandPrimary,
      brandPrimaryDark,
      brandHeading,
      brandMuted,
      rowEven,
      rowOdd,
      tableBorder,
      tableHeaderColor,
      summaryBg,
      summaryBorder,
      rowHeight,
      pageMargin,
      tableDataHeight,
    } = REPORT_CARD_DESIGN;
    const left = pageMargin;
    const right = doc.page.width - pageMargin;
    const width = right - left;
    const pad = 10;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    const school = data.school;
    const className = data.class?.name ?? '—';
    const session = data.academicSession;
    const sessionLabel = `${session.academic_year} Academic Session`;
    const termLabelStr = termLabel(session.term);

    let cursorY = 28;
    const logoSize = { w: REPORT_CARD_DESIGN.logoMaxWidth, h: REPORT_CARD_DESIGN.logoMaxHeight };
    const logoX = left;
    const logoY = cursorY;

    // ----- Top accent bar -----
    doc.rect(0, 0, doc.page.width, 6).fill(brandPrimaryDark);

    // ----- School logo or placeholder -----
    const hasLogo = school.school_logo && Buffer.isBuffer(school.school_logo) && school.school_logo.length > 0;
    doc.rect(logoX, logoY, logoSize.w, logoSize.h).stroke(tableBorder);
    if (hasLogo) {
      try {
        doc.image(school.school_logo as Buffer, logoX + 2, logoY + 2, {
          fit: [logoSize.w - 4, logoSize.h - 4],
          align: 'center',
          valign: 'center',
        });
      } catch {
        doc
          .fontSize(REPORT_CARD_DESIGN.logoPlaceholderFontSize)
          .font('Helvetica')
          .fillColor(brandMuted)
          .text(REPORT_CARD_DESIGN.logoPlaceholderText, logoX, logoY + logoSize.h / 2 - 4, {
            width: logoSize.w,
            align: 'center',
          });
      }
    } else {
      doc
        .fontSize(REPORT_CARD_DESIGN.logoPlaceholderFontSize)
        .font('Helvetica')
        .fillColor(brandMuted)
        .text(REPORT_CARD_DESIGN.logoPlaceholderText, logoX, logoY + logoSize.h / 2 - 4, {
          width: logoSize.w,
          align: 'center',
        });
    }

    // ----- Header: school name and contact centered on full page (logo stays left, does not shift center) -----
    doc
      .fontSize(REPORT_CARD_DESIGN.schoolNameFontSize)
      .fillColor(brandPrimary)
      .font('Helvetica-Bold')
      .text(toTitleCase(school.school_name) || school.school_name, left, cursorY, { width, align: 'center' });
    cursorY += 26;
    doc.fontSize(REPORT_CARD_DESIGN.bodyFontSize).font('Helvetica').fillColor(brandMuted);
    if (school.school_address) {
      doc.text(`Address: ${school.school_address}`, left, cursorY, { width, align: 'center' });
      cursorY += 14;
    }
    if (school.school_phone) {
      doc.text(`Tel: ${school.school_phone}`, left, cursorY, { width, align: 'center' });
      cursorY += 14;
    }
    if (school.school_email) {
      doc.text(`Email: ${school.school_email}`, left, cursorY, { width, align: 'center' });
      cursorY += 14;
    }
    cursorY = Math.max(cursorY + 8, logoY + logoSize.h + 10);

    // ----- Banner: STUDENT REPORT CARD -----
    const bannerY = cursorY;
    doc.rect(left, bannerY, width, REPORT_CARD_DESIGN.bannerHeight).fill(brandPrimary);
    doc.rect(left, bannerY, width, REPORT_CARD_DESIGN.bannerHeight).stroke(brandPrimaryDark);
    doc
      .fontSize(REPORT_CARD_DESIGN.bannerTitleFontSize)
      .fillColor(tableHeaderColor)
      .font('Helvetica-Bold')
      .text('STUDENT REPORT CARD', left, bannerY + 10, { width, align: 'center' });
    cursorY = bannerY + REPORT_CARD_DESIGN.bannerHeight + 22;

    // ----- Academic details (two-column layout) -----
    doc.fontSize(REPORT_CARD_DESIGN.bodyFontSize).font('Helvetica').fillColor(brandHeading);
    const infoLineH = 20;
    doc.text(`Session: ${sessionLabel}`, left, cursorY);
    doc.text(`Term: ${termLabelStr}`, right - 160, cursorY);
    cursorY += infoLineH;
    doc.text(`Class: ${className}`, left, cursorY);
    doc.text(`Total Students in Class: ${data.total_students ?? '—'}`, right - 200, cursorY);
    cursorY += infoLineH;
    const posText = data.class_position != null ? `${data.class_position}${getOrdinal(data.class_position)}` : '—';
    doc.text(`Position in Class: ${posText}`, left, cursorY);
    cursorY += 28;

    // ----- Subject results table: fixed 12 rows with full border -----
    const tableTop = cursorY;
    const subjects = Array.isArray(data.subject_results) ? data.subject_results : [];
    const colWidths = {
      sn: 32,
      subject: width - 32 - 48 - 48 - 72 - 44 - 44,
      ca1: 48,
      ca2: 48,
      overall: 72,
      pct: 44,
      grade: 44,
    };
    const headers = ['S/N', 'Subject', 'CA1', 'CA2', 'Overall', '%', 'Grade'];
    const startX = left;

    // Table outer border
    const tableTotalHeight = rowHeight + tableDataHeight;
    doc.rect(startX, tableTop, width, tableTotalHeight).stroke(tableBorder);

    // Header row (filled background + border)
    doc.rect(startX, tableTop, width, rowHeight).fill(brandPrimary);
    doc.rect(startX, tableTop, width, rowHeight).stroke(tableBorder);
    doc
      .fillColor(tableHeaderColor)
      .font('Helvetica-Bold')
      .fontSize(REPORT_CARD_DESIGN.tableHeaderFontSize);
    let x = startX + pad;
    doc.text(headers[0], x, tableTop + 7, { width: colWidths.sn });
    x += colWidths.sn;
    doc.text(headers[1], x, tableTop + 7, { width: colWidths.subject });
    x += colWidths.subject;
    doc.text(headers[2], x, tableTop + 7, { width: colWidths.ca1 });
    x += colWidths.ca1;
    doc.text(headers[3], x, tableTop + 7, { width: colWidths.ca2 });
    x += colWidths.ca2;
    doc.text(headers[4], x, tableTop + 7, { width: colWidths.overall });
    x += colWidths.overall;
    doc.text(headers[5], x, tableTop + 7, { width: colWidths.pct });
    x += colWidths.pct;
    doc.text(headers[6], x, tableTop + 7, { width: colWidths.grade });

    // Vertical lines between columns (header + data area)
    let colX = startX;
    [colWidths.sn, colWidths.subject, colWidths.ca1, colWidths.ca2, colWidths.overall, colWidths.pct].forEach((w) => {
      colX += w;
      doc.moveTo(colX, tableTop).lineTo(colX, tableTop + tableTotalHeight).stroke(tableBorder);
    });

    // Data rows: always 12 rows (fill with subject data, then empty rows)
    doc.font('Helvetica').fontSize(REPORT_CARD_DESIGN.tableFontSize);
    let dataY = tableTop + rowHeight;
    for (let i = 0; i < REPORT_CARD_SUBJECT_ROWS; i++) {
      const rowBg = i % 2 === 0 ? rowEven : rowOdd;
      doc.rect(startX, dataY, width, rowHeight).fill(rowBg);
      doc.rect(startX, dataY, width, rowHeight).stroke(tableBorder);

      const row = subjects[i];
      const isFilled = row != null;
      const sn = isFilled ? String(i + 1) : '—';
      const name = isFilled ? ((toTitleCase(row.subject_name) || row.subject_name) ?? '—') : '—';
      const ca1 = isFilled ? (row.ca1 ?? row.ca_score ?? '—') : '—';
      const ca2 = isFilled ? (row.ca2 ?? row.exam_score ?? '—') : '—';
      const total = isFilled ? (row.total_score ?? 0) : '—';
      const pct = isFilled
        ? (row.percentage ?? (row.total_max_score ? ((row.total_score ?? 0) / row.total_max_score) * 100 : 0))
        : '—';
      const pctStr = typeof pct === 'number' ? `${Number(pct).toFixed(0)}%` : '—';
      const grade = isFilled ? (row.grade ?? '—') : '—';

      doc.fillColor(brandHeading);
      x = startX + pad;
      doc.text(String(sn), x, dataY + 7, { width: colWidths.sn });
      x += colWidths.sn;
      doc.text(String(name), x, dataY + 7, { width: colWidths.subject });
      x += colWidths.subject;
      doc.text(String(ca1), x, dataY + 7, { width: colWidths.ca1 });
      x += colWidths.ca1;
      doc.text(String(ca2), x, dataY + 7, { width: colWidths.ca2 });
      x += colWidths.ca2;
      doc.text(String(total), x, dataY + 7, { width: colWidths.overall });
      x += colWidths.overall;
      doc.text(pctStr, x, dataY + 7, { width: colWidths.pct });
      x += colWidths.pct;
      doc.text(String(grade), x, dataY + 7, { width: colWidths.grade });
      dataY += rowHeight;
    }

    cursorY = tableTop + tableTotalHeight + 26;

    // ----- Summary box -----
    const summaryBoxH = 52;
    const summaryBoxW = 220;
    const summaryLeft = left;
    doc.rect(summaryLeft, cursorY, summaryBoxW, summaryBoxH).fill(summaryBg).stroke(summaryBorder);
    doc.font('Helvetica-Bold').fontSize(REPORT_CARD_DESIGN.summaryFontSize).fillColor(brandHeading);
    doc.text(`Total Marks: ${data.total_score ?? 0}`, summaryLeft + 14, cursorY + 12);
    doc.text(
      `Average: ${data.overall_percentage != null ? data.overall_percentage.toFixed(1) : '0'}%`,
      summaryLeft + 14,
      cursorY + 28,
    );
    doc.text(`Final Grade: ${data.overall_grade ?? '—'}`, summaryLeft + 14, cursorY + 44);

    // ----- Watermark: diagonal lower-left to upper-right (drawn on top so it is visible) -----
    doc.save();
    doc.opacity(REPORT_CARD_DESIGN.watermarkOpacity);
    doc.fontSize(REPORT_CARD_DESIGN.watermarkFontSize).font('Helvetica').fillColor(brandMuted);
    doc.translate(pageWidth / 2, pageHeight / 2);
    doc.rotate(45, { origin: [0, 0] });
    doc.text(REPORT_CARD_WATERMARK, -pageWidth / 2, -10, {
      width: pageWidth,
      align: 'center',
    });
    doc.restore();

    doc.end();
  });
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
