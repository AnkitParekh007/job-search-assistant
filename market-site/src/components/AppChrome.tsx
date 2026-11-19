type Props = {
  chips?: string[];
  sideStrongIndex?: number;
  sideCount?: number;
};

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
      </div>
      <div className="app-body">
        <div className="app-side">
          {Array.from({ length: sideCount }, (_, i) => (
            <div key={i} className={`side-item${i === sideStrongIndex ? " strong" : ""}`} />
          ))}
        </div>
        <div className="app-main">
          <div className="chip-row">
            {chips.map((c) => (
              <span key={c} className="chip">
                {c}
              </span>
            ))}
          </div>
          <div className="card-line accent" />
          <div className="card-line" />
          <div className="card-line" />
        </div>
      </div>
    </div>
  );
}
