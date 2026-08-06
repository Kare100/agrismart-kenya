import { findMatchingDiseaseId } from '../lib/diseaseMatch';

const diseases = [
  { id: 'd1', common_name: 'Early Blight' },
  { id: 'd2', common_name: 'Late Blight' },
  { id: 'd3', common_name: 'Bacterial Wilt' },
];

describe('findMatchingDiseaseId', () => {
  test('matches on exact name (case/spacing insensitive)', () => {
    expect(findMatchingDiseaseId('early blight', diseases)).toBe('d1');
    expect(findMatchingDiseaseId('  EARLY   BLIGHT  ', diseases)).toBe('d1');
  });

  test('matches when the AI name is a superset of the stored name', () => {
    expect(findMatchingDiseaseId('Early Blight (Alternaria solani)', diseases)).toBe('d1');
  });

  test('does not confuse Early Blight with Late Blight', () => {
    expect(findMatchingDiseaseId('Late Blight', diseases)).toBe('d2');
  });

  test('returns null for "Healthy"', () => {
    expect(findMatchingDiseaseId('Healthy', diseases)).toBeNull();
  });

  test('returns null for "Not a plant photo"', () => {
    expect(findMatchingDiseaseId('Not a plant photo', diseases)).toBeNull();
  });

  test('returns null when nothing matches', () => {
    expect(findMatchingDiseaseId('Powdery Mildew', diseases)).toBeNull();
  });

  test('returns null for empty/missing input', () => {
    expect(findMatchingDiseaseId('', diseases)).toBeNull();
    expect(findMatchingDiseaseId(null, diseases)).toBeNull();
    expect(findMatchingDiseaseId('Early Blight', [])).toBeNull();
    expect(findMatchingDiseaseId('Early Blight', null)).toBeNull();
  });
});
