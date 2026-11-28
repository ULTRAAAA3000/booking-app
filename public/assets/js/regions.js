/* Куди поїхати: напрямки з описами й фільтром за інтересами. Фото, кількість осель і ціна «від» беруться з каталогу (/api/properties). */
(()=>{
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const FL={ski:"Лижі",hike:"Походи",water:"Озера й водоспади",culture:"Ремесла й культура"};
const R=[
{s:"verkhovyna",n:"Верховина",t:["culture"],w:"Цілий рік",d:"Серце Гуцульщини над Черемошем: дерев'яна архітектура, традиції й спокійний ритм без курортного натовпу.",l:["Дерев'яна гуцульська архітектура","Долина річки Черемош","Тиша без курортного натовпу"]},
{s:"kosiv",n:"Косів",t:["culture"],w:"Цілий рік",d:"Місто гуцульських ремесел: кераміка, різьба й ткацтво, а ще відомий ярмарок майстрів.",l:["Кераміка, різьба й ткацтво","Ярмарок майстрів","Сувеніри ручної роботи"]},
{s:"vorokhta",n:"Ворохта",t:["hike"],w:"Літо й рання осінь: маршрути на Говерлу",d:"Зручна база для походів на Говерлу, найвищу вершину України (2061 м). Є залізнична станція.",l:["Походи на Говерлу (2061 м)","Залізнична станція","База для гірських маршрутів"]},
{s:"yaremche",n:"Яремче",t:["water"],w:"Цілий рік",d:"Водоспад Пробій, сувенірний ринок і прогулянки вздовж Пруту. Легко дістатися поїздом чи автобусом.",l:["Водоспад Пробій","Сувенірний ринок","Прогулянки вздовж Пруту"]},
{s:"bukovel",n:"Буковель",t:["ski","hike"],w:"Зима: лижі й сноуборд. Літо: велосипеди та маршрути",d:"Найбільший гірськолижний курорт України: узимку траси й підйомники, влітку велосипеди та маршрути.",l:["Найбільший гірськолижний курорт України","Траси й підйомники взимку","Велосипеди й маршрути влітку"]},
{s:"rakhiv",n:"Рахів",t:["hike","culture"],w:"Літо: походи Чорногорою",d:"Закарпатське місто біля Чорногори. Поруч Ясіня та Ділове, де позначено географічний центр Європи.",l:["Чорногора поруч","Ясіня й Ділове","Знак географічного центру Європи"]},
{s:"mizhhirya",n:"Міжгір'я",t:["water","hike"],w:"Літо й осінь",d:"Озеро Синевир, найбільше озеро Українських Карпат, і однойменний національний парк.",l:["Озеро Синевир","Національний парк «Синевир»","Найбільше озеро Українських Карпат"]},
{s:"slavske",n:"Славське",t:["ski"],w:"Зима: траси й підйомники",d:"Гірськолижний курорт біля гори Тростян: траси різної складності та підйомники.",l:["Гора Тростян","Траси різної складності","Підйомники"]}];
const fmt=m=>(m/100).toLocaleString("uk-UA")+" ₴",plural=m=>m+(m==1?" оселя":m<5?" оселі":" осель");
let data=null,f=location.hash.slice(1);if(!FL[f])f="";
const card=(r,i)=>{const m=data&&(data[r.s]||{c:0}),has=!m||m.c>0;
return `<article class="rgc" style="--n:${i}"><div class="im"${m&&m.cover?` style="background-image:url(${esc(m.cover)})"`:""}>${m?`<em>${m.c?plural(m.c):"Скоро"}</em>`:""}</div><div class="bd"><h2>${esc(r.n)}</h2><p>${esc(r.d)}</p><ul>${r.l.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><div class="wh"><b>Коли їхати:</b> ${esc(r.w)}</div>
<div class="ft">${m&&m.c?`<span>від <b>${fmt(m.min)}</b> / ніч</span>`:"<span></span>"}${has?`<a class="go" href="stays.html?region=${esc(r.s)}">Дивитись оселі</a>`:`<span>Оселі з'являться скоро</span>`}</div></div></article>`};
function paint(){const list=R.filter(r=>!f||r.t.includes(f));
$("#rch").innerHTML=[["","Усі напрямки"],...Object.entries(FL)].map(([k,v])=>`<button type="button" data-f="${k}" class="${k==f?"a":""}" aria-pressed="${k==f}">${v}</button>`).join("");
$("#rcn").textContent="Показано "+list.length+" з "+R.length;
$("#rgr").innerHTML=list.map(card).join("")}
$("#rch").addEventListener("click",e=>{const b=e.target.closest("[data-f]");if(!b)return;f=b.dataset.f;history.replaceState(null,"",location.pathname+(f?"#"+f:""));paint()});
paint();
fetch("/api/properties?limit=48").then(r=>r.ok?r.json():null).then(j=>{if(!j)return;data={};j.items.forEach(it=>{const d=data[it.region_slug]||(data[it.region_slug]={c:0,min:Infinity,cover:""});d.c++;d.min=Math.min(d.min,it.price_minor);if(!d.cover&&it.cover)d.cover=it.cover});paint()}).catch(()=>{});
})();
