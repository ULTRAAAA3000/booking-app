/* Інтерактив секцій головної: напрямки, сезони, FAQ, поява при скролі. */
(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
if(!$("#hrg"))return;
const pool=[["hero",0],["thumbs",2],["hero",2],["thumbs",1],["thumbs",0],["hero",1]].map(([k,i],n)=>img(k,i,n+60,n));
// фото напрямків (поки з наших шести кадрів; реальні фото додамо пізніше)
$$("#hrg .hrc").forEach((c,i)=>{c.querySelector(".im").style.backgroundImage="url("+pool[i%pool.length]+")"});
$("#hcim").style.backgroundImage="url("+pool[1]+")";
// скільки осель у кожному напрямку: з каталогу
fetch("/api/properties?limit=48").then(r=>r.ok?r.json():null).then(j=>{if(!j)return;const n={};j.items.forEach(it=>n[it.region_slug]=(n[it.region_slug]||0)+1);
$$("#hrg .hrc").forEach(c=>{const k=new URL(c.href,location.href).searchParams.get("region"),m=n[k]||0,e=c.querySelector("em");e.textContent=m?m+(m==1?" оселя":m<5?" оселі":" осель"):"Скоро"})}).catch(()=>{$$("#hrg .hrc em").forEach(e=>e.remove())});
// сезони: ручне перемикання
const sp=[4,1,3,0].map(i=>pool[i]);$$("#hsp div").forEach((d,i)=>d.style.backgroundImage="url("+sp[i]+")");
$$("#hst button").forEach((b,n)=>b.onclick=()=>{const box=$("#hsb");$$("#hst button").forEach((x,i)=>x.classList.toggle("a",i==n));$$("#hsp div").forEach((x,i)=>x.classList.toggle("a",i==n));
box.classList.add("o");setTimeout(()=>{$$("#hsb>div").forEach((x,i)=>x.hidden=i!=n);box.classList.remove("o")},280)});
// FAQ: одне відкрите питання
$$("#hql>div").forEach(d=>d.querySelector("button").onclick=()=>{const was=d.classList.contains("o");$$("#hql>div").forEach(x=>{x.classList.remove("o");x.querySelector("button").setAttribute("aria-expanded","false")});if(!was){d.classList.add("o");d.querySelector("button").setAttribute("aria-expanded","true")}});
// поява при скролі
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("v");io.unobserve(e.target)}}),{threshold:.12});$$(".hrv").forEach(e=>io.observe(e));
})();
