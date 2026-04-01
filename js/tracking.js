import { bootstrapPage, showToast, formatCurrency } from "./app.js";
import { requireAuth } from "./app.js";
import { getOrders, getTrackingOrder, buildOrderStatusIndex, formatDate } from "./data.js";

bootstrapPage();
requireAuth();

const shell = document.querySelector("[data-tracking-shell]");
const stages = ["confirmed", "processing", "picked", "out-for-delivery", "delivered"];
const labels = ["Order Confirmed", "Processing", "Picked Up", "Out for Delivery", "Delivered"];

let order = getOrders().find((item) => item.id === getTrackingOrder()) || getOrders()[0];

function render() {
  if (!order) {
    shell.innerHTML = `<div class="empty-state">No active order found. Place an order to track it here.</div>`;
    return;
  }

  const currentIndex = buildOrderStatusIndex(order.status);
  const percent = ((currentIndex + 1) / stages.length) * 100;
  shell.innerHTML = `
    <section class="checkout-card">
      <div class="order-card-top">
        <div>
          <div class="pill">Tracking ${order.id}</div>
          <h2>${order.customerName}</h2>
          <p class="muted">Placed ${formatDate(order.createdAt)} • ETA ${order.estimatedDelivery}</p>
        </div>
        <strong>${formatCurrency(order.total)}</strong>
      </div>
      <div class="progress-shell"><div class="progress-bar" style="width:${percent}%"></div></div>
      <div class="timeline">
        ${labels.map((label, index) => `
          <div class="timeline-item ${index < currentIndex ? "done" : index === currentIndex ? "active" : ""}">
            <div class="timeline-dot"></div>
            <div><strong>${label}</strong><p class="muted">${index === currentIndex ? "Current delivery stage" : "Queued milestone"}</p></div>
          </div>
        `).join("")}
      </div>
      <div class="grid-2" style="margin-top:1rem;">
        <div class="checkout-card">
          <h3>Order items</h3>
          <div class="invoice-list">
            ${order.items.map((item) => `<div class="summary-row"><span>${item.name} x ${item.quantity}</span><strong>${formatCurrency(item.quantity * item.price)}</strong></div>`).join("")}
          </div>
        </div>
        <div class="checkout-card">
          <h3>Delivery address</h3>
          <p class="muted">${order.address}, ${order.city} - ${order.pincode}</p>
          <p class="muted">${order.instructions || "No special instructions provided."}</p>
        </div>
      </div>
    </section>
  `;
}

render();

if (order && order.status !== "delivered") {
  const timer = setInterval(() => {
    const orders = getOrders();
    const current = orders.find((item) => item.id === order.id);
    if (!current) return clearInterval(timer);
    const index = buildOrderStatusIndex(current.status);
    if (index >= stages.length - 1) {
      clearInterval(timer);
      showToast("Order delivered successfully.");
      return;
    }
    current.status = stages[index + 1];
    order = current;
    localStorage.setItem("buildfast-orders", JSON.stringify(orders));
    render();
    if (current.status === "delivered") {
      clearInterval(timer);
      showToast("Your order has been delivered.");
    }
  }, 2000);
}
