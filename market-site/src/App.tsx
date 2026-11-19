import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useReveal } from "./hooks/useReveal";
import { DownloadPage } from "./pages/DownloadPage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { HomePage } from "./pages/HomePage";
import { DocsLayout } from "./pages/docs/DocsLayout";
import {
  DocsApply,
  DocsDiscover,
  DocsFirstRun,
  DocsInstall,
  DocsOverview,
  DocsQuickstart,
  DocsSecurity,
  DocsSettings,
  DocsTrack,
  DocsWorkflows,
} from "./pages/docs/DocsPages";

function ScrollAndReveal() {
  const { pathname, hash } = useLocation();
  useReveal();

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

export function App() {
  return (
    <>
      <ScrollAndReveal />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/download" element={<DownloadPage />} />

        <Route path="/docs" element={<DocsLayout />}>
          <Route index element={<DocsOverview />} />
          <Route path="quickstart" element={<DocsQuickstart />} />
          <Route path="install" element={<DocsInstall />} />
          <Route path="first-run" element={<DocsFirstRun />} />
          <Route path="discover" element={<DocsDiscover />} />
          <Route path="apply" element={<DocsApply />} />
          <Route path="track" element={<DocsTrack />} />
          <Route path="settings" element={<DocsSettings />} />
          <Route path="workflows" element={<DocsWorkflows />} />
          <Route path="security" element={<DocsSecurity />} />
        </Route>

        {/* Legacy .html URLs → clean SPA routes */}
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/features.html" element={<Navigate to="/features" replace />} />
        <Route path="/download.html" element={<Navigate to="/download" replace />} />
        <Route path="/docs/index.html" element={<Navigate to="/docs" replace />} />
        <Route path="/docs/quickstart.html" element={<Navigate to="/docs/quickstart" replace />} />
        <Route path="/docs/install.html" element={<Navigate to="/docs/install" replace />} />
        <Route path="/docs/first-run.html" element={<Navigate to="/docs/first-run" replace />} />
        <Route path="/docs/discover.html" element={<Navigate to="/docs/discover" replace />} />
        <Route path="/docs/apply.html" element={<Navigate to="/docs/apply" replace />} />
        <Route path="/docs/track.html" element={<Navigate to="/docs/track" replace />} />
        <Route path="/docs/settings.html" element={<Navigate to="/docs/settings" replace />} />
        <Route path="/docs/workflows.html" element={<Navigate to="/docs/workflows" replace />} />
        <Route path="/docs/security.html" element={<Navigate to="/docs/security" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
