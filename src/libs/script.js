const search=document.getElementById("search")
const results=document.getElementById("results")
const trending=document.getElementById("trending")
const popup=document.getElementById("popup")
const popupData=document.getElementById("popupData")

/* trending packages */

const trendingList=[
"react",
"vue",
"next",
"vite",
"express",
"typescript",
"tailwindcss"
]

trendingList.forEach(pkg=>{

const div=document.createElement("div")
div.className="package"
div.innerHTML=pkg

div.onclick=()=>loadPackage(pkg)

trending.appendChild(div)

})


/* search */

search.addEventListener("input",()=>{

const q=search.value

if(q.length<2) return

fetch(`https://registry.npmjs.org/-/v1/search?text=${q}&size=15`)
.then(res=>res.json())
.then(data=>{

results.innerHTML=""

data.objects.forEach(obj=>{

const pkg=obj.package

const div=document.createElement("div")

div.className="package"

div.innerHTML=`
<strong>${pkg.name}</strong>
<p>${pkg.description||""}</p>
`

div.onclick=()=>loadPackage(pkg.name)

results.appendChild(div)

})

})

})


/* load package */

async function loadPackage(name){

popup.classList.remove("hidden")

popupData.innerHTML="Loading..."

try{

const metaRes=await fetch(`https://registry.npmjs.org/${name}`)
const meta=await metaRes.json()

const latest=meta["dist-tags"].latest
const data=meta.versions[latest]

/* downloads */

const dlRes=await fetch(`https://api.npmjs.org/downloads/range/last-month/${name}`)
const downloads=await dlRes.json()

/* github */

let stars="N/A"
let issues="N/A"

if(data.repository){

const repo=data.repository.url
.replace("git+","")
.replace(".git","")
.replace("git://","https://")
.replace("github.com","api.github.com/repos")

const gh=await fetch(repo)
const ghData=await gh.json()

stars=ghData.stargazers_count
issues=ghData.open_issues

}

/* dependencies */

let deps=""

if(data.dependencies){

Object.keys(data.dependencies)
.slice(0,20)
.forEach(d=>{

deps+=`<div>${d}</div>`

})

}

/* render popup */

popupData.innerHTML=`

<h2>${name}</h2>

<div class="terminal">
<span>$ npm install ${name}</span>
<button class="copy" onclick="copyCmd('npm install ${name}')">Copy</button>
</div>

<div class="stats">

<div class="stat">
Version<br>
<strong>${latest}</strong>
</div>

<div class="stat">
License<br>
<strong>${data.license||"N/A"}</strong>
</div>

<div class="stat">
GitHub Stars<br>
<strong>${stars}</strong>
</div>

<div class="stat">
Open Issues<br>
<strong>${issues}</strong>
</div>

</div>

<canvas id="chart"></canvas>

<h3>Dependencies</h3>

<div class="deps">${deps||"No dependencies"}</div>

<h3>README</h3>

<div class="readme">
${marked.parse(meta.readme||"No README")}
</div>

`

/* chart */

const labels=downloads.downloads.map(d=>d.day)
const values=downloads.downloads.map(d=>d.downloads)

new Chart(document.getElementById("chart"),{

type:"line",

data:{
labels:labels,
datasets:[{
label:"Downloads",
data:values
}]
}

})

}catch(err){

popupData.innerHTML="Failed to load package"

}

}


/* copy install */

function copyCmd(text){

navigator.clipboard.writeText(text)

alert("Copied: "+text)

}


/* close popup */

function closePopup(){

popup.classList.add("hidden")

}
