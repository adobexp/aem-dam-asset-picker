import { getCsrfToken } from "./getCsrfToken";

const SHARE_ENDPOINT = "/bin/api/emails";

export type ShareCommonInput = {
  /** JCR realPaths of the assets being shared. One request is fired per asset. */
  paths: string[];
  /** Comma-separated or already-split list of recipient e-mail addresses. */
  emails: string[];
  /** Optional message body. */
  message?: string;
  /** Sender signature (display name). */
  signature?: string;
};

export type InternalShareInput = ShareCommonInput;

export type ExternalShareInput = ShareCommonInput & {
  /** ISO date string (YYYY-MM-DD) — when the public link becomes valid. */
  startDate: string;
  /** ISO date string (YYYY-MM-DD) — when the public link expires. */
  expiryDate: string;
};

type FetchInit = Omit<RequestInit, "body" | "method">;

const buildBaseHeaders = async (): Promise<Headers> => {
  const headers = new Headers();
  if (process.env.API === "local") {
    headers.set("Authorization", `Basic ${btoa("admin:admin")}`);
  }
  if (process.env.API !== "mock") {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      headers.set("CSRF-Token", csrfToken);
    }
  }
  return headers;
};

const ensureOk = async (response: Response, context: string): Promise<void> => {
  if (response.ok) return;
  let detail = "";
  try {
    detail = await response.text();
  } catch {
    /* swallow */
  }
  throw new Error(`${context} failed (${response.status}): ${detail || response.statusText}`);
};

/**
 * Internal share — multipart/form-data POST. Recipients must be authenticated DAM users.
 * Sends a single request for the whole asset set so recipients receive ONE email
 * listing every shared asset, not one email per asset.
 */
export const shareAssetsInternally = async (input: InternalShareInput, init: FetchInit = {}): Promise<void> => {
  const emails = input.emails.map((e) => e.trim()).filter(Boolean);
  if (emails.length === 0) throw new Error("At least one recipient e-mail is required");
  if (input.paths.length === 0) throw new Error("At least one asset path is required");

  const headers = await buildBaseHeaders();

  const form = new FormData();
  emails.forEach((email) => form.append("email", email));
  input.paths.forEach((path) => form.append("path", path));
  if (input.message) form.append("message", input.message);
  if (input.signature) form.append("signature", input.signature);
  form.append("dam-platform__share--email", "true");

  const response = await fetch(SHARE_ENDPOINT, {
    ...init,
    method: "POST",
    headers,
    body: form,
    credentials: init.credentials ?? "include",
  });
  await ensureOk(response, `Internal share for ${input.paths.length} asset(s)`);
};

/**
 * External share — query-string POST with empty body. Generates a public link (token-based) that
 * is valid between `startDate` and `expiryDate`. A single request is sent with the `path`
 * parameter repeated for every asset so recipients receive a single email.
 */
export const shareAssetsExternally = async (input: ExternalShareInput, init: FetchInit = {}): Promise<void> => {
  const emails = input.emails.map((e) => e.trim()).filter(Boolean);
  if (emails.length === 0) throw new Error("At least one recipient e-mail is required");
  if (input.paths.length === 0) throw new Error("At least one asset path is required");
  if (!input.startDate) throw new Error("Start date is required for external shares");
  if (!input.expiryDate) throw new Error("Expiry date is required for external shares");

  const headers = await buildBaseHeaders();

  const params = new URLSearchParams();
  input.paths.forEach((path) => params.append("path", path));
  emails.forEach((email) => params.append("email", email));
  if (input.message) params.set("message", input.message);
  params.set("email--token--share", "true");
  params.set("externalShare", "on");
  params.set("startDate", input.startDate);
  params.set("expiryDate", input.expiryDate);
  if (input.signature) params.set("signature", input.signature);
  params.set("dam-platform__share--email", "true");

  const response = await fetch(`${SHARE_ENDPOINT}?${params.toString()}`, {
    ...init,
    method: "POST",
    headers,
    credentials: init.credentials ?? "include",
  });
  await ensureOk(response, `External share for ${input.paths.length} asset(s)`);
};
