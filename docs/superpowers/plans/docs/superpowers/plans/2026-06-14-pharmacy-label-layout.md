# Pharmacy Label Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a front-end-only pharmacy medication label web app for manual entry, live 60mm x 40mm preview, local browser memory, and browser printing.

**Architecture:** Use a small Vite + TypeScript single-page app. Keep pharmacy label domain logic in testable modules, keep browser storage behind a storage adapter, and keep UI rendering in focused components and CSS.

**Tech Stack:** Vite, TypeScript, Vitest, DOM Testing Library-style manual DOM assertions, CSS print media.

---

## File Structure

- Create: `package.json` - npm scripts and dev dependencies.
- Create: `index.html` - app shell.
- Create: `src/main.ts` - app bootstrap and event wiring.
- Create: `src/domain.ts` - label types, defaults, validation, history limiting, date formatting.
- Create: `src/storage.ts` - localStorage adapter with safe fallback behavior.
- Create: `src/render.ts` - DOM rendering for form, preview, settings, common values, and recent records.
- Create: `src/styles.css` - application layout, 60mm x 40mm preview, responsive layout, and print CSS.
- Create: `test/domain.test.ts` - tests for validation, defaults, limits, and record reuse.
- Create: `test/storage.test.ts` - tests for storage save/load and storage failure fallback.
- Create: `tsconfig.json` - TypeScript settings.
- Create: `vitest.config.ts` - Vitest configuration.

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/styles.css`
- Create: `src/main.ts`

- [ ] **Step 1: Create npm project files**

Create `package.json`:

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-basic-ssl": "^1.2.0",
    "vite": "^5.4.0"
  },
  "devDependencies": {
    "@vitest/ui": "^2.1.1",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.2",
    "vitest": "^2.1.1"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src", "test", "vitest.config.ts"]
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true
  }
});
```

- [ ] **Step 2: Create app shell**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>药房药品标签排版</title>
  </head>
  <body>
    <main id="app"></main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Create minimal `src/styles.css`:

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
  color: #1d2733;
  background: #f5f7fa;
}
```

Create temporary `src/main.ts`:

```ts
import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root #app not found');
}

app.innerHTML = '<h1>药房药品标签排版</h1>';
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 4: Verify scaffold**

Run: `npm run build`

Expected: TypeScript and Vite build complete without errors.

## Task 2: Domain Model and Tests

**Files:**
- Create: `src/domain.ts`
- Create: `test/domain.test.ts`

- [ ] **Step 1: Write failing domain tests**

Create `test/domain.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  createDefaultLabel,
  createDefaultSettings,
  limitMostRecent,
  validateLabel
} from '../src/domain';

describe('label domain', () => {
  it('creates a default label with today as the print date', () => {
    const label = createDefaultLabel(new Date('2026-06-14T08:00:00+08:00'));

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
    const result = validateLabel(createDefaultLabel(new Date('2026-06-14T08:00:00+08:00')));

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
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- test/domain.test.ts`

Expected: FAIL because `src/domain.ts` does not exist.

- [ ] **Step 3: Implement domain module**

Create `src/domain.ts`:

```ts
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
```

- [ ] **Step 4: Verify domain tests pass**

Run: `npm test -- test/domain.test.ts`

Expected: PASS.

## Task 3: Local Storage Adapter

**Files:**
- Create: `src/storage.ts`
- Create: `test/storage.test.ts`
- Modify: `src/domain.ts`

- [ ] **Step 1: Write failing storage tests**

Create `test/storage.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSettings, type RecentRecord } from '../src/domain';
import {
  addCommonValue,
  addRecentRecord,
  loadAppState,
  saveAppState
} from '../src/storage';

beforeEach(() => {
  localStorage.clear();
});

describe('storage', () => {
  it('returns defaults when nothing has been saved', () => {
    const state = loadAppState();

    expect(state.settings).toEqual(createDefaultSettings());
    expect(state.commonMedicationNames).toEqual([]);
    expect(state.commonSpecifications).toEqual([]);
    expect(state.commonDirections).toEqual([]);
    expect(state.recentRecords).toEqual([]);
    expect(state.storageWarning).toBe('');
  });

  it('saves and loads app state', () => {
    const record: RecentRecord = {
      id: 'r1',
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

    const state = {
      settings: { baseFontSize: 13, boldMedicationName: false, showNotes: false, innerMarginMm: 3 },
      commonMedicationNames: ['阿莫西林胶囊'],
      commonSpecifications: ['0.25g x 24粒'],
      commonDirections: ['每日3次，每次1粒'],
      recentRecords: [record],
      storageWarning: ''
    };

    expect(saveAppState(state)).toBe('');
    expect(loadAppState()).toEqual(state);
  });

  it('deduplicates common values and keeps 50 newest entries', () => {
    const values = Array.from({ length: 51 }, (_, index) => `药品${index}`);
    const result = values.reduce((current, value) => addCommonValue(current, value), ['药品0']);

    expect(result).toHaveLength(50);
    expect(result[0]).toBe('药品1');
    expect(result[49]).toBe('药品50');
  });

  it('keeps 100 newest recent records', () => {
    const records = Array.from({ length: 101 }, (_, index): RecentRecord => ({
      id: `r${index}`,
      printedAt: `2026-06-14T10:${String(index).padStart(2, '0')}:00.000Z`,
      label: {
        patientName: `患者${index}`,
        medicationName: `药品${index}`,
        specification: '',
        quantity: '',
        directions: '每日1次',
        notes: '',
        printDate: '2026-06-14'
      }
    }));

    const result = records.reduce((current, record) => addRecentRecord(current, record), []);

    expect(result).toHaveLength(100);
    expect(result[0].id).toBe('r1');
    expect(result[99].id).toBe('r100');
  });

  it('returns a warning when localStorage save fails', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    const warning = saveAppState(loadAppState());

    expect(warning).toBe('本地保存失败，当前标签仍可打印，但设置和历史记录没有保存。');
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- test/storage.test.ts`

Expected: FAIL because `src/storage.ts` does not exist.

- [ ] **Step 3: Implement storage module**

Create `src/storage.ts`:

```ts
import {
  createDefaultSettings,
  limitMostRecent,
  type RecentRecord,
  type TemplateSettings
} from './domain';

const STORAGE_KEY = 'pharmacy-label-layout-state-v1';
const COMMON_LIMIT = 50;
const RECENT_LIMIT = 100;
const STORAGE_WARNING = '本地保存失败，当前标签仍可打印，但设置和历史记录没有保存。';

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

    const parsed = JSON.parse(raw) as Partial<AppState>;
    const defaults = createDefaultAppState();

    return {
      settings: { ...defaults.settings, ...parsed.settings },
      commonMedicationNames: Array.isArray(parsed.commonMedicationNames) ? parsed.commonMedicationNames : [],
      commonSpecifications: Array.isArray(parsed.commonSpecifications) ? parsed.commonSpecifications : [],
      commonDirections: Array.isArray(parsed.commonDirections) ? parsed.commonDirections : [],
      recentRecords: Array.isArray(parsed.recentRecords) ? parsed.recentRecords : [],
      storageWarning: ''
    };
  } catch {
    return {
      ...createDefaultAppState(),
      storageWarning: '本地记录读取失败，已使用默认设置。'
    };
  }
}

export function saveAppState(state: AppState): string {
  try {
    const stateToSave: AppState = { ...state, storageWarning: '' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    return '';
  } catch {
    return STORAGE_WARNING;
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
```

- [ ] **Step 4: Verify storage tests pass**

Run: `npm test -- test/storage.test.ts`

Expected: PASS.

## Task 4: Rendering and App Wiring

**Files:**
- Create: `src/render.ts`
- Modify: `src/main.ts`
- Modify: `src/styles.css`
- Modify: `test/domain.test.ts`

- [ ] **Step 1: Add a record factory test**

Append this test to `test/domain.test.ts`:

```ts
import { createRecentRecord } from '../src/domain';

it('creates a recent record with stable label data', () => {
  const record = createRecentRecord(
    {
      patientName: '张三',
      medicationName: '阿莫西林胶囊',
      specification: '0.25g x 24粒',
      quantity: '1盒',
      directions: '每日3次，每次1粒',
      notes: '',
      printDate: '2026-06-14'
    },
    new Date('2026-06-14T10:00:00.000Z')
  );

  expect(record.id).toBe('2026-06-14T10:00:00.000Z-阿莫西林胶囊-张三');
  expect(record.printedAt).toBe('2026-06-14T10:00:00.000Z');
  expect(record.label.medicationName).toBe('阿莫西林胶囊');
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- test/domain.test.ts`

Expected: FAIL because `createRecentRecord` is not exported.

- [ ] **Step 3: Add recent record factory**

Add to `src/domain.ts`:

```ts
export function createRecentRecord(label: LabelData, now = new Date()): RecentRecord {
  const printedAt = now.toISOString();
  return {
    id: `${printedAt}-${label.medicationName}-${label.patientName}`,
    printedAt,
    label: { ...label }
  };
}
```

- [ ] **Step 4: Create render module**

Create `src/render.ts`:

```ts
import type { LabelData, TemplateSettings, ValidationResult, RecentRecord } from './domain';
import type { AppState } from './storage';

export interface RenderCallbacks {
  onFieldChange: (field: keyof LabelData, value: string) => void;
  onSettingChange: (field: keyof TemplateSettings, value: number | boolean) => void;
  onPrint: () => void;
  onNewLabel: () => void;
  onUseRecent: (record: RecentRecord) => void;
  onUseCommon: (field: keyof LabelData, value: string) => void;
}

export interface RenderModel {
  label: LabelData;
  state: AppState;
  validation: ValidationResult;
}

function inputRow(label: string, id: string, value: string, required = false): string {
  return `
    <label class="field" for="${id}">
      <span>${label}${required ? '<b>*</b>' : ''}</span>
      <input id="${id}" value="${escapeHtml(value)}" />
    </label>
  `;
}

function textareaRow(label: string, id: string, value: string, required = false): string {
  return `
    <label class="field" for="${id}">
      <span>${label}${required ? '<b>*</b>' : ''}</span>
      <textarea id="${id}" rows="3">${escapeHtml(value)}</textarea>
    </label>
  `;
}

export function renderApp(root: HTMLElement, model: RenderModel, callbacks: RenderCallbacks): void {
  const { label, state, validation } = model;
  const settings = state.settings;

  root.innerHTML = `
    <section class="app-shell">
      <header class="topbar">
        <h1>药房药品标签排版</h1>
        <button class="primary" id="print-button" type="button">打印标签</button>
        <button id="new-button" type="button">新建标签</button>
      </header>

      ${state.storageWarning ? `<p class="warning">${escapeHtml(state.storageWarning)}</p>` : ''}
      ${validation.errors.length ? `<ul class="errors">${validation.errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('')}</ul>` : ''}

      <div class="workspace">
        <section class="panel form-panel" aria-label="标签录入">
          <h2>标签录入</h2>
          ${inputRow('患者姓名', 'patientName', label.patientName, true)}
          ${inputRow('药品名称', 'medicationName', label.medicationName, true)}
          ${inputRow('规格', 'specification', label.specification)}
          ${inputRow('数量', 'quantity', label.quantity)}
          ${textareaRow('用法用量', 'directions', label.directions, true)}
          ${textareaRow('注意事项', 'notes', label.notes)}
          ${inputRow('打印日期', 'printDate', label.printDate, true)}
        </section>

        <section class="preview-panel" aria-label="标签预览">
          <h2>标签预览</h2>
          <article class="label-preview" style="--base-font-size: ${settings.baseFontSize}px; --label-margin: ${settings.innerMarginMm}mm;">
            <div class="label-head">
              <strong class="${settings.boldMedicationName ? 'is-bold' : ''}">${escapeHtml(label.medicationName || '药品名称')}</strong>
              <span>${escapeHtml(label.printDate)}</span>
            </div>
            <div class="patient">患者：${escapeHtml(label.patientName || '未填写')}</div>
            <div class="meta">${escapeHtml([label.specification, label.quantity].filter(Boolean).join(' / ') || '规格 / 数量')}</div>
            <div class="directions">${escapeHtml(label.directions || '用法用量')}</div>
            ${settings.showNotes ? `<div class="notes">${escapeHtml(label.notes || '注意事项')}</div>` : ''}
          </article>
        </section>

        <aside class="panel side-panel" aria-label="模板和记录">
          <h2>模板设置</h2>
          <label class="field">
            <span>基础字号</span>
            <input id="baseFontSize" type="range" min="10" max="16" value="${settings.baseFontSize}" />
          </label>
          <label class="check-field"><input id="boldMedicationName" type="checkbox" ${settings.boldMedicationName ? 'checked' : ''} /> 药品名称加粗</label>
          <label class="check-field"><input id="showNotes" type="checkbox" ${settings.showNotes ? 'checked' : ''} /> 显示注意事项</label>
          <label class="field">
            <span>标签内边距</span>
            <input id="innerMarginMm" type="range" min="1" max="5" value="${settings.innerMarginMm}" />
          </label>

          <h2>常用项</h2>
          ${commonList('药品', 'medicationName', state.commonMedicationNames)}
          ${commonList('规格', 'specification', state.commonSpecifications)}
          ${commonList('用法', 'directions', state.commonDirections)}

          <h2>最近打印</h2>
          <div class="recent-list">
            ${state.recentRecords.slice().reverse().map((record) => `
              <button class="recent-item" data-record-id="${escapeHtml(record.id)}" type="button">
                <span>${escapeHtml(record.label.medicationName)}</span>
                <small>${escapeHtml(record.label.patientName)} · ${escapeHtml(record.label.printDate)}</small>
              </button>
            `).join('') || '<p class="empty">暂无记录</p>'}
          </div>
        </aside>
      </div>
    </section>
  `;

  bindInput(root, 'patientName', callbacks);
  bindInput(root, 'medicationName', callbacks);
  bindInput(root, 'specification', callbacks);
  bindInput(root, 'quantity', callbacks);
  bindInput(root, 'directions', callbacks);
  bindInput(root, 'notes', callbacks);
  bindInput(root, 'printDate', callbacks);

  bindNumberSetting(root, 'baseFontSize', callbacks);
  bindNumberSetting(root, 'innerMarginMm', callbacks);
  bindBooleanSetting(root, 'boldMedicationName', callbacks);
  bindBooleanSetting(root, 'showNotes', callbacks);

  root.querySelector('#print-button')?.addEventListener('click', callbacks.onPrint);
  root.querySelector('#new-button')?.addEventListener('click', callbacks.onNewLabel);

  root.querySelectorAll<HTMLButtonElement>('[data-common-field]').forEach((button) => {
    button.addEventListener('click', () => {
      callbacks.onUseCommon(button.dataset.commonField as keyof LabelData, button.dataset.commonValue || '');
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-record-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const record = state.recentRecords.find((item) => item.id === button.dataset.recordId);
      if (record) callbacks.onUseRecent(record);
    });
  });
}

function commonList(title: string, field: keyof LabelData, values: string[]): string {
  return `
    <div class="common-group">
      <h3>${title}</h3>
      <div class="chip-list">
        ${values.slice(-6).reverse().map((value) => `
          <button data-common-field="${field}" data-common-value="${escapeHtml(value)}" type="button">${escapeHtml(value)}</button>
        `).join('') || '<span class="empty">暂无</span>'}
      </div>
    </div>
  `;
}

function bindInput(root: HTMLElement, id: keyof LabelData, callbacks: RenderCallbacks): void {
  root.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)?.addEventListener('input', (event) => {
    callbacks.onFieldChange(id, (event.target as HTMLInputElement).value);
  });
}

function bindNumberSetting(root: HTMLElement, id: keyof TemplateSettings, callbacks: RenderCallbacks): void {
  root.querySelector<HTMLInputElement>(`#${id}`)?.addEventListener('input', (event) => {
    callbacks.onSettingChange(id, Number((event.target as HTMLInputElement).value));
  });
}

function bindBooleanSetting(root: HTMLElement, id: keyof TemplateSettings, callbacks: RenderCallbacks): void {
  root.querySelector<HTMLInputElement>(`#${id}`)?.addEventListener('change', (event) => {
    callbacks.onSettingChange(id, (event.target as HTMLInputElement).checked);
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
```

- [ ] **Step 5: Wire app state in main**

Replace `src/main.ts` with:

```ts
import './styles.css';
import {
  createDefaultLabel,
  createRecentRecord,
  validateLabel,
  type LabelData,
  type TemplateSettings
} from './domain';
import { renderApp } from './render';
import {
  addCommonValue,
  addRecentRecord,
  loadAppState,
  saveAppState,
  type AppState
} from './storage';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root #app not found');
}

let label = createDefaultLabel();
let state: AppState = loadAppState();
let showValidation = false;

function persist(nextState = state): void {
  const warning = saveAppState(nextState);
  state = { ...nextState, storageWarning: warning };
}

function rerender(): void {
  renderApp(
    app,
    {
      label,
      state,
      validation: showValidation ? validateLabel(label) : { valid: true, errors: [] }
    },
    {
      onFieldChange(field, value) {
        label = { ...label, [field]: value };
        showValidation = false;
        rerender();
      },
      onSettingChange(field, value) {
        persist({ ...state, settings: { ...state.settings, [field]: value } as TemplateSettings });
        rerender();
      },
      onPrint() {
        showValidation = true;
        const validation = validateLabel(label);
        if (!validation.valid) {
          rerender();
          return;
        }

        const record = createRecentRecord(label);
        persist({
          ...state,
          commonMedicationNames: addCommonValue(state.commonMedicationNames, label.medicationName),
          commonSpecifications: addCommonValue(state.commonSpecifications, label.specification),
          commonDirections: addCommonValue(state.commonDirections, label.directions),
          recentRecords: addRecentRecord(state.recentRecords, record)
        });
        rerender();
        window.print();
      },
      onNewLabel() {
        label = createDefaultLabel();
        showValidation = false;
        rerender();
      },
      onUseRecent(record) {
        label = { ...record.label };
        showValidation = false;
        rerender();
      },
      onUseCommon(field, value) {
        label = { ...label, [field]: value };
        showValidation = false;
        rerender();
      }
    }
  );
}

rerender();
```

- [ ] **Step 6: Verify domain tests pass**

Run: `npm test -- test/domain.test.ts`

Expected: PASS.

## Task 5: Visual Styling and Print CSS

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Replace CSS with complete application styles**

Replace `src/styles.css` with:

```css
* {
  box-sizing: border-box;
}

:root {
  color: #1d2733;
  background: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
}

body {
  margin: 0;
  min-width: 320px;
}

button,
input,
textarea {
  font: inherit;
}

button {
  border: 1px solid #c6d1dc;
  background: #ffffff;
  color: #1d2733;
  border-radius: 6px;
  min-height: 36px;
  padding: 0 12px;
  cursor: pointer;
}

button.primary {
  border-color: #146c75;
  background: #146c75;
  color: #ffffff;
}

.app-shell {
  padding: 18px;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.topbar h1 {
  margin: 0;
  flex: 1;
  font-size: 22px;
  letter-spacing: 0;
}

.warning,
.errors {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 6px;
}

.warning {
  background: #fff4d8;
  color: #674d00;
}

.errors {
  background: #ffe8e8;
  color: #8a1f1f;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(280px, 1fr) minmax(260px, 340px);
  gap: 16px;
  align-items: start;
}

.panel,
.preview-panel {
  background: #ffffff;
  border: 1px solid #d9e1e8;
  border-radius: 8px;
  padding: 14px;
}

h2 {
  margin: 0 0 12px;
  font-size: 16px;
}

h3 {
  margin: 12px 0 6px;
  font-size: 13px;
  color: #55616d;
}

.field {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
}

.field span {
  font-size: 13px;
  color: #44515f;
}

.field b {
  margin-left: 3px;
  color: #a12626;
}

input,
textarea {
  width: 100%;
  border: 1px solid #c6d1dc;
  border-radius: 6px;
  padding: 8px 10px;
  background: #ffffff;
  color: #1d2733;
}

textarea {
  resize: vertical;
}

.check-field {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.check-field input {
  width: auto;
}

.preview-panel {
  display: grid;
  justify-items: center;
  gap: 12px;
  min-height: 320px;
}

.label-preview {
  width: 60mm;
  height: 40mm;
  padding: var(--label-margin);
  background: #ffffff;
  border: 1px solid #9ca8b3;
  color: #000000;
  font-size: var(--base-font-size);
  display: grid;
  grid-template-rows: auto auto auto 1fr auto;
  gap: 1.6mm;
  overflow: hidden;
}

.label-head {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 2mm;
}

.label-head strong {
  font-size: 1.35em;
  line-height: 1.12;
  overflow-wrap: anywhere;
}

.label-head strong:not(.is-bold) {
  font-weight: 500;
}

.label-head span {
  flex: 0 0 auto;
  font-size: 0.82em;
}

.patient,
.meta {
  font-size: 0.92em;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.directions {
  font-size: 1.08em;
  line-height: 1.18;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.notes {
  font-size: 0.86em;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-list button {
  max-width: 100%;
  min-height: 30px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-list {
  display: grid;
  gap: 8px;
}

.recent-item {
  display: grid;
  justify-items: start;
  height: auto;
  min-height: 44px;
  padding: 7px 9px;
  text-align: left;
}

.recent-item span,
.recent-item small {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-item small,
.empty {
  color: #667484;
}

@media (max-width: 980px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .topbar {
    flex-wrap: wrap;
  }

  .topbar h1 {
    flex-basis: 100%;
  }
}

@page {
  size: 60mm 40mm;
  margin: 0;
}

@media print {
  body {
    background: #ffffff;
  }

  .topbar,
  .panel,
  .preview-panel h2,
  .warning,
  .errors {
    display: none !important;
  }

  .app-shell {
    padding: 0;
  }

  .workspace {
    display: block;
  }

  .preview-panel {
    display: block;
    border: 0;
    padding: 0;
  }

  .label-preview {
    border: 0;
    width: 60mm;
    height: 40mm;
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

Expected: PASS.

## Task 6: Full Verification

**Files:**
- No file changes unless verification reveals a concrete failure.

- [ ] **Step 1: Run all automated tests**

Run: `npm test`

Expected: PASS for `test/domain.test.ts` and `test/storage.test.ts`.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: Vite production build succeeds.

- [ ] **Step 3: Start dev server**

Run: `npm run dev -- --port 5173`

Expected: server starts at `http://127.0.0.1:5173/`.

- [ ] **Step 4: Manual browser verification**

Open `http://127.0.0.1:5173/` and verify:

- The page shows form, preview, template settings, common values, and recent records.
- Filling patient name, medication name, directions, and print date updates the label preview.
- Printing with required fields empty shows validation messages.
- Printing with required fields complete opens browser print dialog.
- After triggering print, common medication name, common specification, common directions, and recent record appear.
- "新建标签" clears the form but keeps template settings.
- Reusing a recent record refills the form.
- Narrow viewport changes the page to a vertical layout.
- Browser print preview uses a 60mm x 40mm page.

- [ ] **Step 5: Final status**

If this directory has no git repository, report that files were created and verified but not committed. If it is a git repository, run:

```bash
git status --short
git add package.json package-lock.json index.html tsconfig.json vitest.config.ts src test docs/superpowers/plans/2026-06-14-pharmacy-label-layout.md docs/superpowers/specs/2026-06-14-pharmacy-label-layout-design.md
git commit -m "feat: add pharmacy label layout app"
```

Expected: commit succeeds only when the workspace is a git repository.

## Self-Review

Spec coverage:

- Manual entry: Task 4 render form and state wiring.
- 60mm x 40mm preview: Task 4 preview markup and Task 5 CSS.
- Browser printing: Task 4 `window.print()` and Task 5 print CSS.
- Template settings: Task 4 settings controls and Task 5 preview variables.
- Local storage: Task 3 storage adapter and tests.
- Common values and recent records: Task 3 limits and Task 4 UI reuse.
- Required field validation: Task 2 validation and Task 4 print guard.
- Responsive layout: Task 5 media query and Task 6 manual verification.

Placeholder scan:

- No empty markers, unspecified edge handling, or unnamed tests are present.

Type consistency:

- `LabelData`, `TemplateSettings`, `RecentRecord`, `AppState`, and callback names are consistent across tasks.
