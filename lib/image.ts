// lib/image.ts — prepare a picked photo for storage.
//
// No CDN for now: the avatar is downsized to a small square and sent to the
// backend as an inline base64 data URI, stored on the user document. Keeping
// it tiny is what makes that viable — a raw phone photo is 3–8 MB, this
// produces roughly 15–25 KB.
//
// Uses the SDK 54 contextual ImageManipulator API (`manipulate` -> `renderAsync`
// -> `saveAsync`). The old `manipulateAsync` helper is deprecated.
// Docs: https://docs.expo.dev/versions/v54.0.0/sdk/imagemanipulator/
//
// To move to a CDN later, only this function changes (upload and return the
// URL instead of a data URI) — nothing else in the app cares.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Width of the stored avatar, in pixels (height follows the aspect ratio). */
const AVATAR_SIZE = 256;
/** JPEG quality (0–1). Low on purpose — it renders at ~112px. */
const AVATAR_QUALITY = 0.5;
/** Must stay under the backend's cap (150_000 chars). */
const MAX_CHARS = 150_000;

export async function prepareAvatarAsync(localUri?: string | null): Promise<string | null> {
  if (!localUri) return null;

  // already stored (an http URL or a data URI) — send it through unchanged
  if (/^https?:\/\//i.test(localUri) || /^data:image\//i.test(localUri)) return localUri;

  // schedule the resize, then await the render and save
  const context = ImageManipulator.manipulate(localUri).resize({ width: AVATAR_SIZE });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    compress: AVATAR_QUALITY,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!result.base64) return null;

  const dataUri = `data:image/jpeg;base64,${result.base64}`;

  if (dataUri.length > MAX_CHARS) {
    throw new Error('That photo is too large. Please choose a smaller one.');
  }

  return dataUri;
}
