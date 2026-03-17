/**
 * Fetches an image URL and returns a File object.
 * Returns null if the fetch fails (e.g. CORS).
 */
export async function fetchImageAsFile(
  imageUrl: string,
  fileName: string = "promo.jpg"
): Promise<File | null> {
  try {
    const response = await fetch(imageUrl, { mode: "cors" });
    if (!response.ok) return null;
    const blob = await response.blob();
    const type = blob.type || "image/jpeg";
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_") || "promo.jpg";
    const name =
      safeName.endsWith(".jpg") || safeName.endsWith(".png") ? safeName : `${safeName}.jpg`;
    return new File([blob], name, { type });
  } catch {
    return null;
  }
}

/**
 * Tries to share text + image via the Web Share API (e.g. to WhatsApp).
 * Falls back to opening the fallbackUrl (e.g. wa.me?text=...) when native
 * share is unavailable or the user cancels.
 */
export async function shareWithImage(
  text: string,
  imageUrl: string,
  fallbackUrl: string,
  fileName: string = "promo.jpg"
): Promise<void> {
  const canUseNativeShare =
    typeof navigator !== "undefined" && navigator.share != null;

  if (!canUseNativeShare) {
    window.open(fallbackUrl, "_blank");
    return;
  }

  const file = await fetchImageAsFile(imageUrl, fileName);
  const payload: ShareData = { text };

  if (file && navigator.canShare?.({ ...payload, files: [file] })) {
    payload.files = [file];
  }

  try {
    await navigator.share(payload);
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    if (!isAbort) {
      window.open(fallbackUrl, "_blank");
    }
  }
}

/**
 * Downloads an image from a URL to the user's device.
 * Uses fetch + blob URL so the browser triggers a real download
 * instead of navigating to the image.
 */
export async function downloadImage(
  imageUrl: string,
  fileName: string = "promo.jpg"
): Promise<void> {
  const file = await fetchImageAsFile(imageUrl, fileName);
  if (!file) {
    // Fallback: open in new tab so user can long-press / right-click save
    window.open(imageUrl, "_blank");
    return;
  }
  const blobUrl = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
