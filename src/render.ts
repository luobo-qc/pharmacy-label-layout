import type { LabelData, TemplateSettings, ValidationResult } from './domain';
import type { AppState } from './storage';

export type LabelField = keyof LabelData;
export type SettingField = keyof TemplateSettings;
export type CommonField = 'medicationName' | 'specification' | 'directions';

export interface RenderCallbacks {
  onFieldChange: (field: LabelField, value: string) => void;
  onSettingChange: (field: SettingField, value: number | boolean) => void;
  onPrint: () => void;
  onNewLabel: () => void;
  onUseRecent: (recordId: string) => void;
  onUseCommon: (field: CommonField, value: string) => void;
}

export interface RenderModel {
  label: LabelData;
  settings: TemplateSettings;
  state: AppState;
  validation: ValidationResult;
}

export function renderApp(root: HTMLElement, model: RenderModel, callbacks: RenderCallbacks): void {
  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <h1>药房药品标签排版</h1>
        <div class="topbar-actions">
          <button type="button" data-action="print">打印标签</button>
          <button type="button" data-action="new-label">新建标签</button>
        </div>
      </header>

      ${renderStorageWarning(model.state.storageWarning)}
      ${renderValidation(model.validation)}

      <div class="workspace">
        <section class="panel entry-panel" aria-label="标签录入">
          <h2>标签录入</h2>
          ${renderInput('patientName', '患者姓名', model.label.patientName)}
          ${renderInput('medicationName', '药品名称', model.label.medicationName)}
          ${renderInput('specification', '规格', model.label.specification)}
          ${renderInput('quantity', '数量', model.label.quantity)}
          ${renderTextarea('directions', '用法用量', model.label.directions)}
          ${renderTextarea('notes', '注意事项', model.label.notes)}
          ${renderInput('printDate', '打印日期', model.label.printDate, 'date')}
        </section>

        <section class="preview-panel" aria-label="标签预览">
          ${renderPreview(model.label, model.settings)}
        </section>

        <aside class="panel tools-panel" aria-label="模板与历史">
          <section class="template-controls">
            <h2>模板设置</h2>
            ${renderRange('baseFontSize', '基础字号', model.settings.baseFontSize, 10, 18, 'px')}
            ${renderCheckbox('boldMedicationName', '药品名称加粗', model.settings.boldMedicationName)}
            ${renderCheckbox('showNotes', '显示注意事项', model.settings.showNotes)}
            ${renderRange('innerMarginMm', '标签内边距', model.settings.innerMarginMm, 1, 5, 'mm')}
          </section>

          <section class="common-lists">
            <h2>常用项</h2>
            ${renderCommonList('常用药品', 'medicationName', model.state.commonMedicationNames)}
            ${renderCommonList('常用规格', 'specification', model.state.commonSpecifications)}
            ${renderCommonList('常用用法', 'directions', model.state.commonDirections)}
          </section>

          <section class="recent-records">
            <h2>最近打印</h2>
            ${renderRecentRecords(model.state.recentRecords)}
          </section>
        </aside>
      </div>
    </div>
  `;

  bindEvents(root, callbacks);
}

function bindEvents(root: HTMLElement, callbacks: RenderCallbacks): void {
  root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-field]').forEach((element) => {
    element.addEventListener('input', () => {
      callbacks.onFieldChange(element.dataset.field as LabelField, element.value);
    });
  });

  root.querySelectorAll<HTMLInputElement>('[data-setting]').forEach((element) => {
    const eventName = element.type === 'checkbox' ? 'change' : 'input';
    element.addEventListener(eventName, () => {
      const field = element.dataset.setting as SettingField;
      const value = element.type === 'checkbox' ? element.checked : Number(element.value);
      callbacks.onSettingChange(field, value);
    });
  });

  root.querySelector<HTMLButtonElement>('[data-action="print"]')?.addEventListener('click', callbacks.onPrint);
  root.querySelector<HTMLButtonElement>('[data-action="new-label"]')?.addEventListener('click', callbacks.onNewLabel);

  root.querySelectorAll<HTMLButtonElement>('[data-record-id]').forEach((button) => {
    button.addEventListener('click', () => {
      callbacks.onUseRecent(button.dataset.recordId || '');
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-common-field]').forEach((button) => {
    button.addEventListener('click', () => {
      callbacks.onUseCommon(button.dataset.commonField as CommonField, button.dataset.commonValue || '');
    });
  });
}

function renderInput(field: LabelField, label: string, value: string, type = 'text'): string {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <input type="${escapeAttribute(type)}" data-field="${escapeAttribute(field)}" value="${escapeAttribute(value)}" />
    </label>
  `;
}

function renderTextarea(field: LabelField, label: string, value: string): string {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <textarea data-field="${escapeAttribute(field)}">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function renderRange(field: SettingField, label: string, value: number, min: number, max: number, unit: string): string {
  return `
    <label class="field">
      <span>${escapeHtml(label)}：${escapeHtml(String(value))}${escapeHtml(unit)}</span>
      <input type="range" data-setting="${escapeAttribute(field)}" min="${min}" max="${max}" value="${escapeAttribute(String(value))}" />
    </label>
  `;
}

function renderCheckbox(field: SettingField, label: string, checked: boolean): string {
  return `
    <label class="checkbox-field">
      <input type="checkbox" data-setting="${escapeAttribute(field)}" ${checked ? 'checked' : ''} />
      <span>${escapeHtml(label)}</span>
    </label>
  `;
}

function renderPreview(label: LabelData, settings: TemplateSettings): string {
  const medicationName = label.medicationName.trim() || '药品名称';
  const directions = label.directions.trim() || '用法用量';
  const meta = [label.specification, label.quantity].filter((value) => value.trim()).join(' / ');

  return `
    <article
      class="label-preview"
      style="--base-font-size: ${escapeAttribute(String(settings.baseFontSize))}px; --label-margin: ${escapeAttribute(String(settings.innerMarginMm))}mm;"
    >
      <header class="label-preview-header">
        <div class="label-medication ${settings.boldMedicationName ? 'is-bold' : ''}">${escapeHtml(medicationName)}</div>
        <time>${escapeHtml(label.printDate)}</time>
      </header>
      <div class="label-patient">患者：${escapeHtml(label.patientName)}</div>
      ${meta ? `<div class="label-meta">${escapeHtml(meta)}</div>` : ''}
      <div class="label-directions">${escapeHtml(directions)}</div>
      ${settings.showNotes && label.notes.trim() ? `<div class="label-notes">注意：${escapeHtml(label.notes)}</div>` : ''}
    </article>
  `;
}

function renderStorageWarning(warning: string): string {
  if (!warning) return '';
  return `<p class="storage-warning" role="status">${escapeHtml(warning)}</p>`;
}

function renderValidation(validation: ValidationResult): string {
  if (!validation.errors.length) return '';

  return `
    <section class="validation-errors" aria-label="校验错误">
      <ul>
        ${validation.errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('')}
      </ul>
    </section>
  `;
}

function renderCommonList(title: string, field: CommonField, values: string[]): string {
  return `
    <div class="common-list">
      <h3>${escapeHtml(title)}</h3>
      <div class="button-list">
        ${values.length ? values.map((value) => renderCommonButton(field, value)).join('') : '<p class="empty-state">暂无</p>'}
      </div>
    </div>
  `;
}

function renderCommonButton(field: CommonField, value: string): string {
  return `
    <button
      type="button"
      data-common-field="${escapeAttribute(field)}"
      data-common-value="${escapeAttribute(value)}"
    >${escapeHtml(value)}</button>
  `;
}

function renderRecentRecords(records: RenderModel['state']['recentRecords']): string {
  if (!records.length) return '<p class="empty-state">暂无</p>';

  return `
    <div class="button-list">
      ${records
        .slice()
        .reverse()
        .map(
          (record) => `
            <button type="button" data-record-id="${escapeAttribute(record.id)}">
              ${escapeHtml(record.label.medicationName || '未命名药品')} · ${escapeHtml(record.label.patientName || '未命名患者')}
            </button>
          `
        )
        .join('')}
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
