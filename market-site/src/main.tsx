import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./styles/styles.css";
import "./styles/docs.css";
import "./styles/marketing-expansion.css";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";
const container = document.getElementById("root")!;

const app = (
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// Prerendered routes ship real markup to hydrate; the dev server and the
// 404.html SPA fallback ship an empty root and render from scratch.
if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
