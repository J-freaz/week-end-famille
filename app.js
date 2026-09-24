'use strict';
const $ = id => document.getElementById(id);
const days = [
  { label: 'Samedi 24 octobre', meals: [
    { id: 'sat-dinner', label: 'Dîner · pendant le jeu', detail: 'Proposition du groupe · choix des pizzas à préciser.' }
  ] },
  { label: 'Dimanche 25 octobre', meals: [
    { id: 'sun-breakfast', label: 'Petit-déjeuner', detail: 'Suggestion pour la liste · avec lait et café, à adapter.' },
    { id: 'sun-lunch', label: 'Déjeuner · hors courses', fixed: 'Restaurant', detail: 'L’Auberge des Roux, prévue dans les échanges.' },
    { id: 'sun-dinner', label: 'Dîner', detail: 'Proposition du groupe · nombre de convives à confirmer.' }
  ] },
  { label: 'Lundi 26 octobre', meals: [
    { id: 'mon-breakfast', label: 'Petit-déjeuner', detail: 'Suggestion pour la liste · avec lait et café, à adapter.' }
  ] }
];
const groceryPlan = [
  { id:'pizzas', name:'Pizzas à réchauffer', category:'Surgelés', quantity:n=>`${Math.ceil(n * .7)} pizzas de 400 à 500 g environ`, note:'Samedi soir · garnitures à choisir' },
  { id:'pain-mie', name:'Pain de mie', category:'Boulangerie', quantity:n=>`${n * 4} tranches`, note:'Dimanche soir · 2 croque-monsieur par personne' },
  { id:'jambon', name:'Jambon pour les croque-monsieur', category:'Frais', quantity:n=>`${n * 2} tranches`, note:'Dimanche soir · variante sans viande à prévoir si besoin' },
  { id:'fromage', name:'Fromage pour les croque-monsieur', category:'Frais', quantity:n=>`${n * 4} tranches`, note:'Dimanche soir · 2 tranches par croque-monsieur' },
  { id:'salade', name:'Salade verte', category:'Fruits et légumes', quantity:n=>`${Math.ceil(n * 60 / 100) * 100} g`, note:'Dimanche soir' },
  { id:'sauce', name:'Vinaigrette', category:'Épicerie', quantity:n=>`${Math.ceil(n * 15 / 50) * 50} ml`, note:'À apporter si déjà disponible' },
  { id:'baguettes', name:'Pain pour les petits-déjeuners', category:'Boulangerie', quantity:n=>`${Math.ceil(n * 2 * 100 / 250)} baguettes de 250 g environ`, note:'Total dimanche et lundi · prévoir la conservation' },
  { id:'beurre', name:'Beurre', category:'Frais', quantity:n=>`${Math.ceil(n * 30 / 250) * 250} g`, note:'Deux petits-déjeuners + croque-monsieur' },
  { id:'confiture', name:'Confiture', category:'Épicerie', quantity:n=>`${Math.ceil(n * 2 * 20 / 250) * 250} g`, note:'Deux petits-déjeuners' },
  { id:'lait', name:'Lait', category:'Boissons', quantity:n=>`${Math.ceil(n * 2 * .2)} L`, note:'Deux petits-déjeuners · type à confirmer' },
  { id:'cafe', name:'Café', category:'Épicerie', quantity:n=>`${Math.ceil(n * 2 * 10 / 250) * 250} g`, note:'À adapter à la cafetière du logement' },
  { id:'fruits', name:'Fruits pour les petits-déjeuners', category:'Fruits et légumes', quantity:n=>`${n * 2} pièces`, note:'Total dimanche et lundi · fruits au choix' }
];
const state = {
  people: 10,
  meals: { 'sat-dinner': 'Pizzas', 'sun-dinner': 'Croque-monsieur et salade', 'sun-breakfast':'Pain, beurre, confiture et fruits', 'mon-breakfast':'Pain, beurre, confiture et fruits' },
  items: groceryPlan.map(item=>({ ...item, quantity:item.quantity(10), done:false, planned:true }))
};
let selectedMeal, selectedItem;
function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function renderMeals() {
  $('days').replaceChildren(...days.map(day => {
    const card = node('article', undefined, 'day');
    card.append(node('h3', day.label));
    day.meals.forEach(slot => {
      const id = slot.id, title = slot.fixed || state.meals[id];
      const meal = node('div', undefined, 'meal');
      meal.append(node('div', slot.label, 'kind'), node('strong', title || 'À décider', title ? '' : 'empty'), node('p', slot.detail, 'muted'));
      if (slot.fixed) { card.append(meal); return; }
      const button = node('button', title ? 'Modifier' : '+ Prévoir ce repas', 'secondary');
      button.setAttribute('aria-label', `${title ? 'Modifier' : 'Prévoir'} : ${day.label}, ${slot.label}`);
      button.onclick = () => {
        selectedMeal = id;
        $('mealTitle').textContent = `${day.label} · ${slot.label.toLowerCase()}`;
        $('mealName').value = title || '';
        $('mealDialog').showModal();
      };
      meal.append(button); card.append(meal);
    });
    return card;
  }));
}
function showTab(tab) {
  const meals = tab === 'meals';
  $('meals').hidden = !meals; $('shopping').hidden = meals;
  $('mealsTab').setAttribute('aria-pressed', String(meals));
  $('shoppingTab').setAttribute('aria-pressed', String(!meals));
}
function renderItems() {
  const done = state.items.filter(i => i.done).length;
  $('count').textContent = String(state.items.length);
  $('summary').textContent = state.items.length ? `${done} / ${state.items.length} article${state.items.length > 1 ? 's' : ''} acheté${state.items.length > 1 ? 's' : ''}` : 'Aucun article pour le moment.';
  $('bar').style.width = `${state.items.length ? done / state.items.length * 100 : 0}%`;
  $('items').replaceChildren();
  if (!state.items.length) {
    const empty = node('div', undefined, 'emptybox');
    empty.append(node('h3', 'La liste attend vos idées'), node('p', 'Ajoutez les ingrédients de vos repas et les petits essentiels du week-end.'));
    $('items').append(empty); return;
  }
  [...$('itemCategory').options].forEach(option => {
    const group = state.items.filter(i => i.category === option.value);
    if (!group.length) return;
    const list = node('div', undefined, 'list'); list.append(node('h3', option.value));
    group.forEach(item => {
      const row = node('div', undefined, `row${item.done ? ' done' : ''}`);
      const label = node('label'); const check = node('input'); check.type = 'checkbox'; check.checked = item.done;
      check.onchange = () => { item.done = check.checked; row.classList.toggle('done', item.done); updateProgress(); };
      const description = node('span', item.name); if (item.quantity) description.append(node('small', item.quantity));
      if (item.note) description.append(node('small', item.note));
      label.append(check, description);
      const edit = node('button', 'Modifier', 'secondary');
      edit.setAttribute('aria-label', `Modifier ${item.name}`);
      edit.onclick = () => {
        selectedItem = item.id;
        $('itemForm').reset();
        $('itemName').value = item.name; $('itemQty').value = item.quantity; $('itemCategory').value = item.category;
        $('itemDialogTitle').textContent = 'Modifier une course'; $('itemSubmit').textContent = 'Valider';
        $('itemHint').hidden = !item.planned;
        $('itemDialog').showModal();
      };
      const remove = node('button', '×', 'remove'); remove.setAttribute('aria-label', `Supprimer ${item.name}`);
      remove.onclick = () => { state.items = state.items.filter(i => i.id !== item.id); renderItems(); $('add').focus(); };
      row.append(label, edit, remove); list.append(row);
    });
    $('items').append(list);
  });
}
function updateProgress() {
  const done = state.items.filter(i => i.done).length;
  $('summary').textContent = `${done} / ${state.items.length} article${state.items.length > 1 ? 's' : ''} acheté${state.items.length > 1 ? 's' : ''}`;
  $('bar').style.width = `${done / state.items.length * 100}%`;
}
function addItem(name, quantity, category) {
  if (typeof name !== 'string' || !name.trim() || name.length > 100 || typeof quantity !== 'string' || quantity.length > 60 || ![...$('itemCategory').options].some(o => o.value === category)) throw new Error('Article invalide');
  const item = { id: crypto.randomUUID(), name: name.trim(), quantity: quantity.trim(), category, done: false };
  state.items.push(item); renderItems(); return item.id;
}
$('mealsTab').onclick = () => showTab('meals');
$('shoppingTab').onclick = () => showTab('shopping');
$('people').onchange = () => {
  const n = Number($('people').value);
  if (!Number.isInteger(n) || n < 1 || n > 99) {
    $('people').value = state.people;
    $('status').textContent = 'Indiquez un nombre de personnes entre 1 et 99.';
    return;
  }
  const changed = n !== state.people;
  state.people = n;
  $('peopleHelp').textContent = `Base provisoire : ${n} personnes à chacun des quatre repas. Les quantités proposées se recalculent ; les quantités modifiées à la main restent fixes.`;
  state.items.forEach(item => {
    if (!item.planned) return;
    const recipe = groceryPlan.find(p => p.id === item.id);
    item.quantity = recipe.quantity(n);
    if (changed) item.done = false;
  });
  renderItems();
  $('status').textContent = changed ? `Quantités recalculées pour ${n} personnes par repas. Les achats de la liste proposée sont à revérifier.` : `Base inchangée : ${n} personnes.`;
};
$('add').onclick = () => {
  selectedItem = undefined; $('itemForm').reset(); $('itemHint').hidden = true;
  $('itemName').setCustomValidity(''); $('itemDialogTitle').textContent = 'Ajouter une course'; $('itemSubmit').textContent = 'Ajouter';
  $('itemDialog').showModal();
};
document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => button.closest('dialog').close());
$('mealForm').onsubmit = event => {
  event.preventDefault(); state.meals[selectedMeal] = $('mealName').value.trim();
  $('mealDialog').close(); renderMeals(); $('status').textContent = 'Repas modifié dans cet aperçu.';
};
$('itemForm').onsubmit = event => {
  event.preventDefault();
  if (!$('itemName').value.trim()) { $('itemName').setCustomValidity('Indiquez un article.'); $('itemName').reportValidity(); return; }
  if (selectedItem) {
    const item = state.items.find(i => i.id === selectedItem);
    item.name = $('itemName').value.trim(); item.quantity = $('itemQty').value.trim(); item.category = $('itemCategory').value;
    item.planned = false; item.done = false; item.note = 'Quantité personnalisée · à ajuster manuellement si l’effectif change';
    renderItems();
  } else addItem($('itemName').value, $('itemQty').value, $('itemCategory').value);
  $('itemDialog').close(); $('status').textContent = selectedItem ? 'Article modifié dans cet aperçu.' : 'Article ajouté dans cet aperçu.';
};
$('itemName').oninput = () => $('itemName').setCustomValidity('');
renderMeals(); renderItems();
if (document.modelContext?.registerTool) {
  try {
    Promise.resolve(document.modelContext.registerTool({ name: 'read_weekend_preview', description: 'Lire les repas et courses de cet aperçu non sauvegardé.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute: () => JSON.parse(JSON.stringify(state)) })).catch(() => {});
  } catch {}
}
