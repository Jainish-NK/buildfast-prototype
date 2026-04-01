import { getUsers, saveUsers, setCurrentUser, clearCurrentUser, getCurrentUser } from "./data.js";
import { showToast } from "./app.js";

const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

export function handleLogout() {
  const url = new URL(window.location.href);
  if (url.searchParams.get("logout") === "1") {
    clearCurrentUser();
    showToast("Logged out successfully.", "info");
    setTimeout(() => {
      window.location.href = "./index.html";
    }, 400);
  }
}

export function mountSignup() {
  const form = document.querySelector("[data-signup-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());

    if (!payload.fullName || !validateEmail(payload.email) || payload.password.length < 6) {
      showToast("Please complete the form with valid details. Password must be at least 6 characters.", "error");
      return;
    }

    const users = getUsers();
    if (users.some((user) => user.email.toLowerCase() === payload.email.toLowerCase())) {
      showToast("An account with this email already exists. Please login instead.", "error");
      return;
    }

    const user = {
      id: `USR-${Date.now()}`,
      fullName: payload.fullName,
      email: payload.email.toLowerCase(),
      phone: payload.phone,
      password: payload.password,
      userType: payload.userType || "contractor",
      subscription: payload.subscription || "free",
      createdAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(users);
    setCurrentUser(user, true);
    showToast("Account created successfully! Welcome to BuildFast!");
    setTimeout(() => {
      window.location.href = "./marketplace.html";
    }, 800);
  });
}

export function mountLogin() {
  const form = document.querySelector("[data-login-form]");
  if (!form) return;

  const remembered = getCurrentUser();
  if (remembered) {
    const hint = document.querySelector("[data-login-hint]");
    if (hint) hint.textContent = `Welcome back, ${remembered.fullName}!`;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = `${formData.get("email")}`.toLowerCase();
    const password = `${formData.get("password")}`;
    const remember = formData.get("remember") === "on";

    const user = getUsers().find((item) => item.email.toLowerCase() === email && item.password === password);

    if (!user) {
      showToast("Invalid email or password. Please try again.", "error");
      return;
    }

    setCurrentUser(user, remember);
    showToast(`Welcome back, ${user.fullName}!`);
    setTimeout(() => {
      window.location.href = user.userType === "admin" ? "./admin.html" : "./marketplace.html";
    }, 400);
  });
}