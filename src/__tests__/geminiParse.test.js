import { cleanJsonText, parseGeminiAnalysis } from '../lib/geminiParse';

const validJson = JSON.stringify({
  disease_name: 'Early Blight',
  scientific_name: 'Alternaria solani',
  confidence_percent: 87,
  explanation: 'A fungal disease affecting lower leaves.',
  treatment_steps: ['Remove affected leaves', 'Apply fungicide'],
});

describe('cleanJsonText', () => {
  test('strips ```json fences', () => {
    expect(cleanJsonText('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  test('strips bare ``` fences', () => {
    expect(cleanJsonText('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  test('trims surrounding whitespace', () => {
    expect(cleanJsonText('   {"a":1}   ')).toBe('{"a":1}');
  });

  test('handles null/undefined input', () => {
    expect(cleanJsonText(undefined)).toBe('');
    expect(cleanJsonText(null)).toBe('');
  });
});

describe('parseGeminiAnalysis', () => {
  test('parses a clean JSON response', () => {
    const result = parseGeminiAnalysis(validJson);
    expect(result).toEqual({
      diseaseName: 'Early Blight',
      latinName: 'Alternaria solani',
      confidence: 87,
      explanation: 'A fungal disease affecting lower leaves.',
      steps: ['Remove affected leaves', 'Apply fungicide'],
    });
  });

  test('parses a response wrapped in code fences', () => {
    const result = parseGeminiAnalysis('```json\n' + validJson + '\n```');
    expect(result.diseaseName).toBe('Early Blight');
  });

  test('clamps confidence_percent into 0-100', () => {
    const over = parseGeminiAnalysis(JSON.stringify({ disease_name: 'X', confidence_percent: 150 }));
    expect(over.confidence).toBe(100);

    const under = parseGeminiAnalysis(JSON.stringify({ disease_name: 'X', confidence_percent: -10 }));
    expect(under.confidence).toBe(0);
  });

  test('defaults confidence to 90 when missing', () => {
    const result = parseGeminiAnalysis(JSON.stringify({ disease_name: 'X' }));
    expect(result.confidence).toBe(90);
  });

  test('defaults treatment_steps to an empty array when missing or malformed', () => {
    const missing = parseGeminiAnalysis(JSON.stringify({ disease_name: 'Healthy' }));
    expect(missing.steps).toEqual([]);

    const malformed = parseGeminiAnalysis(JSON.stringify({ disease_name: 'Healthy', treatment_steps: 'none' }));
    expect(malformed.steps).toEqual([]);
  });

  test('throws when disease_name is missing', () => {
    expect(() => parseGeminiAnalysis(JSON.stringify({ confidence_percent: 90 }))).toThrow(
      'Gemini response missing disease_name'
    );
  });

  test('throws on invalid JSON', () => {
    expect(() => parseGeminiAnalysis('not json at all')).toThrow();
  });
});
