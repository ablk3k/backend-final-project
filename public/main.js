$(function () {
  // Set current year
  $("#year, #year2, #year3, #year4, #year5").text(new Date().getFullYear());

  // ===================== RESERVATION TABLE PICKER =====================
  let selectedTableId = null;
  const DEFAULT_DURATION = 120; // minutes

  function setTablesUI({ loading = false, empty = false, clear = false } = {}) {
    const $loading = $("#tablesLoading");
    const $empty = $("#tablesEmpty");
    const $grid = $("#tablesGrid");

    if ($loading.length) $loading.toggleClass("d-none", !loading);
    if ($empty.length) $empty.toggleClass("d-none", !empty);
    if (clear && $grid.length) $grid.empty();
  }

  function clearSelectedTable() {
    selectedTableId = null;
    $("#tableId").val("");
    $(".table-card.selected").removeClass("selected");
  }

  function renderTables(tables) {
    const $grid = $("#tablesGrid");
    if (!$grid.length) return;

    $grid.empty();

    tables.forEach((t) => {
      const $col = $('<div class="col-6 col-md-4"></div>');

      const $btn = $(`
        <button type="button" class="w-100 text-start p-2 border rounded table-card">
          <div class="d-flex justify-content-between align-items-center">
            <div class="fw-semibold"></div>
            <span class="badge text-bg-light"></span>
          </div>
          <div class="small text-muted text-capitalize"></div>
        </button>
      `);

      $btn.find(".fw-semibold").text(t.label);
      $btn.find(".badge").text(`${t.capacity} seats`);
      $btn.find(".small").text(t.area || "main");

      $btn.on("click", function () {
        clearSelectedTable();
        selectedTableId = t._id;
        $("#tableId").val(t._id);
        $(this).addClass("selected");
      });

      $col.append($btn);
      $grid.append($col);
    });
  }

  async function loadAvailableTables() {
    // Only run if the UI exists on this page
    if (!document.getElementById("tablesGrid")) return;

    clearSelectedTable();

    const date = $("#resDate").val();
    const time = $("#resTime").val();
    const guests = parseInt($("#guests").val(), 10);

    if (!date || !time || !guests) {
      setTablesUI({ loading: false, empty: false, clear: true });
      return;
    }

    setTablesUI({ loading: true, empty: false, clear: true });

    try {
      const qs = new URLSearchParams({
        date,
        time,
        guests: String(guests),
        duration: String(DEFAULT_DURATION),
      });

      const res = await apiFetch(`/api/tables/available?${qs.toString()}`);
      const data = await res.json().catch(() => []);

      setTablesUI({ loading: false });

      if (!res.ok) {
        console.error("Available tables API error:", data);
        setTablesUI({ empty: true });
        return;
      }

      if (!Array.isArray(data) || data.length === 0) {
        setTablesUI({ empty: true });
        return;
      }

      setTablesUI({ empty: false });
      renderTables(data);
    } catch (err) {
      console.error(err);
      setTablesUI({ loading: false, empty: true });
    }
  }

  // Load tables when date/time/guests change
  $("#resDate, #resTime, #guests").on("change", loadAvailableTables);
  $("#refreshTablesBtn").on("click", loadAvailableTables);

  // ===================== RESERVE MODAL =====================
  $("#reserveBtn, #reserveBtnTop, #reserveBtnTop2, #reserveBtnTop3, #reserveBtnTop4").on("click", function () {
    const el = document.getElementById("reserveModal");
    if (el) {
      const modal = bootstrap.Modal.getOrCreateInstance(el);
      modal.show();

      // optional: load tables immediately if values already chosen
      loadAvailableTables();
    } else {
      window.location.href = "index.html";
    }
  });

  // ===================== RESERVATION FORM SUBMISSION =====================
  $("#reserveForm").on("submit", async function (e) {
    e.preventDefault();

    const name = $("#name").val().trim();
    const phone = $("#phone").val().trim();
    const date = $("#resDate").val();
    const time = $("#resTime").val();
    const guests = parseInt($("#guests").val(), 10);

    // table selection
    const tableId = $("#tableId").val() || selectedTableId;

    if (!name || !phone || !date || !time || !guests) {
      alert("Please fill all fields correctly.");
      return;
    }

    if (!tableId) {
      alert("Please choose a table.");
      return;
    }

    const selected = new Date(date + "T" + time);
    const now = new Date();
    if (isNaN(selected.getTime())) {
      alert("Please choose a valid date and time.");
      return;
    }
    if (selected < now) {
      alert("Reservation time must be in the future.");
      return;
    }

    // Save locally (optional)
    let reservations = JSON.parse(localStorage.getItem("reservations")) || [];
    reservations.push({ name, phone, date, time, guests, tableId, duration: DEFAULT_DURATION });
    localStorage.setItem("reservations", JSON.stringify(reservations));

    // Send to backend API (public create)
    try {
      const res = await apiFetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, date, time, guests, tableId, duration: DEFAULT_DURATION })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Reservation API error:", data);

        if (res.status === 409) {
          alert(data.error || "This table is already booked. Please choose another table.");
          await loadAvailableTables();
          return;
        }

        alert(data.error || "Reservation saved locally, but server request failed.");
      } else {
        alert("Reservation received! We will call to confirm.");
      }
    } catch (err) {
      console.error(err);
      alert("Reservation saved locally, but server is not reachable.");
    }

    $(this).trigger("reset");
    clearSelectedTable();
    setTablesUI({ loading: false, empty: false, clear: true });

    const modalEl = document.getElementById("reserveModal");
    if (modalEl) {
      const modalInst =
        bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInst.hide();
    }
  });

  // ===================== CONTACT FORM (if present) =====================
  $("#contactForm").on("submit", function (e) {
    e.preventDefault();

    const name = $("#cname").val().trim();
    const email = $("#cemail").val().trim();
    const message = $("#cmessage").val().trim();

    if (!name || !email || !message || !validateEmail(email)) {
      alert("Please enter a valid name, email, and message.");
      return;
    }

    alert("Thanks! Your message has been sent.");
    $(this).trigger("reset");
  });

  // ===================== DISH CARD OVERLAY =====================
  $(".dish-card").each(function () {
    const overlay = $(this).find(".dish-overlay");
    if (overlay.length) overlay.hide();
    $(this).on("click", function () {
      $(this).find(".dish-overlay").toggle();
    });
  });

  // Page fade-in
  $("main.container").hide().fadeIn(600);

  // ===================== DARK/LIGHT MODE TOGGLE =====================
  const themeBtn = document.getElementById("themeToggle");

  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    if (themeBtn) themeBtn.textContent = "☀️";
  } else {
    if (themeBtn) themeBtn.textContent = "🌙";
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      document.body.classList.toggle("dark-mode");
      if (document.body.classList.contains("dark-mode")) {
        themeBtn.textContent = "☀️";
        localStorage.setItem("theme", "dark");
      } else {
        themeBtn.textContent = "🌙";
        localStorage.setItem("theme", "light");
      }
    });
  }

  // ===================== GALLERY IMAGE CLICK -> DESCRIPTION MODAL =====================
  $(".gallery-item").on("click", function () {
    const src = $(this).attr("src") || $(this).data("src");
    const title = $(this).data("title") || "";
    const desc = $(this).data("description") || "";

    $("#imageModalImg").attr("src", src);
    $("#imageModalTitle").text(title);
    $("#imageModalDesc").text(desc);

    const modalEl = document.getElementById("imageModal");
    if (modalEl) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
    }
  });
});

// ===================== EMAIL VALIDATION =====================
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ===================== PRICE FORMAT (KZT) =====================
function formatKZT(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0
  }).format(n);
}

// ======================= AUTH CONFIG =======================
const API_BASE = "http://localhost:5000";

function getToken() {
  return localStorage.getItem("token");
}

function setAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = options.headers ? { ...options.headers } : {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

// ======================= NAVBAR USER ICON =======================
function getInitials(nameOrEmail) {
  const s = (nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

function updateAuthUI() {
  const user = getUser();

  const loginLink = document.getElementById("loginLink");
  const registerLink = document.getElementById("registerLink");
  const userWrap = document.getElementById("userDropdownWrap");

  if (!loginLink || !registerLink || !userWrap) return;

  if (user) {
    loginLink.classList.add("d-none");
    registerLink.classList.add("d-none");
    userWrap.classList.remove("d-none");

    const nameEl = document.getElementById("userNameNav");
    const emailEl = document.getElementById("userEmailNav");
    const avatarEl = document.getElementById("userAvatar");

    if (nameEl) nameEl.textContent = user.name || "User";
    if (emailEl) emailEl.textContent = user.email || "";
    if (avatarEl) avatarEl.textContent = getInitials(user.name || user.email);
  } else {
    loginLink.classList.remove("d-none");
    registerLink.classList.remove("d-none");
    userWrap.classList.add("d-none");
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.onclick = logout;
}

// ======================= MENU (Public list + admin delete button) =======================
async function fetchMenuItems() {
  try {
    const res = await apiFetch("/api/menu");
    if (!res.ok) throw new Error("Failed to load menu");
    const data = await res.json();
    renderMenuItems(data);
  } catch (err) {
    console.error(err);
    const el = document.getElementById("apiMenuList");
    if (el) el.innerHTML = '<div class="text-danger">Could not fetch menu items.</div>';
  }
}

function renderMenuItems(items) {
  const container = document.getElementById("apiMenuList");
  if (!container) return;

  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = '<div class="text-muted">No items yet.</div>';
    return;
  }

  const user = getUser();
  const isAdmin = user && user.role === "admin";

  container.innerHTML = "";
  items.forEach((it) => {
    const node = document.createElement("div");
    node.className = "card mb-2 p-2";

    node.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <strong>${escapeHtml(it.name)}</strong>
          <div class="text-muted small">${escapeHtml(it.category)} • ${formatKZT(it.price)}</div>
          <div class="small mt-1">${escapeHtml(it.description)}</div>
        </div>
        <div>
          ${isAdmin ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteMenuItem('${it._id}')">Delete</button>` : ``}
        </div>
      </div>
    `;
    container.appendChild(node);
  });
}

async function deleteMenuItem(id) {
  if (!confirm("Delete this item?")) return;

  try {
    const res = await apiFetch(`/api/menu/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data.error || "Delete failed (login as admin).");
      return;
    }

    await fetchMenuItems();
  } catch (err) {
    console.error(err);
    alert("Network error");
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ======================= ADMIN PAGE LOGIC =======================
function requireAdminOnAdminPage() {
  if (!location.pathname.toLowerCase().endsWith("admin.html")) return true;

  const user = getUser();
  const msg = document.getElementById("adminGuardMsg");

  if (!user) {
    if (msg) msg.innerHTML = `<div class="alert alert-warning">Please login as admin to access this page.</div>`;
    setTimeout(() => (window.location.href = "login.html"), 700);
    return false;
  }

  if (user.role !== "admin") {
    if (msg) msg.innerHTML = `<div class="alert alert-danger">Forbidden: Admin only.</div>`;
    setTimeout(() => (window.location.href = "index.html"), 900);
    return false;
  }

  if (msg) msg.innerHTML = "";
  return true;
}

async function adminLoadMenu() {
  const list = document.getElementById("adminMenuList");
  if (!list) return;

  list.innerHTML = `<div class="text-muted">Loading...</div>`;

  try {
    const res = await apiFetch("/api/menu");
    const data = await res.json().catch(() => []);
    if (!res.ok) {
      list.innerHTML = `<div class="text-danger">${escapeHtml(data.error || "Failed to load menu.")}</div>`;
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      list.innerHTML = `<div class="text-muted">No items yet.</div>`;
      return;
    }

    list.innerHTML = "";
    data.forEach((it) => {
      const card = document.createElement("div");
      card.className = "card mb-2 p-3";

      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="fw-bold">${escapeHtml(it.name)}</div>
            <div class="text-muted small">${escapeHtml(it.category)} • ${formatKZT(it.price)}</div>
            <div class="small mt-1">${escapeHtml(it.description)}</div>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-secondary" data-edit="${it._id}">Edit</button>
            <button class="btn btn-sm btn-outline-danger" data-del="${it._id}">Delete</button>
          </div>
        </div>
      `;

      card.dataset.item = JSON.stringify(it);
      list.appendChild(card);
    });

    list.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-del");
        if (!confirm("Delete this item?")) return;

        const res = await apiFetch(`/api/menu/${id}`, { method: "DELETE" });
        const out = await res.json().catch(() => ({}));
        if (!res.ok) return alert(out.error || "Delete failed");
        adminLoadMenu();
      });
    });

    list.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const wrap = btn.closest(".card");
        const it = JSON.parse(wrap.dataset.item || "{}");
        adminStartEdit(it);
      });
    });
  } catch (err) {
    console.error(err);
    list.innerHTML = `<div class="text-danger">Network error</div>`;
  }
}

function adminStartEdit(item) {
  const editId = document.getElementById("editId");
  const title = document.getElementById("adminFormTitle");
  const cancelBtn = document.getElementById("cancelEditBtn");
  const submitBtn = document.getElementById("adminSubmitBtn");

  document.getElementById("mname").value = item.name || "";
  document.getElementById("mprice").value = item.price ?? "";
  document.getElementById("mcategory").value = item.category || "";
  document.getElementById("mdesc").value = item.description || "";

  if (editId) editId.value = item._id;
  if (title) title.textContent = "Update Menu Item";
  if (submitBtn) submitBtn.textContent = "Update";
  if (cancelBtn) cancelBtn.classList.remove("d-none");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function adminResetForm() {
  const form = document.getElementById("adminMenuForm");
  const editId = document.getElementById("editId");
  const title = document.getElementById("adminFormTitle");
  const cancelBtn = document.getElementById("cancelEditBtn");
  const submitBtn = document.getElementById("adminSubmitBtn");

  if (form) form.reset();
  if (editId) editId.value = "";
  if (title) title.textContent = "Create Menu Item";
  if (submitBtn) submitBtn.textContent = "Create";
  if (cancelBtn) cancelBtn.classList.add("d-none");
}

async function adminSubmitForm(e) {
  e.preventDefault();

  const msg = document.getElementById("adminFormMsg");
  if (msg) msg.innerHTML = "";

  const id = document.getElementById("editId")?.value || "";
  const name = document.getElementById("mname").value.trim();
  const price = parseFloat(document.getElementById("mprice").value);
  const category = document.getElementById("mcategory").value.trim();
  const description = document.getElementById("mdesc").value.trim();

  if (!name || !category || !description || isNaN(price)) {
    if (msg) msg.innerHTML = `<div class="alert alert-danger mb-0">Please fill all fields.</div>`;
    return;
  }

  const payload = { name, price, category, description };

  try {
    const res = await apiFetch(id ? `/api/menu/${id}` : "/api/menu", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const out = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (msg) msg.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(out.error || "Request failed")}</div>`;
      else alert(out.error || "Request failed");
      return;
    }

    if (msg) msg.innerHTML = `<div class="alert alert-success mb-0">${id ? "Updated!" : "Created!"}</div>`;
    adminResetForm();
    adminLoadMenu();
  } catch (err) {
    console.error(err);
    if (msg) msg.innerHTML = `<div class="alert alert-danger mb-0">Network error</div>`;
  }
}

// ======================= VERIFY PAGE HELPERS =======================
// ✅ ВАЖНО: endpoints должны совпадать с backend роутами:
// register -> /api/auth/register
// verify   -> /api/auth/verify
// resend   -> /api/auth/resend

async function verifySubmit(e) {
  e.preventDefault();

  const msg = document.getElementById("verifyMsg");
  if (msg) msg.innerHTML = "";

  const email = document.getElementById("verifyEmail").value.trim();
  const code = document.getElementById("verifyCode").value.trim();

  if (!email || !validateEmail(email) || !code || code.length < 6) {
    if (msg) msg.innerHTML = `<div class="alert alert-danger mb-0">Enter a valid email and 6-digit code.</div>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/verify`, { // ✅ FIXED
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (msg) msg.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(data.error || "Verification failed")}</div>`;
      return;
    }

    localStorage.removeItem("pendingVerifyEmail");

    if (msg) msg.innerHTML = `<div class="alert alert-success mb-0">Verified! Redirecting to login…</div>`;
    setTimeout(() => (window.location.href = "login.html"), 600);
  } catch (err) {
    console.error(err);
    if (msg) msg.innerHTML = `<div class="alert alert-danger mb-0">Network error</div>`;
  }
}

async function resendCode() {
  const msg = document.getElementById("verifyMsg");
  if (msg) msg.innerHTML = "";

  const email = document.getElementById("verifyEmail").value.trim();
  if (!email || !validateEmail(email)) {
    if (msg) msg.innerHTML = `<div class="alert alert-danger mb-0">Enter a valid email first.</div>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/resend`, { // ✅ FIXED
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (msg) msg.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(data.error || "Resend failed")}</div>`;
      return;
    }

    if (msg) msg.innerHTML = `<div class="alert alert-success mb-0">${escapeHtml(data.message || "Code resent. Check your email.")}</div>`;
  } catch (err) {
    console.error(err);
    if (msg) msg.innerHTML = `<div class="alert alert-danger mb-0">Network error</div>`;
  }
}

// ======================= DOM READY HOOKS =======================
document.addEventListener("DOMContentLoaded", function () {
  updateAuthUI();
  window.addEventListener("pageshow", updateAuthUI);

  // Hide admin link/button if not admin (optional)
  const user = getUser();
  const manage = document.getElementById("manageMenu");
  if (manage) {
    if (!user || user.role !== "admin") manage.style.display = "none";
  }

  // Public menu list (menu.html)
  const menuList = document.getElementById("apiMenuList");
  if (menuList) fetchMenuItems();

  // REGISTER (register.html) -> verify.html ALWAYS
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("regName").value.trim();
      const email = document.getElementById("regEmail").value.trim();
      const password = document.getElementById("regPassword").value;

      const msg = document.getElementById("registerMsg");
      if (msg) msg.innerHTML = "";

      try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (msg) msg.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(data.error || "Registration failed")}</div>`;
          else alert(data.error || "Registration failed");
          return;
        }

        // Save email so verify.html auto-fills it
        localStorage.setItem("pendingVerifyEmail", data.email || email);

        if (msg) msg.innerHTML = `<div class="alert alert-success mb-0">Account created! Redirecting to verification…</div>`;
        registerForm.reset();

        setTimeout(() => (window.location.href = "verify.html"), 400);
      } catch (err) {
        console.error(err);
        if (msg) msg.innerHTML = `<div class="alert alert-danger mb-0">Network error</div>`;
        else alert("Network error");
      }
    });
  }

  // VERIFY PAGE (verify.html)
  const verifyForm = document.getElementById("verifyForm");
  if (verifyForm) {
    const pendingEmail = localStorage.getItem("pendingVerifyEmail");
    const emailInput = document.getElementById("verifyEmail");
    if (pendingEmail && emailInput && !emailInput.value) {
      emailInput.value = pendingEmail;
      const hint = document.getElementById("verifyHint");
      if (hint) {
        hint.style.display = "";
        hint.textContent = `We sent a code to: ${pendingEmail}`;
      }
    }

    verifyForm.addEventListener("submit", verifySubmit);

    const resendBtn = document.getElementById("resendCodeBtn");
    if (resendBtn) resendBtn.addEventListener("click", resendCode);
  }

  // LOGIN (login.html)
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      const msg = document.getElementById("loginMsg");
      if (msg) msg.innerHTML = "";

      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (msg) msg.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(data.error || "Login failed")}</div>`;
          else alert(data.error || "Login failed");
          return;
        }

        setAuth(data.token, data.user);
        updateAuthUI();

        if (msg) msg.innerHTML = `<div class="alert alert-success mb-0">Login success! Redirecting…</div>`;
        setTimeout(() => (window.location.href = "menu.html"), 700);
      } catch (err) {
        console.error(err);
        if (msg) msg.innerHTML = `<div class="alert alert-danger mb-0">Network error</div>`;
        else alert("Network error");
      }
    });
  }

  // ADMIN PAGE (admin.html)
  if (location.pathname.toLowerCase().endsWith("admin.html")) {
    if (!requireAdminOnAdminPage()) return;

    const refreshBtn = document.getElementById("refreshAdminBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", adminLoadMenu);

    const adminForm = document.getElementById("adminMenuForm");
    if (adminForm) adminForm.addEventListener("submit", adminSubmitForm);

    const cancelBtn = document.getElementById("cancelEditBtn");
    if (cancelBtn) cancelBtn.addEventListener("click", adminResetForm);

    adminLoadMenu();
  }
});
