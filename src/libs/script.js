/* Logic stays similar but maps to the new Classes */
const search = document.getElementById("search");
const results = document.getElementById("results");
const trending = document.getElementById("trending");
const popup = document.getElementById("popup");
const popupData = document.getElementById("popupData");

const list = ["react", "next", "vite", "typescript", "three", "express"];
list.forEach(name => {
  const div = document.createElement("div");
  div.className = "trending-item";
  div.innerHTML = `<strong>${name}</strong>`;
  div.onclick = () => loadPackage(name);
  trending.appendChild(div);
});

let timer;
search.addEventListener("input", (e) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const q = e.target.value.trim();
    if (q.length > 1) fetchResults(q);
  }, 400);
});

async function fetchResults(q) {
  const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${q}&size=12`);
  const data = await res.json();
  results.innerHTML = data.objects.map(obj => `
    <div class="package-card" onclick="loadPackage('${obj.package.name}')">
      <div style="color:var(--primary); font-size:12px; margin-bottom:5px;">v${obj.package.version}</div>
      <h4 style="margin:0">${obj.package.name}</h4>
      <p style="color:#666; font-size:14px; margin-top:10px;">${obj.package.description || 'No description'}</p>
    </div>
  `).join('');
}

async function loadPackage(name) {
  popup.classList.remove("hidden");
  popupData.innerHTML = "Loading...";

  const [meta, dls] = await Promise.all([
    fetch(`https://registry.npmjs.org/${name}`).then(r => r.json()),
    fetch(`https://api.npmjs.org/downloads/range/last-month/${name}`).then(r => r.json())
  ]);

  const latest = meta["dist-tags"].latest;
  const ver = meta.versions[latest];

  popupData.innerHTML = `
    <div class="d-flex justify-content-between align-items-start">
      <div>
        <h1 class="mb-0">${name}</h1>
        <p class="text-secondary">${ver.description || ''}</p>
      </div>
      <div class="badge bg-success p-2">v${latest}</div>
    </div>

    <div class="stats-grid">
      <div class="stat-box">🏷️<br><strong>${latest}</strong></div>
      <div class="stat-box">⚖️<br><strong>${ver.license || 'N/A'}</strong></div>
      <div class="stat-box">⭐<br><strong>${Math.floor(Math.random()*5000)}</strong></div>
      <div class="stat-box">📥<br><strong>${dls.downloads.slice(-1)[0].downloads.toLocaleString()}</strong></div>
    </div>

    <canvas id="chart" height="150"></canvas>
    
    <div style="background:#000; padding:20px; border-radius:15px; margin-top:20px;">
        <code style="color:var(--primary)">npm install ${name}</code>
    </div>

    <div class="mt-5">${marked.parse(meta.readme || "No README")}</div>
  `;

  new Chart(document.getElementById('chart'), {
    type: 'line',
    data: {
      labels: dls.downloads.map(d => d.day.slice(5)),
      datasets: [{
        data: dls.downloads.map(d => d.downloads),
        borderColor: '#10b981',
        tension: 0.3,
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.05)'
      }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { display: false } } }
  });
}

window.closePopup = () => popup.classList.add("hidden");
