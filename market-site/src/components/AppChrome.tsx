type Props = {
  chips?: string[];
  sideStrongIndex?: number;
  sideCount?: number;
};

const SIDE_LABELS = ["Today", "Jobs", "Studio", "Pipeline", "Prep"];

/** Stylised app window used as a decorative illustration on inner pages. */
export function AppChrome({
  chips = ["Today", "Jobs", "Studio"],
  sideStrongIndex = 0,
  sideCount = 4,
}: Props) {
  return (
    <div className="app-chrome">
      <div className="app-top">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="app-title mono">AI Job Search</span>
      </div>
      <div className="app-body">
        <div className="app-side">
          {Array.from({ length: sideCount }, (_, i) => (
            <div key={i} className={`side-item${i === sideStrongIndex ? " strong" : ""}`}>
              <i />
              <span>{SIDE_LABELS[i % SIDE_LABELS.length]}</span>
            </div>
          ))}
        </div>
        <div className="app-main">
          <div className="chip-row">
            {chips.map((c, i) => (
              <span key={c} className={`chip${i === 0 ? " is-on" : ""}`}>
                {c}
              </span>
            ))}
          </div>
          <div className="card-line accent">
            <b className="mono">94</b>
            <span />
          </div>
          <div className="card-line">
            <b className="mono">88</b>
            <span />
          </div>
          <div className="card-line">
            <b className="mono">72</b>
            <span />
          </div>
          <div className="app-progress">
            <i />
          </div>
        </div>
      </div>
    </div>
  );
}
