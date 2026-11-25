/* Демо-авторизація: вхід імітується локально (без пароля в сховищі). Справжня — на сервері (D1 + Functions). */
(()=>{
const q=s=>document.querySelector(s),K="pol_session",SOC=[["Google","G","#ea4335"],["Apple","A","#111"],["Facebook","f","#1877f2"],["Telegram","T","#27a7e7"]];
const get=()=>{try{return JSON.parse(localStorage.getItem(K))}catch(e){return null}};
const put=u=>{try{u?localStorage.setItem(K,JSON.stringify(u)):localStorage.removeItem(K)}catch(e){}};
document.body.insertAdjacentHTML("beforeend",'<div class="au" id="au"><div class="ac" role="dialog" aria-modal="true" aria-label="Вхід"><button class="ax" aria-label="Закрити">×</button><div id="ab"></div></div></div><aside class="ad" id="ad" aria-label="Акаунт"><button class="ax" aria-label="Закрити">×</button><div id="adb" style="display:contents"></div></aside>');
const au=q("#au"),ad=q("#ad"),pill=q("nav .pill"),pi=pill.querySelector("i"),ico=pi.innerHTML;let view="in";
const lock=()=>{document.documentElement.style.overflow=(au.classList.contains("o")||ad.classList.contains("o"))?"hidden":""};
const soc=()=>`<div class="asb">${SOC.map(s=>`<button type="button" data-s="${s[0]}"><b style="background:${s[2]}">${s[1]}</b>${s[0]}</button>`).join("")}</div>`;
const fld=(t,n,p,a)=>`<label class="afi"><input type="${t}" name="${n}" placeholder="${p}" autocomplete="${a}"></label>`;
function render(){const b=q("#ab");let h="";
if(view=="magic")h=`<h2 class="ah av2">Вхід за посиланням</h2><p class="as av2">Надішлемо на пошту посилання: без пароля. Так само можна відновити доступ.</p><form class="av2" data-f="magic">${fld("email","email","Ваш e-mail","email")}<div class="aer"></div><button class="apb">Надіслати посилання</button></form><a href="#" class="alk" data-v="in">← Назад до входу</a>`;
else{const up=view=="up";h=`<div class="at${up?" r":""}"><i></i><button class="${up?"":"a"}" data-v="in">Вхід</button><button class="${up?"a":""}" data-v="up">Реєстрація</button></div><h2 class="ah av2">${up?"Створіть акаунт":"З поверненням"}</h2><p class="as av2">${up?"Зберігайте бронювання та обране в одному місці.":"Увійдіть, щоб бачити свої бронювання."}</p><div class="av2">${soc()}<div class="adv">або через e-mail</div></div><form class="av2" data-f="${view}">${up?fld("text","name","Ім'я","name"):""}${fld("email","email","E-mail","email")}${fld("password","pass","Пароль (від 6 символів)",up?"new-password":"current-password")}<div class="aer"></div><button class="apb">${up?"Зареєструватись":"Увійти"}</button></form>${up?"":'<a href="#" class="alk" data-v="magic">Забули пароль або вхід за посиланням</a>'}<p class="ant">Демо: вхід імітується в браузері. Справжня авторизація буде на сервері.</p>`}
b.innerHTML=h}
function paint(){const u=get();if(u){pi.className="u";pi.textContent=(u.name||"К")[0].toUpperCase()}else{pi.className="";pi.innerHTML=ico}
q("#adb").innerHTML=u?`<div class="apf"><div class="aav">${(u.name||"К")[0].toUpperCase()}</div><div><b>${u.name}</b><span>${u.email}</span></div></div><div class="abx"><h3>Мої бронювання</h3><p>Поки що немає бронювань. Оберіть оселю, і вона з'явиться тут.</p><button class="sa" id="agt">Дивитись оселі</button></div><div class="abx"><h3>Профіль</h3><div class="arw"><span>Ім'я</span>${u.name}</div><div class="arw"><span>Вхід</span>${u.via}</div></div><button class="aso" id="aso">Вийти</button>`:""}
function openA(v){view=v||"in";render();au.classList.add("o");lock()}
function closeA(){au.classList.remove("o");lock()}
function openD(){paint();ad.classList.add("o");lock()}
function closeD(){ad.classList.remove("o");lock()}
function login(u){put(u);paint();closeA()}
pill.addEventListener("click",()=>get()?openD():openA("in"));
au.addEventListener("click",e=>{if(e.target==au||e.target.closest(".ax"))return closeA();const v=e.target.closest("[data-v]");if(v){e.preventDefault();view=v.dataset.v;render();return}
const s=e.target.closest("[data-s]");if(s)login({name:"Користувач "+s.dataset.s,email:"Вхід через "+s.dataset.s,via:s.dataset.s+" (демо)"})});
au.addEventListener("submit",e=>{e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f)),er=f.querySelector(".aer"),t=f.dataset.f;
if(!/^\S+@\S+\.\S+$/.test(d.email||""))return er.textContent="Введіть коректний e-mail";
if(t=="magic"){f.innerHTML='<div class="aok">Готово! Надіслали посилання на '+d.email.replace(/</g,"")+' (у демо лист не відправляється).</div>';return}
if((d.pass||"").length<6)return er.textContent="Пароль має містити щонайменше 6 символів";
if(t=="up"&&!(d.name||"").trim())return er.textContent="Вкажіть ім'я";
login({name:t=="up"?d.name.trim():d.email.split("@")[0],email:d.email,via:"e-mail"})});
ad.addEventListener("click",e=>{if(e.target.closest(".ax"))closeD();if(e.target.id=="aso"){put(null);paint();closeD()}if(e.target.id=="agt"){closeD();if(window.home)home();setTimeout(()=>q("#stays").scrollIntoView({behavior:"smooth"}),50)}});
addEventListener("keydown",e=>{if(e.key=="Escape"){closeA();closeD()}});
paint();
})();
