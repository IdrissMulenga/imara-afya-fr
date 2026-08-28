// constants/photos.ts — WHERE THE PHOTOGRAPHS GO.
//
// The dashboard is built to show real photography behind the header and on the
// wide cards. No photos ship with the app yet, so every slot below is `null`
// and each surface falls back to its gradient — which is a finished look, not a
// broken one.
//
// TO ADD A PHOTO
//   1. put the file in  assets/images/dashboard/
//   2. swap the `null` below for  require('@/assets/images/dashboard/<name>.jpg')
//
// That is the whole change. Nothing else needs touching.
//
// WHY A TABLE OF `require` CALLS RATHER THAN A FILENAME STRING
//
// Metro resolves `require` at BUILD time, so a path pointing at a file that
// isn't there fails the bundle — a try/catch around it does not help, because
// the failure happens before any of this code runs. Listing the slots here
// means an empty slot is a value (`null`), which is safe, instead of a missing
// module, which is not.
//
// WHAT TO CHOOSE, given who uses this app
//
//   • Bundle them locally. A remote URL means the dashboard is blank on a bad
//     connection, and this is an app for 2G.
//   • Compress hard. 1080px wide, WebP, quality ~70 — about 60-90KB each.
//     Four photos at that size is fine; four straight off a camera is 20MB of
//     download before the app opens once.
//   • Faces and hands read as human at small sizes; landscapes turn to mush.
//   • Check them behind the dark scrim, not on their own. Anything busy across
//     the top-left fights the greeting text.
//   • Licensing is yours to decide. Unsplash and Pexels both permit commercial
//     use without attribution; a photo found in a search result does not.
import type { ImageSourcePropType } from 'react-native';

export type PhotoSlot = ImageSourcePropType | null;

export const PHOTOS: {
  /** behind the greeting. Wide, calm, nothing busy top-left. */
  hero: PhotoSlot;
  /** the hydration card */
  water: PhotoSlot;
  /** the routines section header */
  routines: PhotoSlot;
  /** the wellbeing / check-in section */
  wellbeing: PhotoSlot;
} = {
  hero: null,
  water: null,
  routines: null,
  wellbeing: null,
};

/** Is there a real photograph in this slot, or should the caller fall back? */
export const hasPhoto = (slot: PhotoSlot): slot is ImageSourcePropType => slot != null;
