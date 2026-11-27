/* Відгуки на сторінці оселі: список + форма. Із акаунтом ім'я береться з акаунта, без акаунта його вводить гість. */
(()=>{
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const MON=["січ","лют","бер","кві","тра","чер","лип","сер","вер","жов","лис","гру"];
const fd=s=>{const d=new Date(s.replace(" ","T")+(/Z|\+/.test(s)?"":"Z"));return isNaN(d)?"":d.getDate()+" "+MON[d.getMonth()]+" "+d.getFullYear()};
const word=n=>n==1?"відгук":n>1&&n<5?"відгуки":"відгуків";
const EM={invalid_rating:"Оберіть оцінку",invalid_name:"Вкажіть ім'я (від 2 символів)",review_too_short:"Напишіть кілька слів про відпочинок (від 10 символів)",already_reviewed:"Ви вже залишали відгук про цю оселю",too_many_requests:"Забагато спроб. Зачекайте кілька хвилин",captcha_failed:"Не вдалося підтвердити, що ви не робот. Оновіть сторінку й спробуйте ще раз",captcha_unavailable:"Перевірка від ботів тимчасово недоступна. Спробуйте пізніше",too_fast:"Ви надто швидко відправили форму. Спробуйте ще раз",invalid_request:"Запит відхилено",network:"Сервер недоступний"};
const stars=n=>"★".repeat(n)+"☆".repeat(5-n);
window.mountReviews=async(box,slug)=>{
if(!box)return;let offset=0,total=0,rating=0;
box.innerHTML=`<h2 class="ser">Відгуки гостей</h2><div class="rvh" id="rvh"></div><div class="rvg"><div><div class="rvl" id="rvl"></div><div style="margin-top:16px"><button class="sa" id="rvm" hidden>Показати ще</button></div></div>
<form class="rvf" id="rvf" novalidate><h3>Залишити відгук</h3><p class="as2" id="rvw"></p><div class="rvz" id="rvz">${[1,2,3,4,5].map(i=>`<button type="button" data-v="${i}" aria-label="Оцінка ${i}">★</button>`).join("")}</div>
<label class="afi" id="rvn"><small>Ваше ім'я</small><input name="name" maxlength="60" autocomplete="name"></label><textarea name="body" maxlength="1000" placeholder="Розкажіть, як минув відпочинок"></textarea>
${Guard.hp()}<div class="cft" id="rvc"></div><div class="aer" id="rve2"></div><button class="apb">Опублікувати відгук</button><div class="rvok" id="rvk"></div></form></div>`;
const $=s=>box.querySelector(s),g=Guard.mount($("#rvc"));
function head(avg,n){$("#rvh").innerHTML=n?`<b>${String(avg).replace(".",",")}</b><span class="stars">${"★".repeat(Math.round(avg))}${"☆".repeat(5-Math.round(avg))}</span><span>${n} ${word(n)}</span>`:'<span>Ще немає відгуків. Станьте першим.</span>';if(window.showRating)showRating(avg,n)}
const item=r=>`<div class="rvi"><div class="top"><div class="av3">${esc((r.author||"Г")[0].toUpperCase())}</div><div><b>${esc(r.author)}</b><small>${fd(r.created_at)}</small></div><span class="stars">${stars(r.rating)}</span></div>${r.body?`<p>${esc(r.body)}</p>`:""}${r.verified?'<span class="vf">Підтверджене бронювання</span>':""}</div>`;
async function load(reset){if(reset)offset=0;let j;try{const r=await fetch(`/api/reviews?slug=${encodeURIComponent(slug)}&limit=5&offset=${offset}`,{credentials:"same-origin"});if(!r.ok)throw 0;j=await r.json()}catch(e){if(reset)$("#rvl").innerHTML='<div class="rve">Не вдалося завантажити відгуки.</div>';return}
total=j.total;head(j.avg,j.total);const l=$("#rvl");if(reset)l.innerHTML="";if(reset&&!j.reviews.length)l.innerHTML='<div class="rve">Відгуків про цю оселю ще немає.</div>';l.insertAdjacentHTML("beforeend",j.reviews.map(item).join(""));offset+=j.reviews.length;$("#rvm").hidden=offset>=total}
$("#rvm").onclick=()=>load(false);
$("#rvz").onclick=e=>{const b=e.target.closest("button");if(!b)return;rating=+b.dataset.v;$("#rvz").querySelectorAll("button").forEach(x=>x.classList.toggle("on",+x.dataset.v<=rating))};
function who(u){$("#rvn").hidden=!!u;$("#rvw").innerHTML=u?`Ви залишаєте відгук як <b>${esc(u.name)}</b>.`:"Можна без акаунта: просто вкажіть ім'я. Із акаунтом ім'я підставиться само.";}
Auth.on(who);who(Auth.get());
$("#rvf").addEventListener("submit",async e=>{e.preventDefault();const f=e.target,er=$("#rve2"),btn=f.querySelector(".apb");er.textContent="";$("#rvk").textContent="";
if(!rating){er.textContent=EM.invalid_rating;return}
btn.disabled=true;const x=await g.fields(f);let r,d={};try{const resp=await fetch("/api/reviews",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({slug,rating,body:f.elements.body.value,name:f.elements.name.value,...x})});d=await resp.json().catch(()=>({}));r=resp}catch(err){r={ok:false};d={error:"network"}}
g.reset();btn.disabled=false;if(!r.ok){er.textContent=EM[d.error]||"Щось пішло не так. Спробуйте ще раз.";return}
f.elements.body.value="";rating=0;$("#rvz").querySelectorAll("button").forEach(z=>z.classList.remove("on"));$("#rvk").textContent=d.verified?"Дякуємо! Відгук опубліковано з позначкою підтвердженого бронювання.":"Дякуємо! Ваш відгук опубліковано.";await load(true)});
load(true);
};
})();
