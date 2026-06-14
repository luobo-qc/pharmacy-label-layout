import type { ValidationResult } from './domain';

export const LONG_TEXT_ERROR = '标签内容过长，请缩短药品名称或用法用量后再打印。';

export function validateRenderedLabelFit(labelElement: HTMLElement | null): ValidationResult {
  if (!labelElement) return { valid: true, errors: [] };

  labelElement.classList.remove('is-condensed');

  if (!doesOverflow(labelElement)) {
    return { valid: true, errors: [] };
  }

  labelElement.classList.add('is-condensed');

  if (!doesOverflow(labelElement)) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: [LONG_TEXT_ERROR]
  };
}

function doesOverflow(element: HTMLElement): boolean {
  const scrollWidth = element.scrollWidth;
  const clientWidth = element.clientWidth;
  const scrollHeight = element.scrollHeight;
  const clientHeight = element.clientHeight;

  return scrollWidth > clientWidth || scrollHeight > clientHeight;
}
