// lib/cloudinary.ts — direct (unsigned) image upload from the phone.
//
// The backend stores only the image URL, so the app uploads the picked photo
// straight to Cloudinary and sends back the resulting `secure_url`.
//
// SETUP (one-time, in your Cloudinary dashboard):
//   1. Settings → Upload → Upload presets → "Add upload preset"
//   2. Set Signing Mode = "Unsigned", save, copy the preset name.
//   3. Fill the two values below (cloud name is shown on your dashboard home).
//
// Until both are filled, uploadImageAsync() returns null and the profile
// simply saves without an image.
export const CLOUDINARY_CLOUD_NAME = '';   // e.g. 'imara-afya'
export const CLOUDINARY_UPLOAD_PRESET = ''; // e.g. 'imara_unsigned'

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
