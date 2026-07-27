// lib/cloudinary.ts — direct (unsigned) image upload from the phone.
//
// The backend stores only the image URL, so the app uploads the picked photo
// straight to Cloudinary and sends back the resulting `secure_url`.
//
// SETUP (one-time, in your Cloudinary dashboard):
//   1. Settings → Upload → Upload presets → "Add upload preset"
//   2. Set Signing Mode = "Unsigned", save, copy the preset name.
//   3. Put these in a .env file at the project root (then restart with -c):
//        EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
//        EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
//
// These are public values (safe in the app bundle) — an unsigned preset is
// designed for client uploads. Never put your Cloudinary API *secret* here.
//
// Until both are set, uploadImageAsync() returns null and the profile simply
// saves without an image.
export const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || '';
export const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim() || '';

export const cloudinaryConfigured = () =>
  !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);

export async function uploadImageAsync(localUri?: string | null): Promise<string | null> {
  if (!cloudinaryConfigured() || !localUri) return null;

  const name = localUri.split('/').pop() || 'photo.jpg';
  const ext = (name.split('.').pop() || 'jpg').toLowerCase();

  const form = new FormData();
  // React Native's FormData accepts this { uri, name, type } shape for file uploads.
  form.append('file', {
    uri: localUri,
    name,
    type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  } as unknown as Blob);
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form },
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Image upload failed');
  }
  return data.secure_url as string;
}
