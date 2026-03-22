import { Workbook, type Worksheet } from 'exceljs';
import type { DataValidation } from 'exceljs';

/** Runtime API (missing from exceljs typings). */
type WorksheetDataValidations = {
  add(address: string, validation: DataValidation): void;
};

function sheetWithValidations(ws: Worksheet): WorksheetDataValidations {
  return (ws as Worksheet & { dataValidations: WorksheetDataValidations })
    .dataValidations;
}

/** Types supported by bulk Excel import (must match parser + `BULK_UNSUPPORTED_TYPES`). */
export const BULK_TEMPLATE_QUESTION_TYPES = [
  'MULTIPLE_CHOICE_SINGLE',
  'MULTIPLE_CHOICE_MULTIPLE',
  'TRUE_FALSE',
  'SHORT_ANSWER',
  'LONG_ANSWER',
  'FILL_IN_BLANK',
  'NUMERIC',
  'DATE',
] as const;

/**
 * Row 1 labels (human-readable). Backend maps these to internal keys by
 * normalizing: lowercase, spaces → underscores, strip punctuation
 * (e.g. "Correct answer (text)" → `correct_answer_text`).
 */
export const BULK_QUESTIONS_TEMPLATE_DISPLAY_HEADERS = [
  'Question text',
  'Question type',
  'Points',
  'Option 1',
  'Option 2',
  'Option 3',
  'Option 4',
  'Correct option indices',
  'Correct answer text',
  'Correct answer number',
  'Correct answer date',
] as const;

const OPTION_COUNT = 4;
const DATA_ROW_START = 2;
/** Editable data rows (header stays row 1). */
const DATA_ROW_END = 5000;

const LISTS_SHEET = '_Lists';
const QUESTIONS_SHEET = 'Questions';
const HELP_SHEET = 'How_to_use';

function buildHeaderRow(): string[] {
  return [...BULK_QUESTIONS_TEMPLATE_DISPLAY_HEADERS];
}

/**
 * Generates the teacher bulk-questions `.xlsx` template:
 * - Human-readable headers; difficulty is not collected (backend uses EASY).
 * - Row 1 locked; data rows 2–5000 unlocked; sheet protected (no password).
 * - Dropdown: **Question type** only (`_Lists` sheet, veryHidden).
 * - **Points**: whole 0–1000 or blank.
 * - **Correct answer date** column: date validation.
 * - **How_to_use** read-only.
 */
export async function buildBulkQuestionsTemplateExcelBuffer(): Promise<Buffer> {
  const headers = buildHeaderRow();
  const colCount = headers.length;

  const wb = new Workbook();
  wb.creator = 'Smart Edu';
  wb.created = new Date();

  const questions = wb.addWorksheet(QUESTIONS_SHEET, {
    properties: { tabColor: { argb: 'FF2E75B6' } },
    views: [
      {
        state: 'frozen',
        ySplit: 1,
        activeCell: 'A2',
        showGridLines: true,
      },
    ],
  });

  const help = wb.addWorksheet(HELP_SHEET, {
    properties: { tabColor: { argb: 'FF70AD47' } },
  });

  const lists = wb.addWorksheet(LISTS_SHEET, { state: 'veryHidden' });

  BULK_TEMPLATE_QUESTION_TYPES.forEach((t, i) => {
    lists.getCell(i + 1, 1).value = t;
  });

  headers.forEach((h, i) => {
    const cell = questions.getCell(1, i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FF000000' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.protection = { locked: true };
  });

  const sampleRows: (string | number)[][] = [
    [
      'What is 2 + 2?',
      'MULTIPLE_CHOICE_SINGLE',
      1,
      '3',
      '4',
      '5',
      '22',
      '2',
      '',
      '',
      '',
    ],
    [
      'Select all prime numbers.',
      'MULTIPLE_CHOICE_MULTIPLE',
      2,
      '2',
      '3',
      '4',
      '9',
      '1,2',
      '',
      '',
      '',
    ],
    [
      'The sun rises in the east.',
      'TRUE_FALSE',
      1,
      '',
      '',
      '',
      '',
      'TRUE',
      '',
      '',
      '',
    ],
    [
      'Name the process plants use to make food.',
      'SHORT_ANSWER',
      2,
      '',
      '',
      '',
      '',
      '',
      'Photosynthesis',
      '',
      '',
    ],
  ];

  let rowIndex = DATA_ROW_START;
  for (const row of sampleRows) {
    for (let c = 0; c < colCount; c++) {
      const v = row[c];
      const cell = questions.getCell(rowIndex, c + 1);
      if (v !== '' && v !== undefined) {
        cell.value = v as string | number;
      }
      cell.protection = { locked: false };
    }
    rowIndex++;
  }

  for (let r = rowIndex; r <= DATA_ROW_END; r++) {
    for (let c = 1; c <= colCount; c++) {
      questions.getCell(r, c).protection = { locked: false };
    }
  }

  const widths = headers.map((h) =>
    Math.min(48, Math.max(14, String(h).length + 4)),
  );
  questions.columns = widths.map((wch) => ({ width: wch }));

  const qtEnd = BULK_TEMPLATE_QUESTION_TYPES.length;

  const dv = sheetWithValidations(questions);

  dv.add(`B${DATA_ROW_START}:B${DATA_ROW_END}`, {
    type: 'list',
    allowBlank: true,
    showErrorMessage: true,
    errorTitle: 'Invalid value',
    error:
      'Pick a question type from the list. These are the only types supported for Excel import.',
    showInputMessage: true,
    promptTitle: 'Question type',
    prompt: 'Select from the dropdown (required for each question row).',
    formulae: [`'${LISTS_SHEET}'!$A$1:$A$${qtEnd}`],
  });

  dv.add(`C${DATA_ROW_START}:C${DATA_ROW_END}`, {
    type: 'whole',
    allowBlank: true,
    operator: 'between',
    showErrorMessage: true,
    errorTitle: 'Invalid points',
    error: 'Enter a whole number from 0 to 1000, or leave blank to use default (1).',
    showInputMessage: true,
    promptTitle: 'Points',
    prompt: 'Optional. Whole number 0–1000.',
    formulae: [0, 1000],
  });

  dv.add(`K${DATA_ROW_START}:K${DATA_ROW_END}`, {
    type: 'date',
    allowBlank: true,
    operator: 'between',
    showErrorMessage: true,
    errorTitle: 'Invalid date',
    error: 'Enter a date, or leave blank if this row is not a DATE question.',
    showInputMessage: true,
    promptTitle: 'Correct answer (date)',
    prompt: 'For DATE questions only. Use a proper date or ISO-style value.',
    formulae: [new Date(1980, 0, 1), new Date(2100, 11, 31)],
  });

  await questions.protect('', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: true,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    insertHyperlinks: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    autoFilter: false,
    pivotTables: false,
  });

  const helpRows: [string, string][] = [
    ['Column', 'Rules'],
    [
      'Question text',
      'Required. The question wording (plain text).',
    ],
    [
      'Question type',
      'Required. Use the dropdown. All imported questions are stored with difficulty **EASY** (no column for difficulty).',
    ],
    ['Points', 'Optional. Whole number 0–1000, or blank for default 1.'],
    [
      'Option 1 … Option 4',
      'MCQ / TRUE_FALSE: up to four answers, left to right. TRUE_FALSE may leave all four blank (True/False implied). More than four options: use the app or JSON API.',
    ],
    [
      'Correct option indices',
      'MCQ: 1-based positions (1–4), e.g. 2 or 1,3. Letters A–D = options 1–4. TRUE_FALSE with blank options: TRUE/FALSE or 1/2.',
    ],
    [
      'Correct answer text',
      'SHORT_ANSWER, LONG_ANSWER, FILL_IN_BLANK only.',
    ],
    ['Correct answer number', 'NUMERIC only.'],
    [
      'Correct answer date',
      'DATE only (validated as a date).',
    ],
    [
      'Difficulty & explanation',
      'Not in this template. Difficulty is always **EASY** on import. Add hints/explanations later in the app if needed.',
    ],
    [
      'Sheet protection',
      'Row 1 is locked. Unprotect only if you must fix a mistake (Review → Unprotect); prefer re-downloading the template.',
    ],
    [
      '',
      'Hidden `_Lists` sheet powers the question-type dropdown — do not delete it.',
    ],
  ];

  helpRows.forEach((pair, r) => {
    const [a, b] = pair;
    const c1 = help.getCell(r + 1, 1);
    const c2 = help.getCell(r + 1, 2);
    c1.value = a;
    c2.value = b;
    c1.protection = { locked: true };
    c2.protection = { locked: true };
    if (r === 0) {
      c1.font = { bold: true };
      c2.font = { bold: true };
    }
  });
  help.getColumn(1).width = 32;
  help.getColumn(2).width = 78;

  await help.protect('', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    insertHyperlinks: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    autoFilter: false,
    pivotTables: false,
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
