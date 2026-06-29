import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { LanguageProvider } from "./contexts/LanguageContext";

const root = createRoot(document.getElementById("root")!);
root.render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);