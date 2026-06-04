/** Matches Backend TopicCodec.encodeForTopic (Base64 URL without padding). */
export function encodeLicenseForTopic(raw) {
  const bytes = new TextEncoder().encode(raw || "");
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
