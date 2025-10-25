import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";
import "./i18n";

const rootEl = document.getElementById("root");
if (!rootEl) {
  const pre = document.createElement("pre");
  pre.textContent = "Root element #root not found.";
  document.body.appendChild(pre);
} else {
  try {
    createRoot(rootEl).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    );
  } catch (e) {
    console.error("App boot failed:", e);
    const pre = document.createElement("pre");
    pre.style.color = "#fff";
    pre.style.padding = "24px";
    pre.textContent = "App boot failed: " + String(e);
    document.body.appendChild(pre);
  }

  window.addEventListener("error", (ev) => {
    const pre = document.createElement("pre");
    pre.style.color = "#fff";
    pre.style.padding = "24px";
    const message =
      "Unhandled error: " + String(ev.error ?? ev.message ?? "Unknown error");
    pre.textContent = message;
    document.body.appendChild(pre);
  });

  window.addEventListener("unhandledrejection", (ev) => {
    const pre = document.createElement("pre");
    pre.style.color = "#fff";
    pre.style.padding = "24px";
    pre.textContent =
      "Unhandled promise rejection: " + String(ev.reason ?? "Unknown reason");
    document.body.appendChild(pre);
  });
}
