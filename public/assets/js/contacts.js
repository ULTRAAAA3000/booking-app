/* Контакти: картка з даними (змінні PUBLIC_* у /api/config) і форма зв'язку з антибот-захистом. Повідомлення зберігається в базі й приходить на CONTACT_TO; відповідь піде на e-mail відвідувача. */
(()=>{
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ER={invalid_name:"Вкажіть ім'я (від 2 символів)",invalid_email:"Введіть коректний e-mail",invalid_phone:"Введіть коректний телефон",invalid_topic:"Оберіть тему",invalid_message:"Напишіть повідомлення (від 10 символів)",captcha_failed:"Не вдалося підтвердити, що ви не робот. Оновіть сторінку й спробуйте ще раз",captcha_unavailable:"Перевірка від ботів тимчасово недоступна. Спробуйте пізніше",too_many_requests:"Забагато спроб. Зачекайте кілька хвилин",too_fast:"Ви надто швидко відправили форму. Спробуйте ще раз",invalid_request:"Запит відхилено",network:"Сервер недоступний. Запустіть проєкт через npm run dev або відкрийте розгорнуту версію.",server_misconfigured:"Сервер ще не налаштований (база або SESSION_SECRET)"};
const TOPICS=[["booking","Бронювання"],["stay","Питання про оселю"],["host","Розмістити оселю"],["other","Інше"]];
const IC={mail:'<path d="M4 6h16v12H4zM4 7l8 6 8-6"/>',phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',tg:'<path d="M21 4L3 11l6 2 2 6 3-4 5 4z"/>',pin:'<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'};
const api=async(p,body)=>{try{const r=await fetch("/api/"+p,{method:body?"POST":"GET",credentials:"same-origin",headers:{"content-type":"application/json"},body:body?JSON.stringify(body):undefined});const d=await r.json().catch(()=>({}));return{ok:r.ok,...d}}catch(e){return{ok:false,error:"network"}}};
const item=(k,l,v,h)=>`<div class="cit"><i><svg class="ic" viewBox="0 0 24 24">${IC[k]}</svg></i><div><small>${l}</small>${h?`<a href="${esc(h)}"><b>${esc(v)}</b></a>`:`<b>${esc(v)}</b>`}</div></div>`;
const root=$("#ct");let user=null,gd=null;
const val=n=>{const e=$("#cf")&&$("#cf").elements[n];return e?e.value.trim():""};
function fill(){const f=$("#cf");if(!f||!user)return;if(!f.elements.name.value)f.elements.name.value=user.name;if(!f.elements.email.value)f.elements.email.value=user.email}
function render(c){const k=c.contacts||{},tg=k.telegram?k.telegram.replace(/^https?:\/\/t\.me\//,"").replace(/^@/,""):"";
const items=[k.email&&item("mail","E-mail",k.email,"mailto:"+k.email),k.phone&&item("phone","Телефон",k.phone,"tel:"+k.phone.replace(/[^\d+]/g,"")),tg&&item("tg","Telegram","@"+tg,/^\w{3,}$/.test(tg)?"https://t.me/"+tg:""),k.address&&item("pin","Адреса",k.address)].filter(Boolean).join("");
const inp=(n,t,l,ex="")=>`<label class="afi"><small>${l}</small><input type="${t}" name="${n}" ${ex}></label>`;
root.innerHTML=`<div class="cgr"><aside class="ccd"><h2 class="ser">Напишіть нам</h2><p>Допоможемо з бронюванням, вибором оселі або розміщенням вашої оселі. Відповідь прийде на e-mail, який ви вкажете у формі.</p>${items}</aside>
<form class="bcard" id="cf" novalidate><h2 class="ser" style="font-size:26px;margin-bottom:18px">Повідомлення</h2>
<label class="afi"><small>Тема</small><select name="topic">${TOPICS.map(t=>`<option value="${t[0]}">${t[1]}</option>`).join("")}</select></label>
<div class="b2">${inp("name","text","Ім'я",'autocomplete="name" maxlength="80"')}${inp("email","email","E-mail",'autocomplete="email" maxlength="254"')}</div>
${inp("phone","tel","Телефон (необов'язково)",'autocomplete="tel" placeholder="+380…" maxlength="20"')}
<label class="afi"><small>Повідомлення</small><textarea name="message" maxlength="2000" style="min-height:140px"></textarea></label>
${Guard.hp()}<div class="cft" id="ccf"></div><div class="aer" id="cer"></div><button class="apb" id="csub">Надіслати повідомлення</button></form></div>`;
const f=$("#cf");gd=Guard.mount($("#ccf"));f.addEventListener("input",()=>{$("#cer").textContent=""});f.addEventListener("submit",submit);fill()}
async function submit(e){e.preventDefault();const er=$("#cer"),b=$("#csub");er.textContent="";
const d={topic:val("topic"),name:val("name"),email:val("email"),phone:val("phone"),message:val("message")};
b.disabled=true;b.textContent="Надсилаємо…";
const r=await api("contact",{...d,...await gd.fields($("#cf"))});gd.reset();b.disabled=false;b.textContent="Надіслати повідомлення";
if(!r.ok){er.textContent=ER[r.error]||"Щось пішло не так. Спробуйте ще раз.";return}
root.innerHTML=`<div class="bok cok"><svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="38"/><path d="M26 43l11 11 21-23"/></svg><h2>Повідомлення надіслано</h2><p>Дякуємо! Ми відповімо на <b>${esc(d.email)}</b>.</p><div class="acts"><a href="index.html" class="pr2">На головну</a><a href="stays.html">До осель</a></div></div>`;scrollTo({top:0,behavior:"smooth"})}
Auth.on(u=>{user=u;fill()});
Guard.cfg().then(c=>render(c||{}));
})();
