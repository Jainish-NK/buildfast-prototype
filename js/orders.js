import { bootstrapPage, createModal, formatCurrency, showToast } from "./app.js";
import { requireAuth } from "./app.js";
import { getOrders, getCurrentUser, formatDate, setTrackingOrder } from "./data.js";

bootstrapPage();
const user = requireAuth();
const modal = createModal();
const shell = document.querySelector("[data-orders-list]");
const tabs = document.querySelector("[data-status-tabs]");
let active = "all";

function userOrders() {
  return getOrders().filter((order) => user.userType === "admin" || order.userId === getCurrentUser().id);
}

function filteredOrders() {
  return userOrders().filter((order) => active === "all" || order.status === active);
}

function renderOrders() {
  const orders = filteredOrders();
  if (!orders.length) {
    shell.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>No orders in this status yet.</p><a href="./marketplace.html" class="btn btn-primary">Start Shopping</a></div>`;
    return;
  }

  shell.innerHTML = orders.map((order) => `
    <article class="order-card glass-card">
      <div class="order-card-top" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
        <div>
          <div class="pill" style="font-size: 0.75rem;">${order.id}</div>
          <h3 style="margin-top: 0.5rem;">${formatDate(order.createdAt)}</h3>
        </div>
        <span class="badge badge-demand" style="text-transform: capitalize;">${order.status.replaceAll("-", " ")}</span>
      </div>
      <p class="muted">${order.items.slice(0, 2).map((item) => `${item.name} x ${item.quantity}`).join(", ")}${order.items.length > 2 ? "..." : ""}</p>
      <div class="summary-row" style="margin-top: 1rem;">
        <strong style="font-size: 1.2rem;">${formatCurrency(order.total)}</strong>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-outline" data-view="${order.id}">Details</button>
          <button class="btn btn-secondary" data-track="${order.id}">Track</button>
          <button class="btn btn-primary" data-invoice="${order.id}">📄 Bill</button>
        </div>
      </div>
    </article>
  `).join("");
}

function openDetails(orderId) {
  const order = userOrders().find((entry) => entry.id === orderId);
  if (!order) return;
  modal.open(`
    <div>
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
        <div>
          <div class="pill">${order.id}</div>
          <h2>${order.customerName}</h2>
        </div>
        <strong style="font-size: 1.5rem; color: var(--primary);">${formatCurrency(order.total)}</strong>
      </div>
      <p class="muted"><strong>Delivery Address:</strong> ${order.address}, ${order.city} - ${order.pincode}</p>
      <p class="muted"><strong>Phone:</strong> ${order.customerPhone}</p>
      ${order.instructions ? `<p class="muted"><strong>Instructions:</strong> ${order.instructions}</p>` : ''}
      <div style="margin-top: 1.5rem;">
        <h3>Order Items</h3>
        <div class="invoice-list">
          ${order.items.map((item) => `<div class="summary-row"><span>${item.name} x ${item.quantity}</span><strong>${formatCurrency(item.quantity * item.price)}</strong></div>`).join("")}
        </div>
        <div class="summary-row"><span>Subtotal</span><strong>${formatCurrency(order.subtotal)}</strong></div>
        <div class="summary-row"><span>Discount (${Math.round((order.discount / order.subtotal) * 100)}%)</span><strong>-${formatCurrency(order.discount)}</strong></div>
        <div class="summary-row"><span>Delivery Fee</span><strong>${order.deliveryFee === 0 ? 'Free' : formatCurrency(order.deliveryFee)}</strong></div>
        <div class="summary-row summary-block"><span>Total Paid</span><strong style="color: var(--primary);">${formatCurrency(order.total)}</strong></div>
      </div>
    </div>
  `);
}

function generateBill(order) {
  const billHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - ${order.id}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          background: #f5f5f5;
          padding: 2rem;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .invoice-header {
          background: linear-gradient(135deg, #1a237e, #0d1642);
          color: white;
          padding: 2rem;
          text-align: center;
        }
        .invoice-header h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        .invoice-header p {
          opacity: 0.9;
        }
        .invoice-body {
          padding: 2rem;
        }
        .company-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f4b400;
        }
        .bill-to {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }
        .bill-to h3 {
          color: #1a237e;
          margin-bottom: 0.5rem;
        }
        .order-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .detail-item {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 8px;
        }
        .detail-item strong {
          color: #1a237e;
          display: block;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .detail-item span {
          font-size: 1rem;
          font-weight: 500;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        th, td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background: #f8f9fa;
          color: #1a237e;
          font-weight: 600;
        }
        .totals {
          text-align: right;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 2px solid #f4b400;
        }
        .totals p {
          margin: 0.5rem 0;
        }
        .totals .grand-total {
          font-size: 1.25rem;
          font-weight: 700;
          color: #f4b400;
        }
        .invoice-footer {
          background: #f8f9fa;
          padding: 1.5rem;
          text-align: center;
          font-size: 0.75rem;
          color: #6c757d;
        }
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          background: #10b981;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <h1>BUILDFAST</h1>
          <p>Instant Construction Material Delivery</p>
        </div>
        <div class="invoice-body">
          <div class="company-info">
            <div>
              <strong>TAX INVOICE</strong><br>
              Invoice #: ${order.id}<br>
              Date: ${formatDate(order.createdAt)}
            </div>
            <div class="status-badge">${order.status.toUpperCase()}</div>
          </div>
          
          <div class="bill-to">
            <h3>Bill To:</h3>
            <p><strong>${order.customerName}</strong><br>
            ${order.address}<br>
            ${order.city} - ${order.pincode}<br>
            Phone: ${order.customerPhone}</p>
          </div>
          
          <div class="order-details">
            <div class="detail-item">
              <strong>Order Date</strong>
              <span>${formatDate(order.createdAt)}</span>
            </div>
            <div class="detail-item">
              <strong>Payment Method</strong>
              <span>Online Payment</span>
            </div>
            <div class="detail-item">
              <strong>Order Status</strong>
              <span>${order.status.replaceAll("-", " ").toUpperCase()}</span>
            </div>
            <div class="detail-item">
              <strong>Estimated Delivery</strong>
              <span>${order.estimatedDelivery || "30-90 mins"}</span>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.price)}</td>
                  <td>${formatCurrency(item.price * item.quantity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <p>Subtotal: ${formatCurrency(order.subtotal)}</p>
            ${order.discount > 0 ? `<p>Discount (${Math.round((order.discount / order.subtotal) * 100)}%): -${formatCurrency(order.discount)}</p>` : ''}
            <p>Delivery Fee: ${order.deliveryFee === 0 ? 'Free' : formatCurrency(order.deliveryFee)}</p>
            <p class="grand-total">Total Amount: ${formatCurrency(order.total)}</p>
          </div>
          
          <div style="margin-top: 2rem; padding: 1rem; background: #fef3e8; border-radius: 8px;">
            <p style="font-size: 0.875rem; color: #1a237e;">📦 Thank you for choosing BuildFast! For any queries, contact support@buildfast.com</p>
          </div>
        </div>
        <div class="invoice-footer">
          <p>This is a computer-generated invoice and does not require a physical signature.</p>
          <p>BuildFast - Building the future, faster.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Create blob and download
  const blob = new Blob([billHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BuildFast_Invoice_${order.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`Invoice for ${order.id} downloaded successfully!`, 'success');
}

tabs.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-status]");
  if (!tab) return;
  active = tab.dataset.status;
  tabs.querySelectorAll(".status-tab").forEach((button) => button.classList.toggle("active", button.dataset.status === active));
  renderOrders();
});

shell.addEventListener("click", (event) => {
  const orderId = event.target.dataset.view || event.target.dataset.track || event.target.dataset.invoice;
  if (!orderId) return;
  if (event.target.dataset.view) openDetails(orderId);
  if (event.target.dataset.track) {
    setTrackingOrder(orderId);
    window.location.href = "./tracking.html";
  }
  if (event.target.dataset.invoice) {
    const order = userOrders().find(o => o.id === orderId);
    if (order) generateBill(order);
  }
});

renderOrders();