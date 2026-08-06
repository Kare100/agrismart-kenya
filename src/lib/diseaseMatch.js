// The Gemini prompt returns disease_name as free text (e.g. "Early Blight",
// "early blight", "Blight (Early)"), so we can't rely on an exact string
// match against diseases.common_name. This does a light normalize +
// substring match to link the AI's answer back to a real disease_id
// wherever possible, while still tolerating a name Gemini invents that
// isn't in the table (falls back to null — ai_disease_name still records
// what was shown to the user).
const normalize = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const NON_DISEASE_LABELS = ['healthy', 'notaplantphoto', 'notaplant'];

export function findMatchingDiseaseId(diseaseName, diseases) {
  const target = normalize(diseaseName);
  if (!target || !diseases?.length) return null;
  if (NON_DISEASE_LABELS.some((label) => target === label)) return null;

  const exact = diseases.find((d) => normalize(d.common_name) === target);
  if (exact) return exact.id;

  const partial = diseases.find((d) => {
    const name = normalize(d.common_name);
    return name.length > 2 && (target.includes(name) || name.includes(target));
  });
  return partial ? partial.id : null;
}
