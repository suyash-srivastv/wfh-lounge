// Profile photos: square-cropped, shrunk to a 128px WebP (~5–10KB) and kept as
// text right on the profile in Firestore — no file storage, works on the free plan.

export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_SIZE = 128;

export async function shrinkPhoto(file) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.min(PHOTO_SIZE, side);
  canvas.getContext('2d').drawImage(bitmap,
    (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  let url = canvas.toDataURL('image/webp', 0.82);
  if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/jpeg', 0.82); // Safari can't make WebP
  if (url.length > 60000) throw new Error('Photo too detailed after shrinking');
  return url;
}

// Checks and shrinks a picked file. Throws an Error whose message is ready to show.
export async function photoFromFile(file) {
  if (!PHOTO_TYPES.includes(file.type)) throw new Error('Use a JPG, PNG or WebP image.');
  if (file.size > PHOTO_MAX_BYTES)      throw new Error('That image is over 5MB.');
  try { return await shrinkPhoto(file); }
  catch (err) { console.error('Photo processing failed:', err); throw new Error("Couldn't use that photo. Try another one."); }
}
