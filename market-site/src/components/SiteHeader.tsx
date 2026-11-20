import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { BrandLockup } from "./BrandMark";

type Props = {
  active?: "about" | "features" | "benchmarks" | "faq" | "docs" | "download";
  primaryCta?: { to: string; label: string };
  ghostCta?: { to: string; label: string };
};

export function SiteHeader({
  active,
  primaryCta = { to: "/download", label: "Download" },
  ghostCta,
}: Props) {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [active]);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="nav-inner">
        <Link className="brand" to="/" aria-label="AI Job Search home">
          <BrandLockup />
        </Link>
        <nav className={`nav-links${menuOpen ? " is-open" : ""}`} aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => (isActive || active === "about" ? "is-active" : undefined)}>
            About
          </NavLink>
          <NavLink
            to="/features"
            className={({ isActive }) => (isActive || active === "features" ? "is-active" : undefined)}
          >
            Features
          </NavLink>
          <NavLink
            to="/benchmarks"
            className={({ isActive }) => (isActive || active === "benchmarks" ? "is-active" : undefined)}
          >
            Benchmarks
          </NavLink>
          <NavLink
            to="/faq"
            className={({ isActive }) => (isActive || active === "faq" ? "is-active" : undefined)}
          >
            FAQs
          </NavLink>
          <NavLink
            to="/docs"
            className={({ isActive }) => (isActive || active === "docs" ? "is-active" : undefined)}
          >
            Docs
          </NavLink>
          <NavLink
            to="/download"
            className={({ isActive }) => (isActive || active === "download" ? "is-active" : undefined)}
          >
            Download
          </NavLink>
        </nav>
        <div className="nav-actions">
          <button
            className="theme-toggle"
            type="button"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            onClick={toggle}
          >
            <svg className="icon-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M20 14.5A7.5 7.5 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            <svg className="icon-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.05 5.05l1.56 1.56M17.39 17.39l1.56 1.56M18.95 5.05l-1.56 1.56M6.61 17.39l-1.56 1.56"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {ghostCta ? (
            <Link className="btn btn-ghost" to={ghostCta.to}>
              {ghostCta.label}
            </Link>
          ) : null}
          <Link className="btn btn-primary" to={primaryCta.to}>
            {primaryCta.label}
          </Link>
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
