(function () {
  'use strict';
  const conf = window.CLARITA_CONFIG || {};
  const seed = window.CLARITA_SEED_PRODUCTS || [];
  const storeKey = 'clarita_demo_catalog_v1';
  const authKey = 'clarita_admin_session_v1';
  const ready = !!(conf.supabaseUrl && conf.supabaseAnonKey && /^https:\/\//.test(conf.supabaseUrl));
  const base = String(conf.supabaseUrl || '').replace(/\/$/, '');
  const anon = conf.supabaseAnonKey || '';
  const escapeHtml = (str) => String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeImage = (value) => {
    const s=String(value || '');
    return /^(assets\/[^\s<>"']+|https:\/\/[^\s<>"']+)$/.test(s) ? s : 'assets/brand/logo-clarita.webp';
  };
  const formatPrice = (n) => n === null || n === undefined || n === '' || !Number.isFinite(Number(n)) ? 'Precio por confirmar' : 'Q ' + Number(n).toLocaleString('es-GT',{minimumFractionDigits:2,maximumFractionDigits:2});
  function getLocal() {
    try { const v=JSON.parse(localStorage.getItem(storeKey)); return Array.isArray(v) ? v : structuredClone(seed); } catch (_) { return structuredClone(seed); }
  }
  function saveLocal(items) { try{localStorage.setItem(storeKey,JSON.stringify(items))}catch(_){/* Vista local con almacenamiento restringido */} }
  function session() { try { return JSON.parse(sessionStorage.getItem(authKey) || 'null'); } catch (_) { return null; } }
  function setSession(s) { if(s) sessionStorage.setItem(authKey,JSON.stringify(s));else sessionStorage.removeItem(authKey); }
  async function api(path, {method='GET', body, token, headers={}}={}) {
    const h = {'apikey':anon,'Authorization':'Bearer '+(token || anon), ...headers};
    if (body !== undefined && !(body instanceof Blob)) h['Content-Type']='application/json';
    const response = await fetch(base+path,{method,headers:h,body:body===undefined?undefined:(body instanceof Blob ? body : JSON.stringify(body)),cache:'no-store'});
    if(!response.ok) { let err;try{err=await response.json()}catch(_){err={message:response.statusText}};throw new Error(err.message||err.error_description||err.msg||`Error ${response.status}`); }
    if(response.status===204)return null;
    const ct=response.headers.get('content-type')||'';
    return ct.includes('json')?response.json():response.text();
  }
  async function getProducts({admin=false}={}) {
    if(!ready) return getLocal().sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
    const s=admin?await ensureSession():null;
    return await api('/rest/v1/products?select=*&order=sort_order.asc',{token:s?.access_token});
  }
  async function login(email,password) {
    const r=await api('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
    setSession(r);
    return r;
  }
  async function ensureSession() {
    let s=session();if(!s)throw new Error('Debes iniciar sesión.');
    if(s.expires_at && Date.now()/1000<s.expires_at-90)return s;
    if(!s.refresh_token)throw new Error('Sesión vencida: vuelve a ingresar.');
    const r=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:s.refresh_token}});
    setSession(r);return r;
  }
  async function isAdmin() {
    if(!ready)return true;
    const s=await ensureSession();
    const user=await api('/auth/v1/user',{token:s.access_token});
    const rows=await api('/rest/v1/admins?select=user_id&user_id=eq.'+encodeURIComponent(user.id),{token:s.access_token});
    return Array.isArray(rows) && rows.length>0;
  }
  async function upsertProduct(product) {
    if(!ready){const all=getLocal();const index=all.findIndex(p=>p.id===product.id);if(index>=0)all[index]=product;else all.push(product);saveLocal(all);return;}
    const s=await ensureSession();
    return api('/rest/v1/products?on_conflict=id',{method:'POST',token:s.access_token,body:product,headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});
  }
  async function deleteProduct(id) {
    if(!ready){saveLocal(getLocal().filter(x=>x.id!==id));return;}
    const s=await ensureSession();
    return api('/rest/v1/products?id=eq.'+encodeURIComponent(id),{method:'DELETE',token:s.access_token,headers:{Prefer:'return=minimal'}});
  }
  async function uploadImage(file) {
    if(!ready)throw new Error('Para subir fotografías y publicarlas debes conectar Supabase.');
    if(!file.type.match(/^image\/(jpeg|png|webp)$/))throw new Error('Solo se aceptan imágenes JPG, PNG o WEBP.');
    if(file.size>4*1024*1024)throw new Error('La imagen supera los 4 MB.');
    const s=await ensureSession();
    const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    const dest=Date.now()+'-'+Math.random().toString(36).slice(2,10)+'.'+ext;
    const path='/storage/v1/object/catalogo/'+dest;
    await api(path,{method:'POST',body:file,token:s.access_token,headers:{'Content-Type':file.type,'x-upsert':'false'}});
    return base+'/storage/v1/object/public/catalogo/'+dest;
  }
  function makeWhatsapp(text) {return 'https://wa.me/'+String(conf.phone || '50258304062').replace(/\D/g,'')+'?text='+encodeURIComponent(text);}
  window.Clarita={conf,seed,ready,getProducts,getLocal,saveLocal,storeKey,authKey,session,login,ensureSession,isAdmin,setSession,upsertProduct,deleteProduct,uploadImage,escapeHtml,safeImage,formatPrice,makeWhatsapp};
})();
