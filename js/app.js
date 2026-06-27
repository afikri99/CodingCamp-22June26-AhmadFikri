(function () {

  // --- Constants ---
  const STORAGE_KEY = "expense_transactions";
  const CATEGORIES = ["Food", "Transport", "Fun"];
  const CHART_COLORS = { Food: "#FF6384", Transport: "#36A2EB", Fun: "#FFCE56" };
  const MAX_NAME_LEN = 100;
  const MIN_AMOUNT = 0.01;
  const MAX_AMOUNT = 999999.99;

  // --- State ---
  let transactions = [];
  let chartInstance = null;

  // --- Validation ---
  function validateInputs(name, amountStr, category) {
    const errors = {};

    // Name rule: must be 1–MAX_NAME_LEN non-whitespace characters
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > MAX_NAME_LEN) {
      errors.name = "Item name is required";
    }

    // Amount rule: numeric, in [MIN_AMOUNT, MAX_AMOUNT], at most 2 decimal places
    const amountNum = parseFloat(amountStr);
    const isNumeric = amountStr.trim() !== "" && !isNaN(amountNum);
    const inRange = isNumeric && amountNum >= MIN_AMOUNT && amountNum <= MAX_AMOUNT;
    const decimalMatch = isNumeric && /^\d+(\.\d{1,2})?$/.test(amountStr.trim());
    if (!isNumeric || !inRange || !decimalMatch) {
      errors.amount = "Amount must be between 0.01 and 999999.99 with up to 2 decimal places";
    }

    // Category rule: must be one of CATEGORIES
    if (!CATEGORIES.includes(category)) {
      errors.category = "Category is required";
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  // --- Storage helpers ---
  function saveToStorage(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // --- Utilities ---

  /**
   * Formats a number as Indonesian Rupiah string.
   * @param {number} value
   * @returns {string}
   */
  function formatCurrency(value) {
    return "Rp " + value.toLocaleString("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Escapes HTML special characters to prevent XSS.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // --- Transaction operations ---

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function createTransaction(name, amountStr, category) {
    const amount = Math.round(parseFloat(amountStr) * 100) / 100;
    return { id: generateId(), name: name.trim(), amount, category };
  }

  function addTransaction(transaction) {
    transactions.push(transaction);
    saveToStorage(transactions);
    refreshUI();
  }

  function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveToStorage(transactions);
    refreshUI();
  }

  // --- Calculations ---

  function calcBalance(txns) {
    return txns.reduce((sum, t) => sum + t.amount, 0);
  }

  function calcCategorySums(txns) {
    return CATEGORIES.map(cat =>
      txns.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0)
    );
  }

  // --- Rendering ---

  /** Master refresh — call after any state change */
  function refreshUI() {
    renderBalance();
    renderTransactionList();
    renderChart();
  }

  function renderBalance() {
    document.getElementById("balance-value").textContent =
      formatCurrency(calcBalance(transactions));
  }

  function renderTransactionList() {
    const ul = document.getElementById("transaction-list");
    ul.innerHTML = "";
    transactions.forEach(t => ul.appendChild(buildTransactionItem(t)));
  }

  function buildTransactionItem(transaction) {
    const li = document.createElement("li");
    li.className = "transaction-item";
    li.dataset.id = transaction.id;
    li.innerHTML = `
      <span class="item-name">${escapeHtml(transaction.name)}</span>
      <span class="item-amount">${formatCurrency(transaction.amount)}</span>
      <span class="item-category category-${transaction.category.toLowerCase()}">${transaction.category}</span>
      <button class="delete-btn" aria-label="Delete ${escapeHtml(transaction.name)}">✕</button>
    `;
    return li;
  }

  // --- Chart ---

  function renderChart() {
    // Guard: Chart.js CDN may not have loaded
    if (typeof Chart === "undefined") return;

    const sums = calcCategorySums(transactions);

    if (chartInstance) {
      // Update in place — avoids canvas flicker
      chartInstance.data.datasets[0].data = sums;
      chartInstance.update();
      return;
    }

    const ctx = document.getElementById("spending-chart").getContext("2d");
    chartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: CATEGORIES,
        datasets: [{
          data: sums,
          backgroundColor: CATEGORIES.map(c => CHART_COLORS[c]),
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}`,
            },
          },
        },
      },
    });
  }

  // --- Event handlers ---

  function handleFormSubmit(event) {
    event.preventDefault();

    const nameField     = document.getElementById("item-name");
    const amountField   = document.getElementById("amount");
    const categoryField = document.getElementById("category");

    const name      = nameField.value;
    const amountStr = amountField.value;
    const category  = categoryField.value;

    const { valid, errors } = validateInputs(name, amountStr, category);

    // Show / clear per-field errors
    const nameError     = document.getElementById("name-error");
    const amountError   = document.getElementById("amount-error");
    const categoryError = document.getElementById("category-error");

    if (errors.name) {
      nameError.textContent = errors.name;
      nameError.style.display = "block";
      nameField.setAttribute("aria-invalid", "true");
    } else {
      nameError.textContent = "";
      nameError.style.display = "none";
      nameField.removeAttribute("aria-invalid");
    }

    if (errors.amount) {
      amountError.textContent = errors.amount;
      amountError.style.display = "block";
      amountField.setAttribute("aria-invalid", "true");
    } else {
      amountError.textContent = "";
      amountError.style.display = "none";
      amountField.removeAttribute("aria-invalid");
    }

    if (errors.category) {
      categoryError.textContent = errors.category;
      categoryError.style.display = "block";
      categoryField.setAttribute("aria-invalid", "true");
    } else {
      categoryError.textContent = "";
      categoryError.style.display = "none";
      categoryField.removeAttribute("aria-invalid");
    }

    if (!valid) return; // Retain field values on failure

    // Validation passed: create, add, reset form
    const transaction = createTransaction(name, amountStr, category);
    addTransaction(transaction);
    event.target.reset();
  }

  // --- Bootstrap ---

  function handleListClick(event) {
    if (event.target.classList.contains("delete-btn")) {
      const item = event.target.closest(".transaction-item");
      if (item) {
        deleteTransaction(item.dataset.id);
      }
    }
  }

  function initApp() {
    transactions = loadFromStorage();
    refreshUI();

    // Attach event listeners after DOM is ready
    document.getElementById("input-form").addEventListener("submit", handleFormSubmit);
    document.getElementById("transaction-list").addEventListener("click", handleListClick);
  }

  // Bootstrap on DOM ready
  document.addEventListener("DOMContentLoaded", initApp);

})();
