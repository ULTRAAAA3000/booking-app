(()=>{
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const TY={grazhda:"Ґражда",khata:"Хата",chalet:"Шале",koliba:"Колиба",cottage:"Котедж",estate:"Садиба",villa:"Вілла"};
const fmt=m=>(m/100).toLocaleString("uk-UA")+" ₴",L=12,P=new URLSearchParams(location.search);
const heart='<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.500-8 11-8 11z"/></svg>';
const cal='<svg class="ic" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M9.5 15l2 2 3.5-4"/></svg>';
const st={};["q","region","type","guests","min","max","in","out"].forEach(k=>st[k]=P.get(k)||"");st.sort=P.get("sort")||"recommended";
let offset=0,loaded=false,timer=0,seq=0,favs=new Set(),total=0;
const flt=$("#flt"),res=$("#res"),more=$("#more"),cnt=$("#cnt");
const today=new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Kyiv"});
function form(regions,types){const keep=Object.assign({},st);
flt.innerHTML=`<label class="afi"><small>Пошук</small><input name="q" placeholder="Назва або село" value="${esc(st.q)}"></label>
<label class="afi"><small>Регіон</small><select name="region"><option value="">Усі</option>${regions.map(r=>`<option value="${esc(r.slug)}">${esc(r.name)}</option>`).join("")}</select></label>
<label class="afi"><small>Тип</small><select name="type"><option value="">Усі</option>${types.map(t=>`<option value="${esc(t)}">${esc(TY[t]||t)}</option>`).join("")}</select></label>
<label class="afi"><small>Гості</small><select name="guests"><option value="">Будь-яка</option>${[1,2,3,4,5,6,8,10].map(n=>`<option value="${n}">від ${n}</option>`).join("")}</select></label>
<label class="afi"><small>Заїзд</small><input type="date" name="in" min="${today}"></label><label class="afi"><small>Виїзд</small><input type="date" name="out" min="${today}"></label>
<label class="afi"><small>Ціна від, ₴</small><input type="number" name="min" min="0" step="100" placeholder="0"></label><label class="afi"><small>Ціна до, ₴</small><input type="number" name="max" min="0" step="100" placeholder="будь-яка"></label>
<label class="afi"><small>Сортування</small><select name="sort"><option value="recommended">Рекомендовані</option><option value="price_asc">Спершу дешевші</option><option value="price_desc">Спершу дорожчі</option><option value="rating">За рейтингом</option><option value="popular">Популярні</option></select></label>`;
Object.keys(keep).forEach(k=>{if(flt.elements[k])flt.elements[k].value=keep[k]});
flt.addEventListener("input",e=>{const n=e.target.name;if(!n)return;st[n]=e.target.value;if(n=="in"&&st.in){flt.elements.out.min=st.in;if(st.out&&st.out<=st.in){st.out="";flt.elements.out.value=""}}later()})}
const ftg=$("#ftg");ftg.onclick=()=>flt.classList.toggle("o");
function sync(){const n=["q","region","type","guests","min","max","in","out"].filter(k=>st[k]).length;$("#fcn").textContent=n?"("+n+")":"";const q=new URLSearchParams();Object.entries(st).forEach(([k,v])=>{if(v&&!(k=="sort"&&v=="recommended"))q.set(k,v)});history.replaceState(null,"",location.pathname+(q.toString()?"?"+q:""))}
const later=()=>{clearTimeout(timer);timer=setTimeout(()=>run(true),300)};
const card=(it,c)=>`<div class="cd" data-s="${esc(it.slug)}" style="--c:${c%4}"><div class="im" style="${it.cover?`background-image:url(${esc(it.cover)})`:""}"></div><div class="pr">${fmt(it.price_minor)}<em>/ніч</em></div><button class="hb${favs.has(it.slug)?" l":""}" type="button" aria-label="В обране">${heart}</button><button class="bi" type="button" aria-label="Забронювати">${cal}</button><div class="ci"><b>${esc(it.title)}</b><div>${esc(it.region)}<span class="kk">, Карпати · ${esc(TY[it.type]||it.type)}</span></div><div><span class="stars">★★★★★</span>${String(it.rating_avg).replace(".",",")}<span class="kk"> · до ${it.max_guests} гост.</span></div></div></div>`;
async function run(reset){const my=++seq;if(reset){offset=0;sync();if(!loaded)res.innerHTML='<div class="sk"></div>'.repeat(8)}
const q=new URLSearchParams();Object.entries(st).forEach(([k,v])=>{if(v)q.set(k,v)});q.set("limit",L);q.set("offset",offset);
let j;try{const r=await fetch("/api/properties?"+q);if(!r.ok)throw 0;j=await r.json()}catch(e){if(my==seq){cnt.textContent="";res.innerHTML='<div class="emp"><p>Не вдалося завантажити каталог. Запустіть проєкт через npm run dev або відкрийте розгорнуту версію.</p></div>'}return}
if(my!=seq)return;if(!loaded){loaded=true;form(j.regions,j.types)}
total=j.total;cnt.textContent=total?`Знайдено: ${total}`:"";
const html=j.items.map((it,k)=>card(it,k)).join("");
if(reset)res.innerHTML=html||'<div class="emp"><p>Нічого не знайдено. Спробуйте змінити фільтри.</p><button class="sa" id="rst">Скинути фільтри</button></div>';else res.insertAdjacentHTML("beforeend",html);
offset+=j.items.length;more.hidden=offset>=total;requestAnimationFrame(()=>res.querySelectorAll(".cd:not(.v)").forEach(e=>e.classList.add("v")));
const rs=$("#rst");if(rs)rs.onclick=()=>{Object.keys(st).forEach(k=>st[k]=k=="sort"?"recommended":"");flt.querySelectorAll("input,select").forEach(e=>e.value=e.name=="sort"?"recommended":"");run(true)}}
more.onclick=()=>run(false);
res.addEventListener("click",async e=>{const c=e.target.closest(".cd");if(!c)return;const s=c.dataset.s;
if(e.target.closest(".bi")){const q=new URLSearchParams({house:s});if(st.in&&st.out){q.set("in",st.in);q.set("out",st.out)}q.set("guests",st.guests||2);location.href="book.html?"+q;return}
const hb=e.target.closest(".hb");if(hb){if(!Auth.get()){Auth.open("in");return}const on=!favs.has(s);hb.classList.toggle("l",on);try{const r=await fetch("/api/favorites",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({slug:s,on})});if(!r.ok)throw 0;on?favs.add(s):favs.delete(s)}catch(x){hb.classList.toggle("l",!on)}return}
location.href="index.html#stay="+s});
Auth.on(async u=>{favs.clear();if(u){try{const r=await fetch("/api/favorites",{credentials:"same-origin"});if(r.ok)(await r.json()).favorites.forEach(f=>favs.add(f.slug))}catch(e){}}res.querySelectorAll(".cd").forEach(c=>{const h=c.querySelector(".hb");if(h)h.classList.toggle("l",favs.has(c.dataset.s))})});
run(true);
})();
