import React from "react";

import { App as AssetPicker } from "./AssetPicker";

export const registeredDynamicComponents = (): Record<string, React.ComponentType<any>> => ({
  AssetPicker,
});
