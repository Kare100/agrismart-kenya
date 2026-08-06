// Gemini is asked to return raw JSON but sometimes wraps it in ```json
// fences anyway, or the whitespace is off — this normalizes and parses
// that text into the shape the rest of the app expects. Kept dependency-
// free (no env, no fetch, no RN) on purpose so it can be unit tested in
// isolation from network/config concerns.
export function cleanJsonText(raw) {
  return (raw || '').replace(/```json|```/g, '').trim();
}

export function parseGeminiAnalysis(raw) {
  const cleaned = cleanJsonText(raw);
  const parsed = JSON.parse(cleaned);

  if (!parsed.disease_name) {
    throw new Error('Gemini response missing disease_name');
  }

  return {
    diseaseName: parsed.disease_name,
    latinName: parsed.scientific_name || '',
    confidence: Math.max(0, Math.min(100, Math.round(parsed.confidence_percent ?? 90))),
    explanation: parsed.explanation || '',
    steps: Array.isArray(parsed.treatment_steps) ? parsed.treatment_steps : [],
  };
}
