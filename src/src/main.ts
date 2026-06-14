import './styles.css';
import {
  createDefaultLabel,
  createRecentRecord,
  type TemplateSettings,
  validateLabel,
  type ValidationResult
} from './domain';
import { validateRenderedLabelFit } from './printFit';
import { renderApp, type CommonField, type LabelField, type SettingField } from './render';
import {
  addCommonValue,
  addRecentRecord,
  type AppState,
  loadAppState,
  saveAppState
} from './storage';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root #app not found');
}

const appRoot = app;
let label = createDefaultLabel();
let appState: AppState = loadAppState();
let validation: ValidationResult = { valid: true, errors: [] };

render();

function render(): void {
  renderApp(
    appRoot,
    {
      label,
      settings: appState.settings,
      state: appState,
      validation
    },
    {
      onFieldChange,
      onSettingChange,
      onPrint,
      onNewLabel,
      onUseRecent,
      onUseCommon
    }
  );
}

function onFieldChange(field: LabelField, value: string): void {
  label = {
    ...label,
    [field]: value
  };
  validation = { valid: true, errors: [] };
  render();
}

function onSettingChange(field: SettingField, value: number | boolean): void {
  appState = {
    ...appState,
    settings: {
      ...appState.settings,
      [field]: coerceSettingValue(field, value)
    }
  };
  persist();
  render();
}

function onPrint(): void {
  const result = validateLabel(label);
  validation = result;

  if (!result.valid) {
    render();
    return;
  }

  render();
  const fitResult = validateRenderedLabelFit(appRoot.querySelector<HTMLElement>('.label-preview'));

  if (!fitResult.valid) {
    validation = fitResult;
    render();
    return;
  }

  const record = createRecentRecord(label);
  appState = {
    ...appState,
    commonMedicationNames: addCommonValue(appState.commonMedicationNames, label.medicationName),
    commonSpecifications: addCommonValue(appState.commonSpecifications, label.specification),
    commonDirections: addCommonValue(appState.commonDirections, label.directions),
    recentRecords: addRecentRecord(appState.recentRecords, record)
  };

  persist();
  window.print();
}

function onNewLabel(): void {
  label = createDefaultLabel();
  validation = { valid: true, errors: [] };
  render();
}

function onUseRecent(recordId: string): void {
  const record = appState.recentRecords.find((item) => item.id === recordId);
  if (!record) return;

  label = { ...record.label };
  validation = { valid: true, errors: [] };
  render();
}

function onUseCommon(field: CommonField, value: string): void {
  label = {
    ...label,
    [field]: value
  };
  validation = { valid: true, errors: [] };
  render();
}

function persist(): void {
  const warning = saveAppState(appState);
  appState = {
    ...appState,
    storageWarning: warning
  };
}

function coerceSettingValue(field: SettingField, value: number | boolean): TemplateSettings[SettingField] {
  if (field === 'boldMedicationName' || field === 'showNotes') {
    return Boolean(value);
  }

  const numberValue = typeof value === 'number' ? value : Number(value);
  return clampNumber(numberValue, field === 'baseFontSize' ? 10 : 1, field === 'baseFontSize' ? 18 : 5);
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}
