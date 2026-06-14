import {
  type LabelData,
  createDefaultSettings,
  limitMostRecent,
  type RecentRecord,
  type TemplateSettings
} from './domain';

const STORAGE_KEY = 'pharmacy-label-layout-state-v1';
const COMMON_LIMIT = 50;
const RECENT_LIMIT = 100;
const LOAD_WARNING = '本地记录读取失败，已使用默认设置。';
const SAVE_WARNING = '本地保存失败，当前标签仍可打印，但设置和历史记录没有保存。';

export interface AppState {
  settings: TemplateSettings;
  commonMedicationNames: string[];
  commonSpecifications: string[];
  commonDirections: string[];
  recentRecords: RecentRecord[];
  storageWarning: string;
}

export function createDefaultAppState(): AppState {
  return {
    settings: createDefaultSettings(),
    commonMedicationNames: [],
    commonSpecifications: [],
    commonDirections: [],
    recentRecords: [],
    storageWarning: ''
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultAppState();

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const defaults = createDefaultAppState();

    return {
      settings: sanitizeSettings(parsed.settings, defaults.settings),
      commonMedicationNames: sanitizeCommonValues(parsed.commonMedicationNames),
      commonSpecifications: sanitizeCommonValues(parsed.commonSpecifications),
      commonDirections: sanitizeCommonValues(parsed.commonDirections),
      recentRecords: sanitizeRecentRecords(parsed.recentRecords),
      storageWarning: ''
    };
  } catch {
    return {
      ...createDefaultAppState(),
      storageWarning: LOAD_WARNING
    };
  }
}

export function saveAppState(state: AppState): string {
  try {
    const { storageWarning: _storageWarning, ...stateToSave } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    return '';
  } catch {
    return SAVE_WARNING;
  }
}

export function addCommonValue(values: string[], value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return values;

  const withoutDuplicate = values.filter((item) => item !== trimmed);
  return limitMostRecent([...withoutDuplicate, trimmed], COMMON_LIMIT);
}

export function addRecentRecord(records: RecentRecord[], record: RecentRecord): RecentRecord[] {
  const withoutDuplicate = records.filter((item) => item.id !== record.id);
  return limitMostRecent([...withoutDuplicate, record], RECENT_LIMIT);
}

function sanitizeSettings(value: unknown, defaults: TemplateSettings): TemplateSettings {
  if (!isRecord(value)) return defaults;

  return {
    baseFontSize: getClampedNumber(value.baseFontSize, defaults.baseFontSize, 10, 18),
    boldMedicationName: getBoolean(value.boldMedicationName, defaults.boldMedicationName),
    showNotes: getBoolean(value.showNotes, defaults.showNotes),
    innerMarginMm: getClampedNumber(value.innerMarginMm, defaults.innerMarginMm, 1, 5)
  };
}

function sanitizeCommonValues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.reduce<string[]>((current, item) => {
    if (typeof item !== 'string') return current;
    return addCommonValue(current, item);
  }, []);
}

function sanitizeRecentRecords(value: unknown): RecentRecord[] {
  if (!Array.isArray(value)) return [];

  const records = value.filter(isRecentRecord);
  return limitMostRecent(records, RECENT_LIMIT);
}

function isRecentRecord(value: unknown): value is RecentRecord {
  if (!isRecord(value)) return false;
  if (typeof value.id !== 'string') return false;
  if (typeof value.printedAt !== 'string') return false;

  return isLabelData(value.label);
}

function isLabelData(value: unknown): value is LabelData {
  if (!isRecord(value)) return false;

  return (
    typeof value.patientName === 'string' &&
    typeof value.medicationName === 'string' &&
    typeof value.specification === 'string' &&
    typeof value.quantity === 'string' &&
    typeof value.directions === 'string' &&
    typeof value.notes === 'string' &&
    typeof value.printDate === 'string'
  );
}

function getClampedNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

function getBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
