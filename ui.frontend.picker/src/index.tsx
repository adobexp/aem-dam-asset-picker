import React from "react";
import * as ReactDOMClient from "react-dom/client";

import { registeredDynamicComponents } from "./dynamic/registerDynamicComp";

const apps: Record<string, React.ComponentType<any>> = registeredDynamicComponents();

export const renderAppInElement = (el: HTMLElement) => {
  const componentName = el.dataset.reactComponent ?? "";

  if (!apps[componentName]) {
    console.warn(`${componentName || "(no data-react-component)"} is not a registered component`);
    return;
  }

  if (el.dataset.rendered === "true") {
    return;
  }

  const App = apps[componentName];
  const componentRoot = ReactDOMClient.createRoot(el);
  componentRoot.render(
    <React.StrictMode>
      <App {...el.dataset} />
    </React.StrictMode>,
  );
  el.dataset.rendered = "true";
};

const appNamespace = "ReactComponents";

(window as any)[appNamespace] = {
  ready: false,
  parseComponents() {
    document.querySelectorAll(".__react-cmp").forEach((element: Element) => {
      renderAppInElement(element as HTMLElement);
    });
  },
};

(window as any)[appNamespace].parseComponents();
(window as any)[appNamespace].ready = true;

if (typeof (window as any)[`${appNamespace}AsyncInit`] === "function") {
  (window as any)[`${appNamespace}AsyncInit`]();
}
