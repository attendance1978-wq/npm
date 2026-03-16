const search = document.getElementById("search");
const results = document.getElementById("results");
const trending = document.getElementById("trending");
const popup = document.getElementById("popup");
const popupData = document.getElementById("popupData");

let activeChart = null;

/* Trending Setup */
const trendingItems = ["react", "next", "vite", "typescript", "three"];
trendingItems.forEach(name => {
  const div = document.createElement("div");
  div.className = "package";
  div.innerHTML = `<strong>${name}</strong>`;
  div.onclick = () => loadPackage(name);
  trending.appendChild(div);
});

/* Search Debounce */
let timer;
search.addEventListener("input", (e) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const q = e.target.value.trim();
    if (q.length > 1) performSearch(q);
  }, 400);
});

async function performSearch(q) {
  const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${q}&size=12`);
  const data = await res.json();
  results.innerHTML = data.objects.map(obj => `
    <div class="col">
      <div class="package" onclick="loadPackage('${obj.package.name}')">
        <strong>${obj.package.name}</strong>
        <p>${obj.package.description || ''}</p>
      </div>
    </div>
  `).join('');
}

async function loadPackage(name) {
  popup.classList.remove("hidden");
  popupData.innerHTML = "<p class='text-center'>Fetching registry data...</p>";

  try {
    const [metaRes, dlRes] = await Promise.all([
      fetch(`https://registry.npmjs.org/${name}`),
      fetch(`https://api.npmjs.org/downloads/range/last-month/${name}`)
    ]);

    const meta = await metaRes.json();
    const dls = await dlRes.json();
    const latest = meta["dist-tags"].latest;
    const versionData = meta.versions[latest];

    // Mocking Stars/Issues for Demo (requires GitHub API for real data)
    const stars = Math.floor(Math.random() * 5000).toLocaleString();
    const issues = Math.floor(Math.random() * 100);

    popupData.innerHTML = `
      <h2 class="mb-1">${name}</h2>
      <span class="badge bg-success mb-3">v${latest}</span>

      <div class="terminal">
        <span>$ npm install ${name}</span>
        <button class="btn btn-sm btn-success" onclick="copyText('npm i ${name}')">Copy</button>
      </div>

      <div class="stats mb-4">
        <div class="stat stat-v">Version<br><strong>${latest}</strong></div>
        <div class="stat stat-l">License<br><strong>${versionData.license || 'N/A'}</strong></div>
        <div class="stat stat-s">Stars<br><strong>${stars}</strong></div>
        <div class="stat stat-i">Issues<br><strong>${issues}</strong></div>
      </div>

      <canvas id="chart" height="200"></canvas>

      <div class="readme mt-4">
        ${marked.parse(meta.readme || "# No README available")}
      </div>
    `;

    renderChart(dls.downloads);
  } catch (e) {
    popupData.innerHTML = "<p class='text-danger'>Error loading package metadata.</p>";
  }
}

function renderChart(downloads) {
  const ctx = document.getElementById('chart').getContext('2d');
  if (activeChart) activeChart.destroy();

  activeChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: downloads.map(d => d.day.split('-').slice(1).join('/')),
      datasets: [{
        label: 'Daily Downloads',
        data: downloads.map(d => d.downloads),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { grid: { color: '#222' } } }
    }
  });
}

function copyText(t) {
  navigator.clipboard.writeText(t);
  alert("Command copied to clipboard!");
}

function closePopup() {
  popup.classList.add("hidden");
}
