import { PickerAsset } from "../models/picker";

/**
 * The window that launched the picker: `window.opener` when the host used
 * `window.open`, otherwise the parent frame. This mirrors the OOTB picker's own
 * `getParent()` helper so both integration styles keep working unchanged.
 */
const getHostWindow = (): Window | null => {
  if (window.opener) {
    return window.opener as Window;
  }
  if (window.parent && window.parent !== window) {
    return window.parent;
  }
  return null;
};

const post = (payload: unknown, targetOrigin: string) => {
  const host = getHostWindow();

  if (!host) {
    console.warn("Asset Picker has no opener or parent window, dropping message", payload);
    return;
  }

  // The OOTB picker posts a JSON *string*, not a structured clone. Consumers call
  // JSON.parse(event.data), so the payload must stay stringified.
  host.postMessage(JSON.stringify(payload), targetOrigin);
};

/** Hands the selection to the host page and asks it to tear the picker down. */
export const postSelection = (assets: PickerAsset[], targetOrigin: string) => {
  post({ data: assets, config: { action: "done" } }, targetOrigin);
};

/** Tells the host page the user cancelled, so it closes the popup or hides the iframe. */
export const postCancel = (targetOrigin: string) => {
  post({ config: { action: "close" } }, targetOrigin);
};
