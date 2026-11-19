import { Link } from "react-router-dom";
import { GITHUB_REPO } from "../lib/site";

type Props = {
  note?: string;
};

export function SiteFooter({
  note = "Local-first · Claude Code required · Does not auto-submit applications",
}: Props) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link className="brand" to="/">
            <span className="brand-mark" aria-hidden="true">
              AJ
            </span>
            <span>AI Job Search</span>
          </Link>
          <p>
            Local-first job search automation for macOS, powered by Claude Code and your own workspace
            files.
          </p>
        </div>
        <div className="footer-col">
          <h4>Product</h4>
          <Link to="/">About</Link>
          <Link to="/features">Features</Link>
          <Link to="/docs">Docs</Link>
          <Link to="/download">Install</Link>
        </div>
        <div className="footer-col">
          <h4>Platform</h4>
          <Link to="/download#platforms">Platform downloads</Link>
          <Link to="/download#requirements">Requirements</Link>
          <Link to="/download#source">Build from source</Link>
        </div>
        <div className="footer-col">
          <h4>Notes</h4>
          <Link to="/download#requirements">Claude Code required</Link>
          <a href={GITHUB_REPO} rel="noopener">
            GitHub
          </a>
          <a href={`${GITHUB_REPO}/blob/main/LICENSE`} rel="noopener">
            MIT License
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 AI Job Search</span>
        <span>{note}</span>
      </div>
    </footer>
  );
}
