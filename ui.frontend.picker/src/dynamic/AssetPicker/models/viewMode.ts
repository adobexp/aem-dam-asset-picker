export const viewModes = ["grid", "list"] as const;

export type ViewMode = (typeof viewModes)[number];
