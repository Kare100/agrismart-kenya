import { formatKes } from '../utils/formatPrice';

describe('formatKes', () => {
  test('adds thousands separators', () => {
    expect(formatKes(4500)).toBe('4,500');
    expect(formatKes(1200000)).toBe('1,200,000');
  });

  test('leaves small numbers unchanged', () => {
    expect(formatKes(85)).toBe('85');
  });

  test('returns a dash for null/undefined/NaN', () => {
    expect(formatKes(null)).toBe('—');
    expect(formatKes(undefined)).toBe('—');
    expect(formatKes(NaN)).toBe('—');
    expect(formatKes('not a number')).toBe('—');
  });
});
