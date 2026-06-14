import { describe, expect, it } from 'vitest';
import { LONG_TEXT_ERROR, validateRenderedLabelFit } from '../src/printFit';

function createLabelElement(measurements: Array<{ scrollWidth: number; clientWidth: number; scrollHeight: number; clientHeight: number }>): HTMLElement {
  const element = document.createElement('article');
  element.className = 'label-preview';
  let index = 0;

  Object.defineProperties(element, {
    scrollWidth: {
      get: () => measurements[Math.min(index, measurements.length - 1)].scrollWidth
    },
    clientWidth: {
      get: () => measurements[Math.min(index, measurements.length - 1)].clientWidth
    },
    scrollHeight: {
      get: () => measurements[Math.min(index, measurements.length - 1)].scrollHeight
    },
    clientHeight: {
      get: () => {
        const value = measurements[Math.min(index, measurements.length - 1)].clientHeight;
        index += 1;
        return value;
      }
    }
  });

  return element;
}

describe('print fit validation', () => {
  it('accepts a rendered label that already fits', () => {
    const element = createLabelElement([{ scrollWidth: 200, clientWidth: 220, scrollHeight: 120, clientHeight: 150 }]);

    expect(validateRenderedLabelFit(element)).toEqual({ valid: true, errors: [] });
    expect(element.classList.contains('is-condensed')).toBe(false);
  });

  it('condenses medication and directions text before accepting a label', () => {
    const element = createLabelElement([
      { scrollWidth: 230, clientWidth: 220, scrollHeight: 160, clientHeight: 150 },
      { scrollWidth: 210, clientWidth: 220, scrollHeight: 140, clientHeight: 150 }
    ]);

    expect(validateRenderedLabelFit(element)).toEqual({ valid: true, errors: [] });
    expect(element.classList.contains('is-condensed')).toBe(true);
  });

  it('rejects a rendered label that still overflows after condensing', () => {
    const element = createLabelElement([
      { scrollWidth: 230, clientWidth: 220, scrollHeight: 160, clientHeight: 150 },
      { scrollWidth: 225, clientWidth: 220, scrollHeight: 151, clientHeight: 150 }
    ]);

    expect(validateRenderedLabelFit(element)).toEqual({ valid: false, errors: [LONG_TEXT_ERROR] });
    expect(element.classList.contains('is-condensed')).toBe(true);
  });
});
