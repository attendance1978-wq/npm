const search = document.getElementById("search");
const results = document.getElementById("results");
const trending = document.getElementById("trending");
const popup = document.getElementById("popup");
const popupData = document.getElementById("popupData");

const trendingList = ["react", "vue", "next", "vite", "express", "typescript", "tailwindcss"];

// 1. Initialize Trending
trendingList.forEach(pkg => {
    const div = document.createElement("div");
    div.className = "tag";
    div.innerText = pkg;
    div.onclick = () => loadPackage(pkg);
    trending.appendChild(div);
});

// 2. Search Event with Debounce
let timeout = null;
search.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        const q = search.value;
        if (q.length < 2) return;

        fetch(`https://registry.npmjs.org/-/v1/search?text=${q}&size=12`)
            .then(res => res.json())
            .then(data => {
                results.innerHTML = "";
                data.objects.forEach(obj => {
                    const pkg = obj.package;
                    const card = document.createElement("div");
                    card.className = "package-card";
                    card.innerHTML = `
                        <h4>${pkg.name}</h4>
                        <p>${pkg.description || "No description provided."}</p>
                        <div style="margin-top:10px; font-size:11px; color:#444;">v${pkg.version}</div>
                    `;
                    card.onclick = () => loadPackage(pkg.name);
                    results.appendChild(card);
                });
            });
    }, 400);
});

// 3. Load Details
async function loadPackage(name) {
    popup.classList.remove("hidden");
    popupData.innerHTML = "<p>Fetching package data...</p>";

    try {
        const res = await fetch(`https://registry.npmjs.org/${name}`);
        const meta = await res.json();
        const latest = meta["dist-tags"].latest;
        const data = meta.versions[latest];

        popupData.innerHTML = `
            <h2 style="color:var(--accent);">${name}</h2>
            <p style="color:#888;">${data.description || ""}</p>
            <div style="background:#111; padding:15px; border-radius:10px; margin: 20px 0; font-family:monospace;">
                $ npm install ${name}
            </div>
            <div class="readme-content" style="border-top:1px solid #222; padding-top:20px;">
                ${marked.parse(meta.readme || "No README available.")}
            </div>
        `;
    } catch (e) {
        popupData.innerHTML = "Error loading package.";
    }
}

// 4. Utilities
function closePopup() {
    popup.classList.add("hidden");
}

// Shortcut ⌘K / Ctrl+K
window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        search.focus();
    }
});
