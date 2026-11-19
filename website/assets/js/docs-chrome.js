(() => {
  const page = document.body.dataset.docsPage || "overview";
  const section = document.body.dataset.docsSection || "get-started";

  const subnav = [
    { id: "get-started", href: "index.html", label: "Overview" },
    { id: "guides", href: "discover.html", label: "Guides" },
    { id: "reference", href: "workflows.html", label: "Reference" },
    { id: "security", href: "security.html", label: "Security" },
  ];

  const sidebar = [
    {
      title: "Get started",
      links: [
        { id: "overview", href: "index.html", label: "Overview" },
        { id: "quickstart", href: "quickstart.html", label: "Quickstart" },
        { id: "install", href: "install.html", label: "Install" },
        { id: "first-run", href: "first-run.html", label: "First run" },
      ],
    },
    {
      title: "Guides",
      links: [
        { id: "discover", href: "discover.html", label: "Discover & rank" },
        { id: "apply", href: "apply.html", label: "Application Studio" },
        { id: "track", href: "track.html", label: "Track & prep" },
        { id: "settings", href: "settings.html", label: "Settings" },
      ],
    },
    {
      title: "Reference",
      links: [
        { id: "workflows", href: "workflows.html", label: "Workflows" },
        { id: "security", href: "security.html", label: "Security model" },
      ],
    },
  ];

  const mount = document.getElementById("docs-chrome");
  if (!mount) return;

  mount.innerHTML = `
    <div class="docs-subnav">
      <div class="docs-subnav-inner">
        ${subnav
          .map(
            (item) =>
              `<a href="${item.href}" class="${item.id === section ? "is-active" : ""}">${item.label}</a>`
          )
          .join("")}
      </div>
    </div>
  `;

  const shell = document.querySelector(".docs-shell");
  if (!shell) return;

  const aside = document.createElement("aside");
  aside.className = "docs-sidebar";
  aside.id = "docs-sidebar";
  aside.setAttribute("aria-label", "Docs");
  aside.innerHTML = sidebar
    .map(
      (group) => `
      <div class="docs-side-group">
        <h4>${group.title}</h4>
        ${group.links
          .map(
            (link) =>
              `<a href="${link.href}" class="${link.id === page ? "is-active" : ""}">${link.label}</a>`
          )
          .join("")}
      </div>`
    )
    .join("");

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "docs-sidebar-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "docs-sidebar");
  toggle.textContent = "Browse docs";
  toggle.addEventListener("click", () => {
    const open = aside.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  shell.prepend(aside);
  shell.prepend(toggle);
})();
