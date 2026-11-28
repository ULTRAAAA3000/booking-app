/* Антибот на клієнті: Cloudflare Turnstile (якщо налаштований на сервері), приховане поле-приманка, час заповнення форми. */
window.Guard=(()=>{
const cp=fetch("/api/config",{credentials:"same-origin"}).then(r=>r.ok?r.json():{}).catch(()=>({})).then(j=>j||{});
let tsp=null;const loadTs=()=>tsp||(tsp=new Promise(res=>{if(window.turnstile)return res();const s=document.createElement("script");s.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";s.async=true;s.onload=()=>res();s.onerror=()=>res();document.head.appendChild(s)}));
const hp=()=>'<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">';
function mount(el){const st={shown:Date.now(),token:"",id:null,failed:false,w:[]};
const flush=t=>st.w.splice(0).forEach(f=>f(t));
cp.then(c=>{if(!c.turnstile_site_key||!el)return;return loadTs().then(()=>{if(!window.turnstile){st.failed=true;flush("");return}
st.id=turnstile.render(el,{sitekey:c.turnstile_site_key,appearance:"interaction-only",callback:t=>{st.token=t;flush(t)},"expired-callback":()=>{st.token=""},"error-callback":()=>{st.token=""}})})});
return{
fields:async f=>{const c=await cp;let tok="";if(c.turnstile_site_key&&!st.failed)tok=st.token||await new Promise(r=>{st.w.push(r);setTimeout(()=>r(""),12000)});
return{website:f&&f.elements&&f.elements.website?f.elements.website.value:"",t:Date.now()-st.shown,turnstile:tok}},
reset:()=>{st.token="";if(st.id!==null&&window.turnstile)try{turnstile.reset(st.id)}catch(e){}}}}
return{hp,mount,cfg:()=>cp};
})();
