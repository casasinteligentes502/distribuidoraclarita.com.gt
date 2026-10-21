(function(){'use strict';
 const C=window.Clarita,conf=C.conf,grid=document.getElementById('productsGrid');
 const $=id=>document.getElementById(id), escape=C.escapeHtml;
 const labels={ceras:'Ceras vegetales',mechas:'Mechas y pabilos',aromas:'Esencias aromáticas',colorantes:'Colorantes',moldes:'Moldes',accesorios:'Accesorios'};
 let products=[],category='todos',search='',sort='default';
 let cart={};try{const saved=JSON.parse(localStorage.getItem('clarita_cart_v1')||'{}');if(saved&&typeof saved==='object')cart=saved}catch(_){}
 function saveCart(){try{localStorage.setItem('clarita_cart_v1',JSON.stringify(cart))}catch(_){}updateCount()}
 function getProduct(id){return products.find(p=>p.id===id)}
 function updateCount(){let total=Object.values(cart).reduce((n,x)=>n+Number(x.qty||0),0);$('cartCount').textContent=total;$('drawerCount').textContent=total+' unidad'+(total===1?'':'es')}
 function toast(message){let t=$('toast');t.textContent=message;t.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.hidden=true,2600)}
 function getVisible(){return products.filter(p=>p.active!==false&&(category==='todos'||p.category===category)&&(!search||(`${p.name} ${p.description} ${p.unit_label}`).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(search))).sort((a,b)=>{if(sort==='az')return a.name.localeCompare(b.name);if(sort==='price-asc')return Number(a.price??Infinity)-Number(b.price??Infinity);if(sort==='price-desc')return Number(b.price??-1)-Number(a.price??-1);return (a.sort_order||0)-(b.sort_order||0)})}
 function draw(){const list=getVisible();$('resultCount').textContent=`${list.length} producto${list.length===1?'':'s'} disponibles en el catálogo`;grid.innerHTML=list.map(p=>{
 const soldout=p.stock!==null&&p.stock!==undefined&&Number(p.stock)<=0, known=p.price!==null&&p.price!==undefined&&p.price!=='';
 return `<article class="product-card"><div class="product-photo"><img src="${escape(C.safeImage(p.image))}" alt="${escape(p.alt||p.name)}" loading="lazy" decoding="async"><span class="product-tag">${escape(labels[p.category]||'Producto')}</span>${p.promo?`<span class="product-promo">${escape(p.promo)}</span>`:''}</div><div class="product-body"><span class="product-category">${escape(labels[p.category]||'Producto')}</span><h3>${escape(p.name)}</h3><p class="product-description">${escape(p.description||'Consulta más detalles por WhatsApp.')}</p><span class="product-unit">${escape(p.unit_label||'Presentación por confirmar')}</span>${soldout?'<small class="stock-note out">Agotado temporalmente</small>':p.stock===null||p.stock===undefined?'<small class="stock-note">Existencia por confirmar</small>':''}</div><div class="product-bottom"><span class="product-price${known?'':' unknown'}">${escape(C.formatPrice(p.price))}</span><button type="button" class="add-product" data-add="${escape(p.id)}" ${soldout?'disabled':''}><svg class="ico"><use href="#plus"/></svg> ${soldout?'Agotado':'Agregar'}</button></div></article>`}).join('');$('emptyResults').hidden=list.length>0;grid.hidden=list.length===0;
 }
 function openCart(){renderCart();$('drawerBackdrop').hidden=false;$('cartDrawer').classList.add('open');$('cartDrawer').setAttribute('aria-hidden','false');document.body.classList.add('drawer-open');$('closeCart').focus()}
 function closeCart(){ $('cartDrawer').classList.remove('open');$('cartDrawer').setAttribute('aria-hidden','true');$('drawerBackdrop').hidden=true;document.body.classList.remove('drawer-open');$('openCart').focus()}
 function renderCart(){let items=Object.entries(cart).filter(([id,x])=>getProduct(id)&&Number(x.qty)>0);let total=0,unpriced=0;
 $('cartItems').innerHTML=items.length?items.map(([id,x])=>{const p=getProduct(id),qty=Math.max(1,Math.min(999,Number(x.qty)||1));let known=p.price!==null&&p.price!==undefined&&p.price!=='';if(known)total+=Number(p.price)*qty;else unpriced++;return `<div class="cart-item"><img src="${escape(C.safeImage(p.image))}" alt="${escape(p.alt||p.name)}"><div><h3>${escape(p.name)}</h3><p>${escape(C.formatPrice(p.price))}${known?' c/u':''}</p><div class="cart-line"><div class="qty-controls"><button data-minus="${escape(id)}" aria-label="Restar unidad a ${escape(p.name)}">−</button><strong>${qty}</strong><button data-plus="${escape(id)}" aria-label="Agregar unidad a ${escape(p.name)}">+</button></div><button class="remove-item" data-remove="${escape(id)}">Eliminar</button></div></div></div>`}).join(''):`<div class="cart-empty"><svg class="ico"><use href="#bag"/></svg><h3>Tu carrito está vacío</h3><p>Elige tus productos favoritos y agrégalos para solicitar una cotización.</p><button class="btn btn-outline" id="browseProducts">Explorar catálogo</button></div>`;
 $('cartTotal').textContent=items.length&&unpriced===items.length?'Por cotizar':C.formatPrice(total);$('cartTotalNote').textContent=unpriced?`Subtotal parcial. ${unpriced} producto${unpriced===1?'':'s'} sin precio publicado. El total final y el envío se confirman por WhatsApp.`:'Precios sujetos a confirmación de existencia y envío por WhatsApp.';$('sendOrder').disabled=!items.length;updateCount();
 }
 function modify(id,add){let p=getProduct(id);if(!p)return;const current=Number(cart[id]?.qty||0);let quantity=Math.max(0,Math.min(999,current+add));if(p.stock!=null&&Number(p.stock)<=0&&add>0){toast('Producto temporalmente agotado');return}if(p.stock!=null&&quantity>Number(p.stock)){toast('Cantidad superior a existencias');return}if(quantity===0)delete cart[id];else cart[id]={qty:quantity};saveCart();renderCart();if(add>0)toast('Producto agregado a tu pedido')}
 function checkout(){const items=Object.entries(cart).filter(([id,x])=>getProduct(id)&&Number(x.qty)>0);if(!items.length)return;const name=$('clientName').value.trim(),city=$('clientCity').value.trim(),delivery=$('deliveryType').value,notes=$('orderNotes').value.trim();if(!name||!city){$('cartError').textContent='Por favor escribe tu nombre y municipio/departamento.';$('cartError').hidden=false;(!name?$('clientName'):$('clientCity')).focus();return}$('cartError').hidden=true;let amount=0,unknown=false;let lines=items.map(([id,x])=>{const p=getProduct(id),unit=p.price;const hasPrice=unit!==null&&unit!==undefined&&unit!=='';if(!hasPrice)unknown=true;else amount+=Number(unit)*x.qty;return `• ${p.name} (${p.unit_label||'presentación por confirmar'})\n  Cantidad: ${x.qty} | ${hasPrice?C.formatPrice(unit)+' c/u':'Precio por confirmar'}`});let message=`🕯️ *PEDIDO — DISTRIBUIDORA CLARITA*\n\n*Cliente:* ${name}\n*Destino:* ${city}\n*Entrega:* ${delivery}\n\n*PRODUCTOS SOLICITADOS*\n${lines.join('\n\n')}\n\n*${unknown?'Subtotal conocido (no incluye productos por cotizar)':'Subtotal de productos'}:* ${unknown&&items.every(([id])=>{const u=getProduct(id).price;return u===null||u===undefined||u===''})?'Por cotizar':C.formatPrice(amount)}\n*Nota:* Existencias, precios y transporte sujetos a confirmación.\n${notes?'\n*Comentarios:* '+notes+'\n':''}\n¡Hola! Quisiera confirmar disponibilidad, total y forma de pago. `;
 const url=C.makeWhatsapp(message);const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';document.body.appendChild(link);link.click();link.remove()}
 function changeCategory(value){category=value;document.querySelectorAll('[data-category]').forEach(b=>{b.classList.toggle('active',b.dataset.category===value);b.setAttribute('aria-pressed',String(b.dataset.category===value))});draw()}
 document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>changeCategory(b.dataset.category)));
 document.querySelectorAll('[data-go-category]').forEach(el=>el.addEventListener('click',()=>{changeCategory(el.dataset.goCategory)}));
 $('productSearch').addEventListener('input',e=>{search=e.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();draw()});$('productSort').addEventListener('change',e=>{sort=e.target.value;draw()});$('resetFilters').addEventListener('click',()=>{search='';$('productSearch').value='';changeCategory('todos')});
 grid.addEventListener('click',e=>{const btn=e.target.closest('[data-add]');if(btn){modify(btn.dataset.add,1);openCart()}});
 $('openCart').addEventListener('click',openCart);$('closeCart').addEventListener('click',closeCart);$('drawerBackdrop').addEventListener('click',closeCart);window.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('cartDrawer').classList.contains('open'))closeCart()});
 $('cartItems').addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;if(el.dataset.plus)modify(el.dataset.plus,1);if(el.dataset.minus)modify(el.dataset.minus,-1);if(el.dataset.remove){delete cart[el.dataset.remove];saveCart();renderCart()}if(el.id==='browseProducts'){closeCart();document.getElementById('catalogo').scrollIntoView({behavior:'smooth'})}});
 // Opciones interactivas de «Así de fácil».
 function showCatalog(){
   search='';$('productSearch').value='';changeCategory('todos');
   $('catalogo').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 }
 $('stepExplore').addEventListener('click',showCatalog);
 $('stepBuild').addEventListener('click',()=>{openCart();if(!Object.keys(cart).length)toast('Elige tus productos en el catálogo y agrégalos al carrito.')});
 $('stepConfirm').addEventListener('click',()=>{
   openCart();
   if(!Object.entries(cart).some(([id,item])=>getProduct(id)&&Number(item.qty)>0)){
     toast('Primero agrega productos a tu pedido.');return;
   }
   toast('Completa tus datos y pulsa «Enviar pedido por WhatsApp».');
   $('clientName').focus({preventScroll:true});
   $('clientName').scrollIntoView({behavior:'smooth',block:'nearest'});
 });
 const deliveryDialog=$('deliveryDialog');
 $('stepDelivery').addEventListener('click',()=>deliveryDialog.showModal());
 $('closeDelivery').addEventListener('click',()=>deliveryDialog.close());
 deliveryDialog.addEventListener('click',e=>{if(e.target===deliveryDialog)deliveryDialog.close()});
 document.querySelectorAll('[data-select-delivery]').forEach(btn=>btn.addEventListener('click',()=>{
   $('deliveryType').value=btn.dataset.selectDelivery;
   deliveryDialog.close();
   if(!Object.entries(cart).some(([id,item])=>getProduct(id)&&Number(item.qty)>0)){
     showCatalog();toast('Selecciona productos; el tipo de entrega quedó preparado en tu pedido.');
   }else{
     openCart();toast('Entrega seleccionada. Confírmala al enviar tu pedido por WhatsApp.');
   }
 }));
 $('sendOrder').addEventListener('click',checkout);$('year').textContent=new Date().getFullYear();
 $('menuToggle').addEventListener('click',()=>{const nav=$('mobileNav');nav.hidden=!nav.hidden;$('menuToggle').setAttribute('aria-expanded',String(!nav.hidden))});document.querySelectorAll('#mobileNav a').forEach(a=>a.addEventListener('click',()=>{$('mobileNav').hidden=true;$('menuToggle').setAttribute('aria-expanded','false')}));
 async function init(){try{products=await C.getProducts();draw()}catch(err){console.warn('No se pudo conectar al catálogo remoto:',err);products=C.seed;draw();toast('Catálogo temporal; verifica existencias por WhatsApp')}updateCount();renderCart();if(!C.ready)$('catalogInfo').textContent='Catálogo de muestra. Precios y existencias pendientes de confirmar por WhatsApp.'}
 init();
})();
