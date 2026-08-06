import { ENV } from '../../config/env';
import { ensureFreshSession, getSessionSync } from './session';

const STORAGE_URL = `${ENV.SUPABASE_URL}/storage/v1`;

// Uploads a locally-captured photo to the "plant-photos" Storage bucket and
// returns its public URL. Throws on failure — callers should catch and fall
// back to a placeholder rather than blocking the whole diagnosis flow.
export async function uploadPhotoToStorage(localUri, userId, mimeType) {
  await ensureFreshSession();
  const ext = (mimeType || 'image/jpeg').split('/')[1] || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const fileRes = await fetch(localUri);
  const blob = await fileRes.blob();

  const uploadRes = await fetch(`${STORAGE_URL}/object/plant-photos/${path}`, {
    method: 'POST',
    headers: {
      apikey: ENV.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${getSessionSync()?.access_token || ENV.SUPABASE_ANON_KEY}`,
      'Content-Type': mimeType || 'image/jpeg',
    },
    body: blob,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Upload failed: ${uploadRes.status} ${text}`);
  }

  return `${STORAGE_URL}/object/public/plant-photos/${path}`;
}
