import { describe, expect, it } from 'vitest';
import {
  createRecentRecord,
  createDefaultLabel,
  createDefaultSettings,
  limitMostRecent,
  validateLabel
} from '../src/domain';

describe('label domain', () => {
  it('creates a default label with today as the print date', () => {
    const label = createDefaultLabel(new Date(2026, 5, 14, 8, 0, 0));

    expect(label).toEqual({
      patientName: '',
      medicationName: '',
      specification: '',
      quantity: '',
      directions: '',
      notes: '',
      printDate: '2026-06-14'
    });
  });

  it('creates default template settings', () => {
    expect(createDefaultSettings()).toEqual({
      baseFontSize: 12,
      boldMedicationName: true,
      showNotes: true,
      innerMarginMm: 2
    });
  });

  it('requires patient name, medication name, directions, and print date', () => {
    const result = validateLabel({
      ...createDefaultLabel(new Date(2026, 5, 14, 8, 0, 0)),
      printDate: ''
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      '请填写患者姓名',
      '请填写药品名称',
      '请填写用法用量',
      '请填写打印日期'
    ]);
  });

  it('accepts a complete label', () => {
    const result = validateLabel({
      patientName: '张三',
      medicationName: '阿莫西林胶囊',
      specification: '0.25g x 24粒',
      quantity: '1盒',
      directions: '每日3次，每次1粒，饭后服用',
      notes: '青霉素过敏者禁用',
      printDate: '2026-06-14'
    });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('keeps only the newest records up to the provided limit', () => {
    const items = ['a', 'b', 'c', 'd'];

    expect(limitMostRecent(items, 2)).toEqual(['c', 'd']);
  });

  it('creates a recent record with copied label data', () => {
    const label = {
      patientName: '张三',
      medicationName: '阿莫西林胶囊',
      specification: '0.25g x 24粒',
      quantity: '1盒',
      directions: '每日3次，每次1粒，饭后服用',
      notes: '青霉素过敏者禁用',
      printDate: '2026-06-14'
    };

    const record = createRecentRecord(label, new Date('2026-06-14T10:00:00.000Z'));
    label.patientName = '李四';

    expect(record).toEqual({
      id: '2026-06-14T10:00:00.000Z-阿莫西林胶囊-张三',
      printedAt: '2026-06-14T10:00:00.000Z',
      label: {
        patientName: '张三',
        medicationName: '阿莫西林胶囊',
        specification: '0.25g x 24粒',
        quantity: '1盒',
        directions: '每日3次，每次1粒，饭后服用',
        notes: '青霉素过敏者禁用',
        printDate: '2026-06-14'
      }
    });
  });
});
