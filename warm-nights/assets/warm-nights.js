const state = {
  threshold: "18",
  view: "2005_2024",
  manifest: null,
  map: null,
  layer: null
};

const thresholdLabels = {
  "15": "15°C mild nights",
  "18": "18°C warm nights",
  "20": "20°C tropical nights"
};

const viewLabels = {
  "1981_2000": "1981–2000",
  "2005_2024": "2005–2024",
  "change": "Change"
};

function layerKey() {
  return state.view === "change" ? `change_T${state.threshold}` : `${state.view}_T${state.threshold}`;
}

function boundsFromManifest(m) {
  if (m.leafletBounds) return m.leafletBounds;
  return [[m.bounds.south, m.bounds.west], [m.bounds.north, m.bounds.east]];
}

function styleFeature(feature) {
  const p = feature.properties || {};
  return {
    color: p.stroke || p.fill || "#a33",
    weight: p.strokeWeight ?? 0.35,
    opacity: p.strokeOpacity ?? 0.7,
    fillColor: p.fill || "#a33",
    fillOpacity: p.fillOpacity ?? 0.5,
    interactive: true
  };
}

function onEachFeature(feature, layer) {
  const p = feature.properties || {};
  layer.bindPopup(`<strong>${p.layer_label || "Warm nights"}</strong><br>${p.label || ""}`);
}

function legendHtml() {
  if (!state.manifest) return "";
  const type = state.view === "change" ? "change" : "frequency";
  const leg = state.manifest.legend[type];
  const units = type === "change" ? "percentage points" : "% of summers";
  const title = type === "change" ? "Change in frequency" : "Frequency";
  const subtitle = type === "change" ? "2005–2024 minus 1981–2000" : "% of summers with at least one 14-night spell";
  let html = `<div class="legend-title">${title}</div><div class="legend-subtitle">${subtitle}</div>`;
  for (let i = 0; i < leg.colours.length; i++) {
    const lo = leg.levels[i];
    const hi = leg.levels[i + 1];
    html += `<div class="legend-row"><span class="swatch" style="background:${leg.colours[i]}"></span>${lo}–${hi} ${units}</div>`;
  }
  return html;
}

function updateButtons() {
  document.querySelectorAll("[data-threshold]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.threshold === state.threshold);
  });
  document.querySelectorAll("[data-view]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === state.view);
  });
}

function updateText() {
  document.getElementById("current-layer-title").textContent = `${thresholdLabels[state.threshold]} · ${viewLabels[state.view]}`;
  document.getElementById("current-layer-note").textContent = state.view === "change"
    ? "Showing the change in percentage points between 1981–2000 and 2005–2024."
    : "Showing the percentage of summers with at least one 14-night warm spell.";
  document.getElementById("legend").innerHTML = legendHtml();
}

async function updateLayer() {
  const key = layerKey();
  const file = state.manifest.layers[key];
  if (!file) throw new Error(`Layer not found in manifest: ${key}`);

  const response = await fetch(`assets/data/${file}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not fetch layer ${file}: HTTP ${response.status}`);
  const geojson = await response.json();

  if (state.layer) {
    state.map.removeLayer(state.layer);
  }

  state.layer = L.geoJSON(geojson, {
    style: styleFeature,
    onEachFeature: onEachFeature
  }).addTo(state.map);

  updateButtons();
  updateText();
}

function setupControls() {
  document.querySelectorAll("[data-threshold]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.threshold = btn.dataset.threshold;
      updateLayer().catch(showError);
    });
  });
  document.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.view;
      updateLayer().catch(showError);
    });
  });
}

function showError(err) {
  console.error(err);
  const box = document.getElementById("map-message");
  box.hidden = false;
  box.textContent = `Could not load map layer: ${err.message}`;
}

async function init() {
  try {
    const manifestResponse = await fetch("assets/data/manifest.json", { cache: "no-store" });
    if (!manifestResponse.ok) throw new Error(`Could not fetch manifest: HTTP ${manifestResponse.status}`);
    state.manifest = await manifestResponse.json();

    state.view = state.manifest.default?.view || state.view;
    state.threshold = state.manifest.default?.threshold || state.threshold;

    const bounds = boundsFromManifest(state.manifest);
    state.map = L.map("map", { zoomControl: true, scrollWheelZoom: true });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 8,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(state.map);

    state.map.fitBounds(bounds, { padding: [8, 8] });
    setupControls();
    await updateLayer();
  } catch (err) {
    showError(err);
  }
}

document.addEventListener("DOMContentLoaded", init);
