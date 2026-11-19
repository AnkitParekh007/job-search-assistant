import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@ai-job-search/ui";
import "@ai-job-search/ui/styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
