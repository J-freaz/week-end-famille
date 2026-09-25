'use strict';
const $=id=>document.getElementById(id);
const BACKEND='https://courses-week-end-famille.j-freaz91540.chatgpt.site';
const API=location.origin===BACKEND?'':BACKEND;
const categories=['Fruits et légumes','Frais','Viandes et poissons','Surgelés','Épicerie','Boulangerie','Boissons','Autres'];
const days=[
 {label:'Apéro à partager',apero:true,meals:[{id:'weekend-apero',label:'Pour tout le week-end · choisissez parmi les propositions'}]},
 {label:'Samedi 24 octobre',meals:[{id:'sat-dinner',label:'Dîner · pendant le jeu'}]},
 {label:'Dimanche 25 octobre',meals:[{id:'sun-breakfast',label:'Petit-déjeuner'},{id:'sun-lunch',label:'Déjeuner · hors courses',fixed:'Restaurant',detail:'L’Auberge des Roux.'},{id:'sun-dinner',label:'Dîner'}]},
 {label:'Lundi 26 octobre',meals:[{id:'mon-breakfast',label:'Petit-déjeuner'}]}
];
let state=null,busy=false,poll=null,pollRunning=false,selectedQuantity=null,selectedItem=null,selectedMeal=null,selectedDish=null,actorId='',personId='';
try{actorId=localStorage.getItem('family-profile-id')||'';personId=actorId;}catch{}
let soundEnabled=true,soundContext=null,soundLoad=null,soundSource=null;
try{soundEnabled=localStorage.getItem('family-dragon-sound')!=='off';}catch{}
function renderSound(){
 $('soundToggle').textContent=soundEnabled?'🔊 Son activé':'🔇 Son coupé';
 $('soundToggle').setAttribute('aria-pressed',String(soundEnabled));
 $('soundToggle').setAttribute('aria-label',soundEnabled?'Couper le son Dracarys':'Activer le son Dracarys');
 $('soundTest').disabled=!soundEnabled;
}
function prepareDragon(){
 if(!soundEnabled)return null;
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return null;
  if(!soundContext)soundContext=new Audio();
  if(soundContext.state!=='running')soundContext.resume().catch(()=>{});
  if(!soundLoad)soundLoad=fetch('dracarys.mp3?v=provided-8').then(r=>{if(!r.ok)throw new Error('Audio unavailable');return r.arrayBuffer();}).then(b=>soundContext.decodeAudioData(b)).catch(()=>{soundLoad=null;return null;});
  return soundLoad;
 }catch{return null;}
}
async function playDragon(test=false){
 try{
  const buffer=await prepareDragon();
  if(!soundEnabled||document.hidden)return;
  if(!buffer||soundContext?.state!=='running'){if(test)$('soundFeedback').textContent='Le son est indisponible sur ce navigateur. Les quantités restent enregistrables.';return;}
  if(soundSource){try{soundSource.stop();}catch{}}
  const source=soundContext.createBufferSource(),gain=soundContext.createGain();
  source.buffer=buffer;gain.gain.value=.65;source.connect(gain);gain.connect(soundContext.destination);soundSource=source;
  source.onended=()=>{source.disconnect();gain.disconnect();if(soundSource===source)soundSource=null;};
  source.start();$('soundFeedback').textContent='🔥 Dracarys !';
 }catch{if(test)$('soundFeedback').textContent='Le son est indisponible. Vous pouvez continuer à renseigner vos quantités.';}
}
$('soundToggle').onclick=()=>{
 soundEnabled=!soundEnabled;try{localStorage.setItem('family-dragon-sound',soundEnabled?'on':'off');}catch{}
 if(!soundEnabled&&soundSource){try{soundSource.stop();}catch{}soundSource=null;}
 $('soundFeedback').textContent='';renderSound();
};
$('soundTest').onclick=()=>{void playDragon(true);};
renderSound();
const number=new Intl.NumberFormat('fr-FR',{maximumFractionDigits:3});
function node(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
function amount(milli,unit){return number.format(milli/1000)+' '+unit+(['unité','pièce','pizza','tranche','baguette','paquet','boîte'].includes(unit)&&milli>=2000?'s':'');}
function personName(id){return state?.profiles.find(p=>p.id===id)?.name||'Profil inconnu';}
function entry(itemId,profileId=personId){return state?.requests.find(r=>r.item_id===itemId&&r.profile_id===profileId);}
function requestLabel(r,item){return amount(r.amount_milli,item.unit)+(r.amount_milli>0?(r.variant?' · '+r.variant:item.choice_required?' · choix à préciser':''):'');}
function completeRequest(r,item){return !!r&&!(item.choice_required&&r.amount_milli>0&&!r.variant_key);}
function choiceGroups(item){
 const groups=new Map();for(const r of state.requests.filter(r=>r.item_id===item.id&&r.amount_milli>0)){
  const key=r.variant_key||'',label=r.variant||(item.choice_required?'Choix à préciser':'Sans préférence');
  if(!groups.has(key))groups.set(key,{label,total:0,people:[]});const g=groups.get(key);g.total+=r.amount_milli;g.people.push(`${personName(r.profile_id)} (${amount(r.amount_milli,item.unit)})`);
 }return [...groups.values()].sort((a,b)=>a.label.localeCompare(b.label,'fr'));
}
function rememberActor(){try{localStorage.setItem('family-profile-id',actorId);}catch{}}
async function api(path,method='GET',data){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(API+path,{method,credentials:API?'omit':'same-origin',cache:'no-store',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,signal:controller.signal});
  let result;try{result=await response.json();}catch{throw new Error('Le service de sauvegarde ne répond pas correctement. Réessayez.');}
  if(!response.ok){const e=new Error(result.error||'La modification n’a pas pu être enregistrée.');e.status=response.status;throw e;}return result;
 }catch(e){if(e.name==='AbortError'||e instanceof TypeError)throw new Error('Connexion interrompue. Votre saisie est conservée : réessayez.');throw e;}
 finally{clearTimeout(timeout);}
}
function connected(ok){$('connection').textContent=ok?'Liste commune · les quantités sont enregistrées pour toute la famille.':'Connexion interrompue · la dernière liste chargée peut être incomplète.';$('connection').classList.toggle('offline',!ok);$('retry').hidden=ok;}
function renderProfiles(){
 const profiles=state.profiles;if(!profiles.some(p=>p.id===actorId)){actorId='';personId='';}
 if(!profiles.some(p=>p.id===personId))personId=actorId;
 for(const [id,value,placeholder] of [['actor',actorId,'Choisir mon prénom'],['person',personId,'Choisir une personne']]){
  const select=$(id),empty=node('option',placeholder);empty.value='';select.replaceChildren(empty,...profiles.map(p=>{const o=node('option',p.name);o.value=p.id;return o;}));select.value=value;
 }
 $('person').disabled=!actorId;$('createProfile').disabled=false;
 $('needsTitle').textContent=personId?`Les quantités de ${personName(personId)}`:'Les quantités souhaitées';
 $('personHint').textContent=!actorId?'Choisissez votre prénom ou créez votre profil pour renseigner vos quantités.':personId!==actorId?`${personName(actorId)}, vous renseignez pour ${personName(personId)}. Le récapitulatif gardera les deux prénoms.`:`Renseignez vos besoins pour tout le week-end. Pour un proche, choisissez son prénom dans « Je renseigne pour ».`;
}
function renderMeals(){
 $('days').replaceChildren(...days.map(day=>{
  const card=node('article',undefined,day.apero?'day apero':'day');card.append(node('h3',day.label));
  for(const slot of day.meals){
   const meal=node('div',undefined,'meal');meal.append(node('div',slot.label,'kind'));
   if(slot.fixed){meal.append(node('strong',slot.fixed),node('p',slot.detail,'muted'));card.append(meal);continue;}
   const dishes=(state.dishes||[]).filter(d=>d.meal_id===slot.id);
   if(!dishes.length)meal.append(node('p','Aucun plat prévu pour ce repas.','muted'));
   for(const dish of dishes){
    const row=node('div',undefined,'dish'),controls=node('div',undefined,'dish-actions');row.append(node('strong',dish.title));
    const item=state.items.find(i=>i.id===dish.item_id);
    if(item){const qty=node('button','Mes quantités','secondary');qty.setAttribute('aria-label','Renseigner mes quantités : '+dish.title);qty.onclick=()=>openQuantity(item);controls.append(qty);}
    if(state.isAdmin){
     const edit=node('button','Modifier','secondary');edit.setAttribute('aria-label','Modifier le plat : '+dish.title);edit.onclick=()=>openDishEdit(dish);
     const remove=node('button','Retirer','secondary');remove.setAttribute('aria-label','Retirer du repas : '+dish.title);remove.onclick=()=>removeDish(dish);
     controls.append(edit,remove);
    }
    row.append(controls);meal.append(row);
   }
   if(state.isAdmin){const add=node('button',day.apero?'+ Ajouter une proposition':'+ Ajouter un plat','primary');add.setAttribute('aria-label',`${day.apero?'Ajouter une proposition':'Ajouter un plat'} : ${day.label}, ${slot.label}`);add.onclick=()=>openDishAdd(slot,day);meal.append(add);}
   card.append(meal);
  }return card;
 }));
}
function openDishAdd(slot,day){
 selectedMeal={id:slot.id,label:`${day.label} · ${slot.label}`,requestId:crypto.randomUUID()};
 $('dishAddForm').reset();$('dishAddTitle').textContent=day.apero?'Ajouter une proposition pour l’apéro':'Ajouter un plat';$('dishAddMeal').textContent=selectedMeal.label;$('dishAddError').hidden=true;
 const available=state.items.filter(i=>!(state.dishes||[]).some(d=>d.meal_id===slot.id&&d.item_id===i.id));
 const first=node('option','Créer un nouveau plat');first.value='';$('dishSource').replaceChildren(first,...available.map(i=>{const o=node('option',i.name);o.value=i.id;return o;}));
 $('dishUnit').value='pièce';$('dishCategory').value='Frais';updateDishSource();$('dishAddDialog').showModal();$('dishName').focus();
}
function updateDishSource(){
 const existing=!!$('dishSource').value;$('newDishFields').hidden=existing;$('dishName').required=!existing;
 $('dishAddHint').textContent=existing?'Cet article sera aussi affiché à ce repas. Ses quantités restent communes pour tout le week-end, sans doublon.':'Ce plat sera ajouté au menu, à « Mes quantités » et aux courses. Pour une préparation maison, les ingrédients restent à ajuster séparément.';
}
function openDishEdit(dish){
 selectedDish={...dish};$('mealTitle').textContent='Modifier le plat';$('mealName').value=dish.title;$('mealError').hidden=true;
 $('dishEditHint').textContent=dish.item_id?'Le nom sera aussi modifié dans les quantités et les autres repas utilisant cet article. Les quantités déjà saisies sont conservées.':'Ce changement concerne le menu. Pour proposer un plat avec sa propre quantité, utilisez « Ajouter un plat ».';
 $('mealDialog').showModal();
}
async function removeDish(dish){
 if(busy||!confirm(`Retirer « ${dish.title} » de ce repas ? Les articles et les quantités déjà saisis restent dans la liste de courses.`))return;
 busy=true;try{await api('/api/meal-dishes/'+dish.id,'DELETE',{revision:dish.revision});await refresh(true);$('status').textContent='Plat retiré de ce repas. Les quantités existantes sont conservées.';}catch(e){$('status').textContent=e.message;await refresh(true);}finally{busy=false;}
}
function renderNeeds(){
 $('needsItems').replaceChildren();
 if(!state.items.length){$('needsItems').append(node('p','L’organisateur peut ajouter les premiers articles.','emptybox'));return;}
 const aperoIds=new Set((state.dishes||[]).filter(d=>d.meal_id==='weekend-apero').map(d=>d.item_id));
 const groups=[{label:'Apéro à partager',items:state.items.filter(i=>aperoIds.has(i.id))},...categories.map(category=>({label:category,items:state.items.filter(i=>i.category===category&&!aperoIds.has(i.id))}))];
 for(const group of groups){const items=group.items;if(!items.length)continue;const list=node('div',undefined,'list');list.append(node('h3',group.label));
  if(group.label==='Apéro à partager')list.append(node('p','Indiquez votre part pour tout le week-end, pas celle du groupe. Les aliments sont en grammes, les boissons en litres (25 cl = 0,25 L). Mettez 0 pour les propositions qui ne vous tentent pas.','apero-hint'));
  for(const item of items){const saved=entry(item.id),row=node('div',undefined,'request-row'),description=node('div');description.append(node('strong',item.name),node('small',saved?`Demandé : ${requestLabel(saved,item)}`:'Pas encore renseigné'));if(item.note)description.append(node('small',item.note));const b=node('button',saved?'Modifier':'Renseigner','secondary');b.setAttribute('aria-label',`Quantité souhaitée : ${item.name}`);b.onclick=()=>openQuantity(item);row.append(description,b);list.append(row);}$('needsItems').append(list);
 }
}
function renderRecap(){
 const completed=state.profiles.filter(p=>state.items.length&&state.items.every(i=>completeRequest(entry(i.id,p.id),i))).length;
 $('recapSummary').textContent=`${state.profiles.length} profil${state.profiles.length>1?'s':''} créé${state.profiles.length>1?'s':''} · ${completed} entièrement renseigné${completed>1?'s':''}. Base initiale : 10 personnes, à confirmer.`;
 $('recapPeople').replaceChildren();if(!state.profiles.length){$('recapPeople').append(node('p','Aucun profil créé pour le moment.','emptybox'));return;}
 for(const p of state.profiles){const entries=state.requests.filter(r=>r.profile_id===p.id),card=node('article',undefined,'recap-card');card.append(node('h3',p.name),node('p',`${state.items.filter(i=>completeRequest(entry(i.id,p.id),i)).length} / ${state.items.length} articles renseignés`,'muted'));
  if(p.created_by&&p.created_by!==p.id)card.append(node('small',`Profil créé par ${personName(p.created_by)}`));
  if(!entries.length)card.append(node('p','Quantités en attente.','muted'));
  const ul=node('ul');for(const item of state.items){const r=entries.find(x=>x.item_id===item.id);if(!r)continue;const li=node('li',`${item.name} : ${requestLabel(r,item)}`);li.append(node('small',`Renseigné par ${personName(r.updated_by)} · ${new Date(r.updated_at).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}`));ul.append(li);}card.append(ul);
  const missing=state.items.filter(i=>!completeRequest(entries.find(r=>r.item_id===i.id),i));if(missing.length)card.append(node('p','En attente : '+missing.map(i=>i.name).join(', ')+'.','muted'));
  const button=node('button','Renseigner pour '+p.name,'secondary');button.onclick=()=>{if(!actorId){$('status').textContent='Choisissez d’abord votre propre prénom dans « Je suis ».';$('actor').focus();return;}personId=p.id;render();showTab('needs');};card.append(button);$('recapPeople').append(card);
 }
}
function renderShopping(){
 const positive=state.items.filter(i=>i.total_milli>0),done=positive.filter(i=>i.done).length;
 $('count').textContent=String(positive.length);$('summary').textContent=`${done} / ${positive.length} articles à acheter cochés`;$('bar').style.width=`${positive.length?done/positive.length*100:0}%`;
 const pending=state.items.filter(i=>i.response_count<state.profiles.length||!i.response_count||state.requests.some(r=>r.item_id===i.id&&!completeRequest(r,i))).length;
 $('shoppingMissing').hidden=!pending;$('shoppingMissing').textContent=pending?`${pending} article${pending>1?'s':''} encore incomplet${pending>1?'s':''} : les totaux portent uniquement sur les quantités déjà renseignées. Vérifiez aussi que tous les participants ont un profil.`:'';
 $('items').replaceChildren();
 for(const category of categories){const group=state.items.filter(i=>i.category===category);if(!group.length)continue;const list=node('div',undefined,'list');list.append(node('h3',category));
  for(const item of group){const row=node('div',undefined,`row${item.done?' done':''}`),label=node('label'),check=node('input');check.type='checkbox';check.checked=item.done;check.disabled=!(item.total_milli>0)||state.requests.some(r=>r.item_id===item.id&&!completeRequest(r,item));check.dataset.itemId=item.id;
   check.onchange=()=>saveCheck(item,check);
   const description=node('span',item.name);description.append(node('small',item.total_milli===null?'Total en attente':`Total demandé : ${amount(item.total_milli,item.unit)}`,'quantity-total'),node('small',`${item.response_count} / ${state.profiles.length} profils renseignés`));
   if(item.choice_required||state.requests.some(r=>r.item_id===item.id&&r.variant)){
    const breakdown=node('span',undefined,'choice-breakdown');for(const g of choiceGroups(item)){breakdown.append(node('strong',`${g.label} : ${amount(g.total,item.unit)}`),node('small',g.people.join(' · ')));}if(breakdown.childNodes.length)description.append(breakdown);
   }
   if(item.quantity!=='À définir')description.append(node('small',`Repère pour le groupe : ${item.quantity}`));label.append(check,description);row.append(label);
   if(state.isAdmin){const edit=node('button','Article','secondary');edit.setAttribute('aria-label','Modifier l’article : '+item.name);edit.onclick=()=>openItem(item);const remove=node('button','×','remove');remove.setAttribute('aria-label','Supprimer '+item.name);remove.onclick=()=>removeItem(item);row.append(edit,remove);}list.append(row);
  }$('items').append(list);
 }
}
function render(){renderProfiles();renderMeals();renderNeeds();renderRecap();renderShopping();$('add').hidden=!state.isAdmin;$('organizer').hidden=state.isAdmin;$('adminMode').hidden=!state.isAdmin;}
async function refresh(force=false){if(busy&&!force)return false;try{const latest=await api('/api/state');const changed=JSON.stringify(latest)!==JSON.stringify(state);state=latest;connected(true);$('loadError').hidden=true;if(changed)render();return true;}catch(e){connected(false);$('loadError').textContent=e.message;$('loadError').hidden=false;return false;}}
function showTab(name){for(const id of ['meals','needs','recap','shopping']){$(id).hidden=id!==name;$(id+'Tab').setAttribute('aria-pressed',String(id===name));}}
function openQuantity(item){
 if(!actorId||!personId){$('status').textContent='Choisissez votre prénom avant de renseigner une quantité.';$('actor').focus();return;}
 const saved=entry(item.id);selectedQuantity={itemId:item.id,profileId:personId,actorId,revision:saved?.revision||0,unit:item.unit};
 $('quantityVariant').value=saved?.variant||'';$('quantityVariant').required=!!item.choice_required&&(!saved||saved.amount_milli>0);$('variantLabel').textContent=item.choice_required?'Votre choix (sauf si quantité = 0)':'Choix ou préférence (facultatif)';$('sharingHint').hidden=item.unit!=='pizza';
 $('quantityVariant').placeholder=item.unit==='pizza'?'Ex. : chèvre ou quatre fromages':'Ex. : nature, sans sucre, parfum préféré';
 const apero=(state.dishes||[]).some(d=>d.meal_id==='weekend-apero'&&d.item_id===item.id);
 $('portionHint').hidden=!apero;$('portionHint').textContent=item.unit==='L'?'Votre part en litres : 25 cl = 0,25 L ; 50 cl = 0,5 L.':item.unit==='g'?'Votre part en grammes, pas un nombre de paquets.':'Votre part pour tout le week-end, pas celle de tout le groupe.';
 const choices=new Set([...(item.unit==='pizza'?['Chèvre','Quatre fromages']:[]),...state.requests.filter(r=>r.item_id===item.id&&r.variant).map(r=>r.variant)]);
 $('variantSuggestions').replaceChildren(...[...choices].map(c=>{const o=node('option');o.value=c;return o;}));
 $('quantityTitle').textContent=item.name;$('quantityHint').textContent=`Pour ${personName(personId)} · saisi par ${personName(actorId)}`;$('quantityUnit').textContent=item.unit;$('quantityAmount').value=saved?String(saved.amount_milli/1000).replace('.',','):'';$('quantityError').hidden=true;$('quantityDialog').showModal();$('quantityAmount').focus();
}
$('quantityAmount').oninput=()=>{$('quantityVariant').required=!!state?.items.find(i=>i.id===selectedQuantity?.itemId)?.choice_required&&Number($('quantityAmount').value.replace(',','.'))>0;};
function error(id,e){$(id).textContent=e.message;$(id).hidden=false;}
$('quantityForm').onsubmit=async e=>{
 e.preventDefault();if(busy)return;busy=true;$('quantitySubmit').disabled=true;$('quantityError').hidden=true;
 prepareDragon();
 try{await api('/api/requests','POST',{...selectedQuantity,amount:$('quantityAmount').value,variant:$('quantityVariant').value});void playDragon();$('quantityDialog').close();await refresh(true);$('status').textContent=`Quantité enregistrée pour ${personName(selectedQuantity.profileId)}. Le total des courses est mis à jour.`;}
 catch(e){error('quantityError',e);if(e.status===409){await refresh(true);const latest=entry(selectedQuantity.itemId,selectedQuantity.profileId);const item=state.items.find(i=>i.id===selectedQuantity.itemId);if(item){selectedQuantity.revision=latest?.revision||0;selectedQuantity.unit=item.unit;$('quantityUnit').textContent=item.unit;$('quantityError').textContent+=` Valeur actuelle : ${latest?requestLabel(latest,item):'non renseignée'}. Votre saisie est conservée ; vérifiez-la avant d’enregistrer.`;}}}
 finally{busy=false;$('quantitySubmit').disabled=false;}
};
$('createProfile').onclick=()=>{$('profileForm').reset();$('profilePurpose').value=actorId?'other':'self';$('profilePurpose').querySelector('[value="other"]').disabled=!actorId;$('profileError').hidden=true;$('profileDialog').showModal();};
$('profileForm').onsubmit=async e=>{
 e.preventDefault();if(busy)return;busy=true;$('profileSubmit').disabled=true;$('profileError').hidden=true;
 try{const other=$('profilePurpose').value==='other';const result=await api('/api/profiles','POST',{name:$('profileName').value,...(other?{createdBy:actorId}:{})});if(!other){actorId=result.profile.id;rememberActor();}personId=result.profile.id;$('profileDialog').close();await refresh(true);render();showTab('needs');$('status').textContent='Profil créé. Vous pouvez renseigner les quantités.';}
 catch(e){error('profileError',e);if(e.status===409)await refresh(true);}finally{busy=false;$('profileSubmit').disabled=false;}
};
$('actor').onchange=()=>{actorId=$('actor').value;personId=actorId;rememberActor();render();};$('person').onchange=()=>{personId=$('person').value||actorId;render();};
async function saveCheck(item,check){
 if(busy){check.checked=item.done;return;}busy=true;check.disabled=true;try{await api('/api/items/'+item.id,'PATCH',{done:check.checked,revision:item.revision});await refresh(true);$('status').textContent='État de l’achat enregistré.';}catch(e){check.checked=item.done;$('status').textContent=e.message;await refresh(true);}finally{busy=false;check.disabled=false;}
}
function openItem(item){selectedItem=item?{...item}:null;$('itemForm').reset();$('itemError').hidden=true;$('itemDialogTitle').textContent=item?'Modifier un article':'Ajouter un article';$('itemName').value=item?.name||'';$('itemQty').value=item?.quantity==='À définir'?'':item?.quantity||'';$('itemUnit').value=item?.unit||'unité';$('itemUnit').disabled=!!item;$('itemChoiceRequired').checked=!!item?.choice_required;$('unitHint').hidden=!item;$('itemCategory').value=item?.category||categories[0];$('itemDialog').showModal();}
$('itemForm').onsubmit=async e=>{
 e.preventDefault();if(busy)return;busy=true;$('itemSubmit').disabled=true;$('itemError').hidden=true;
 const data={name:$('itemName').value,quantity:$('itemQty').value.trim()||'À définir',category:$('itemCategory').value};
 try{if(selectedItem)await api('/api/items/'+selectedItem.id,'PATCH',{...data,choice_required:$('itemChoiceRequired').checked,revision:selectedItem.revision});else await api('/api/items','POST',{...data,unit:$('itemUnit').value,choiceRequired:$('itemChoiceRequired').checked});$('itemDialog').close();await refresh(true);$('status').textContent='Article enregistré pour toute la famille.';}
 catch(e){error('itemError',e);if(e.status===409){await refresh(true);selectedItem={...state.items.find(i=>i.id===selectedItem.id)};}}finally{busy=false;$('itemSubmit').disabled=false;}
};
async function removeItem(item){if(busy||!confirm(`Supprimer « ${item.name} » et ses quantités individuelles de la liste ?`))return;busy=true;try{await api('/api/items/'+item.id,'DELETE',{revision:item.revision});await refresh(true);$('status').textContent='Article supprimé.';}catch(e){$('status').textContent=e.message;await refresh(true);}finally{busy=false;}}
$('dishSource').onchange=updateDishSource;
$('dishAddForm').onsubmit=async e=>{
 e.preventDefault();if(busy)return;busy=true;$('dishAddSubmit').disabled=true;$('dishAddError').hidden=true;
 const itemId=$('dishSource').value,data={requestId:selectedMeal.requestId};
 if(itemId)data.itemId=itemId;else Object.assign(data,{title:$('dishName').value.trim(),unit:$('dishUnit').value,category:$('dishCategory').value,choiceRequired:$('dishChoice').checked});
 try{await api('/api/meals/'+selectedMeal.id+'/dishes','POST',data);$('dishAddDialog').close();await refresh(true);$('status').textContent='Plat ajouté au repas et disponible dans les quantités de chacun.';}
 catch(e){error('dishAddError',e);if(e.status===409)await refresh(true);}finally{busy=false;$('dishAddSubmit').disabled=false;}
};
$('mealForm').onsubmit=async e=>{
 e.preventDefault();if(busy)return;busy=true;$('mealSubmit').disabled=true;$('mealError').hidden=true;
 try{await api('/api/meal-dishes/'+selectedDish.id,'PATCH',{title:$('mealName').value,revision:selectedDish.revision,itemRevision:selectedDish.item_revision});$('mealDialog').close();await refresh(true);$('status').textContent='Plat modifié. Les quantités existantes sont conservées.';}
 catch(e){error('mealError',e);if(e.status===409){await refresh(true);const latest=(state.dishes||[]).find(d=>d.id===selectedDish.id);if(latest){selectedDish={...latest};$('mealError').textContent+=` Nom actuel : ${latest.title}. Vérifiez votre saisie avant de valider à nouveau.`;}}}
 finally{busy=false;$('mealSubmit').disabled=false;}
};
for(const id of ['meals','needs','recap','shopping'])$(id+'Tab').onclick=()=>showTab(id);
$('add').onclick=()=>{if(state?.isAdmin)openItem(null);};$('retry').onclick=()=>refresh();
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{if(!busy)b.closest('dialog').close();});
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('cancel',e=>{if(busy)e.preventDefault();}));
async function pollState(){if(pollRunning)return;pollRunning=true;try{await refresh();}finally{pollRunning=false;if(!document.hidden)poll=setTimeout(pollState,5000);}}
void pollState();document.addEventListener('visibilitychange',()=>{clearTimeout(poll);if(!document.hidden)void pollState();});
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'read_family_list',description:'Lire les profils, choix, quantités individuelles et totaux par variante de la liste familiale.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:async()=>{if(!await refresh())throw new Error('La liste à jour est indisponible.');return JSON.parse(JSON.stringify(state));}})).catch(()=>{});}catch{}}
