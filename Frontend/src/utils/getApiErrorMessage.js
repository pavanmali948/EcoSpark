export default function getApiErrorMessage(error, fallback = "Something went wrong") {
  const data = error?.response?.data;
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }
  const fieldErrors = Array.isArray(data?.errors) ? data.errors : data?.fieldErrors;
  if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
    const first = fieldErrors[0];
    if (first?.message) return first.message;
  }
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
