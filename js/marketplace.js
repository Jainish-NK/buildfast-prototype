import { bootstrapPage, renderSkeletons, productCardTemplate, upsertCartItem, createModal, showToast } from "./app.js";
import { getMaterials, getCategories, formatDate } from "./data.js";

bootstrapPage();

const grid = document.querySelector("[data-product-grid]");
const chipRow = document.querySelector("[data-category-chips]");
const searchInput = document.querySelector("[data-search]");
const resultCount = document.querySelector("[data-result-count]");
const modal = createModal();

let activeCategory = "All";
let searchTerm = "";
let materials = [];

function renderChips() {
  chipRow.innerHTML = getCategories().map((category) => `
    <button class="chip ${category === activeCategory ? "active" : ""}" data-category="${category}">${category}</button>
  `).join("");
}

function filteredMaterials() {
  return materials.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
}

function renderProducts() {
  const items = filteredMaterials();
  resultCount.textContent = `${items.length} materials ready for dispatch`;
  if (!items.length) {
    grid.innerHTML = `<div class="empty-state">No materials match this search right now.</div>`;
    return;
  }
  grid.innerHTML = items.map(productCardTemplate).join("");
}

function openQuickView(materialId) {
  const item = materials.find((material) => material.id === materialId);
  if (!item) return;

  modal.open(`
    <div class="grid-2">
      <div class="hero-visual" style="min-height:260px;">
        <div class="pill">Warehouse ${item.warehouse}</div>
        <div style="font-size:4rem;">${item.image}</div>
        <div>
          <strong>${item.eta}</strong>
          <p>${item.category} dispatch lane</p>
        </div>
      </div>
      <div>
        <div class="badge-row">
          <span class="badge badge-demand">${item.demand} demand</span>
          <span class="badge badge-${item.stock < 50 ? "critical" : item.stock < 100 ? "low" : item.stock < 200 ? "medium" : "high"}">${item.stock} in stock</span>
        </div>
        <h2>${item.name}</h2>
        <p class="muted">${item.description}</p>
        <div class="price-row">
          <strong>${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(item.price)}</strong>
          <span>${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(item.costPrice)}</span>
        </div>
        <p class="muted">Fastest ETA from ${item.warehouse}. Last synced ${formatDate(new Date())}.</p>
        <button class="btn btn-primary" data-modal-add="${item.id}">Add to cart</button>
      </div>
    </div>
  `);

  document.querySelector("[data-modal-add]")?.addEventListener("click", () => {
    upsertCartItem(item.id, 1);
    modal.close();
  });
}

function bindEvents() {
  chipRow.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    renderChips();
    renderProducts();
  });

  searchInput.addEventListener("input", (event) => {
    searchTerm = event.target.value;
    renderProducts();
  });

  grid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-product-id]");
    if (!card) return;

    if (event.target.matches("[data-add-cart]")) {
      const qty = Number(card.querySelector("[data-qty-input]").value || 1);
      upsertCartItem(card.dataset.productId, qty);
      return;
    }

    if (!event.target.matches("input")) {
      openQuickView(card.dataset.productId);
    }
  });
}

function init() {
  renderSkeletons(grid, 8);
  setTimeout(() => {
    materials = getMaterials();
    renderChips();
    renderProducts();
    bindEvents();
    showToast("Marketplace loaded.", "info");
  }, 700);
}

init();
