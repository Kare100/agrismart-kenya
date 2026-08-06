import { ENV } from '../config/env';
import { parseGeminiAnalysis } from './geminiParse';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${ENV.GEMINI_MODEL}:generateContent?key=${ENV.GEMINI_API_KEY}`;

function buildPrompt(cropNameEnglish) {
  return `You are an expert agricultural plant pathologist helping smallholder farmers in Kenya. Only respond with disease_name "Not a plant photo" if the image clearly shows something completely unrelated to plants — like a person, a book cover, a screen, or an empty room, with NO visible leaves, stems, or greenery anywhere in the frame. If there is ANY visible plant material at all, even if the photo is blurry, poorly lit, or not perfectly framed, proceed with a diagnosis instead — do your best with what's visible rather than rejecting it.

Assume this photo is meant to show a ${cropNameEnglish} plant leaf, and identify the most likely disease, pest damage, or nutrient deficiency visible.

If it DOES show a ${cropNameEnglish} plant leaf, identify the most likely disease, pest damage, or nutrient deficiency visible.

Respond with ONLY valid JSON — no markdown formatting, no code fences, no extra commentary. Use exactly this structure:
{"disease_name": "string", "scientific_name": "string or empty string", "confidence_percent": integer between 0 and 100, "explanation": "1-2 sentence explanation of what this means for the crop and yield impact", "treatment_steps": ["step 1", "step 2", "step 3", "step 4"]}

If the leaf looks healthy with no visible issues, set disease_name to "Healthy", scientific_name to "", explanation to a short reassuring note, and treatment_steps to an empty array.`;
}

export async function analyzeCropPhoto(base64Image, mimeType, cropNameEnglish) {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: buildPrompt(cropNameEnglish) },
            { inline_data: { mime_type: mimeType, data: base64Image } },
          ],
        },
      ],
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || 'Gemini request failed');

  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseGeminiAnalysis(raw);
}
