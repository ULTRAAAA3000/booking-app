/* ===== ФОТО: впишіть сюди шляхи/URL 4K-фото Карпат. Поки порожньо — генеруються заглушки-пейзажі ===== */
const PHOTOS={hero:["assets/img/hero-1.jpg", "assets/img/hero-2.jpg", "assets/img/hero-3.jpg"],thumbs:["assets/img/thumb-1.jpg", "assets/img/thumb-2.jpg", "assets/img/thumb-3.jpg"],cards:["https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261115_005347_d7535a9a-29c3-4714-9c2a-4b8934ed1df2.png&w=700&q=85", "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261115_005405_6867b7fa-e6ec-4c5c-a810-aea29a94cce4.png&w=700&q=85", "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261115_005408_78f07613-5823-4ef1-94a9-cbf8977e5c38.png&w=700&q=85", "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261115_005408_816e6775-3733-4270-8e1f-bbf270fe3fff.png&w=700&q=85", "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261115_005408_bf9bfa74-cb9c-4055-a632-b725670fdc9d.png&w=700&q=85", "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261115_005413_84e12590-d5b2-4676-9600-c31c6cd0b0f4.png&w=700&q=85", "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261115_005414_da006178-018e-4ed8-b340-f6a70f18f1bc.png&w=700&q=85", "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261115_005417_3c7632ad-341c-4e40-b370-db3c3aaf479e.png&w=700&q=85"],interior:["https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261115_005420_531ca3bc-da2a-48a8-9506-30b46f6725a5.png&w=500&q=85"]};
/* ================================================================================================= */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const PAL=[["#f6b48f","#f9d9c3","#b98aa0","#8a6a8c","#4f5f6e","#2c3f3a"],["#bcc7d6","#e8e2e0","#9aa9bd","#6f8196","#46606a","#27403a"],["#8fb4d0","#f2e3d3","#7d9db0","#4f7a78","#2f5e4e","#1d3b2e"],["#e9a68a","#f6d0b0","#a8798c","#6d5a78","#3f4f62","#25353a"],["#a9c3d6","#e6ece9","#86a6b4","#5d8584","#3a6652","#21402f"]];
function scene(seed,pi){const p=PAL[pi%PAL.length];let s=seed*9301+49297;const r=()=>(s=(s*9301+49297)%233280)/233280;
const W=1600,H=1000;let o=`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${p[0]}'/><stop offset='1' stop-color='${p[1]}'/></linearGradient><linearGradient id='f' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff' stop-opacity='.5'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></linearGradient></defs><rect width='${W}' height='${H}' fill='url(#g)'/><circle cx='${300+r()*1000}' cy='${300+r()*100}' r='${70+r()*40}' fill='#fff7ec' opacity='.75'/>`;
[[520,150,p[2]],[620,170,p[3]],[740,130,p[4]],[860,90,p[5]]].forEach(([y,a,c],k)=>{const f=.004+r()*.004,ph=r()*9;let d=`M0 ${H}`;for(let x=0;x<=W;x+=40)d+=`L${x} ${y-Math.abs(Math.sin(x*f+ph))*a-r()*a*.25}`;o+=`<path d='${d}L${W} ${H}Z' fill='${c}'/>`;if(k<3)o+=`<rect y='${y-a}' width='${W}' height='${a*1.4}' fill='url(#f)' opacity='.35'/>`});
for(let i=0;i<46;i++){const x=r()*W,h=40+r()*70,y=880+r()*110;o+=`<path d='M${x} ${y}l${-h*.2} ${h*.9}h${h*.4}z M${x} ${y-h*.45}l${-h*.24} ${h*.8}h${h*.48}z' fill='${p[5]}'/>`}
return"data:image/svg+xml,"+encodeURIComponent(o+"</svg>").replace(/[()']/g,c=>"%"+c.charCodeAt(0).toString(16))}
const img=(k,i,seed,pi)=>PHOTOS[k]&&PHOTOS[k][i]||scene(seed,pi);
const bg=u=>`background-image:url(${u})`;
const SL=[{t:["ЛАСКАВО ПРОСИМО","В КАРПАТИ"],cl:"",pos:"center 62%",th:2,h:"Відкрий Карпати",d:"Найкращі оселі та місця відпочинку в Карпатах. Знайдіть ту, що підійде вам і вашій родині"},
{t:["ЗНАЙДИ СВІЙ","ДІМ У ГОРАХ"],cl:"",pos:"center 55%",th:1,h:"Де зупинитись",d:"Дерев'яні ґражди, затишні шале та тихі садиби серед смерек — підібрані для вас"},
{t:["ВІДКРИЙ","КАРПАТИ"],cl:"l3",pos:"center 40%",th:0,h:"Куди поїхати",d:"Полонини, озера та водоспади Карпат"}];
const TH=[{s:11,p:3},{s:12,p:4},{s:13,p:2}];
const H=[["Ґражда над Черемошем","Верховина","5 200"],["Хата гуцула","Косів","3 400"],["Шале «Говерла»","Ворохта","6 800"],["Лісова колиба","Яремче","2 100"],["Котедж «Смерека»","Буковель","4 600"],["Полонинська садиба","Рахів","2 900"],["Вілла «Синевир»","Міжгір'я","7 500"],["Карпатська веранда","Славське","3 800"]];
const MON=["січ","лют","бер","кві","тра","чер","лип","сер","вер","жов","лис","гру"],MF=["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];
const SLUGS=["grazhda-nad-cheremoshem","khata-hutsula","shale-hoverla","lisova-koliba","kotedzh-smereka","polonynska-sadyba","vila-synevyr","karpatska-veranda"];
const ymd=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const bookUrl=(i,a,b,g)=>"book.html?house="+SLUGS[i]+(a&&b?"&in="+ymd(a)+"&out="+ymd(b):"")+"&guests="+g;
const favs=new Set();
const markFavs=()=>document.querySelectorAll(".cd").forEach(c=>{const h=c.querySelector(".hb");if(h)h.classList.toggle("l",favs.has(SLUGS[+c.dataset.i]))});
async function favToggle(btn,i){if(!window.Auth||!Auth.get()){window.Auth&&Auth.open("in");return}const on=!favs.has(SLUGS[i]);btn.classList.toggle("l",on);
try{const r=await fetch("/api/favorites",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({slug:SLUGS[i],on})});if(!r.ok)throw 0;on?favs.add(SLUGS[i]):favs.delete(SLUGS[i])}catch(e){btn.classList.toggle("l",!on)}}
async function favSync(u){favs.clear();if(u){try{const r=await fetch("/api/favorites",{credentials:"same-origin"});if(r.ok)(await r.json()).favorites.forEach(f=>favs.add(f.slug))}catch(e){}}markFavs()}
addEventListener("auth:change",e=>favSync(e.detail));
const heart='<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.5-8 11-8 11z"/></svg>';
let cur=0,busy=false,timer;
/* hero build */
$("#stack").innerHTML=SL.map((s,i)=>`<div class="sl ${i?'':'on kb'}"><div class="ph" style="${bg(img('hero',i,i+3,[0,1,3][i]))};background-position:${s.pos}"></div><div class="tint"></div><h1 class="t ${s.cl}">${s.t.map((l,j)=>l.split(" ").map((w,k)=>`<span class="w"><i style="--i:${j*3+k}">${w}</i></span>`).join("")+(j<s.t.length-1&&i!=0&&i!=1?"<br>":"<br>")).join("")}</h1></div>`).join("");
$("#rail").innerHTML=TH.map((t,i)=>`<div class="th" data-i="${i}" style="--i:${i};${bg(img('thumbs',i,t.s,t.p))}"></div>`).join("")+'<div class="rg" id="r1"></div><div class="rg" id="r2"></div><div class="cn" id="cn"></div><div id="cap"><div class="br"></div><div class="tx"><h3></h3><p></p></div></div><div class="ctl"><button class="ct" aria-label="Назад" onclick="nx(-1)">‹</button><div class="dts">'+[0,1,2].map(i=>`<button class="dt${i?"":" a"}" aria-label="Слайд ${i+1}" onclick="go(${i})"></button>`).join("")+'</div><button class="ct" aria-label="Далі" onclick="nx(1)">›</button></div>';
function lay(){const vw=innerWidth,hh=$("#hero").offsetHeight,cx=.855*vw,a=Math.min(190,Math.max(96,.113*vw)),n=Math.min(92,Math.max(46,.054*vw)),g=Math.max(8,.009*vw);let y=74+.085*hh,ac=SL[cur].th,cy=0,al=0;
$$(".th").forEach((e,i)=>{const sz=i==ac?a:n;e.style.cssText+=`;left:${cx-sz/2}px;top:${y}px;width:${sz}px;height:${sz}px`;e.classList.toggle("a",i==ac);if(i==ac){cy=y+sz/2;al=cx-sz/2}y+=sz+g});
[[5,"#r1"],[10.8,"#r2"]].forEach(([k,id])=>{const r=a/2+k/100*vw,e=$(id);e.style.cssText=`left:${cx-r}px;top:${cy-r}px;width:${2*r}px;height:${2*r}px`});
const cw=Math.max(40,.047*vw),cl=al-.008*vw-cw;$("#cn").style.cssText=`left:${cl}px;top:${cy-1.5}px;width:${cw}px`;
const c=$("#cap");c.style.top=cy+"px";c.style.right=Math.max(16,vw-cl+14)+"px";c.querySelector(".br").style.height=Math.max(84,.065*vw)+"px"}
function cap(){const s=SL[cur];$("#cap h3").textContent=s.h;$("#cap p").textContent=s.d;$("#rail").classList.remove("hide")}
$$(".th").forEach(e=>e.onclick=()=>go(2-e.dataset.i));
function go(n){n=+n;if(busy||n==cur)return;busy=true;clearInterval(timer);const old=$$(".sl")[cur],nw=$$(".sl")[n],op=old.querySelector(".ph"),np=nw.querySelector(".ph"),m=$("#mist"),vw=innerWidth;
$("#rail").classList.add("hide");cur=n;dots();lay();setTimeout(cap,650);old.classList.remove("kb");nw.style.zIndex=2;nw.style.opacity=1;const t0=performance.now();
(function f(now){let t=Math.min(1,(now-t0)/1250),e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;const a=e*135-35,b=e*135,mk=`linear-gradient(to left,#000 ${a}%,rgba(0,0,0,.6) ${(a+b)/2}%,transparent ${b}%)`;
nw.style.webkitMaskImage=nw.style.maskImage=mk;
m.style.left=(vw*(1-(a+b)/200)-.17*vw)+"px";m.style.opacity=Math.min(.95,Math.sin(Math.PI*t));
if(t<1)requestAnimationFrame(f);else{nw.style.webkitMaskImage=nw.style.maskImage="";nw.style.zIndex="";old.style.opacity=0;old.classList.remove("on");nw.classList.add("on","kb");m.style.opacity=0;busy=false;auto()}})(t0)}
function auto(){clearInterval(timer);timer=setInterval(()=>{if(!$("#det").classList.contains("o"))go((cur+1)%3)},5200)}
function dots(){$$('.dt').forEach((d,i)=>d.classList.toggle('a',i==cur))}
const nx=k=>go((cur+k+3)%3);
addEventListener('keydown',e=>{if($('#det').classList.contains('o'))return;if(e.key=='ArrowRight')nx(1);if(e.key=='ArrowLeft')nx(-1)});
let tx=0;$('#hero').addEventListener('touchstart',e=>tx=e.touches[0].clientX,{passive:true});$('#hero').addEventListener('touchend',e=>{const d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>50)nx(d<0?1:-1)});
/* scroll */
function sc(){const y=scrollY,vh=innerHeight;$("#stack").style.transform=`translateY(${.42*y}px)`;$("#bank").style.transform=`translateY(${-.38*y}px) scale(${1+.35*y/vh})`;
$("#tc").style.opacity=Math.min(1,y/(.45*vh));$("#tc").style.translate=`0 ${-y*.2}px`;const r=$("#rail");r.style.transform=`translateY(${.2*y}px)`;r.style.opacity=Math.max(0,1-y/(.5*vh));
$("#nav").classList.toggle("s",y>.3*vh||$("#det").classList.contains("o"))}
addEventListener("scroll",sc);addEventListener("resize",lay);$("#det").addEventListener("scroll",()=>{});
/* search */
let ci=null,co=null,ad=2,kd=0,vm=new Date(2026,11,1),step=0;
const fm=d=>d.getDate()+" "+MON[d.getMonth()];
function calR(){const f=(new Date(vm.getFullYear(),vm.getMonth(),1).getDay()+6)%7,dm=new Date(vm.getFullYear(),vm.getMonth()+1,0).getDate(),t=new Date(2026,10,24);
let h=`<div class="ch"><button onclick="mv(-1)">‹</button>${MF[vm.getMonth()]} ${vm.getFullYear()}<button onclick="mv(1)">›</button></div><div class="g">${["Пн","Вт","Ср","Чт","Пт","Сб","Нд"].map(x=>`<small>${x}</small>`).join("")}`+"<span></span>".repeat(f);
for(let i=1;i<=dm;i++){const d=new Date(vm.getFullYear(),vm.getMonth(),i),dis=(step==1&&ci&&d<=ci)||d<t,e=(ci&&+d==+ci)||(co&&+d==+co),r=ci&&co&&d>ci&&d<co;h+=`<button class="dy ${e?'e':''} ${r?'r':''}" ${dis?'disabled':''} onclick="pk(${+d})">${i}</button>`}
$("#cal").innerHTML=h+"</div>"}
function mv(k){vm=new Date(vm.getFullYear(),vm.getMonth()+k,1);calR()}
function pk(t){const d=new Date(t);if(step==0||!ci||d<=ci){ci=d;co=null;step=1;$("#fo").classList.add("a");$("#fi").classList.remove("a")}else{co=d;step=0;$("#so").textContent=fm(co);opn("gp")}
$("#si").textContent=fm(ci);if(!co)$("#so").textContent="Додати дату";calR()}
function gR(){const row=(n,s,k,v)=>`<div class="row"><div>${n}<small>${s}</small></div><div class="st"><button onclick="gc('${k}',-1)">−</button><b>${v}</b><button onclick="gc('${k}',1)">+</button></div></div>`;
$("#gp").innerHTML=row("Дорослі","13+","a",ad)+row("Діти","2–12","k",kd);const n=ad+kd;$("#sg").textContent=n+(n==1?" гість":n<5?" гості":" гостей")}
function gc(k,v){if(k=="a")ad=Math.max(1,Math.min(12,ad+v));else kd=Math.max(0,Math.min(8,kd+v));gR()}
function opn(id){$$(".pop").forEach(p=>p.classList.toggle("o",p.id==id));if(id=="cal")calR();if(id=="gp"){const g=$$(".f")[3];$$(".f").forEach(f=>f.classList.remove("a"));g.classList.add("a")}}
$$(".f").forEach(f=>f.onclick=e=>{e.stopPropagation();$$(".f").forEach(x=>x.classList.remove("a"));f.classList.add("a");if(f.dataset.p)opn(f.dataset.p);else $$(".pop").forEach(p=>p.classList.remove("o"))});
$$(".pop").forEach(p=>p.onclick=e=>e.stopPropagation());addEventListener("click",()=>$$(".pop").forEach(p=>p.classList.remove("o")));
$("#go").onclick=()=>{const q=new URLSearchParams();if(ci&&co){q.set("in",ymd(ci));q.set("out",ymd(co))}q.set("guests",ad+kd);location.href="stays.html?"+q};gR();
/* cards */
const card=(i,c,sim)=>{const h=H[i];return`<div class="cd" data-i="${i}" style="--c:${c}"><div class="im" style="${bg(img('cards',i,i*7+5,i))}"></div><div class="pr">${h[2]} ₴<em>/ніч</em></div><button class="hb">${heart}</button><button class="bi" aria-label="Забронювати"><svg class="ic" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4M9.5 15l2 2 3.5-4"/></svg></button><div class="ci"><b>${h[0]}</b><div><svg class="ic" viewBox="0 0 24 24" style="width:12px"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/></svg>${h[1]}<span class="kk">, Карпати</span></div><div>${rt(i)}</div></div></div>`};
function bindCards(root){root.querySelectorAll(".cd").forEach(c=>{c.onclick=e=>{if(e.target.closest(".bi")){e.stopPropagation();location.href=bookUrl(+c.dataset.i,ci,co,ad+kd);return}if(e.target.closest(".hb")){e.stopPropagation();favToggle(e.target.closest(".hb"),+c.dataset.i);return}openD(+c.dataset.i,c)}});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("v");io.unobserve(e.target)}}),{threshold:.15});root.querySelectorAll(".cd").forEach(c=>io.observe(c))}
const D=[];const rt=i=>D[i]&&D[i].rating_count?'<span class="stars">★★★★★</span>'+String(D[i].rating_avg).replace(".",","):(D[i]?"Ще без відгуків":"");
$("#gd").innerHTML=H.map((_,i)=>card(i,i%4)).join("");bindCards($("#gd"));
(async()=>{try{const r=await fetch("/api/properties?limit=24");if(!r.ok)throw 0;const j=await r.json();if(!j.items||!j.items.length)throw 0;
const same=j.items.length==SLUGS.length&&j.items.every((it,k)=>it.slug==SLUGS[k]&&it.cover==PHOTOS.cards[k]);D.length=0;j.items.forEach(it=>D.push(it));
if(!same){H.length=0;SLUGS.length=0;PHOTOS.cards=[];j.items.forEach(it=>{H.push([it.title,it.region,Math.round(it.price_minor/100).toLocaleString("uk-UA")]);SLUGS.push(it.slug);PHOTOS.cards.push(it.cover)});$("#gd").innerHTML=H.slice(0,8).map((_,k)=>card(k,k%4)).join("");bindCards($("#gd"));markFavs()}else{document.querySelectorAll("#gd .cd").forEach(c=>{const x=c.querySelector(".ci > div:last-child");if(x)x.innerHTML=rt(+c.dataset.i)})}}catch(e){}openHash()})();
/* detail */
const ics={"Wi-Fi":'<path d="M3 9a14 14 0 0 1 18 0M6 12.5a9 9 0 0 1 12 0M9 16a4 4 0 0 1 6 0"/><circle cx="12" cy="19" r=".8"/>',"Міні-бар":'<path d="M8 3h8l-1 7a3 3 0 0 1-6 0zM12 13v8M8 21h8"/>',"Власна купіль":'<path d="M3 12h18v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM6 12V6a2 2 0 0 1 4 0"/>',"Суперхост":'<path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.4l6-.9z"/>',"Кінозал":'<rect x="3" y="5" width="18" height="13" rx="2"/><path d="m10 9 5 3-5 3z"/>',"Сервіс у номер":'<path d="M3 17h18M5 17a7 7 0 0 1 14 0M12 8V6"/>'};
function openD(i,from){const h=H[i],d=$("#det"),w=$("#dw"),r=from&&!d.classList.contains("o")?from.querySelector(".im").getBoundingClientRect():null,pc=(k)=>`${bg(img('cards',i,i*7+5,i))}`;
const fd=x=>x.getDate()+" "+MON[x.getMonth()]+" "+x.getFullYear();let gs=ad+kd,dci=ci,dco=co;
w.innerHTML=`<div class="bc rs" style="--k:0"><a href="#" onclick="home();return false">Головна</a> › Типи осель › Садиби › <span>${h[0]}, ${h[1]}</span></div><div class="cols"><div><div id="mi" style="${r?'visibility:hidden':''}"><div class="mm"></div><button class="gn p" aria-label="Назад" onclick="gs(-1)">‹</button><button class="gn n" aria-label="Далі" onclick="gs(1)">›</button><button class="hb">${heart}</button></div><div class="tm rs" style="--k:2" id="tm"></div></div>
<div><h1 class="ser dn rs" style="--k:1">${h[0]}</h1><h3 class="ser rs" style="--k:3">Про оселю «${h[0]}»</h3>
<p class="ab rs" id="dab" style="--k:3">Затишна оселя в мальовничому куточку: ${h[1]}. Неподалік — полонини, гірські потічки та стежки до водоспадів. Вечорами — тераса з видом на смереки, піч, дерев'яні балки та гуцульські ліжники. До найближчого лісу — п'ять хвилин пішки.</p>
<div class="bk rs" style="--k:4"><div class="p">${h[2]} ₴<small>/ніч</small></div><div class="dg"><button type="button" id="dgi"><b>Заїзд</b><span>Додати дату</span></button><button type="button" id="dgo"><b>Виїзд</b><span>Додати дату</span></button></div><div class="pop" id="dcal"></div><div class="dsm" id="dsm"></div><div class="gr">Гості<div class="st"><button onclick="bg2(-1)">−</button><b id="bgn">${gs}</b><button onclick="bg2(1)">+</button></div></div><button id="bn">Забронювати</button></div>
<div class="rt rs" style="--k:5"><b id="drt" style="font-size:20px">—</b><span id="drc" style="color:var(--lm)"></span><span class="stars" id="drs" hidden>★★★★★</span><button class="rn" id="drgo">Залишити відгук</button></div>
<div class="rs" style="--k:6"><h3 class="ser" style="margin-top:22px">Зручності</h3><div class="am" id="dam">${Object.entries(ics).map(([n,p])=>`<div><svg class="ic" viewBox="0 0 24 24">${p}</svg>${n}</div>`).join("")}</div></div></div></div>
<div class="rvs rs" style="--k:7" id="drv"></div>
<div class="sim rs" style="--k:7"><h2 class="ser">Схожі оселі</h2><div class="grid" id="sg2">${[1,2,3,4].map((k,c)=>card((i+k)%H.length,c)).join("")}</div></div>`;
bindCards($("#sg2"));markFavs();
const G=[img('cards',i,i*7+5,i),...[0,1,2].map(k=>img('interior',k,i*3+k+40,i+k+1))];let gi=0;const mm=$("#mi .mm");
const tms=()=>{$("#tm").innerHTML=[0,1,2,3].filter(k=>k!=gi).map((k,j)=>`<div class="${j==2?'m':''}" style="${bg(G[k])}" onclick="sel(${k})"></div>`).join("")};
window.sel=n=>{if(n==gi)return;gi=n;mm.style.opacity=0;setTimeout(()=>{mm.style.backgroundImage=`url(${G[gi]})`;mm.style.opacity=1;tms()},170)};
window.gs=d=>sel((gi+d+4)%4);mm.style.backgroundImage=`url(${G[0]})`;tms();let maxg=D[i]?D[i].max_guests:12,busy=[],dstep=dci&&!dco?1:0;const nowd=new Date(),dtd=new Date(nowd.getFullYear(),nowd.getMonth(),nowd.getDate());let dvm=new Date((dci||dtd).getFullYear(),(dci||dtd).getMonth(),1);
const dcal=$("#dcal"),price=()=>D[i]?D[i].price_minor:parseInt(h[2].replace(/\D/g,""))*100,isBusy=x=>{const k=ymd(x);return busy.some(r=>r[0]<=k&&k<r[1])},hit=(x,y)=>busy.some(r=>r[0]<ymd(y)&&r[1]>ymd(x)),uah=m=>(m/100).toLocaleString("uk-UA")+" ₴";
function dsum(){const n=dci&&dco?Math.round((dco-dci)/864e5):0;$("#dsm").innerHTML=n?`<div class="r"><span>${uah(price())} × ${n} ноч.</span><b>${uah(price()*n)}</b></div>`:"";
$("#dgi span").textContent=dci?fd(dci):"Додати дату";$("#dgo span").textContent=dco?fd(dco):"Додати дату";ci=dci;co=dco;if($("#si")){$("#si").textContent=dci?fm(dci):"Додати дату";$("#so").textContent=dco?fm(dco):"Додати дату"}}
function dcR(){const f=(new Date(dvm.getFullYear(),dvm.getMonth(),1).getDay()+6)%7,dm=new Date(dvm.getFullYear(),dvm.getMonth()+1,0).getDate();
let t=`<div class="ch"><button type="button" onclick="dmv(-1)">‹</button>${MF[dvm.getMonth()]} ${dvm.getFullYear()}<button type="button" onclick="dmv(1)">›</button></div><div class="g">${["Пн","Вт","Ср","Чт","Пт","Сб","Нд"].map(x=>`<small>${x}</small>`).join("")}`+"<span></span>".repeat(f);
for(let n=1;n<=dm;n++){const x=new Date(dvm.getFullYear(),dvm.getMonth(),n),dis=x<dtd||isBusy(x)||(dstep==1&&dci&&x<=dci),e=(dci&&+x==+dci)||(dco&&+x==+dco),r=dci&&dco&&x>dci&&x<dco;t+=`<button type="button" class="dy ${e?"e":""} ${r?"r":""}" ${dis?"disabled":""} onclick="dpk(${+x})">${n}</button>`}dcal.innerHTML=t+"</div>"}
window.dmv=k=>{dvm=new Date(dvm.getFullYear(),dvm.getMonth()+k,1);dcR()};
window.dpk=t=>{const x=new Date(t);if(dstep==0||!dci||x<=dci||hit(dci,x)){dci=x;dco=null;dstep=1}else{dco=x;dstep=0;dcal.classList.remove("o")}dsum();dcR()};
$("#dgi").onclick=e=>{e.stopPropagation();dstep=0;dcal.classList.add("o");dcR()};$("#dgo").onclick=e=>{e.stopPropagation();dstep=dci?1:0;dcal.classList.add("o");dcR()};
d.onclick=ev=>{if(!ev.target.closest("#dcal,#dgi,#dgo"))dcal.classList.remove("o")};
$("#bn").onclick=()=>{if(!dci||!dco){dstep=dci?1:0;dcal.classList.add("o");dcR();return}location.href=bookUrl(i,dci,dco,gs)};
window.bg2=v=>{gs=Math.max(1,Math.min(maxg,gs+v));$("#bgn").textContent=gs};dsum();
window.mountReviews&&mountReviews($("#drv"),SLUGS[i]);$("#drgo").onclick=()=>$("#drv").scrollIntoView({behavior:"smooth",block:"start"});
fetch("/api/availability?busy=1&slug="+SLUGS[i],{credentials:"same-origin"}).then(r=>r.ok?r.json():null).then(j=>{if(!j||!j.busy)return;busy=j.busy.map(x=>[x.from,x.to]);if(dci&&dco&&hit(dci,dco)){dci=dco=null;dsum();$("#dsm").innerHTML='<div class="r" style="color:#d23b4d">Обрані дати вже зайняті, оберіть інші</div>'}if(dcal.classList.contains("o"))dcR()}).catch(()=>{});
fetch("/api/properties/"+SLUGS[i]).then(r=>r.ok?r.json():null).then(j=>{if(!j)return;const p=j.property;if(p.description)$("#dab").textContent=p.description;showRating(p.rating_avg,p.rating_count);maxg=p.max_guests;if(gs>maxg){gs=maxg;$("#bgn").textContent=gs}
(j.photos||[]).slice(1,4).forEach((ph,k)=>{if(ph.url)G[k+1]=ph.url});tms();if(j.amenities&&j.amenities.length)$("#dam").innerHTML=j.amenities.map(n=>`<div><svg class="ic" viewBox="0 0 24 24">${ics[n]||""}</svg>${n}</div>`).join("")}).catch(()=>{});
history.replaceState(null,"","#stay="+SLUGS[i]);
d.scrollTop=0;requestAnimationFrame(()=>{d.classList.add("o");$("#nav").classList.add("s");if(!r)return;
const mi=$("#mi").getBoundingClientRect(),f=$("#fl");f.style.cssText=`display:block;${pc()};left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:12px`;
const t0=performance.now();(function s(n){let t=Math.min(1,(n-t0)/900),e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,L=x=>r[x]+(mi[x]-r[x])*e;
f.style.left=L("left")+"px";f.style.top=L("top")+"px";f.style.width=L("width")+"px";f.style.height=L("height")+"px";f.style.borderRadius=(12-2*e)+"px";
if(t<1)requestAnimationFrame(s);else{$("#mi").style.visibility="visible";f.style.display="none"}})(t0)})}
function home(){$("#det").classList.remove("o");sc();scrollTo({top:0});history.replaceState(null,"",location.pathname+location.search)}
function showRating(avg,n){const t=document.querySelector("#drt"),c=document.querySelector("#drc"),z=document.querySelector("#drs");if(!t)return;t.textContent=n?String(avg).replace(".",","):"—";c.textContent=n?"("+n+" "+(n==1?"відгук":n<5?"відгуки":"відгуків")+")":"Ще немає відгуків";if(z)z.hidden=!n}
function openHash(){const m=location.hash.match(/^#stay=([\w-]+)/);if(!m)return;const i=SLUGS.indexOf(m[1]);if(i>=0)openD(i)}
addEventListener("hashchange",()=>{if(/^#stay=/.test(location.hash))openHash();else if($("#det").classList.contains("o"))home()});

/* intro */
setTimeout(()=>{document.body.classList.add("in");lay();setTimeout(cap,900);setTimeout(()=>document.body.classList.add("ready"),1800);auto()},250);
lay();sc();
