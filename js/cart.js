import { bootstrapPage, formatCurrency, showToast, updateCartCount } from "./app.js";
import { requireAuth } from "./app.js";
import {
  getCart,
  saveCart,
  getMaterials,
  discountRate,
  generateOrderId,
  getCurrentUser,
  getOrders,
  saveOrders,
  saveMaterials,
  setTrackingOrder
} from "./data.js";

bootstrapPage();
const user = requireAuth();

const cartList = document.querySelector("[data-cart-list]");
const summary = document.querySelector("[data-cart-summary]");
const form = document.querySelector("[data-checkout-form]");

if (form && user) {
  form.fullName.value = user.fullName || "";
  form.phone.value = user.phone || "";
}

function cartDetails() {
  const materials = getMaterials();
  const cart = getCart().map((item) => {
    const material = materials.find((m) => m.id === item.id);
    return { ...item, material };
  }).filter((item) => item.material);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = subtotal * discountRate(user?.subscription);
  const deliveryFee = subtotal > 5000 ? 0 : cart.length ? 100 : 0;
  const total = subtotal - discount + deliveryFee;
  return { cart, subtotal, discount, deliveryFee, total };
}

function renderCart() {
  const details = cartDetails();
  if (!details.cart.length) {
    cartList.innerHTML = `<div class="empty-state">Your cart is empty. Add materials from the marketplace to continue.</div>`;
  } else {
    cartList.innerHTML = details.cart.map((item) => `
      <article class="cart-item">
        <div class="cart-item-emoji">${item.image}</div>
        <div>
          <h3>${item.name}</h3>
          <p class="muted">${formatCurrency(item.price)} each • Stock ${item.material.stock}</p>
          <div class="qty-controls">
            <button type="button" data-action="decrease" data-id="${item.id}">-</button>
            <input value="${item.quantity}" readonly />
            <button type="button" data-action="increase" data-id="${item.id}">+</button>
            <button type="button" class="btn btn-outline" data-action="remove" data-id="${item.id}">Remove</button>
          </div>
        </div>
        <strong>${formatCurrency(item.price * item.quantity)}</strong>
      </article>
    `).join("");
  }

  summary.innerHTML = `
    <div class="summary-row"><span>Subtotal</span><strong>${formatCurrency(details.subtotal)}</strong></div>
    <div class="summary-row"><span>Subscription discount (${Math.round(discountRate(user?.subscription) * 100)}%)</span><strong>- ${formatCurrency(details.discount)}</strong></div>
    <div class="summary-row"><span>Delivery fee</span><strong>${details.deliveryFee ? formatCurrency(details.deliveryFee) : "Free"}</strong></div>
    <div class="summary-row summary-block"><span>Total payable</span><strong>${formatCurrency(details.total)}</strong></div>
  `;
}

function updateQuantity(id, delta) {
  const materials = getMaterials();
  const cart = getCart();
  const item = cart.find((entry) => entry.id === id);
  const material = materials.find((entry) => entry.id === id);
  if (!item || !material) return;

  const next = item.quantity + delta;
  if (next < 1) return;
  if (next > material.stock) {
    showToast(`Only ${material.stock} units available.`, "error");
    return;
  }
  item.quantity = next;
  saveCart(cart);
  updateCartCount();
  renderCart();
}

function removeItem(id) {
  saveCart(getCart().filter((item) => item.id !== id));
  updateCartCount();
  renderCart();
  showToast("Item removed.", "info");
}

cartList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === "increase") updateQuantity(id, 1);
  if (action === "decrease") updateQuantity(id, -1);
  if (action === "remove") removeItem(id);
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const details = cartDetails();
  if (!details.cart.length) {
    showToast("Add items before checkout.", "error");
    return;
  }

  const payload = Object.fromEntries(new FormData(form).entries());
  const required = ["fullName", "phone", "address", "city", "pincode"];
  if (required.some((key) => !payload[key])) {
    showToast("Please complete the checkout form.", "error");
    return;
  }

  const materials = getMaterials();
  for (const cartItem of details.cart) {
    const material = materials.find((item) => item.id === cartItem.id);
    if (!material || cartItem.quantity > material.stock) {
      showToast(`Stock changed for ${cartItem.name}. Please review cart.`, "error");
      return;
    }
  }

  details.cart.forEach((cartItem) => {
    const material = materials.find((item) => item.id === cartItem.id);
    material.stock -= cartItem.quantity;
  });
  saveMaterials(materials);

  const order = {
    id: generateOrderId(),
    userId: getCurrentUser().id,
    customerName: payload.fullName,
    customerPhone: payload.phone,
    address: payload.address,
    city: payload.city,
    pincode: payload.pincode,
    instructions: payload.instructions || "",
    createdAt: new Date().toISOString(),
    estimatedDelivery: "30-90 mins",
    status: "confirmed",
    items: details.cart,
    subtotal: details.subtotal,
    discount: details.discount,
    deliveryFee: details.deliveryFee,
    total: details.total
  };

  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
  saveCart([]);
  updateCartCount();
  setTrackingOrder(order.id);
  showToast(`Order ${order.id} placed successfully.`);
  setTimeout(() => {
    window.location.href = "./tracking.html";
  }, 600);
});

renderCart();
