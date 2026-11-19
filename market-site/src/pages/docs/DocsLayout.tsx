import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { SiteHeader } from "../../components/SiteHeader";
import { applySeo } from "../../lib/seo";
import { DOCS_META, DOCS_SIDEBAR, DOCS_SUBNAV, type DocsPageId } from "./nav";

function pageIdFromPath(pathname: string): DocsPageId {
  const cleaned = pathname.replace(/\/+$/, "");
  if (cleaned.endsWith("/docs") || cleaned.endsWith("/docs/")) return "overview";
  const slug = cleaned.split("/").pop() || "overview";
  if (slug in DOCS_META) return slug as DocsPageId;
  return "overview";
}

export function DocsLayout() {
  const { pathname } = useLocation();
  const page = pageIdFromPath(pathname);
  const meta = DOCS_META[page];
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    applySeo({
      title: meta.title,
      description: meta.description,
      path: meta.path,
    });
  }, [meta]);

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="docs-body">
      <SiteHeader active="docs" />
      <div className="docs-subnav">
        <div className="docs-subnav-inner">
          {DOCS_SUBNAV.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className={item.id === meta.section ? "is-active" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="docs-shell">
        <button
          type="button"
          className="docs-sidebar-toggle"
          aria-expanded={sidebarOpen}
          aria-controls="docs-sidebar"
          onClick={() => setSidebarOpen((o) => !o)}
        >
          Browse docs
        </button>
        <aside
          className={`docs-sidebar${sidebarOpen ? " is-open" : ""}`}
          id="docs-sidebar"
          aria-label="Docs"
        >
          {DOCS_SIDEBAR.map((group) => (
            <div className="docs-side-group" key={group.title}>
              <h4>{group.title}</h4>
              {group.links.map((link) => (
                <NavLink
                  key={link.id}
                  to={link.to}
                  end={link.to === "/docs"}
                  className={({ isActive }) => (isActive ? "is-active" : undefined)}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </aside>
        <main className="docs-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
