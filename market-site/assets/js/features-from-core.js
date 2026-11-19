(function () {
  function card(f) {
    var el = document.createElement("article");
    el.className = "feature-card reveal";
    el.innerHTML =
      '<p class="feature-kicker">' + (f.group || "Workflow") + "</p>" +
      "<h3>" + f.title + "</h3>" +
      "<p>" + f.blurb + "</p>";
    return el;
  }
  function row(w) {
    var tr = document.createElement("tr");
    tr.innerHTML =
      "<td><code>" + w.command + "</code></td>" +
      "<td>" + w.title + "</td>" +
      "<td>" + w.stage + "</td>" +
      "<td>" + w.blurb + "</td>";
    return tr;
  }
  fetch("assets/data/features.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var grid = document.getElementById("core-feature-grid");
      if (grid && data.product) {
        grid.innerHTML = "";
        data.product.forEach(function (f) { grid.appendChild(card(f)); });
      }
      var body = document.getElementById("core-workflow-body");
      if (body && data.workflows) {
        body.innerHTML = "";
        data.workflows.forEach(function (w) { body.appendChild(row(w)); });
      }
    })
    .catch(function () { /* keep static fallback */ });
})();
