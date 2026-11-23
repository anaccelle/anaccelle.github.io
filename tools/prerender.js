// Prerender news list and song list into static HTML (for SEO); JS keeps the data as the single source.
const fs=require('fs');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
// ---- news.html
let n=fs.readFileSync('news.html','utf8');
const dataSrc=n.slice(n.indexOf('const SP_ALBUM'), n.indexOf('const imgURL'));
const news=new Function(dataSrc+';return news;')();
const imgURL=v=>v.startsWith('http')?v:'https://i.scdn.co/image/ab67616d00001e02'+v;
const items=news.map(x=>`
  <li class="item">
    <a class="thumb" href="${x.links[0][1]}" target="_blank" rel="noopener"><img src="${imgURL(x.img)}" alt="${esc(x.title)}" loading="lazy" width="300" height="300"></a>
    <div>
      <div class="meta"><time datetime="${x.date.replace(/\./g,'-')}">${x.date}</time><span class="tag ${x.type}">${x.type}</span></div>
      <h2>${esc(x.title)}</h2>
      <p class="ja" lang="ja">${esc(x.ja)}</p>
      <div class="acts">${x.links.map(([t,u])=>`<a href="${u}" target="_blank" rel="noopener">${t} ↗</a>`).join('')}</div>
    </div>
  </li>`).join('');
n=n.replace(/<ul class="list" id="list">[\s\S]*?<\/ul>/, `<ul class="list" id="list">${items}\n    </ul>`);
// remove client-side render line (static now)
n=n.replace(/document\.getElementById\("list"\)\.innerHTML = news\.map[\s\S]*?\.join\(""\);\n/, '');
// JSON-LD: releases
const ld={"@context":"https://schema.org","@type":"ItemList","name":"anaccelle releases","itemListElement":news.map((x,i)=>{
  const name=(x.title.match(/“([^”]+)”/)||[,x.title])[1];
  return {"@type":"ListItem","position":i+1,"item":{"@type":"MusicAlbum","name":name,"albumReleaseType":"https://schema.org/SingleRelease","datePublished":x.date.replace(/\./g,'-'),"image":imgURL(x.img),"url":x.links[0][1],"byArtist":{"@type":"MusicGroup","name":x.type==="press"?"Stellartree feat. anaccelle":"anaccelle","@id":x.type==="press"?undefined:"https://anaccelle.com/#artist"}}};
})};
n=n.replace(/<script type="application\/ld\+json" id="releases-ld">[\s\S]*?<\/script>\n/,'');
n=n.replace('<meta name="theme-color"',`<script type="application/ld+json" id="releases-ld">\n${JSON.stringify(ld)}\n</script>\n<meta name="theme-color"`);
fs.writeFileSync('news.html',n);
// ---- index.html song list
let s=fs.readFileSync('index.html','utf8');
const rsrc=s.slice(s.indexOf('const IMG ='), s.indexOf('document.getElementById("list").innerHTML'));
const releases=new Function(rsrc+';return releases;')();
const IMG=h=>'https://i.scdn.co/image/ab67616d00001e02'+h, AL=id=>'https://open.spotify.com/album/'+id;
const lis=releases.map(([t,d,id,img],i)=>`<li><a href="${AL(id)}" target="_blank" rel="noopener"><span class="art"><img src="${IMG(img)}" alt="anaccelle - ${esc(t)} cover" loading="lazy" draggable="false" width="300" height="300">${i===0?'<span class="new">new</span>':''}</span><span class="t">${esc(t)}</span><small>${d}</small></a></li>`).join('');
s=s.replace(/<ul class="list" id="list">[\s\S]*?<\/ul>/, `<ul class="list" id="list">${lis}</ul>`);
s=s.replace(/document\.getElementById\("list"\)\.innerHTML = releases\.map\([\s\S]*?\.join\(""\);\n/, '');
fs.writeFileSync('index.html',s);
console.log('news',news.length,'songs',releases.length);
