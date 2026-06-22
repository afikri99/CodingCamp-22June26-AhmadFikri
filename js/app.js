(function () {

  // --- Constants ---
  const TRANSACTIONS_KEY = "expense_transactions";
  const CATEGORIES_KEY = "expense_categories";
  const LIMIT_KEY = "expense_limit";
  const THEME_KEY = "expense_theme";

  const DEFAULT_CATEGORIES = [
    { name: "Food", color: "#FF6384" },
    { name: "Transport", color: "#36A2EB" },
    { name: "Fun", color: "#FFCE56" }
  ];

  const COLOR_OPTIONS = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
    "#9966FF", "#FF9F40", "#C9CBCF", "#E67E22"
  ];

  const MAX_NAME_LEN = 100;
  const MIN_AMOUNT = 0.01;
  const MAX_AMOUNT = 999999.99;

  // --- State ---
  let transactions = [];
  let categories = [];
  let monthlyLimit = 0;
  let currentSort = "date-desc";
  let currentMonthFilter = "";
  let chartInstance = null;
  let selectedColorForNewCategory = COLOR_OPTIONS[0];
  let isDarkMode = false;

  // ============================================================
  //  STORAGE HELPERS
  // ============================================================

  function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function loadFromStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveAll() {
    saveToStorage(TRANSACTIONS_KEY, transactions);
    saveToStorage(CATEGORIES_KEY, categories);
    if (monthlyLimit > 0) {
      saveToStorage(LIMIT_KEY, monthlyLimit);
    } else {
      localStorage.removeItem(LIMIT_KEY);
    }
  }

  function loadAll() {
    transactions = loadFromStorage(TRANSACTIONS_KEY, []);
    categories = loadFromStorage(CATEGORIES_KEY, DEFAULT_CATEGORIES);
    monthlyLimit = loadFromStorage(LIMIT_KEY, 0);
    isDarkMode = loadFromStorage(THEME_KEY, false);
  }

  // ============================================================
  //  UTILITY FUNCTIONS
  // ============================================================

  function stripFormatting(str) {
    return str.replace(/\./g, "").replace(",", ".");
  }

  function formatCurrency(value) {
    return "Rp " + value.toLocaleString("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatNumberInput(value) {
    const clean = value.replace(/[^\d,]/g, "");
    const parts = clean.split(",");
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? "," + parts[1].slice(0, 2) : "";
    let formatted = "";
    let count = 0;
    for (let i = integerPart.length - 1; i >= 0; i--) {
      if (count > 0 && count % 3 === 0) {
        formatted = "." + formatted;
      }
      formatted = integerPart[i] + formatted;
      count++;
    }
    return formatted + decimalPart;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function getMonthKey(timestamp) {
    const d = new Date(timestamp);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }

  function formatMonthKey(monthKey) {
    if (!monthKey) return "All Time";
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function getCategoryColor(categoryName) {
    const cat = categories.find(c => c.name === categoryName);
    return cat ? cat.color : "#999999";
  }

  function getCategoryNames() {
    return categories.map(c => c.name);
  }

  // ============================================================
  //  FILTERING & SORTING
  // ============================================================

  function getFilteredTransactions() {
    if (!currentMonthFilter) return transactions;
    return transactions.filter(t => getMonthKey(t.timestamp) === currentMonthFilter);
  }

  function sortTransactions(txns) {
    const sorted = [...txns];
    switch (currentSort) {
      case "date-asc":
        sorted.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case "date-desc":
        sorted.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case "amount-asc":
        sorted.sort((a, b) => a.amount - b.amount);
        break;
      case "amount-desc":
        sorted.sort((a, b) => b.amount - a.amount);
        break;
      case "category-asc":
        sorted.sort((a, b) => a.category.localeCompare(b.category));
        break;
      default:
        sorted.sort((a, b) => b.timestamp - a.timestamp);
    }
    return sorted;
  }

  function getAvailableMonths() {
    const months = new Set();
    transactions.forEach(t => months.add(getMonthKey(t.timestamp)));
    const sorted = Array.from(months).sort().reverse();
    return sorted;
  }

  // ============================================================
  //  VALIDATION
  // ============================================================

  function validateInputs(name, amountStr, category) {
    const errors = {};
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > MAX_NAME_LEN) {
      errors.name = "Item name is required";
    }
    const raw = stripFormatting(amountStr.trim());
    const amountNum = parseFloat(raw);
    const isNumeric = raw !== "" && !isNaN(amountNum);
    const inRange = isNumeric && amountNum >= MIN_AMOUNT && amountNum <= MAX_AMOUNT;
    const decimalMatch = isNumeric && /^\d+(\.\d{1,2})?$/.test(raw);
    if (!isNumeric || !inRange || !decimalMatch) {
      errors.amount = "Amount must be between 0.01 and 999,999.99";
    }
    if (!getCategoryNames().includes(category)) {
      errors.category = "Category is required";
    }
    return { valid: Object.keys(errors).length === 0, errors };
  }

  // ============================================================
  //  TRANSACTION & CATEGORY OPERATIONS
  // ============================================================

  function createTransaction(name, amountStr, category) {
    const raw = stripFormatting(amountStr.trim());
    const amount = Math.round(parseFloat(raw) * 100) / 100;
    return {
      id: generateId(),
      name: name.trim(),
      amount,
      category,
      timestamp: Date.now()
    };
  }

  function addTransaction(transaction) {
    transactions.push(transaction);
    saveAll();
    refreshUI();
  }

  function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveAll();
    refreshUI();
  }

  function addCategory(name, color) {
    if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: "Category already exists" };
    }
    categories.push({ name, color });
    saveAll();
    refreshCategoryDropdown();
    return { success: true };
  }

  // ============================================================
  //  CALCULATIONS
  // ============================================================

  function calcBalance(txns) {
    return txns.reduce((sum, t) => sum + t.amount, 0);
  }

  function calcCategorySums(txns) {
    return categories.map(cat =>
      txns.filter(t => t.category === cat.name).reduce((s, t) => s + t.amount, 0)
    );
  }

  // ============================================================
  //  THEME
  // ============================================================

  function applyTheme() {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    saveToStorage(THEME_KEY, isDarkMode);
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    applyTheme();
  }

  // ============================================================
  //  RENDERING
  // ============================================================

  function refreshUI() {
    renderMonthFilter();
    renderMonthlySummary();
    renderLimitDisplay();
    renderBalance();
    renderTransactionList();
    renderChart();
  }

  function refreshCategoryDropdown() {
    const select = document.getElementById("category");
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Select --</option>';
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat.name;
      option.textContent = cat.name;
      select.appendChild(option);
    });
    if (categories.find(c => c.name === currentValue)) {
      select.value = currentValue;
    }
  }

  function renderMonthFilter() {
    const select = document.getElementById("month-filter");
    const currentValue = select.value || currentMonthFilter;
    const months = getAvailableMonths();
    select.innerHTML = '<option value="">All Time</option>';
    const now = new Date();
    const thisMonth = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    if (!months.includes(thisMonth)) {
      months.unshift(thisMonth);
    }
    months.forEach(month => {
      const option = document.createElement("option");
      option.value = month;
      option.textContent = formatMonthKey(month);
      select.appendChild(option);
    });
    if (currentValue && months.includes(currentValue)) {
      select.value = currentValue;
      currentMonthFilter = currentValue;
    } else {
      if (transactions.length > 0) {
        select.value = thisMonth;
        currentMonthFilter = thisMonth;
      } else {
        select.value = "";
        currentMonthFilter = "";
      }
    }
  }

  function renderMonthlySummary() {
    const container = document.getElementById("summary-content");
    const filtered = getFilteredTransactions();
    const total = calcBalance(filtered);
    const count = filtered.length;
    const avg = count > 0 ? total / count : 0;
    let topCategory = "-";
    let topAmount = 0;
    categories.forEach(cat => {
      const catTotal = filtered
        .filter(t => t.category === cat.name)
        .reduce((s, t) => s + t.amount, 0);
      if (catTotal > topAmount) {
        topAmount = catTotal;
        topCategory = cat.name;
      }
    });
    container.innerHTML =
      '<div class="summary-item"><div class="summary-item-label">Total Spent</div><div class="summary-item-value">' + formatCurrency(total) + '</div></div>' +
      '<div class="summary-item"><div class="summary-item-label">Transactions</div><div class="summary-item-value">' + count + '</div></div>' +
      '<div class="summary-item"><div class="summary-item-label">Avg/Txn</div><div class="summary-item-value">' + formatCurrency(avg) + '</div></div>' +
      '<div class="summary-item"><div class="summary-item-label">Top Category</div><div class="summary-item-value">' + escapeHtml(topCategory) + '</div></div>';
  }

  function renderLimitDisplay() {
    const filtered = getFilteredTransactions();
    const total = calcBalance(filtered);
    const progressBar = document.getElementById("limit-progress");
    const spentEl = document.getElementById("limit-spent");
    const totalEl = document.getElementById("limit-total");
    const balanceDisplay = document.getElementById("balance-display");
    const balanceLabel = document.getElementById("balance-label");
    spentEl.textContent = formatCurrency(total) + " spent";
    progressBar.classList.remove("near-limit", "over-limit");
    balanceDisplay.classList.remove("over-limit");
    if (monthlyLimit > 0) {
      totalEl.textContent = "of " + formatCurrency(monthlyLimit) + " limit";
      balanceLabel.textContent = currentMonthFilter ? formatMonthKey(currentMonthFilter) + " Spending" : "Total Spending";
      const percentage = Math.min((total / monthlyLimit) * 100, 100);
      progressBar.style.width = percentage + "%";
      if (total >= monthlyLimit) {
        progressBar.classList.add("over-limit");
        balanceDisplay.classList.add("over-limit");
      } else if (total >= monthlyLimit * 0.8) {
        progressBar.classList.add("near-limit");
      }
    } else {
      totalEl.textContent = "No limit set";
      progressBar.style.width = "0%";
      balanceLabel.textContent = currentMonthFilter ? formatMonthKey(currentMonthFilter) + " Spending" : "Total Spending";
    }
  }

  function renderBalance() {
    const filtered = getFilteredTransactions();
    const total = calcBalance(filtered);
    document.getElementById("balance-value").textContent = formatCurrency(total);
  }

  function renderTransactionList() {
    const ul = document.getElementById("transaction-list");
    const filtered = getFilteredTransactions();
    const sorted = sortTransactions(filtered);
    ul.innerHTML = "";
    if (sorted.length === 0) {
      const li = document.createElement("li");
      li.className = "empty-state";
      li.textContent = currentMonthFilter ? "No transactions for " + formatMonthKey(currentMonthFilter) : "No transactions yet. Add one above!";
      ul.appendChild(li);
      return;
    }
    sorted.forEach(t => ul.appendChild(buildTransactionItem(t)));
  }

  function buildTransactionItem(transaction) {
    const li = document.createElement("li");
    li.className = "transaction-item";
    li.dataset.id = transaction.id;
    const date = new Date(transaction.timestamp);
    const dateStr = date.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const catColor = getCategoryColor(transaction.category);

    // Add highlight class if spending over limit
    const isOverLimit = monthlyLimit > 0 && currentMonthFilter &&
      getMonthKey(transaction.timestamp) === currentMonthFilter &&
      calcBalance(getFilteredTransactions()) >= monthlyLimit;

    if (isOverLimit) {
      li.classList.add("over-limit-item");
    }

    li.innerHTML =
      '<div class="item-main">' +
      '<span class="item-name">' + escapeHtml(transaction.name) + '</span>' +
      '<span class="item-date">' + escapeHtml(dateStr) + '</span>' +
      '</div>' +
      '<span class="item-amount">' + formatCurrency(transaction.amount) + '</span>' +
      '<span class="item-category" style="background-color: ' + catColor + '; ' + (catColor === "#FFCE56" ? "color: #1a1a2e;" : "") + '">' + escapeHtml(transaction.category) + '</span>' +
      '<button class="delete-btn" aria-label="Delete ' + escapeHtml(transaction.name) + '">✕</button>';
    return li;
  }

  // ============================================================
  //  CHART
  // ============================================================

  function renderChart() {
    if (typeof Chart === "undefined") return;
    const filtered = getFilteredTransactions();
    const sums = calcCategorySums(filtered);
    const chartWrapper = document.getElementById("chart-wrapper");

    // Filter out categories with zero sum
    const activeCategories = categories.filter((_, i) => sums[i] > 0);
    const activeSums = sums.filter(s => s > 0);

    // Hide chart wrapper when no data
    if (activeSums.length === 0) {
      chartWrapper.classList.add("hidden");
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      return;
    }

    // Show chart wrapper when there is data
    chartWrapper.classList.remove("hidden");

    if (chartInstance) {
      chartInstance.data.labels = activeCategories.map(c => c.name);
      chartInstance.data.datasets[0].data = activeSums;
      chartInstance.data.datasets[0].backgroundColor = activeCategories.map(c => c.color);
      chartInstance.update();
      return;
    }

    var ctx = document.getElementById("spending-chart").getContext("2d");
    chartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: activeCategories.map(c => c.name),
        datasets: [{
          data: activeSums,
          backgroundColor: activeCategories.map(c => c.color),
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return " " + ctx.label + ": " + formatCurrency(ctx.parsed);
              },
            },
          },
        },
      },
    });
  }

  // ============================================================
  //  EVENT HANDLERS
  // ============================================================

  /**
   * Formats an amount/limit input field with thousand separators while preserving cursor position.
   * @param {Event} event
   */
  function handleFormattedNumberInput(event) {
    var input = event.target;
    var cursorPos = input.selectionStart;
    var oldValue = input.value;
    var newValue = formatNumberInput(oldValue);
    var diff = newValue.length - oldValue.length;
    input.value = newValue;
    input.setSelectionRange(
      Math.max(0, cursorPos + diff),
      Math.max(0, cursorPos + diff)
    );
  }

  function handleAmountInput(event) {
    handleFormattedNumberInput(event);
  }

  function handleLimitInput(event) {
    handleFormattedNumberInput(event);
  }

  function showLimitForm() {
    document.getElementById("limit-display").classList.add("hidden");
    document.getElementById("limit-form").classList.remove("hidden");
    document.getElementById("limit-input").value = monthlyLimit > 0 ? formatNumberInput(monthlyLimit.toString()) : "";
    document.getElementById("limit-input").focus();
  }

  function hideLimitForm() {
    document.getElementById("limit-display").classList.remove("hidden");
    document.getElementById("limit-form").classList.add("hidden");
  }

  function saveLimit() {
    var input = document.getElementById("limit-input");
    var value = input.value.trim();
    if (value === "") {
      monthlyLimit = 0;
    } else {
      var raw = stripFormatting(value);
      var num = parseFloat(raw);
      if (!isNaN(num) && num > 0) {
        monthlyLimit = num;
      }
    }
    saveAll();
    hideLimitForm();
    refreshUI();
  }

  function showCategoryModal() {
    document.getElementById("category-modal").classList.remove("hidden");
    document.getElementById("new-category-name").value = "";
    document.getElementById("category-name-error").style.display = "none";
    selectedColorForNewCategory = COLOR_OPTIONS[0];
    updateColorSelection();
    document.getElementById("new-category-name").focus();
  }

  function hideCategoryModal() {
    document.getElementById("category-modal").classList.add("hidden");
  }

  function updateColorSelection() {
    var options = document.querySelectorAll(".color-option");
    options.forEach(function (opt) {
      var color = opt.getAttribute("data-color");
      if (color === selectedColorForNewCategory) {
        opt.classList.add("selected");
        opt.style.boxShadow = "0 0 0 3px rgba(25, 118, 210, 0.5)";
        opt.style.transform = "scale(1.1)";
      } else {
        opt.classList.remove("selected");
        opt.style.boxShadow = "none";
        opt.style.transform = "scale(1)";
      }
    });
  }

  function handleColorClick(event) {
    var target = event.target.closest(".color-option");
    if (target) {
      selectedColorForNewCategory = target.getAttribute("data-color");
      updateColorSelection();
    }
  }

  function saveNewCategory() {
    var nameInput = document.getElementById("new-category-name");
    var errorEl = document.getElementById("category-name-error");
    var name = nameInput.value.trim();

    if (name.length < 1 || name.length > 20) {
      errorEl.textContent = "Category name must be 1-20 characters";
      errorEl.style.display = "block";
      return;
    }

    var result = addCategory(name, selectedColorForNewCategory);
    if (!result.success) {
      errorEl.textContent = result.error;
      errorEl.style.display = "block";
      return;
    }

    // Auto-select the new category
    document.getElementById("category").value = name;
    hideCategoryModal();
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    var nameField = document.getElementById("item-name");
    var amountField = document.getElementById("amount");
    var categoryField = document.getElementById("category");

    var name = nameField.value;
    var amountStr = amountField.value;
    var category = categoryField.value;

    var validation = validateInputs(name, amountStr, category);
    var valid = validation.valid;
    var errors = validation.errors;

    var nameError = document.getElementById("name-error");
    var amountError = document.getElementById("amount-error");
    var categoryError = document.getElementById("category-error");

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

    if (!valid) return;

    var transaction = createTransaction(name, amountStr, category);
    addTransaction(transaction);
    event.target.reset();
  }

  function handleListClick(event) {
    if (event.target.classList.contains("delete-btn")) {
      var item = event.target.closest(".transaction-item");
      if (item) {
        deleteTransaction(item.dataset.id);
      }
    }
  }

  function handleMonthFilterChange(event) {
    currentMonthFilter = event.target.value;
    refreshUI();
  }

  function handleSortChange(event) {
    currentSort = event.target.value;
    refreshUI();
  }

  function handleModalBackdropClick(event) {
    if (event.target.id === "category-modal") {
      hideCategoryModal();
    }
  }

  // ============================================================
  //  INITIALIZATION
  // ============================================================

  function initApp() {
    loadAll();
    applyTheme();
    refreshCategoryDropdown();
    refreshUI();

    // Event listeners
    document.getElementById("input-form").addEventListener("submit", handleFormSubmit);
    document.getElementById("transaction-list").addEventListener("click", handleListClick);
    document.getElementById("amount").addEventListener("input", handleAmountInput);
    document.getElementById("month-filter").addEventListener("change", handleMonthFilterChange);
    document.getElementById("sort-by").addEventListener("change", handleSortChange);
    document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

    // Limit-related
    document.getElementById("edit-limit-btn").addEventListener("click", showLimitForm);
    document.getElementById("cancel-limit-btn").addEventListener("click", hideLimitForm);
    document.getElementById("save-limit-btn").addEventListener("click", saveLimit);
    document.getElementById("limit-input").addEventListener("input", handleLimitInput);

    // Category modal
    document.getElementById("add-category-btn").addEventListener("click", showCategoryModal);
    document.getElementById("cancel-category-btn").addEventListener("click", hideCategoryModal);
    document.getElementById("save-category-btn").addEventListener("click", saveNewCategory);
    document.getElementById("color-picker").addEventListener("click", handleColorClick);
    document.getElementById("category-modal").addEventListener("click", handleModalBackdropClick);

    // Close modal on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        hideCategoryModal();
        hideLimitForm();
      }
    });

    // Enter to save in limit input
    document.getElementById("limit-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        saveLimit();
      }
    });

    // Enter to save in category name
    document.getElementById("new-category-name").addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        saveNewCategory();
      }
    });

    // Initialize color picker selection
    updateColorSelection();
  }

  document.addEventListener("DOMContentLoaded", initApp);

})();
