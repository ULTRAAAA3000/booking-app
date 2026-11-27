/* Акаунт: реальний вхід через /api/auth (e-mail + пароль). Соцмережі й вхід за посиланням — підключимо пізніше. */
(()=>{
const q=s=>document.querySelector(s),SOC=[["Google","G","#ea4335"],["Telegram","T","#27a7e7"]];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const MON=["січ","лют","бер","кві","тра","чер","лип","сер","вер","жов","лис","гру"];
const fd=s=>{const d=new Date(s+"T00:00:00");return d.getDate()+" "+MON[d.getMonth()]+" "+d.getFullYear()};
const fmt=m=>(m/100).toLocaleString("uk-UA")+" ₴";
const EM={invalid_credentials:"Невірний e-mail або пароль",email_taken:"Такий e-mail уже зареєстровано",invalid_email:"Введіть коректний e-mail",invalid_password:"Пароль має містити від 8 символів",invalid_name:"Вкажіть ім'я",captcha_failed:"Не вдалося підтвердити, що ви не робот. Оновіть сторінку й спробуйте ще раз",captcha_unavailable:"Перевірка від ботів тимчасово недоступна. Спробуйте пізніше",too_many_requests:"Забагато спроб. Зачекайте кілька хвилин",too_fast:"Ви надто швидко відправили форму. Спробуйте ще раз",invalid_request:"Запит відхилено",network:"Сервер недоступний. Запустіть проєкт через npm run dev або відкрийте розгорнуту версію.",server_misconfigured:"Сервер ще не налаштований (база або SESSION_SECRET)"};
const api=async(p,body)=>{try{const r=await fetch("/api/"+p,{method:body?"POST":"GET",credentials:"same-origin",headers:{"content-type":"application/json"},body:body?JSON.stringify(body):undefined});const d=await r.json().catch(()=>({}));return{ok:r.ok,...d}}catch(e){return{ok:false,error:"network"}}};
let user=null,loaded=false,view="in";const subs=[];
document.body.insertAdjacentHTML("beforeend",'<div class="au" id="au"><div class="ac" role="dialog" aria-modal="true" aria-label="Вхід"><button class="ax" aria-label="Закрити">×</button><div id="ab"></div></div></div><aside class="ad" id="ad" aria-label="Акаунт"><button class="ax" aria-label="Закрити">×</button><div id="adb" style="display:contents"></div></aside>');
const base=q("#stays")?"":"index.html";
const LINKS=[["Оселі","stays.html"],["Куди поїхати",base+"#regions"],["Як це працює",base+"#how"],["Запитання",base+"#faq"]];
document.body.insertAdjacentHTML("beforeend",'<div class="mnu" id="mnu" aria-hidden="true"><div class="mnh"><a class="logo" href="'+(base||"#")+'">BookingApp</a><button class="ax" aria-label="Закрити меню">×</button></div><div class="mnl" id="mnl"></div><div class="mna" id="mna"></div></div>');
const mnu=q("#mnu"),isMob=()=>window.matchMedia&&matchMedia("(max-width:860px)").matches;
const au=q("#au"),ad=q("#ad"),pill=q("nav .pill"),pi=pill.querySelector("i"),ico=pi.innerHTML;
const lock=()=>{document.documentElement.style.overflow=(au.classList.contains("o")||ad.classList.contains("o")||mnu.classList.contains("o"))?"hidden":""};
const soc=()=>`<div class="asb">${SOC.map(s=>`<button type="button" disabled><b style="background:${s[2]}">${s[1]}</b>${s[0]}<em>скоро</em></button>`).join("")}</div>`;
const fld=(t,n,p,a)=>`<label class="afi"><input type="${t}" name="${n}" placeholder="${p}" autocomplete="${a}"></label>`;
function render(){const b=q("#ab");let h="";
if(view=="magic")h=`<h2 class="ah av2">Вхід за посиланням</h2><p class="as av2">Надішлемо на пошту посилання без пароля.</p><form class="av2" data-f="magic">${fld("email","email","Ваш e-mail","email")}<div class="aer"></div><button class="apb">Надіслати посилання</button></form><a href="#" class="alk" data-v="in">← Назад до входу</a>`;
else{const up=view=="up";h=`<div class="at${up?" r":""}"><i></i><button class="${up?"":"a"}" data-v="in">Вхід</button><button class="${up?"a":""}" data-v="up">Реєстрація</button></div><h2 class="ah av2">${up?"Створіть акаунт":"З поверненням"}</h2><p class="as av2">${up?"Зберігайте бронювання в одному місці.":"Увійдіть, щоб бачити свої бронювання."}</p><div class="av2">${soc()}<div class="adv">або через e-mail</div></div><form class="av2" data-f="${view}">${up?fld("text","name","Ім'я","name"):""}${fld("email","email","E-mail","email")}${fld("password","password","Пароль (від 8 символів)",up?"new-password":"current-password")}${Guard.hp()}<div class="cft"></div><div class="aer"></div><button class="apb">${up?"Зареєструватись":"Увійти"}</button></form>${up?"":'<a href="#" class="alk" data-v="magic">Вхід за посиланням</a>'}`}
b.innerHTML=h;const gf=b.querySelector('form[data-f="in"],form[data-f="up"]');if(gf)gf._g=Guard.mount(gf.querySelector(".cft"))}
function paint(){const l=user?(user.name||"К")[0].toUpperCase():"";if(user){pi.className="u";pi.textContent=l}else{pi.className="";pi.innerHTML=ico}
q("#adb").innerHTML=user?`<div class="apf"><div class="aav">${esc(l)}</div><div><b>${esc(user.name)}</b><span>${esc(user.email)}</span></div></div><div class="abx"><h3>Мої бронювання</h3><div id="abl"><p>Завантаження…</p></div></div><a class="sa" href="account.html" style="text-align:center">Відкрити кабінет</a><button class="aso" id="aso" style="margin-top:0">Вийти</button>`:""}
async function loadBookings(){const box=q("#abl");if(!box)return;const r=await api("bookings");if(!r.ok){box.innerHTML="<p>Не вдалося завантажити бронювання.</p>";return}
box.innerHTML=r.bookings.length?r.bookings.map(b=>`<div class="arw" style="display:block"><b>${esc(b.title)}</b><br><span>${fd(b.check_in)} — ${fd(b.check_out)} · ${b.guests} гост. · ${fmt(b.total_minor)}</span><br><span>№ ${esc(b.ref)} · ${({confirmed:"Прийнято",cancelled:"Скасовано",completed:"Завершено",pending:"Очікує"})[b.status]||esc(b.status)}</span></div>`).join(""):'<p>Поки що немає бронювань. Оберіть оселю й забронюйте її.</p><button class="sa" id="agt">Дивитись оселі</button>'}
const notify=()=>{subs.forEach(f=>f(user));dispatchEvent(new CustomEvent("auth:change",{detail:user}))};
function openM(){q("#mnl").innerHTML=LINKS.map((l,i)=>`<a href="${l[1]}" style="--i:${i}">${l[0]}</a>`).join("");
q("#mna").innerHTML=user?`<div class="mnu-u"><b>${esc(user.name)}</b><span>${esc(user.email)}</span></div><a class="mnb" href="account.html">Мій кабінет</a><button class="mnb2" id="mlo">Вийти</button>`:'<button class="mnb" id="mli">Увійти або зареєструватись</button>';
mnu.classList.add("o");mnu.setAttribute("aria-hidden","false");lock()}
function closeM(){mnu.classList.remove("o");mnu.setAttribute("aria-hidden","true");lock()}
mnu.addEventListener("click",async e=>{if(e.target.closest(".ax")||e.target.closest("#mnl a")||e.target.closest(".mna a"))return closeM();
if(e.target.id=="mli"){closeM();openA("in")}if(e.target.id=="mlo"){await api("auth/logout",{});user=null;paint();closeM();notify()}});
addEventListener("resize",()=>{if(!isMob())closeM()});
function openA(v){view=v||"in";render();au.classList.add("o");lock()}
function closeA(){au.classList.remove("o");lock()}
function openD(){paint();ad.classList.add("o");lock();loadBookings()}
function closeD(){ad.classList.remove("o");lock()}
pill.addEventListener("click",()=>{if(isMob())return openM();user?openD():openA("in")});
au.addEventListener("click",e=>{if(e.target==au||e.target.closest(".ax"))return closeA();const v=e.target.closest("[data-v]");if(v){e.preventDefault();view=v.dataset.v;render();return}
const s=e.target.closest("[data-s]");if(s){const m=q("#asm");if(m)m.textContent="Вхід через "+s.dataset.s+" підключимо найближчим часом. Скористайтесь e-mail."}});
au.addEventListener("submit",async e=>{e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f)),er=f.querySelector(".aer"),t=f.dataset.f;
if(t=="magic"){er.textContent="Вхід за посиланням з'явиться після підключення пошти. Скористайтесь e-mail і паролем.";return}
const btn=f.querySelector(".apb");btn.disabled=true;er.textContent="";
const x=await f._g.fields(f);const r=await api(t=="up"?"auth/register":"auth/login",t=="up"?{name:d.name,email:d.email,password:d.password,...x}:{email:d.email,password:d.password,...x});f._g.reset();
btn.disabled=false;if(!r.ok){er.textContent=EM[r.error]||"Щось пішло не так. Спробуйте ще раз.";return}
user=r.user;paint();closeA();notify()});
ad.addEventListener("click",async e=>{if(e.target.closest(".ax"))closeD();if(e.target.id=="aso"){await api("auth/logout",{});user=null;paint();closeD();notify()}
if(e.target.id=="agt"){closeD();if(q("#stays")){if(window.home)home();setTimeout(()=>q("#stays").scrollIntoView({behavior:"smooth"}),50)}else location.href="index.html#stays"}});
addEventListener("keydown",e=>{if(e.key=="Escape"){closeA();closeD();closeM()}});
window.Auth={get:()=>user,on:f=>{subs.push(f);if(loaded)f(user)},open:openA,drawer:openD};
api("auth/me").then(d=>{user=d.user||null;loaded=true;paint();notify()});
})();
