import * as ImageManipulator from 'expo-image-manipulator';

// Downscales and re-compresses a picked/captured photo before it's sent
// anywhere. This matters a lot for this app specifically: users are often
// on slow or metered rural connections, and the camera's raw output can
// be several MB. Capping the long edge at 1024px and re-encoding at 70%
// JPEG quality keeps both the Gemini upload and the Storage upload small
// and fast without a visible quality loss for disease identification.
export async function compressForUpload(uri) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return {
    uri: result.uri,
    base64: result.base64,
    mimeType: 'image/jpeg',
  };
}
