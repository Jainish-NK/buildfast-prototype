import { bootstrapPage, createModal, formatCurrency, showToast } from "./app.js";
import { requireAuth } from "./app.js";
import { getMaterials, saveMaterials, getOrders, saveOrders, marginPercent, formatDate } from "./data.js";

bootstrapPage();
requireAuth({ adminOnly: true });

const modal = createModal();
const statsShell = document.querySelector("[data-admin-stats]");
const chartShell = document.querySelector("[data-chart]");
const bestShell = document.querySelector("[data-best-selling]");
const inventoryShell = document.querySelector("[data-inventory-body]");
const ordersShell = document.querySelector("[data-orders-body]");
const addButton = document.querySelector("[data-add-material]");

function analytics() {
  const orders = getOrders();
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const today = new Date().toDateString();
  const month = new Date().getMonth();
  const dailyRevenue = orders.filter((order) => new Date(order.createdAt).toDateString() === today).reduce((sum, order) => sum + order.total, 0);
  const monthlyRevenue = orders.filter((order) => new Date(order.createdAt).getMonth() === month).reduce((sum, order) => sum + order.total, 0);
  const totalProfit = orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + ((item.price - (getMaterials().find((m) => m.id === item.id)?.costPrice || 0)) * item.quantity), 0), 0);
  return {
    totalRevenue,
    monthlyRevenue,
    dailyRevenue,
    totalProfit,
    totalOrders: orders.length,
    averageOrderValue: orders.length ? totalRevenue / orders.length : 0
  };
}

function renderStats() {
  const data = analytics();
  statsShell.innerHTML = [
    ["Total Revenue", data.totalRevenue],
    ["Monthly Revenue", data.monthlyRevenue],
    ["Daily Revenue", data.dailyRevenue],
    ["Total Profit", data.totalProfit],
    ["Total Orders", data.totalOrders],
    ["Average Order Value", data.averageOrderValue]
  ].map(([label, value]) => `
    <article class="stat-card glass-card">
      <h3>${label}</h3>
      <strong>${typeof value === "number" && label.includes("Orders") ? value : formatCurrency(value)}</strong>
    </article>
  `).join("");
}

function renderChart() {
  const orders = getOrders();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const label = date.toLocaleDateString("en-IN", { weekday: "short" });
    const value = orders.filter((order) => new Date(order.createdAt).toDateString() === date.toDateString()).reduce((sum, order) => sum + order.total, 0);
    return { label, value };
  });
  const max = Math.max(...days.map((day) => day.value), 1);
  chartShell.innerHTML = days.map((day) => `<div class="bar" style="height:${Math.max((day.value / max) * 100, 18)}%;"><span>${day.label}</span></div>`).join("");
}

function renderBestSelling() {
  const aggregation = {};
  getOrders().forEach((order) => {
    order.items.forEach((item) => {
      aggregation[item.name] = aggregation[item.name] || { qty: 0, revenue: 0 };
      aggregation[item.name].qty += item.quantity;
      aggregation[item.name].revenue += item.quantity * item.price;
    });
  });

  const top = Object.entries(aggregation).sort((a, b) => b[1].qty - a[1].qty).slice(0, 5);
  bestShell.innerHTML = top.length ? top.map(([name, values]) => `
    <div class="summary-row"><span>${name}</span><strong>${values.qty} units • ${formatCurrency(values.revenue)}</strong></div>
  `).join("") : `<p class="muted">No sales data yet.</p>`;
}

function renderInventory() {
  inventoryShell.innerHTML = getMaterials().map((material) => `
    <tr>
      <td>${material.id}</td>
      <td>${material.name}</td>
      <td>${material.category}</td>
      <td>${formatCurrency(material.price)}</td>
      <td>${formatCurrency(material.costPrice)}</td>
      <td>${marginPercent(material)}%</td>
      <td>${material.stock} ${material.stock < 50 ? '<span class="badge badge-critical">Low alert</span>' : ""}</td>
      <td class="table-actions">
        <button class="btn btn-outline" data-edit="${material.id}">Edit</button>
        <button class="btn btn-secondary" data-delete="${material.id}">Delete</button>
      </td>
    </tr>
  `).join("");
}

function renderOrdersTable() {
  ordersShell.innerHTML = getOrders().map((order) => `
    <tr>
      <td>${order.id}</td>
      <td>${order.customerName}<br /><span class="muted">${order.customerPhone}</span></td>
      <td>${formatDate(order.createdAt)}</td>
      <td>${formatCurrency(order.total)}</td>
      <td>
        <select data-order-status="${order.id}">
          ${["confirmed", "processing", "picked", "out-for-delivery", "delivered"].map((status) => `
            <option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>
          `).join("")}
        </select>
      </td>
    </tr>
  `).join("");
}

function openMaterialForm(material) {
  modal.open(`
    <form class="form-grid" data-material-form>
      <div class="form-field"><label>Name</label><input name="name" value="${material?.name || ""}" required /></div>
      <div class="form-field"><label>Category</label><input name="category" value="${material?.category || ""}" required /></div>
      <div class="form-field"><label>Price</label><input name="price" type="number" value="${material?.price || ""}" required /></div>
      <div class="form-field"><label>Cost Price</label><input name="costPrice" type="number" value="${material?.costPrice || ""}" required /></div>
      <div class="form-field"><label>Stock</label><input name="stock" type="number" value="${material?.stock || ""}" required /></div>
      <div class="form-field"><label>Emoji</label><input name="image" value="${material?.image || "🧱"}" required /></div>
      <div class="form-field full"><label>Description</label><textarea name="description" required>${material?.description || ""}</textarea></div>
      <div class="form-field"><label>Demand</label><select name="demand"><option>high</option><option ${material?.demand === "medium" ? "selected" : ""}>medium</option><option ${material?.demand === "low" ? "selected" : ""}>low</option></select></div>
      <div class="form-field"><label>Warehouse</label><input name="warehouse" value="${material?.warehouse || ""}" required /></div>
      <div class="form-field"><label>ETA</label><input name="eta" value="${material?.eta || ""}" required /></div>
      <div class="form-field full"><button class="btn btn-primary" type="submit">${material ? "Update" : "Add"} Material</button></div>
    </form>
  `);

  document.querySelector("[data-material-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const materials = getMaterials();
    const next = {
      id: material?.id || `MAT-${Date.now()}`,
      name: payload.name,
      category: payload.category,
      price: Number(payload.price),
      costPrice: Number(payload.costPrice),
      stock: Number(payload.stock),
      image: payload.image,
      description: payload.description,
      demand: payload.demand,
      warehouse: payload.warehouse,
      eta: payload.eta
    };
    const updated = material ? materials.map((item) => item.id === material.id ? next : item) : [next, ...materials];
    saveMaterials(updated);
    renderInventory();
    modal.close();
    showToast(material ? "Material updated." : "Material added.");
  });
}

addButton.addEventListener("click", () => openMaterialForm());

inventoryShell.addEventListener("click", (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) openMaterialForm(getMaterials().find((item) => item.id === editId));
  if (deleteId) {
    saveMaterials(getMaterials().filter((item) => item.id !== deleteId));
    renderInventory();
    showToast("Material deleted.", "info");
  }
});

ordersShell.addEventListener("change", (event) => {
  const orderId = event.target.dataset.orderStatus;
  if (!orderId) return;
  const orders = getOrders().map((order) => order.id === orderId ? { ...order, status: event.target.value } : order);
  saveOrders(orders);
  showToast("Order status updated.");
});

renderStats();
renderChart();
renderBestSelling();
renderInventory();
renderOrdersTable();
