const API = 'https://idea.chicsdata.shop';
const KEY_STORAGE = 'ideaRadarKey';
let volatileKey = '';
function readStoredJson(key,fallback){
  try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback;}catch(e){return fallback;}
}
function writeStoredJson(key,value){
  try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(e){return false;}
}
const state = { stories: [], profileMeta:{}, imageFilter: 'all', hidden: new Set(readStoredJson('thumbDeskDone',[])), galleries:{}, selectedImages:{}, serverSelected:{}, uploading:{}, sending:{}, downloading:{}, galleryLoading:{}, loadingStories:false, reloadStoriesPending:false, lightbox:{id:'',images:[],index:0,returnFocus:null,request:0,imageRequest:0} };
const $ = (s) => document.querySelector(s);
const els = { cards:$('#cards'), empty:$('#empty'), notice:$('#notice'), date:$('#dateFilter'), dateDisplay:$('#dateDisplay'), search:$('#searchFilter'), channel:$('#channelFilter'), niche:$('#nicheFilter'), dialog:$('#keyDialog'), apiKey:$('#apiKey'), keyDialogTitle:$('#keyDialogTitle'), clearKey:$('#clearKeyButton'), lightbox:$('#imageLightbox'), lightboxClose:$('#lightboxClose'), lightboxPrev:$('#lightboxPrev'), lightboxNext:$('#lightboxNext'), lightboxStage:$('#lightboxStage'), lightboxImage:$('#lightboxImage'), lightboxStatus:$('#lightboxStatus'), lightboxCounter:$('#lightboxCounter') };

els.date.value = todayInVietnam();
function readStoredKey(){
  try{const saved=localStorage.getItem(KEY_STORAGE);if(saved)return saved;}catch(e){}
  try{return sessionStorage.getItem(KEY_STORAGE)||volatileKey;}catch(e){return volatileKey;}
}
async function storeKey(value){
  volatileKey=value;
  try{localStorage.setItem(KEY_STORAGE,value);try{sessionStorage.removeItem(KEY_STORAGE);}catch(e){}return true;}catch(e){}
  try{sessionStorage.setItem(KEY_STORAGE,value);}catch(e){}
  return false;
}
async function removeStoredKey(){
  volatileKey='';
  try{localStorage.removeItem(KEY_STORAGE);}catch(e){}
  try{sessionStorage.removeItem(KEY_STORAGE);}catch(e){}
}
function migrateLegacyKey(){
  let legacy='';
  try{legacy=sessionStorage.getItem(KEY_STORAGE)||'';}catch(e){}
  if(!legacy)return;
  try{
    if(!localStorage.getItem(KEY_STORAGE))localStorage.setItem(KEY_STORAGE,legacy);
    sessionStorage.removeItem(KEY_STORAGE);
  }catch(e){volatileKey=legacy;}
}
const getKey = () => readStoredKey();
function initializeKeyStore(){migrateLegacyKey();}
function qcMeta(s){
  const q=s.qc&&typeof s.qc==='object'&&!Array.isArray(s.qc)?s.qc:{},state=String(s.qc_state||'').toLowerCase(),verdict=String(q.verdict||'').toUpperCase(),issues=Array.isArray(q.issues)?q.issues:[];
  if(state==='qc_wait')return {label:'⏳ Đang QC',tone:'blue',title:'QC đang chạy'};
  if(verdict==='PASS'&&q.fixed_by)return {label:'🛠 PASS (Opus sửa)',tone:'amber',title:'Bài đã PASS sau khi Opus sửa'};
  if(verdict==='PASS')return {label:'✅ PASS',tone:'green',title:q.summary_vi||'QC đạt'};
  if(verdict==='FAIL')return {label:`❌ ${issues.length?`${issues.length} lỗi`:'Lỗi'}`,tone:'red',title:q.summary_vi||'QC không đạt'};
  if(verdict==='STALE')return {label:'⏳ QC hết hiệu lực',tone:'amber',title:q.summary_vi||'Nội dung đã đổi sau lần QC trước'};
  if(verdict==='ERROR')return {label:'⚠ QC lỗi',tone:'red',title:q.summary_vi||'QC chưa kiểm tra xong'};
  if(state==='qc_pass_opus')return {label:'🛠 PASS (Opus sửa)',tone:'amber',title:'Bài đã PASS sau khi Opus sửa'};
  if(state==='qc_pass'||state==='pass')return {label:'✅ PASS',tone:'green',title:'QC đạt'};
  if(state==='qc_fail'||state==='fail')return {label:'❌ Lỗi',tone:'red',title:'QC không đạt'};
  if(state==='qc_stale'||state==='stale')return {label:'⏳ QC hết hiệu lực',tone:'amber',title:'Nội dung đã đổi sau lần QC trước'};
  if(state==='qc_error'||state==='error')return {label:'⚠ QC lỗi',tone:'red',title:'QC chưa kiểm tra xong'};
  return {label:'🔎 Chưa QC',tone:'neutral',title:'Bài chưa có kết quả QC'};
}
const isQcError = s => qcMeta(s).tone==='red';
const storyNumber = s => s.story_no || s.number || s.code || s.id;
const storyCode = s => [s.profile||s.channel||s.channel_code,storyNumber(s)].filter(Boolean).join('-');
const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const sameImage = (a,b) => Boolean(a&&b) && decodeURIComponent(String(a).split('?')[0]).split('/').pop()===decodeURIComponent(String(b).split('?')[0]).split('/').pop();
const imageUrl = path => /^https?:\/\//i.test(path) ? path : API + (path.startsWith('/') ? path : '/'+path);
const thumbPaths = s => [...(Array.isArray(s.thumb_all)?s.thumb_all:[]),...(Array.isArray(s.thumbs?.images)?s.thumbs.images:[]),...(Array.isArray(s.thumbs?.selected)?s.thumbs.selected:[]),s.thumb0,s.thumbs?.best_thumb,s.thumbs?.best_human?.img].filter(Boolean).filter((p,i,all)=>all.findIndex(x=>sameImage(x,p))===i);
const isUserThumb = path => /^up_/i.test(decodeURIComponent(String(path||'').split('?')[0]).split('/').pop());
const userThumbs = s => thumbPaths(s).filter(isUserThumb);
const hasUserThumb = s => userThumbs(s).length>0;
const preferredUserThumb = s => isUserThumb(s.thumb0)?s.thumb0:(userThumbs(s)[0]||'');
const VI_CHARS=/[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
function englishNiche(value){
  const raw=String(value||'').normalize('NFC').trim();if(!raw)return '';
  const words=raw.split(/\s+/),cut=words.findIndex(word=>VI_CHARS.test(word));
  if(cut<=0)return raw;
  return words.slice(0,cut).join(' ').replace(/\s*(?:[-–—·|/]|\(|\[)\s*$/,'').trim()||raw;
}
function storyNiche(s){const meta=state.profileMeta[s.profile]||{};return englishNiche(s.niche_en||meta.niche_en||s.niche||meta.niche);}
function cardSelectedInfo(s){
  const hasLive=Object.prototype.hasOwnProperty.call(state.serverSelected,s.id);
  const selected=(hasLive&&Array.isArray(state.serverSelected[s.id])?state.serverSelected[s.id]:storySelections(s)).filter(Boolean).filter((p,i,all)=>all.findIndex(x=>sameImage(x,p))===i);
  const fallback=s.thumb0||s.thumbs?.best_thumb||s.thumbs?.best_human?.img||'';
  const image=fallback&&selected.some(p=>sameImage(p,fallback))?fallback:(selected[0]||fallback);
  return {image,count:selected.length||(image?1:0)};
}
const normalizeCode = v => String(v??'').trim().toUpperCase().replace(/\s+/g,'').replace(/^#/,'');
const compactCode = v => normalizeCode(v).replace(/[^A-Z0-9]/g,'');
const safeFileName = v => String(v||'story').replace(/[<>:"/\\|?*\x00-\x1F]/g,'-').replace(/[. ]+$/g,'').slice(0,120)||'story';
function todayInVietnam(){
  const values={};
  new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).forEach(part=>{if(part.type!=='literal')values[part.type]=part.value;});
  return `${values.year}-${values.month}-${values.day}`;
}
function formatPublishDate(value){
  if(!value)return 'Chưa có lịch';
  const raw=String(value).slice(0,10), parts=raw.split('-').map(Number);
  if(parts.length!==3||parts.some(n=>!n))return String(value);
  const date=new Date(`${raw}T12:00:00+07:00`);
  const weekday=new Intl.DateTimeFormat('vi-VN',{weekday:'long',timeZone:'Asia/Ho_Chi_Minh'}).format(date);
  return `${weekday.charAt(0).toUpperCase()+weekday.slice(1)}, ${String(parts[2]).padStart(2,'0')}/${String(parts[1]).padStart(2,'0')}/${parts[0]}`;
}
function updateDateDisplay(){if(els.dateDisplay)els.dateDisplay.textContent=formatPublishDate(els.date.value);}
function collectImages(value, found=[]){
  if(typeof value==='string' && (/\.(png|jpe?g|webp)(\?|$)/i.test(value) || value.includes('/static/thumbs/'))) found.push(value);
  else if(Array.isArray(value)) value.forEach(v=>collectImages(v,found));
  else if(value && typeof value==='object') Object.values(value).forEach(v=>collectImages(v,found));
  return [...new Set(found)];
}

async function api(path, options={}) {
  const key = getKey(); if(!key) throw new Error('Vui lòng kết nối API trước.');
  const headers = {...(options.headers||{}), Authorization:`Bearer ${key}`};
  if(options.body && !(options.body instanceof FormData)) headers['Content-Type']='application/json';
  const res = await fetch(API+path,{...options,headers});
  const body = await res.json().catch(()=>({}));
  if(res.status===401) throw new Error('API key đã hết hạn. Hãy bấm “Đổi API” để nhập key mới.');
  if(res.status===403) throw new Error(body.error||body.message||'API key chưa được cấp quyền cho thao tác này.');
  if(!res.ok) throw new Error(body.error || body.message || `API trả về lỗi ${res.status}`);
  if(body.error) throw new Error(body.error);
  return body;
}

function setNotice(message, error=false){ els.notice.textContent=message; els.notice.classList.toggle('error',error); els.notice.classList.remove('hidden'); clearTimeout(setNotice.t); setNotice.t=setTimeout(()=>els.notice.classList.add('hidden'),4200); }
function setOptions(el, values, label){ const selected=el.value; el.innerHTML=`<option value="">${label}</option>`+[...new Set(values.filter(Boolean))].sort().map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''); el.value=selected; }
const busyMarkup=label=>`<span class="busy-hourglass" aria-hidden="true">⌛</span><span>${esc(label)}</span>`;
function setButtonBusy(button,busy,label='Đang xử lý…'){
  if(!button)return;
  if(busy){
    if(button.dataset.busy!=='true'){
      button.dataset.busy='true';button.dataset.busyHtml=button.innerHTML;button.dataset.busyDisabled=button.disabled?'true':'false';button.dataset.busyMinWidth=button.style.minWidth||'';
      const width=button.getBoundingClientRect().width;if(width)button.style.minWidth=`${Math.ceil(width)}px`;
    }
    button.disabled=true;button.classList.add('is-loading');button.setAttribute('aria-busy','true');button.innerHTML=busyMarkup(label);return;
  }
  if(button.dataset.busy!=='true')return;
  button.innerHTML=button.dataset.busyHtml||'';button.disabled=button.dataset.busyDisabled==='true';button.style.minWidth=button.dataset.busyMinWidth||'';button.classList.remove('is-loading');button.removeAttribute('aria-busy');
  delete button.dataset.busy;delete button.dataset.busyHtml;delete button.dataset.busyDisabled;delete button.dataset.busyMinWidth;
}

async function loadStories(){
  if(!getKey()){ els.dialog.showModal(); return; }
  if(state.loadingStories){state.reloadStoriesPending=true;return;}
  state.loadingStories=true;
  const requestedDate=els.date.value,refreshButton=$('#refreshButton'),syncState=$('#syncState');setButtonBusy(refreshButton,true,'Đang tải');syncState.classList.remove('online');syncState.classList.add('is-loading');syncState.innerHTML=busyMarkup('Đang tải');
  try{
    const all=[],profileMeta={};let offset=0,total=Infinity;
    while(offset<total&&offset<1000){
      const p=new URLSearchParams({limit:'100',offset:String(offset),pfrom:requestedDate,pto:requestedDate,sort:'publish_date',sdir:'asc'});
      const data=await api('/api/stories?'+p), page=data.stories||[];
      Object.assign(profileMeta,data.profile_meta||{});
      all.push(...page);total=Number(data.total??all.length);
      if(!page.length||page.length<100)break;
      offset+=page.length;
    }
    if(requestedDate!==els.date.value){state.reloadStoriesPending=true;return;}
    state.serverSelected={};state.galleries={};state.selectedImages={};state.galleryLoading={};state.profileMeta=profileMeta;state.stories=all;
    setOptions(els.channel,state.stories.map(s=>s.profile),'Tất cả kênh'); setOptions(els.niche,state.stories.map(storyNiche),'Tất cả niche');
    $('#syncState').textContent=`Đã đồng bộ ${new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}`; $('#syncState').classList.add('online'); render();
  }catch(e){ setNotice(e.message,true); $('#syncState').textContent='Kết nối lỗi'; }
  finally{const reload=state.reloadStoriesPending;state.reloadStoriesPending=false;state.loadingStories=false;syncState.classList.remove('is-loading');if(refreshButton?.isConnected)setButtonBusy(refreshButton,false);if(reload)loadStories();}
}

function filtered(){ return state.stories.filter(s=>{
  if(els.channel.value && s.profile!==els.channel.value)return false;
  if(els.niche.value && storyNiche(s)!==els.niche.value)return false;
  const query=normalizeCode(els.search?.value), code=normalizeCode(storyCode(s)), channel=normalizeCode(s.profile), number=normalizeCode(storyNumber(s));
  if(query&&!code.includes(query)&&!channel.includes(query)&&!number.includes(query)&&!compactCode(code).includes(compactCode(query)))return false;
  if(state.imageFilter==='none' && hasUserThumb(s))return false;
  if(state.imageFilter==='has' && !hasUserThumb(s))return false;
  return true;
}).sort((a,b)=>Number(isQcError(b))-Number(isQcError(a))); }

function render(){
  const list=filtered(); els.cards.innerHTML=list.map(cardHtml).join(''); els.empty.classList.toggle('hidden',list.length>0);
  $('#visibleCount').textContent=list.length; $('#qcCount').textContent=state.stories.filter(isQcError).length; $('#doneCount').textContent=state.hidden.size;
  document.querySelectorAll('.file-input').forEach(input=>input.addEventListener('change',()=>{const file=input.files?.[0];if(file)uploadNewImage(input.dataset.id,file,input.closest('.drop-zone'));}));
  document.querySelectorAll('.drop-zone').forEach(zone=>{
    zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('dragging');});
    zone.addEventListener('dragleave',()=>zone.classList.remove('dragging'));
    zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('dragging');const file=[...(e.dataTransfer?.files||[])].find(f=>f.type.startsWith('image/'));if(file)uploadNewImage(zone.dataset.id,file,zone);else setCardStatus(zone.dataset.id,'Hãy thả một file ảnh JPG, PNG hoặc WEBP.',true);});
  });
  document.querySelectorAll('.image-pill').forEach(btn=>btn.addEventListener('click',()=>toggleGallery(btn.dataset.id,btn)));
  document.querySelectorAll('.lightbox-trigger').forEach(btn=>btn.addEventListener('click',()=>openLightbox(btn.dataset.id,btn.dataset.path,btn)));
  document.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',()=>copyText(btn.dataset.copy,btn)));
  document.querySelectorAll('.download-txt').forEach(btn=>btn.addEventListener('click',()=>downloadStoryTxt(btn.dataset.id,btn)));
}

async function copyText(text,target){
  try{
    let copied=false;
    if(navigator.clipboard?.writeText){
      try{await navigator.clipboard.writeText(text);copied=true;}catch(e){}
    }
    if(!copied){
      const area=document.createElement('textarea');
      area.value=text;
      area.style.cssText='position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(area);
      area.focus();area.select();
      copied=document.execCommand('copy');
      area.remove();
    }
    if(!copied)throw new Error('Clipboard write failed');
    target.classList.remove('copy-flash');void target.offsetWidth;target.classList.add('copy-flash');setTimeout(()=>target.classList.remove('copy-flash'),520);
  }catch(e){setNotice('Không copy được nội dung. Hãy thử lại.',true);}
}
async function downloadStoryTxt(id,btn){
  if(state.downloading[id])return;
  const story=state.stories.find(s=>String(s.id)===String(id));if(!story)return;
  state.downloading[id]=true;setButtonBusy(btn,true,'Đang tải');
  try{
    const detail=await getStoryDetail(id);
    const article=typeof detail.story==='string'?detail.story.trim():'';
    const fallback=[story.title,story.title_vi].filter(Boolean).join('\r\n\r\n');
    const content=article||fallback;
    if(!content)throw new Error('Thẻ này chưa có nội dung để tải.');
    const blob=new Blob(['\ufeff'+content],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=safeFileName(storyCode(story))+'.txt';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    setNotice(`Đã tải ${link.download}`);
  }catch(e){setNotice(e.message,true);}
  finally{state.downloading[id]=false;const current=document.querySelector(`.download-txt[data-id="${CSS.escape(String(id))}"]`);if(current===btn)setButtonBusy(btn,false);else if(current){current.disabled=false;current.classList.remove('is-loading');current.removeAttribute('aria-busy');current.textContent='↓ TXT';}}
}

function cardHtml(s){
  const qcError=isQcError(s),qcStatus=qcMeta(s),code=storyCode(s),cardNumber=String(storyNumber(s)||'').replace(/^#/,''),niche=storyNiche(s)||'—',uploaded=userThumbs(s),selection=cardSelectedInfo(s),selectedImage=selection.image,allThumbs=thumbPaths(s),title=s.title||'Chưa có title gốc',titleVi=s.title_vi||'Chưa có title dịch',downloading=Boolean(state.downloading[s.id]),galleryLoading=Boolean(state.galleryLoading[s.id]);
  return `<article class="card ${qcError?'qc-error':''}" data-story-id="${esc(s.id)}">
  <div class="card-head"><div class="card-head-left"><button type="button" class="pill card-id copy-target" data-copy="${esc(code)}" title="Bấm để copy mã thẻ">${esc(code)}</button><button class="pill download-txt ${downloading?'is-loading':''}" data-id="${esc(s.id)}" title="Tải nội dung bài viết" ${downloading?'disabled aria-busy="true"':''}>${downloading?busyMarkup('Đang tải'):'↓ TXT'}</button></div><div class="card-head-right"><span class="pill schedule-pill">📅 ${esc(formatPublishDate(s.publish_date))}</span></div></div>
  <div class="titles"><h2><button type="button" class="copy-title copy-target" data-copy="${esc(title)}" title="Bấm để copy tiêu đề gốc">${esc(title)}</button></h2><p><button type="button" class="copy-title copy-target" data-copy="${esc(titleVi)}" title="Bấm để copy tiêu đề dịch">${esc(titleVi)}</button></p></div>
  <div class="meta"><span class="pill">${esc(niche)}</span><span class="pill story-number-pill" title="Mã thẻ">#${esc(cardNumber)}</span><span class="pill status-badge status-${qcStatus.tone}" title="${esc(qcStatus.title)}">${esc(qcStatus.label)}</span><button class="pill image-pill thumb-count ${uploaded.length?'thumb-count-done':'thumb-count-wait'} ${galleryLoading?'is-loading':''}" data-id="${esc(s.id)}" title="${uploaded.length?'Đã có thumb bạn tải lên':'Chưa có thumb bạn tải lên'} · Bấm để xem ${allThumbs.length} ảnh" ${galleryLoading?'disabled aria-busy="true"':''}>${galleryLoading?busyMarkup('Đang tải'):`Ảnh: ${allThumbs.length}`}</button></div>
  <div class="gallery hidden" id="gallery-${esc(s.id)}"></div>
  <div class="thumb-workspace ${selectedImage?'has-selected':'no-selected'}">
    ${selectedImage?`<button type="button" class="done-thumb-preview lightbox-trigger" data-id="${esc(s.id)}" data-path="${esc(selectedImage)}" title="Bấm để phóng to ảnh"><img src="${esc(imageUrl(selectedImage))}" alt="Ảnh đang chọn của ${esc(code)}" loading="lazy"><span>${selection.count>1?`✓ ${selection.count} ảnh đang chọn`:'✓ Ảnh đang chọn'}</span></button>`:''}
    <div class="upload-row"><label class="drop-zone" data-id="${esc(s.id)}"><input class="file-input" data-id="${esc(s.id)}" type="file" accept="image/png,image/jpeg,image/webp"/><b>↓ Kéo ảnh vào đây để upload</b><span>hoặc bấm chọn ảnh · “Tôi làm tay”</span></label></div>
  </div>
  <div class="pending-preview hidden" data-id="${esc(s.id)}"></div>
  <div class="card-status hidden" id="card-status-${esc(s.id)}" role="status" aria-live="polite"></div>
  </article>`; }

function setCardStatus(id,message,error=false,busy=false){const el=document.getElementById(`card-status-${id}`);if(!el)return;el.innerHTML=busy?busyMarkup(message):esc(message);el.classList.toggle('is-loading',busy);el.classList.toggle('error',error);el.classList.toggle('hidden',!message);el.setAttribute('aria-busy',busy?'true':'false');}

const storyData=raw=>(raw?.story && typeof raw.story==='object')?raw.story:raw;
function storySelections(detail){const story=storyData(detail)||{};return Array.isArray(story.thumbs?.selected)?story.thumbs.selected.filter(Boolean):[];}
function storyPreferred(detail){const story=storyData(detail)||{};return story.thumb0||story.thumbs?.best_thumb||story.thumbs?.best_human?.img||'';}
async function getThumbImages(id){
  const story=await getStoryDetail(id);
  const selected=storySelections(story), preferred=storyPreferred(story);
  const images=[preferred,...selected,...storyImages(story)].filter(Boolean).filter((p,i,all)=>all.findIndex(x=>sameImage(x,p))===i);
  return {images:images.length?images:collectImages(story.thumbs||story),selected,preferred};
}
async function toggleGallery(id,button){
  const box=document.getElementById(`gallery-${id}`); if(!box)return;
  if(!box.classList.contains('hidden')){box.classList.add('hidden');return;}
  if(state.galleryLoading[id])return;
  state.galleryLoading[id]=true;setButtonBusy(button,true,'Đang tải');box.classList.remove('hidden');box.setAttribute('aria-busy','true');box.innerHTML=`<div class="gallery-loading" role="status">${busyMarkup('Đang tải các ảnh…')}</div>`;
  try{
    const gallery=await getThumbImages(id);
    state.galleries[id]=gallery.images;
    state.serverSelected[id]=gallery.selected;
    const current=gallery.images.find(p=>sameImage(p,state.selectedImages[id]));
    state.selectedImages[id]=current||(gallery.selected.length===1?gallery.selected[0]:'')||gallery.preferred||gallery.selected[0]||gallery.images[0]||'';
    renderGallery(id);
  }
  catch(e){box.innerHTML=`<div class="gallery-empty">${esc(e.message)}</div>`;}
  finally{state.galleryLoading[id]=false;box.removeAttribute('aria-busy');const current=document.querySelector(`.image-pill[data-id="${CSS.escape(String(id))}"]`);if(current===button)setButtonBusy(button,false);else if(current){const story=state.stories.find(item=>String(item.id)===String(id));current.disabled=false;current.classList.remove('is-loading');current.removeAttribute('aria-busy');current.textContent=`Ảnh: ${story?thumbPaths(story).length:0}`;}}
}
function renderGallery(id){
  const box=document.getElementById(`gallery-${id}`), images=state.galleries[id]||[], serverSelected=(state.serverSelected[id]||[]).filter((p,i,all)=>all.findIndex(x=>sameImage(x,p))===i),sending=Boolean(state.sending[id]); if(!box)return;
  if(!images.length){box.innerHTML='<div class="gallery-empty">Thẻ này chưa có ảnh để chọn.</div>';return;}
  box.innerHTML=`<div class="gallery-head"><b>Chọn ảnh thumbnail</b><span>${serverSelected.length} đang chọn · ${images.length} ảnh</span></div><div class="gallery-legend"><span><i class="legend-green"></i>Viền xanh = đang chọn trên web</span><span><i class="legend-dark"></i>Viền đen = ảnh chuẩn bị gửi</span></div><div class="gallery-grid">${images.map((p,i)=>{const onServer=serverSelected.some(x=>sameImage(x,p)),active=sameImage(state.selectedImages[id],p);return `<button class="gallery-item ${onServer?'server-selected':''} ${active&&!onServer?'active-choice':''}" data-path="${esc(p)}" title="${onServer?'Đang được chọn trên web · ':''}Bấm chọn ảnh ${i+1}" ${sending?'disabled':''}><img src="${esc(imageUrl(p))}" alt="Thumbnail ${i+1}" loading="lazy">${onServer?'<span class="selected-badge">✓ ĐANG CHỌN</span>':''}${state.uploading[id]?.path&&sameImage(state.uploading[id].path,p)?'<span class="new-badge">MỚI · TÔI LÀM TAY</span>':''}</button>`}).join('')}</div><div class="gallery-actions"><button class="button primary choose-existing ${sending?'is-loading':''}" ${sending?'disabled aria-busy="true"':''}>${sending?busyMarkup('Đang gửi'):'Chỉ chọn ảnh này & gửi'}</button></div>`;
  box.querySelectorAll('.gallery-item').forEach(b=>b.addEventListener('click',()=>{state.selectedImages[id]=b.dataset.path;renderGallery(id);}));
  box.querySelector('.choose-existing').addEventListener('click',e=>sendExistingThumb(id,e.currentTarget));
}
function setLightboxStatus(message,loading=true){
  els.lightboxStatus.innerHTML=loading?busyMarkup(message):esc(message);els.lightboxStatus.classList.toggle('is-loading',loading);els.lightboxStatus.classList.remove('hidden');els.lightboxImage.classList.add('hidden');els.lightboxStage.setAttribute('aria-busy',loading?'true':'false');
}
function renderLightbox(){
  const images=state.lightbox.images,total=images.length;
  els.lightboxPrev.disabled=total<=1;els.lightboxNext.disabled=total<=1;
  if(!total){els.lightboxCounter.textContent='';setLightboxStatus('Thẻ này chưa có ảnh để xem.',false);return;}
  state.lightbox.index=(state.lightbox.index+total)%total;
  const path=images[state.lightbox.index],imageToken=++state.lightbox.imageRequest;
  els.lightboxCounter.textContent=`Ảnh ${state.lightbox.index+1} / ${total}`;
  els.lightboxImage.alt=`Ảnh thumbnail ${state.lightbox.index+1} / ${total}`;
  setLightboxStatus('Đang tải ảnh…');
  els.lightboxImage.onload=()=>{if(imageToken!==state.lightbox.imageRequest)return;els.lightboxStatus.classList.add('hidden');els.lightboxImage.classList.remove('hidden');els.lightboxStage.setAttribute('aria-busy','false');};
  els.lightboxImage.onerror=()=>{if(imageToken!==state.lightbox.imageRequest)return;setLightboxStatus('Không tải được ảnh này. Bạn vẫn có thể chuyển sang ảnh khác.',false);};
  els.lightboxImage.src=imageUrl(path);
}
async function openLightbox(id,startPath='',trigger=null){
  const request=++state.lightbox.request;
  state.lightbox.id=String(id);state.lightbox.images=[];state.lightbox.index=0;state.lightbox.returnFocus=trigger||document.activeElement;
  els.lightboxCounter.textContent='';els.lightboxPrev.disabled=true;els.lightboxNext.disabled=true;setLightboxStatus('Đang tải danh sách ảnh…');
  if(!els.lightbox.open)els.lightbox.showModal();
  document.body.classList.add('lightbox-open');els.lightboxClose.focus();
  try{
    const gallery=await getThumbImages(id);
    if(request!==state.lightbox.request||!els.lightbox.open)return;
    state.galleries[id]=gallery.images;state.serverSelected[id]=gallery.selected;
    state.lightbox.images=gallery.images;
    const start=gallery.images.findIndex(p=>sameImage(p,startPath));state.lightbox.index=start>=0?start:0;
    renderLightbox();
  }catch(e){if(request===state.lightbox.request&&els.lightbox.open)setLightboxStatus(e.message||'Không tải được danh sách ảnh.',false);}
}
function moveLightbox(step){if(state.lightbox.images.length<=1)return;state.lightbox.index+=step;renderLightbox();}
function closeLightbox(){if(els.lightbox.open)els.lightbox.close();}
function cleanupLightbox(){
  state.lightbox.request++;state.lightbox.imageRequest++;state.lightbox.images=[];els.lightboxImage.onload=null;els.lightboxImage.onerror=null;els.lightboxImage.removeAttribute('src');document.body.classList.remove('lightbox-open');
  const target=state.lightbox.returnFocus;state.lightbox.returnFocus=null;if(target?.isConnected)requestAnimationFrame(()=>target.focus());
}
async function sendExistingThumb(id,btn){
  if(state.sending[id])return;
  const image=state.selectedImages[id]; if(!image){setNotice('Hãy chọn một ảnh trước.',true);return;}
  state.sending[id]=true;setButtonBusy(btn,true,'Đang gửi');renderGallery(id);let failed=false;
  try{
    const exclusive=await selectExclusiveThumb(id,image);
    if(!exclusive)throw new Error('Web chính chưa xác nhận chỉ chọn duy nhất ảnh này. App đã dừng để không gửi nhầm.');
    state.serverSelected[id]=storySelections(exclusive);state.galleries[id]=storyImages(exclusive);
    const done=await api(`/api/story/thumb_done/${encodeURIComponent(id)}`,{method:'POST',body:JSON.stringify({image})});
    await new Promise(resolve=>setTimeout(resolve,250));
    const checked=await getStoryDetail(id), selected=storySelections(checked);
    state.serverSelected[id]=selected;state.galleries[id]=storyImages(checked);
    if(selected.length!==1||!sameImage(selected[0],image))throw new Error('Web chính chưa giữ đúng một ảnh được chọn. App không ẩn thẻ.');
    const chosen=done.default_img||done.image||storyPreferred(checked);
    if(!sameImage(chosen,image))throw new Error(`Web chính trả về ảnh mặc định khác ảnh đã chọn (${String(chosen||'không xác định').split('/').pop()}). App không ẩn thẻ.`);
    state.hidden.add(String(id));writeStoredJson('thumbDeskDone',[...state.hidden]);setNotice('Đã chọn đúng ảnh mặc định và gửi thumb.');await loadStories();
  }catch(e){failed=true;setCardStatus(id,e.message,true);setNotice(e.message,true);}
  finally{state.sending[id]=false;if(btn.isConnected)setButtonBusy(btn,false);const box=document.getElementById(`gallery-${id}`);if(failed||(box&&!box.classList.contains('hidden')&&box.querySelector('.choose-existing.is-loading')))renderGallery(id);}
}

function storyImages(detail){
  const story=storyData(detail)||{};
  return [...(Array.isArray(story.thumb_all)?story.thumb_all:[]),...(Array.isArray(story.thumbs?.images)?story.thumbs.images:[]),...(Array.isArray(story.images)?story.images:[])].filter(Boolean).filter((p,i,all)=>all.findIndex(x=>sameImage(x,p))===i);
}
async function getStoryDetail(id){return storyData(await api(`/api/stories/${encodeURIComponent(id)}?fresh=${Date.now()}`));}
async function persistThumbChoice(id,detail,image,choose=true){
  const t=detail.thumbs||{}, images=[image,...thumbPaths(detail).filter(x=>!sameImage(x,image))];
  const thumbs={...t,images,selected:[image]};
  if(choose)thumbs.best_thumb=image;
  return api(`/api/stories/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify({human_pick:!!choose,thumbs})});
}
async function waitUntilAttached(id,image,exclusive=false){
  for(let i=0;i<10;i++){
    const detail=await getStoryDetail(id), attached=thumbPaths(detail).some(p=>sameImage(p,image)), selected=storySelections(detail);
    if(attached&&(!exclusive||(selected.length===1&&sameImage(selected[0],image))))return detail;
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  return null;
}
async function selectExclusiveThumb(id,image){
  await api(`/api/story/add_thumb/${encodeURIComponent(id)}`,{method:'POST',body:JSON.stringify({path:image,select:true})});
  const attached=await waitUntilAttached(id,image,false);
  if(!attached)throw new Error('Ảnh đã upload nhưng web chính chưa gắn ảnh vào bài.');
  const selected=storySelections(attached);
  if(selected.length===1&&sameImage(selected[0],image))return attached;
  try{await persistThumbChoice(id,attached,image,true);}
  catch(error){throw new Error(`Ảnh đã được gắn nhưng API chưa cho phép bỏ chọn ảnh cũ: ${error.message}`);}
  return waitUntilAttached(id,image,true);
}
async function uploadNewImage(id,file,zone){
  if(state.uploading[id]?.busy)return;
  state.uploading[id]={busy:true};zone.classList.add('uploading');zone.setAttribute('aria-busy','true');
  const card=zone.closest('.card'),preview=card.querySelector('.pending-preview');
  const dropLabel=zone.querySelector('b'),dropLabelHtml=dropLabel?.innerHTML||'';if(dropLabel)dropLabel.innerHTML=busyMarkup('Đang upload và chọn ảnh…');
  if(preview.dataset.url)URL.revokeObjectURL(preview.dataset.url);
  const localUrl=URL.createObjectURL(file);preview.dataset.url=localUrl;preview.innerHTML=`<img src="${localUrl}" alt="Ảnh đang upload"><div><b>${busyMarkup('Đang upload · Tôi làm tay')}</b><small>${esc(file.name)}</small></div>`;preview.classList.remove('hidden');
  try{
    setCardStatus(id,'Đang upload ảnh lên web chính…',false,true);
    const before=await getStoryDetail(id);
    const form=new FormData(); form.append('file',file,file.name); form.append('story_id',id); form.append('declared','handmade');
    const uploaded=await api('/api/thumbs/upload',{method:'POST',body:form});
    const image=uploaded.path;
    if(!image) throw new Error('Server không trả về đường dẫn ảnh vừa upload.');
    state.uploading[id]={busy:true,path:image};
    setCardStatus(id,'Đã upload. Đang chọn duy nhất ảnh mới trên web chính…',false,true);
    const attached=await selectExclusiveThumb(id,image);
    if(!attached)throw new Error('Ảnh đã upload nhưng web chính chưa xác nhận đây là ảnh duy nhất được chọn.');
    const serverImages=attached?storyImages(attached):[image,...storyImages(before)];
    state.galleries[id]=[image,...serverImages.filter(x=>!sameImage(x,image))];state.serverSelected[id]=storySelections(attached);state.selectedImages[id]=image;
    if(preview.dataset.url){URL.revokeObjectURL(preview.dataset.url);preview.dataset.url='';}
    render();
    const galleryBox=document.getElementById(`gallery-${id}`);if(galleryBox){galleryBox.classList.remove('hidden');renderGallery(id);}
    setCardStatus(id,'Đã upload. Web chính chỉ còn chọn ảnh mới (viền xanh); kiểm tra rồi bấm “Chỉ chọn ảnh này & gửi”.');
    state.uploading[id]={busy:false,path:image};
  }catch(e){state.uploading[id]={busy:false};const previewLabel=preview.querySelector('b');if(previewLabel)previewLabel.textContent='⚠ Upload chưa hoàn tất';setCardStatus(id,e.message,true);setNotice(e.message,true);}
  finally{if(zone.isConnected){zone.classList.remove('uploading');zone.removeAttribute('aria-busy');if(dropLabel)dropLabel.innerHTML=dropLabelHtml;const input=zone.querySelector('.file-input');if(input)input.value='';}}
}

function syncKeyUi(){
  const saved=Boolean(getKey());
  $('#keyButton').textContent=saved?'Đổi API':'Kết nối API';
  els.keyDialogTitle.textContent=saved?'Đổi API key':'Nhập API key';
  els.clearKey.classList.toggle('hidden',!saved);
}
$('#keyButton').addEventListener('click',()=>{syncKeyUi();els.apiKey.value='';els.dialog.showModal();});
$('.dialog-close').addEventListener('click',()=>els.dialog.close());
$('#keyForm').addEventListener('submit',async e=>{e.preventDefault();const value=els.apiKey.value.trim(),button=$('#keySubmitButton');if(!value||button.dataset.busy==='true')return;setButtonBusy(button,true,'Đang kết nối');try{const persistent=await storeKey(value);syncKeyUi();els.apiKey.value='';els.dialog.close();if(!persistent)setNotice('Trình duyệt chỉ cho lưu API trong tab này.',true);await loadStories();}finally{if(button.isConnected)setButtonBusy(button,false);}});
els.clearKey.addEventListener('click',async()=>{
  if(!confirm('Xóa API key đã lưu trên trình duyệt này?'))return;
  setButtonBusy(els.clearKey,true,'Đang xóa');await removeStoredKey();location.reload();
});
els.lightboxClose.addEventListener('click',closeLightbox);els.lightboxPrev.addEventListener('click',()=>moveLightbox(-1));els.lightboxNext.addEventListener('click',()=>moveLightbox(1));
els.lightbox.addEventListener('close',cleanupLightbox);els.lightbox.addEventListener('click',e=>{if(e.target===els.lightbox||e.target===els.lightboxStage)closeLightbox();});
document.addEventListener('keydown',e=>{if(!els.lightbox.open)return;if(e.key==='ArrowLeft'){e.preventDefault();moveLightbox(-1);}else if(e.key==='ArrowRight'){e.preventDefault();moveLightbox(1);}});
$('#refreshButton').addEventListener('click',loadStories); els.date.addEventListener('change',()=>{updateDateDisplay();loadStories();}); [els.channel,els.niche].forEach(x=>x.addEventListener('change',render)); els.search.addEventListener('input',render);
document.querySelectorAll('[data-image-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-image-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.imageFilter=b.dataset.imageFilter;render();}));
function bootstrap(){
  initializeKeyStore();
  updateDateDisplay();
  syncKeyUi();
  if(getKey())loadStories();else els.dialog.showModal();
}
bootstrap();
