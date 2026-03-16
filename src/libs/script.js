let currentChart = null;

/* Initial Trending Load */
const trendingList = ["react", "next", "vite", "tailwindcss", "typescript"];
trendingList.forEach(name => {
    const div = document.createElement("div");
    div.className = "package";
    div.innerHTML = `<strong>${name}</strong>`;
    div.onclick = () => loadPackage(name);
    document.getElementById("trending").appendChild(div);
});

/* Search with Debounce */
let timer;
document.getElementById("search").addEventListener("input", (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
        const q = e.target.value.trim();
        if (q.length > 1) fetchResults(q);
    }, 400);
});

async function fetchResults(q) {
    const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${q}&size=10`);
    const data = await res.json();
    document.getElementById("results").innerHTML = data.objects.map(obj => `
        <div class="package" onclick="loadPackage('${obj.package.name}')">
            <strong>${obj.package.name}</strong>
            <p style="color:#888; font-size:14px; margin:5px 0;">${obj.package.description || ''}</p>
        </div>
    `).join('');
}

async function loadPackage(name) {
    const popup = document.getElementById("popup");
    const content = document.getElementById("popupData");
    popup.classList.remove("hidden");
    content.innerHTML = "Loading...";

    try {
        const [reg, dl] = await Promise.all([
            fetch(`https://registry.npmjs.org/${name}`).then(r => r.json()),
            fetch(`https://api.npmjs.org/downloads/range/last-month/${name}`).then(r => r.json())
        ]);

        const latest = reg["dist-tags"].latest;
        const ver = reg.versions[latest];

        content.innerHTML = `
            <h2>${name} <span style="color:#10b981; font-size:16px;">v${latest}</span></h2>
            <div class="terminal">
                <span>npm install ${name}</span>
                <button class="copy" onclick="copyText('npm i ${name}')">Copy</button>
            </div>
            <div class="stats">
                <div class="stat">License<br><strong>${ver.license || 'N/A'}</strong></div>
                <div class="stat">Downloads<br><strong>${dl.downloads.reduce((a, b) => a + b.downloads, 0).toLocaleString()}</strong></div>
                <div class="stat">Deps<br><strong>${Object.keys(ver.dependencies || {}).length}</strong></div>
                <div class="stat">Files<br><strong>${ver.dist.fileCount || 'N/A'}</strong></div>
            </div>
            <canvas id="chart"></canvas>
            <h3>Dependencies</h3>
            <div class="deps">${Object.keys(ver.dependencies || {}).map(d => `<div>${d}</div>`).join('') || 'None'}</div>
            <h3>README</h3>
            <div class="readme" style="background:#020202; padding:20px; border-radius:10px; margin-top:10px;">
                ${marked.parse(reg.readme || "No README available.")}
            </div>
        `;

        renderChart(dl.downloads);
    } catch (e) { content.innerHTML = "Error loading data."; }
}

function renderChart(data) {
    const ctx = document.getElementById('chart').getContext('2d');
    if (currentChart) currentChart.destroy();
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.day.slice(5)),
            datasets: [{ label: 'Downloads', data: data.map(d => d.downloads), borderColor: '#10b981', tension: 0.3 }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { display: false } } }
    });
}

window.copyText = (t) => { navigator.clipboard.writeText(t); alert("Copied!"); };
window.closePopup = () => { document.getElementById("popup").classList.add("hidden"); };
