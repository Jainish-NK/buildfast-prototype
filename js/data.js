const STORAGE_KEYS = {
  users: "buildfast-users",
  materials: "buildfast-materials",
  orders: "buildfast-orders",
  cart: "buildfast-cart",
  currentUser: "buildfast-current-user",
  rememberUser: "buildfast-remember-user",
  trackingOrder: "buildfast-tracking-order"
};

const defaultMaterials = [
  { id: "MAT-001", name: "Portland Cement 50kg", category: "Cement", price: 380, costPrice: 320, stock: 150, image: "🧱", description: "High-strength cement ideal for slabs, columns, and structural work.", demand: "high", warehouse: "North Hub", eta: "30-45 mins" },
  { id: "MAT-002", name: "Red Clay Bricks (1000 pcs)", category: "Bricks", price: 5500, costPrice: 4800, stock: 75, image: "🧱", description: "Uniform red clay bricks for walls and load-bearing construction.", demand: "high", warehouse: "East Yard", eta: "60-75 mins" },
  { id: "MAT-003", name: "TMT Steel Bars 12mm (1 ton)", category: "Steel", price: 65000, costPrice: 58000, stock: 45, image: "🏗️", description: "Earthquake-resistant TMT bars with high tensile strength.", demand: "high", warehouse: "Central Steel Depot", eta: "75-90 mins" },
  { id: "MAT-004", name: "River Sand (1 ton)", category: "Sand", price: 1200, costPrice: 900, stock: 200, image: "⛏️", description: "Clean, screened river sand for plastering and masonry.", demand: "medium", warehouse: "Riverfront Yard", eta: "35-50 mins" },
  { id: "MAT-005", name: "Ceramic Floor Tiles (10 sq ft)", category: "Tiles", price: 450, costPrice: 350, stock: 300, image: "◻️", description: "Scratch-resistant ceramic tiles with premium matte finish.", demand: "medium", warehouse: "South Tiles Hub", eta: "40-55 mins" },
  { id: "MAT-006", name: "White Cement Paint 20kg", category: "Paint", price: 850, costPrice: 700, stock: 120, image: "🎨", description: "Weather-proof white cement paint for durable exterior coating.", demand: "medium", warehouse: "Color Warehouse", eta: "30-45 mins" },
  { id: "MAT-007", name: "PVC Plumbing Pipes 4 inch (10 ft)", category: "Plumbing", price: 320, costPrice: 250, stock: 180, image: "🚰", description: "Pressure-tested PVC pipes for reliable water and drainage systems.", demand: "medium", warehouse: "Utility Depot", eta: "30-45 mins" },
  { id: "MAT-008", name: "Copper Electrical Wire 1.5mm (100m)", category: "Electrical", price: 1800, costPrice: 1500, stock: 90, image: "⚡", description: "High conductivity copper wire with heat-resistant insulation.", demand: "high", warehouse: "Power Hub", eta: "45-60 mins" },
  { id: "MAT-009", name: "Plywood Board 8x4 ft", category: "Wood", price: 1200, costPrice: 950, stock: 60, image: "🪵", description: "Moisture-resistant plywood sheet for interiors and furniture.", demand: "medium", warehouse: "Wood Stack", eta: "55-70 mins" },
  { id: "MAT-010", name: "Tempered Glass 6mm (10 sq ft)", category: "Glass", price: 2200, costPrice: 1800, stock: 40, image: "🪟", description: "Safety-tempered glass for facades, railings, and partitions.", demand: "low", warehouse: "Glass Bay", eta: "70-90 mins" },
  { id: "MAT-011", name: "Bathroom Fixtures Set", category: "Fixtures", price: 3500, costPrice: 2800, stock: 55, image: "🚿", description: "Modern chrome fixtures set including shower, taps, and accessories.", demand: "medium", warehouse: "Home Finish Center", eta: "45-60 mins" },
  { id: "MAT-012", name: "Power Tools Kit", category: "Tools", price: 4500, costPrice: 3800, stock: 35, image: "🛠️", description: "Contractor-grade toolkit with drill, grinder, and essentials.", demand: "high", warehouse: "Tool Vault", eta: "50-65 mins" },
  { id: "MAT-013", name: "Construction Adhesive 5kg", category: "Chemicals", price: 550, costPrice: 420, stock: 150, image: "🧴", description: "Fast-bond adhesive for tiles, paneling, and finishing work.", demand: "medium", warehouse: "Chem Store", eta: "30-45 mins" },
  { id: "MAT-014", name: "Insulation Board", category: "Insulation", price: 1800, costPrice: 1450, stock: 45, image: "🧊", description: "Thermal insulation board for energy-efficient wall and roof systems.", demand: "low", warehouse: "Eco Materials Hub", eta: "60-75 mins" },
  { id: "MAT-015", name: "Roofing Sheets (10 pcs)", category: "Roofing", price: 3200, costPrice: 2700, stock: 70, image: "🏠", description: "Corrosion-resistant roofing sheets for industrial and rural projects.", demand: "medium", warehouse: "Roofline Depot", eta: "55-70 mins" },
  { id: "MAT-016", name: "Hardware Assortment Kit", category: "Hardware", price: 900, costPrice: 700, stock: 200, image: "🔩", description: "Mixed pack of fasteners, anchors, hinges, and site essentials.", demand: "high", warehouse: "Fixings Hub", eta: "30-45 mins" }
];

const defaultUsers = [
  { id: "USR-ADMIN", fullName: "BuildFast Admin", email: "admin@buildfast.com", phone: "9999999999", password: "admin123", userType: "admin", subscription: "premium", createdAt: new Date().toISOString() },
  { id: "USR-CONTRACTOR", fullName: "Rahul Contractor", email: "contractor@test.com", phone: "9876543210", password: "test123", userType: "contractor", subscription: "basic", createdAt: new Date().toISOString() }
];

const defaultCategories = ["All", "Cement", "Bricks", "Steel", "Sand", "Tiles", "Paint", "Plumbing", "Electrical", "Wood", "Glass", "Fixtures", "Tools", "Chemicals", "Insulation", "Roofing", "Hardware"];

export function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Failed to read ${key}`, error);
    return fallback;
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function marginPercent(item) {
  return Math.round(((item.price - item.costPrice) / item.price) * 100);
}

export function stockStatus(stock) {
  if (stock < 50) return "critical";
  if (stock < 100) return "low";
  if (stock < 200) return "medium";
  return "high";
}

export function discountRate(subscription) {
  if (subscription === "premium") return 0.15;
  if (subscription === "basic") return 0.05;
  return 0; // Free plan - no discount
}

export const getUsers = () => readStorage(STORAGE_KEYS.users, []);
export const saveUsers = (users) => writeStorage(STORAGE_KEYS.users, users);
export const getMaterials = () => readStorage(STORAGE_KEYS.materials, []);
export const saveMaterials = (materials) => writeStorage(STORAGE_KEYS.materials, materials);
export const getOrders = () => readStorage(STORAGE_KEYS.orders, []);
export const saveOrders = (orders) => writeStorage(STORAGE_KEYS.orders, orders);
export const getCart = () => readStorage(STORAGE_KEYS.cart, []);
export const saveCart = (cart) => writeStorage(STORAGE_KEYS.cart, cart);

export function getCurrentUser() {
  return readStorage(STORAGE_KEYS.currentUser, null) || readStorage(STORAGE_KEYS.rememberUser, null);
}

export function setCurrentUser(user, remember = false) {
  if (remember) {
    writeStorage(STORAGE_KEYS.rememberUser, user);
  } else {
    localStorage.removeItem(STORAGE_KEYS.rememberUser);
  }
  sessionStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}

export function clearCurrentUser() {
  sessionStorage.removeItem(STORAGE_KEYS.currentUser);
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  localStorage.removeItem(STORAGE_KEYS.rememberUser);
}

export const setTrackingOrder = (orderId) => localStorage.setItem(STORAGE_KEYS.trackingOrder, orderId);
export const getTrackingOrder = () => localStorage.getItem(STORAGE_KEYS.trackingOrder);

export function seedAppData() {
  if (!localStorage.getItem(STORAGE_KEYS.materials)) saveMaterials(defaultMaterials);
  if (!localStorage.getItem(STORAGE_KEYS.users)) saveUsers(defaultUsers);
  if (!localStorage.getItem(STORAGE_KEYS.orders)) saveOrders([]);
  if (!localStorage.getItem(STORAGE_KEYS.cart)) saveCart([]);
}

export const getCategories = () => defaultCategories;

export function generateOrderId() {
  return `ORD${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
}

export function formatDate(value) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function buildOrderStatusIndex(status) {
  const statuses = ["confirmed", "processing", "picked", "out-for-delivery", "delivered"];
  return Math.max(statuses.indexOf(status), 0);
}

export { STORAGE_KEYS };