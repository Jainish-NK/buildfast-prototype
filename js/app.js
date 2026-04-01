import {
  seedAppData,
  getCart,
  getCurrentUser,
  saveCart,
  getMaterials,
  stockStatus,
  marginPercent
} from "./data.js";

seedAppData();

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export function showToast(message, type = "success") {
  const tray = document.querySelector("[data-toast-container]") || createToastTray();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  tray.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 250);
  }, 2800);
}

function createToastTray() {
  const tray = document.createElement("div");
  tray.className = "toast-tray";
  tray.setAttribute("data-toast-container", "");
  document.body.appendChild(tray);
  return tray;
}

export function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = count;
  });
}

export function upsertCartItem(materialId, quantity = 1) {
  const materials = getMaterials();
  const material = materials.find((item) => item.id === materialId);
  if (!material) {
    showToast("Material not found.", "error");
    return false;
  }

  const cart = getCart();
  const existing = cart.find((item) => item.id === materialId);
  const nextQuantity = (existing?.quantity || 0) + quantity;
  if (nextQuantity > material.stock) {
    showToast(`Only ${material.stock} units available in stock.`, "error");
    return false;
  }

  if (existing) {
    existing.quantity = nextQuantity;
  } else {
    cart.push({
      id: material.id,
      name: material.name,
      image: material.image,
      price: material.price,
      stock: material.stock,
      quantity
    });
  }

  saveCart(cart);
  updateCartCount();
  showToast(`${material.name} added to cart.`);
  return true;
}

export function createNav() {
  const header = document.querySelector("[data-site-header]");
  if (!header) return;
  const user = getCurrentUser();

  header.innerHTML = `
    <nav class="navbar glass-card">
      <a class="brand" href="./index.html">
        <span class="brand-mark">BF</span>
        <span>BuildFast</span>
      </a>
      <button class="nav-toggle" aria-label="Toggle navigation" data-nav-toggle>☰</button>
      <div class="nav-links" data-nav-links>
        <a href="./index.html">Home</a>
        <a href="./marketplace.html">Marketplace</a>
        <a href="./orders.html">Orders</a>
        ${user?.userType === "admin" ? '<a href="./admin.html">Admin</a>' : ""}
        <a href="./index.html#plans">Plans</a>
      </div>
      <div class="nav-actions">
        <a class="cart-pill" href="./cart.html">Cart <span data-cart-count>0</span></a>
        ${
          user
            ? `<div class="user-pill">${user.fullName.split(" ")[0]} <a href="./login.html?logout=1">Logout</a></div>`
            : `<a class="btn btn-secondary" href="./login.html">Login</a>`
        }
      </div>
    </nav>
  `;

  const toggle = header.querySelector("[data-nav-toggle]");
  const links = header.querySelector("[data-nav-links]");
  toggle?.addEventListener("click", () => links.classList.toggle("open"));
  updateCartCount();
}

export function requireAuth({ adminOnly = false } = {}) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "./login.html";
    return null;
  }
  if (adminOnly && user.userType !== "admin") {
    showToast("Admin access only.", "error");
    window.location.href = "./index.html";
    return null;
  }
  return user;
}

export function attachParallax() {
  const hero = document.querySelector("[data-parallax]");
  if (!hero) return;
  window.addEventListener("scroll", () => {
    hero.style.transform = `translateY(${window.scrollY * 0.15}px)`;
  });
}

export function initTiltCards() {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 10;
      const rotateX = ((y / rect.height) - 0.5) * -10;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

export function createModal() {
  let modal = document.querySelector(".modal-shell");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal-shell";
    modal.innerHTML = `<div class="modal-backdrop" data-close-modal></div><div class="modal-card" data-modal-body></div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (event) => {
      if (event.target.hasAttribute("data-close-modal")) modal.classList.remove("open");
    });
  }

  return {
    open(content) {
      modal.querySelector("[data-modal-body]").innerHTML = content;
      modal.classList.add("open");
    },
    close() {
      modal.classList.remove("open");
    }
  };
}

export function productCardTemplate(item) {
  const stock = stockStatus(item.stock);
  return `
    <article class="product-card glass-card" data-product-id="${item.id}">
      <div class="product-emoji">${item.image}</div>
      <div class="product-meta">
        <div class="badge-row">
          <span class="badge badge-${stock}">${stock}</span>
          <span class="badge badge-demand">${item.demand} demand</span>
        </div>
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="price-row">
          <strong>${formatCurrency(item.price)}</strong>
          <span>${formatCurrency(item.costPrice)}</span>
        </div>
        <div class="meta-row">
          <span>Margin ${marginPercent(item)}%</span>
          <span>${item.eta}</span>
        </div>
      </div>
      <div class="product-actions">
        <input type="number" min="1" value="1" max="${item.stock}" data-qty-input />
        <button class="btn btn-primary" data-add-cart>Add to cart</button>
      </div>
    </article>
  `;
}

export function renderSkeletons(container, count = 8) {
  container.innerHTML = Array.from({ length: count }).map(() => `
    <div class="skeleton-card glass-card">
      <div class="skeleton shimmer square"></div>
      <div class="skeleton shimmer line"></div>
      <div class="skeleton shimmer line short"></div>
      <div class="skeleton shimmer line"></div>
    </div>
  `).join("");
}

export function bootstrapPage() {
  createNav();
  updateCartCount();
}
