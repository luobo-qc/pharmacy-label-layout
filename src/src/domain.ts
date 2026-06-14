export interface LabelData {
  patientName: string;
  medicationName: string;
  specification: string;
  quantity: string;
  directions: string;
  notes: string;
  printDate: string;
}

export interface TemplateSettings {
  baseFontSize: number;
  boldMedicationName: boolean;
  showNotes: boolean;
  innerMarginMm: number;
}

export interface RecentRecord {
  id: string;
  label: LabelData;
  printedAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createDefaultLabel(now = new Date()): LabelData {
  return {
    patientName: '',
    medicationName: '',
    specification: '',
    quantity: '',
    directions: '',
    notes: '',
    printDate: formatDate(now)
  };
}

export function createDefaultSettings(): TemplateSettings {
  return {
    baseFontSize: 12,
    boldMedicationName: true,
    showNotes: true,
    innerMarginMm: 2
  };
}

export function createRecentRecord(label: LabelData, printedAt = new Date()): RecentRecord {
  const printedAtIso = printedAt.toISOString();

  return {
    id: `${printedAtIso}-${label.medicationName}-${label.patientName}`,
    printedAt: printedAtIso,
    label: { ...label }
  };
}

export function validateLabel(label: LabelData): ValidationResult {
  const errors: string[] = [];

  if (!label.patientName.trim()) errors.push('请填写患者姓名');
  if (!label.medicationName.trim()) errors.push('请填写药品名称');
  if (!label.directions.trim()) errors.push('请填写用法用量');
  if (!label.printDate.trim()) errors.push('请填写打印日期');

  return {
    valid: errors.length === 0,
    errors
  };
}

export function limitMostRecent<T>(items: T[], limit: number): T[] {
  return items.slice(Math.max(items.length - limit, 0));
}
