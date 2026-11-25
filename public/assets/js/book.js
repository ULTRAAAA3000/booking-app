(()=>{
const $=s=>document.querySelector(s),P=new URLSearchParams(location.search),slug=P.get("house")||"";
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=m=>(m/100).toLocaleString("uk-UA")+" ₴",MON=["січ","лют","бер","кві","тра","чер","лип","сер","вер","жов","лис","гру"];
const fd=s=>{const d=new Date(s+"T00:00:00");return d.getDate()+" "+MON[d.getMonth()]+" "+d.getFullYear()};
const today=new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Kyiv"});
const nextDay=s=>new Date(Date.parse(s)+864e5).toISOString().slice(0,10);
const ER={invalid_dates:"Перевірте дати заїзду та виїзду",past_date:"Дата заїзду вже минула",min_nights:"Занадто короткий період для цієї оселі",max_nights:"Занадто довгий період",invalid_guests:"Перевірте кількість гостей",dates_unavailable:"Ці дати вже зайняті. Оберіть інші",invalid_name:"Вкажіть ім'я та прізвище",invalid_email:"Введіть коректний e-mail",invalid_phone:"Введіть коректний телефон",not_found:"Оселю не знайдено",network:"Сервер недоступний. Запустіть проєкт через npm run dev або відкрийте розгорнуту версію.",server_misconfigured:"Сервер ще не налаштований (база або SESSION_SECRET)"};
const api=async(p,body)=>{try{const r=await fetch("/api/"+p,{method:body?"POST":"GET",credentials:"same-origin",headers:{"content-type":"application/json"},body:body?JSON.stringify(body):undefined});const d=await r.json().catch(()=>({}));return{ok:r.ok,...d}}catch(e){return{ok:false,error:"network"}}};
const root=$("#bk");let prop=null,av=null,user=null,timer=0,busy=false;
const val=n=>{const e=$("#bf")&&$("#bf").elements[n];return e?e.value.trim():""};
function banner(){const b=$("#bnr");if(!b)return;b.className="bnr"+(user?" ok":"");
b.innerHTML=user?`Ви увійшли як <b>${esc(user.name)}</b>. Бронювання збережеться у вашому акаунті.`:`Увійдіть в акаунт: тоді бронювання збережеться у вашому профілі й буде в «Моїх бронюваннях». Можна й без входу, але ми радимо увійти. <button type="button" class="alk" id="bli">Увійти</button>`;
if(user){const f=$("#bf").elements;if(!f.name.value)f.name.value=user.name;if(!f.email.value)f.email.value=user.email}}
function sum(){const a=val("in"),o=val("out"),g=val("guests"),n=a&&o&&o>a?Math.round((Date.parse(o)-Date.parse(a))/864e5):0;
$("#bsm").innerHTML=`<div class="brw"><span>Заїзд</span>${a?fd(a):"—"}</div><div class="brw"><span>Виїзд</span>${o?fd(o):"—"}</div><div class="brw"><span>Гості</span>${g}</div>${n?`<div class="brw"><span>${fmt(prop.price_minor)} × ${n} ноч.</span>${fmt(prop.price_minor*n)}</div><div class="brw t"><span>Разом</span>${fmt(prop.price_minor*n)}</div>`:""}`;
const st=$("#bst");let bad=false;
if(av&&av.available===true){st.className="bst g";st.textContent="Дати вільні"}
else if(av&&av.available===false){st.className="bst r";st.textContent=ER[av.reason]||"Ці дати недоступні";bad=true}
else if(av&&av.error){st.className="bst r";st.textContent=ER[av.error]||"Помилка";}else{st.className="bst";st.textContent=""}
$("#bsub").disabled=bad||busy}
async function check(){const a=val("in"),o=val("out");if(!a||!o){av=null;sum();return}
av=await api(`availability?slug=${encodeURIComponent(slug)}&in=${a}&out=${o}&guests=${val("guests")}`);sum()}
const later=()=>{clearTimeout(timer);timer=setTimeout(check,250)};
function render(p){prop=p;const g=Math.min(+P.get("guests")||2,p.max_guests),inp=(n,t,l,ex="")=>`<label class="afi"><small>${l}</small><input type="${t}" name="${n}" ${ex}></label>`;
root.innerHTML=`<div class="bgr"><form class="bcard" id="bf" novalidate><div id="bnr" class="bnr"></div><h2 class="ser" style="font-size:26px;margin-bottom:18px">Дані бронювання</h2>
<div class="b2">${inp("in","date","Заїзд",`min="${today}" value="${esc(P.get("in")||"")}"`)}${inp("out","date","Виїзд",`min="${today}" value="${esc(P.get("out")||"")}"`)}</div>
<label class="afi"><small>Гості</small><select name="guests">${[...Array(p.max_guests)].map((_,i)=>`<option value="${i+1}"${i+1==g?" selected":""}>${i+1}</option>`).join("")}</select></label>
<div class="b2">${inp("name","text","Ім'я та прізвище",'autocomplete="name" maxlength="80"')}${inp("phone","tel","Телефон",'autocomplete="tel" placeholder="+380…" maxlength="20"')}</div>
${inp("email","email","E-mail",'autocomplete="email" maxlength="254"')}
<label class="afi"><small>Побажання (необов'язково)</small><textarea name="note" maxlength="500"></textarea></label>
<div class="aer" id="ber"></div><button class="apb" id="bsub">Підтвердити бронювання</button>
<p class="bnt">Оплата поки не потрібна: оплату підключимо наступним етапом. Підтвердження на пошту наразі не надсилається. Після бронювання ви побачите номер замовлення.</p></form>
<aside class="bsum"><div class="bimg" style="${p.cover?`background-image:url(${esc(p.cover)})`:""}"></div><div class="bin"><h3>${esc(p.title)}</h3><div class="rg2">${esc(p.region)}, Карпати</div><div id="bsm"></div><div class="bst" id="bst"></div></div></aside></div>`;
const f=$("#bf");f.addEventListener("input",e=>{if(e.target.name=="in"&&e.target.value){f.elements.out.min=nextDay(e.target.value);if(f.elements.out.value&&f.elements.out.value<=e.target.value)f.elements.out.value=""}if(["in","out"].includes(e.target.name))later();$("#ber").textContent=""});
f.elements.guests.addEventListener("change",later);
f.addEventListener("click",e=>{if(e.target.id=="bli")Auth.open("in")});f.addEventListener("submit",submit);banner();sum();check()}
async function submit(e){e.preventDefault();const er=$("#ber");er.textContent="";
const d={slug,in:val("in"),out:val("out"),guests:+val("guests"),name:val("name"),phone:val("phone"),email:val("email"),note:val("note")};
if(!d.in||!d.out)return er.textContent="Оберіть дати заїзду та виїзду";
busy=true;$("#bsub").disabled=true;$("#bsub").textContent="Опрацьовуємо…";
const r=await api("bookings",d);busy=false;$("#bsub").textContent="Підтвердити бронювання";
if(!r.ok){er.textContent=ER[r.error]||"Щось пішло не так. Спробуйте ще раз.";if(r.error=="dates_unavailable")check();else sum();return}
done(r.booking)}
function done(b){root.innerHTML=`<div class="bok"><svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="38"/><path d="M26 43l11 11 21-23"/></svg><h2>Ваше замовлення прийнято</h2><p>Номер бронювання: <b>${esc(b.ref)}</b>. Збережіть його.</p>
<div class="bx"><div class="brw"><span>Оселя</span>${esc(b.title)}</div><div class="brw"><span>Заїзд</span>${fd(b.check_in)}</div><div class="brw"><span>Виїзд</span>${fd(b.check_out)}</div><div class="brw"><span>Ночей / гостей</span>${b.nights} / ${b.guests}</div><div class="brw t"><span>Разом</span>${fmt(b.total_minor)}</div></div>
<p style="font-size:13px;margin-bottom:22px">${b.account?"Бронювання збережено у вашому акаунті.":"Ви бронювали без акаунта, тож збережіть номер бронювання."} Оплата — наступним етапом.</p>
<div class="acts"><a href="index.html" class="pr2">На головну</a>${b.account?'<button id="bmy">Мої бронювання</button>':""}</div></div>`;
scrollTo({top:0,behavior:"smooth"});const m=$("#bmy");if(m)m.onclick=()=>Auth.drawer()}
Auth.on(u=>{user=u;banner()});
(async()=>{if(!slug){root.innerHTML='<p class="bld">Оселю не вибрано. <a href="index.html#stays" class="alk">Повернутись до осель</a></p>';return}
const r=await api("availability?slug="+encodeURIComponent(slug));
if(!r.ok){root.innerHTML=`<p class="bld">${esc(ER[r.error]||"Не вдалося завантажити оселю")}. <a href="index.html#stays" class="alk">До осель</a></p>`;return}
render(r.property)})();
})();
