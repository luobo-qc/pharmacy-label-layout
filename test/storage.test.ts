import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSettings, type RecentRecord } from '../src/domain';
import {
  addCommonValue,
  addRecentRecord,
  loadAppState,
  saveAppState,
  type AppState
} from '../src/storage';

const STORAGE_KEY = 'pharmacy-label-layout-state-v1';
const SAVE_WARNING = '本地保存失败，当前标签仍可打印，但设置和历史记录没有保存。';
const LOAD_WARNING = '本地记录读取失败，已使用默认设置。';

function createRecord(id: string): RecentRecord {
  return {
    id,
    printedAt: '2026-06-14T10:00:00.000Z',
    label: {
      patientName: '张三',
      medicationName: '阿莫西林胶囊',
      specification: '0.25g x 24粒',
      quantity: '1盒',
      directions: '每日3次，每次1粒',
      notes: '饭后服用',
      printDate: '2026-06-14'
    }
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('storage', () => {
  it('returns default settings and empty history when localStorage is empty', () => {
    const state = loadAppState();

    expect(state.settings).toEqual(createDefaultSettings());
    expect(state.commonMedicationNames).toEqual([]);
    expect(state.commonSpecifications).toEqual([]);
    expect(state.commonDirections).toEqual([]);
    expect(state.recentRecords).toEqual([]);
    expect(state.storageWarning).toBe('');
  });

  it('round-trips settings, common values, and a recent record', () => {
    const record = createRecord('r1');
    const state: AppState = {
      settings: {
        baseFontSize: 13,
        boldMedicationName: false,
        showNotes: false,
        innerMarginMm: 3
      },
      commonMedicationNames: ['阿莫西林胶囊'],
      commonSpecifications: ['0.25g x 24粒'],
      commonDirections: ['每日3次，每次1粒'],
      recentRecords: [record],
      storageWarning: ''
    };

    expect(saveAppState(state)).toBe('');
    expect(loadAppState()).toEqual(state);
  });

  it('does not save storageWarning into localStorage', () => {
    const state: AppState = {
      settings: createDefaultSettings(),
      commonMedicationNames: [],
      commonSpecifications: [],
      commonDirections: [],
      recentRecords: [],
      storageWarning: SAVE_WARNING
    };

    expect(saveAppState(state)).toBe('');

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, unknown>;
    expect(saved).not.toHaveProperty('storageWarning');
  });

  it('returns defaults with a warning when localStorage contains invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');

    const state = loadAppState();

    expect(state).toEqual({
      settings: createDefaultSettings(),
      commonMedicationNames: [],
      commonSpecifications: [],
      commonDirections: [],
      recentRecords: [],
      storageWarning: LOAD_WARNING
    });
  });

  it('sanitizes malformed but parseable storage when loading', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: {
          baseFontSize: 'large',
          boldMedicationName: 'yes',
          showNotes: false,
          innerMarginMm: Number.POSITIVE_INFINITY
        },
        commonMedicationNames: [
          ' 药品0 ',
          '',
          '药品1',
          123,
          '药品0',
          '   ',
          ...Array.from({ length: 51 }, (_, index) => `药品${index + 2}`)
        ],
        commonSpecifications: [' 0.25g x 24粒 ', null, '0.25g x 24粒', ''],
        commonDirections: [' 每日1次 ', {}, '每日2次', '每日1次'],
        recentRecords: [
          createRecord('r0'),
          { ...createRecord('r1'), id: 12 },
          { ...createRecord('r2'), printedAt: null },
          { ...createRecord('r3'), label: 'not an object' },
          { ...createRecord('r4'), label: { ...createRecord('r4').label, notes: undefined } },
          ...Array.from({ length: 101 }, (_, index) => createRecord(`r${index + 5}`))
        ],
        storageWarning: SAVE_WARNING
      })
    );

    const state = loadAppState();

    expect(state.settings).toEqual({
      ...createDefaultSettings(),
      showNotes: false
    });
    expect(state.commonMedicationNames).toHaveLength(50);
    expect(state.commonMedicationNames[0]).toBe('药品3');
    expect(state.commonMedicationNames[49]).toBe('药品52');
    expect(state.commonMedicationNames).not.toContain('药品0');
    expect(state.commonSpecifications).toEqual(['0.25g x 24粒']);
    expect(state.commonDirections).toEqual(['每日2次', '每日1次']);
    expect(state.recentRecords).toHaveLength(100);
    expect(state.recentRecords[0].id).toBe('r6');
    expect(state.recentRecords[99].id).toBe('r105');
    expect(state.recentRecords.every((record) => typeof record.label.printDate === 'string')).toBe(true);
    expect(state.storageWarning).toBe('');
  });

  it('clamps finite out-of-range template settings when loading', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: {
          baseFontSize: 0,
          boldMedicationName: true,
          showNotes: true,
          innerMarginMm: 999
        }
      })
    );

    const state = loadAppState();

    expect(state.settings).toEqual({
      baseFontSize: 10,
      boldMedicationName: true,
      showNotes: true,
      innerMarginMm: 5
    });
  });

  it('deduplicates common values by trimmed value and keeps 50 newest entries', () => {
    const values = Array.from({ length: 51 }, (_, index) => `药品${index}`);
    const result = values.reduce((current, value) => addCommonValue(current, value), ['药品0']);

    expect(addCommonValue(result, '   ')).toEqual(result);
    expect(addCommonValue(['阿莫西林胶囊'], ' 阿莫西林胶囊 ')).toEqual(['阿莫西林胶囊']);
    expect(result).toHaveLength(50);
    expect(result[0]).toBe('药品1');
    expect(result[49]).toBe('药品50');
  });

  it('deduplicates recent records by id and keeps 100 newest records', () => {
    const records = Array.from({ length: 101 }, (_, index): RecentRecord => ({
      ...createRecord(`r${index}`),
      printedAt: `2026-06-14T10:${String(index).padStart(2, '0')}:00.000Z`,
      label: {
        ...createRecord(`r${index}`).label,
        patientName: `患者${index}`,
        medicationName: `药品${index}`
      }
    }));

    const result = records.reduce<RecentRecord[]>((current, record) => addRecentRecord(current, record), []);
    const movedDuplicate = addRecentRecord(result, { ...createRecord('r50'), printedAt: '2026-06-14T12:00:00.000Z' });

    expect(result).toHaveLength(100);
    expect(result[0].id).toBe('r1');
    expect(result[99].id).toBe('r100');
    expect(movedDuplicate).toHaveLength(100);
    expect(movedDuplicate[98].id).toBe('r100');
    expect(movedDuplicate[99].id).toBe('r50');
  });

  it('returns the exact warning when localStorage save fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(saveAppState(loadAppState())).toBe(SAVE_WARNING);
  });
});
