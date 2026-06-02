// ========================
// APP STATE & STORAGE
// ========================
const STORAGE_KEY = 'pliahapp_ledger';
const HISTORY_KEY = 'pliahapp_history';
const INVOICES_KEY = 'pliahapp_invoices';

const defaultData = [
    { id: 1, date: '2026-05-15', client: 'משה אהרנטהל - מילי דהספידה', category: 'writing', amount: 1500.00, status: 'paid' },
    { id: 2, date: '2026-04-10', client: 'לעלאות - פסח מאטעריאל', category: 'editing', amount: 3320.00, status: 'paid' },
    { id: 3, date: '2026-05-20', client: 'rabbi יצחק יהודה קאץ', category: 'writing', amount: 800.00, status: 'unpaid' },
    { id: 4, date: '2026-05-25', client: 'זכרון צדיק - פרשת במדבר', category: 'writing', amount: 615.00, status: 'unpaid' },
    { id: 6, date: '2026-04-05', client: 'אפיס סופליז - פייפער און ינק', category: 'other', amount: 40.00, status: 'expense' }
];

let ledgerData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData;
let historyStack = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
let historyPointer = -1;
let invoices = JSON.parse(localStorage.getItem(INVOICES_KEY)) || [];
let editingId = null;
let invoiceItemsCount = 0;

// ========================
// STORAGE FUNCTIONS
// ========================
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ledgerData));
}

function saveToHistory() {
    // Remove any redo items
    historyStack = historyStack.slice(0, historyPointer + 1);
    historyStack.push(JSON.parse(JSON.stringify(ledgerData)));
    historyPointer = historyStack.length - 1;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historyStack));
    updateHistoryButtons();
    renderHistory();
}

function updateHistoryButtons() {
    document.getElementById('undo-btn').disabled = historyPointer <= 0;
    document.getElementById('redo-btn').disabled = historyPointer >= historyStack.length - 1;
}

// ========================
// UNDO / REDO
// ========================
function undo() {
    if (historyPointer > 0) {
        historyPointer--;
        ledgerData = JSON.parse(JSON.stringify(historyStack[historyPointer]));
        saveToStorage();
        renderLedgerTable();
        updateHistoryButtons();
    }
}

function redo() {
    if (historyPointer < historyStack.length - 1) {
        historyPointer++;
        ledgerData = JSON.parse(JSON.stringify(historyStack[historyPointer]));
        saveToStorage();
        renderLedgerTable();
        updateHistoryButtons();
    }
}

function renderHistory() {
    const undoDiv = document.getElementById('undo-history');
    const redoDiv = document.getElementById('redo-history');
    undoDiv.innerHTML = '';
    redoDiv.innerHTML = '';

    for (let i = 0; i < historyPointer; i++) {
        const item = document.createElement('div');
        item.className = 'history-item undo text-xs bg-green-50 px-3 py-2 rounded cursor-pointer hover:bg-green-100';
        item.textContent = `פ. ${i + 1}: אַקשן`;
        item.onclick = () => {
            historyPointer = i;
            ledgerData = JSON.parse(JSON.stringify(historyStack[i]));
            saveToStorage();
            renderLedgerTable();
            updateHistoryButtons();
            renderHistory();
        };
        undoDiv.appendChild(item);
    }

    for (let i = historyPointer + 1; i < historyStack.length; i++) {
        const item = document.createElement('div');
        item.className = 'history-item redo text-xs bg-yellow-50 px-3 py-2 rounded cursor-pointer hover:bg-yellow-100';
        item.textContent = `פ. ${i + 1}: אַקשן`;
        item.onclick = () => {
            historyPointer = i;
            ledgerData = JSON.parse(JSON.stringify(historyStack[i]));
            saveToStorage();
            renderLedgerTable();
            updateHistoryButtons();
            renderHistory();
        };
        redoDiv.appendChild(item);
    }
}

// ========================
// DARK MODE
// ========================
function toggleDarkMode() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    localStorage.setItem('pliahapp_darkmode', html.classList.contains('dark'));
}

window.addEventListener('load', () => {
    if (localStorage.getItem('pliahapp_darkmode') === 'true') {
        document.documentElement.classList.add('dark');
    }
});

// ========================
// NAVIGATION
// ========================
function switchTab(tabId) {
    // Hide all views
    document.getElementById('view-ledger').classList.add('hidden');
    document.getElementById('view-reports').classList.add('hidden');
    document.getElementById('view-invoice').classList.add('hidden');
    document.getElementById('view-history').classList.add('hidden');

    // Reset nav styles
    ['ledger', 'reports', 'invoice', 'history'].forEach(id => {
        const btn = document.getElementById(`nav-${id}`);
        btn.className = "w-full flex items-center gap-4 px-4 py-2.5 rounded-l-full text-[var(--color-text-muted)] hover:bg-[var(--color-hover)] font-medium transition-colors";
    });

    // Show selected view
    const activeView = document.getElementById(`view-${tabId}`);
    activeView.classList.remove('hidden');
    
    const activeNav = document.getElementById(`nav-${tabId}`);
    activeNav.className = "w-full flex items-center gap-4 px-4 py-2.5 rounded-l-full bg-google-blueLight text-google-blueText font-medium";

    // Context-specific actions
    const searchContainer = document.getElementById('search-container');
    if (tabId === 'invoice' || tabId === 'reports' || tabId === 'history') {
        searchContainer.style.visibility = 'hidden';
    } else {
        searchContainer.style.visibility = 'visible';
    }

    if (tabId === 'reports') {
        renderReports();
    }

    if (tabId === 'invoice') {
        updateInvoiceClientDropdown();
    }

    if (tabId === 'history') {
        renderHistory();
    }
}

// ========================
// MODAL
// ========================
function openModal() {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    
    if (!editingId) {
        document.getElementById('ledger-form').reset();
        document.getElementById('entry-date').valueAsDate = new Date();
        document.getElementById('form-title').textContent = "נייע רעקארד";
        document.getElementById('submit-btn').textContent = "היט";
    }
    
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    
    setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
        editingId = null;
    }, 200);
}

// ========================
// FORMATTERS
// ========================
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getCategoryLabel(catValue) {
    const categories = {
        'writing': 'שרייבן',
        'editing': 'עדיטינג',
        'consultation': 'קאנסולטינג',
        'other': 'אנדערע'
    };
    return categories[catValue] || 'אנדערע';
}

// ========================
// LEDGER SUMMARY
// ========================
function updateLedgerSummary() {
    let totalIncome = 0;
    let totalUnpaid = 0;
    let totalExpenses = 0;

    ledgerData.forEach(entry => {
        if (entry.status === 'paid') totalIncome += entry.amount;
        else if (entry.status === 'unpaid') totalUnpaid += entry.amount;
        else if (entry.status === 'expense') totalExpenses += entry.amount;
    });

    document.getElementById('summary-income').textContent = formatCurrency(totalIncome);
    document.getElementById('summary-unpaid').textContent = formatCurrency(totalUnpaid);
    document.getElementById('summary-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('summary-maaser').textContent = formatCurrency(totalIncome * 0.10);
}

// ========================
// LEDGER TABLE
// ========================
function renderLedgerTable() {
    const tbody = document.getElementById('ledger-table-body');
    const emptyState = document.getElementById('empty-state');
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    const dateFrom = document.getElementById('filter-date-from').value;
    const dateTo = document.getElementById('filter-date-to').value;
    
    tbody.innerHTML = '';

    let filteredData = ledgerData.filter(entry => {
        const matchesSearch = entry.client.toLowerCase().includes(searchQuery);
        const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
        const matchesDateFrom = !dateFrom || entry.date >= dateFrom;
        const matchesDateTo = !dateTo || entry.date <= dateTo;
        return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });

    filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filteredData.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        
        filteredData.forEach(entry => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-[var(--color-hover)] transition-colors group';
            
            let statusBadge = '';
            let statusIcon = '';
            
            if (entry.status === 'paid') {
                statusIcon = `<button onclick="toggleStatus(${entry.id})" class="text-[var(--color-text-muted)] hover:text-google-blue p-1 rounded-full transition" title="טויש סטאטוס"><span class="material-symbols-outlined text-[20px]">check_circle</span></button>`;
                statusBadge = `<span class="bg-google-greenLight text-google-green px-2 py-0.5 rounded text-xs font-medium">באצאלט</span>`;
            } else if (entry.status === 'unpaid') {
                statusIcon = `<button onclick="toggleStatus(${entry.id})" class="text-google-red hover:text-google-blue p-1 rounded-full transition" title="מארק אלס באצאלט"><span class="material-symbols-outlined text-[20px]">radio_button_unchecked</span></button>`;
                statusBadge = `<span class="bg-google-redLight text-google-red px-2 py-0.5 rounded text-xs font-medium">אומבאצאלט</span>`;
            } else {
                statusIcon = `<span class="material-symbols-outlined text-[var(--color-text-muted)] text-[20px] p-1">remove</span>`;
                statusBadge = `<span class="bg-[var(--color-hover)] text-[var(--color-text-muted)] px-2 py-0.5 rounded text-xs font-medium">הוצאה</span>`;
            }

            tr.innerHTML = `
                <td class="px-6 py-3 whitespace-nowrap text-sm text-[var(--color-text-muted)]">${entry.date}</td>
                <td class="px-6 py-3 text-sm text-[var(--color-text)] font-medium">${entry.client}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm text-[var(--color-text-muted)]">${getCategoryLabel(entry.category)}</td>
                <td class="px-6 py-3 whitespace-nowrap text-sm text-[var(--color-text)]">${formatCurrency(entry.amount)}</td>
                <td class="px-6 py-3 whitespace-nowrap flex items-center gap-2">${statusIcon} ${statusBadge}</td>
                <td class="px-6 py-3 whitespace-nowrap text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div class="flex justify-center items-center gap-1">
                        <button onclick="editEntry(${entry.id})" class="text-[var(--color-text-muted)] hover:bg-[var(--color-hover)] p-1.5 rounded-full transition" title="פאררעכטן">
                            <span class="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button onclick="deleteEntry(${entry.id})" class="text-[var(--color-text-muted)] hover:bg-red-50 hover:text-google-red p-1.5 rounded-full transition" title="מעק אויס">
                            <span class="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    updateLedgerSummary();
}

// ========================
// LEDGER CRUD
// ========================
document.getElementById('ledger-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const date = document.getElementById('entry-date').value;
    const client = document.getElementById('entry-client').value;
    const category = document.getElementById('entry-category').value;
    const amount = parseFloat(document.getElementById('entry-amount').value);
    const status = document.getElementById('entry-status').value;

    if (editingId) {
        const index = ledgerData.findIndex(item => item.id === editingId);
        if (index !== -1) {
            ledgerData[index] = { id: editingId, date, client, category, amount, status };
        }
    } else {
        ledgerData.push({ id: Date.now(), date, client, category, amount, status });
    }

    saveToStorage();
    saveToHistory();
    renderLedgerTable();
    closeModal();
});

function editEntry(id) {
    const entry = ledgerData.find(e => e.id === id);
    if (!entry) return;

    document.getElementById('entry-date').value = entry.date;
    document.getElementById('entry-client').value = entry.client;
    document.getElementById('entry-category').value = entry.category || 'other';
    document.getElementById('entry-amount').value = entry.amount;
    document.getElementById('entry-status').value = entry.status;
    
    editingId = id;
    document.getElementById('form-title').textContent = "עדיט רעקארד";
    document.getElementById('submit-btn').textContent = "אפדעיט";
    openModal();
}

function deleteEntry(id) {
    if (confirm('ביסט דו זיכער?')) {
        ledgerData = ledgerData.filter(entry => entry.id !== id);
        saveToStorage();
        saveToHistory();
        renderLedgerTable();
    }
}

function toggleStatus(id) {
    const entryIndex = ledgerData.findIndex(e => e.id === id);
    if (entryIndex > -1) {
        ledgerData[entryIndex].status = ledgerData[entryIndex].status === 'paid' ? 'unpaid' : 'paid';
        saveToStorage();
        saveToHistory();
        renderLedgerTable();
    }
}

// ========================
// EXPORT
// ========================
function exportToCSV() {
    if (ledgerData.length === 0) return;
    let csvContent = "\uFEFFID,Date,Client,Category,Amount,Status\n";
    ledgerData.forEach(e => {
        const safeClient = e.client.replace(/"/g, '""');
        csvContent += `${e.id},${e.date},"${safeClient}",${e.category},${e.amount},${e.status}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// ========================
// REPORTS
// ========================
function renderReports() {
    renderMonthlyReport();
    renderCategoryReport();
    renderProfitLoss();
}

function renderMonthlyReport() {
    const div = document.getElementById('monthly-report');
    div.innerHTML = '';

    const months = {};
    ledgerData.forEach(entry => {
        const date = new Date(entry.date);
        const month = date.toLocaleString('he-IL', { month: 'long', year: 'numeric' });
        if (!months[month]) months[month] = { income: 0, unpaid: 0, expenses: 0 };
        if (entry.status === 'paid') months[month].income += entry.amount;
        else if (entry.status === 'unpaid') months[month].unpaid += entry.amount;
        else months[month].expenses += entry.amount;
    });

    Object.entries(months).reverse().forEach(([month, data]) => {
        const item = document.createElement('div');
        item.className = 'p-3 bg-[var(--color-hover)] rounded';
        item.innerHTML = `
            <div class="font-medium mb-1">${month}</div>
            <div class="text-xs text-[var(--color-text-muted)]">
                <div>הכנסות: ${formatCurrency(data.income)}</div>
                <div>חובות: ${formatCurrency(data.unpaid)}</div>
                <div>הוצאות: ${formatCurrency(data.expenses)}</div>
            </div>
        `;
        div.appendChild(item);
    });
}

function renderCategoryReport() {
    const div = document.getElementById('category-report');
    div.innerHTML = '';

    const categories = {};
    ledgerData.forEach(entry => {
        const cat = getCategoryLabel(entry.category);
        if (!categories[cat]) categories[cat] = 0;
        categories[cat] += entry.amount;
    });

    Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, amount]) => {
        const item = document.createElement('div');
        item.className = 'p-3 bg-[var(--color-hover)] rounded flex justify-between';
        item.innerHTML = `
            <span>${cat}</span>
            <span class="font-medium">${formatCurrency(amount)}</span>
        `;
        div.appendChild(item);
    });
}

function renderProfitLoss() {
    let income = 0;
    let expenses = 0;
    
    ledgerData.forEach(entry => {
        if (entry.status === 'paid') income += entry.amount;
        else if (entry.status === 'expense') expenses += entry.amount;
    });

    const net = income - expenses;
    const maaser = income * 0.1;

    document.getElementById('pl-income').textContent = formatCurrency(income);
    document.getElementById('pl-expenses').textContent = formatCurrency(expenses);
    document.getElementById('pl-net').textContent = formatCurrency(net);
    document.getElementById('pl-maaser').textContent = formatCurrency(maaser);
}

// ========================
// INVOICE FUNCTIONS
// ========================
function updateInvoiceClientDropdown() {
    const select = document.getElementById('import-client-select');
    select.innerHTML = '<option value="">-- אימפארטיר א חוב --</option>';
    ledgerData.filter(e => e.status === 'unpaid').forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = `${item.client} (${formatCurrency(item.amount)})`;
        select.appendChild(opt);
    });
}

function importClientToInvoice() {
    const select = document.getElementById('import-client-select');
    const id = select.value;
    if (!id) return;

    const entry = ledgerData.find(e => e.id == id);
    if (entry) {
        document.getElementById('inv-client-name').value = entry.client;
        document.getElementById('inv-date').value = entry.date;
        document.getElementById('invoice-items-body').innerHTML = '';
        invoiceItemsCount = 0;
        const defaultRate = 70.00;
        const approxHours = (entry.amount / defaultRate).toFixed(1);
        addInvoiceItem(entry.client + ' - ' + getCategoryLabel(entry.category), approxHours, defaultRate);
    }
    select.value = '';
}

function createNewInvoice() {
    document.getElementById('inv-number').value = 'INV-' + String(invoices.length + 1).padStart(3, '0');
    document.getElementById('inv-date').valueAsDate = new Date();
    document.getElementById('inv-client-name').value = '';
    document.getElementById('inv-client-phone').value = '';
    document.getElementById('invoice-items-body').innerHTML = '';
    invoiceItemsCount = 0;
    addInvoiceItem();
}

function addInvoiceItem(desc = '', qty = 1, rate = 70.00) {
    invoiceItemsCount++;
    const tbody = document.getElementById('invoice-items-body');
    const tr = document.createElement('tr');
    tr.id = `inv-item-${invoiceItemsCount}`;
    tr.className = "group border border-google-blue";
    
    tr.innerHTML = `
        <td class="py-2 px-3 border border-google-blue">
            <input type="number" id="qty-${invoiceItemsCount}" value="${qty}" min="0" step="0.1" class="w-full bg-transparent border-none outline-none text-sm text-center" oninput="calculateRow(${invoiceItemsCount})" placeholder="שעות">
        </td>
        <td class="py-2 px-3 border border-google-blue">
            <input type="text" value="${desc}" class="w-full bg-transparent border-none outline-none text-sm" placeholder="דעטאלן">
        </td>
        <td class="py-2 px-3 border border-google-blue">
            <div class="flex items-center text-sm">
                <span>$</span>
                <input type="number" id="rate-${invoiceItemsCount}" value="${rate.toFixed(2)}" min="0" step="0.01" class="w-16 bg-transparent border-none outline-none text-right" oninput="calculateRow(${invoiceItemsCount})">
                <span class="ml-1">/ שעה</span>
            </div>
        </td>
        <td class="py-2 px-1 text-center no-print border-none w-8">
            <button type="button" onclick="removeInvoiceItem(${invoiceItemsCount})" class="text-[var(--color-text-muted)] hover:text-google-red opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
            <span id="row-total-${invoiceItemsCount}" data-value="${qty * rate}" class="hidden"></span>
        </td>
    `;
    tbody.appendChild(tr);
    calculateInvoiceTotal();
}

function removeInvoiceItem(id) {
    const row = document.getElementById(`inv-item-${id}`);
    if (row) { 
        row.remove(); 
        calculateInvoiceTotal(); 
    }
}

function calculateRow(id) {
    const qty = parseFloat(document.getElementById(`qty-${id}`).value) || 0;
    const rate = parseFloat(document.getElementById(`rate-${id}`).value) || 0;
    const total = qty * rate;
    const totalEl = document.getElementById(`row-total-${id}`);
    if (totalEl) {
        totalEl.dataset.value = total;
    }
    calculateInvoiceTotal();
}

function calculateInvoiceTotal() {
    let subtotal = 0;
    document.querySelectorAll('[id^="row-total-"]').forEach(row => {
        subtotal += parseFloat(row.dataset.value || 0);
    });

    const taxAmount = parseFloat(document.getElementById('inv-tax-amount').value) || 0;
    
    document.getElementById('inv-price-total').textContent = formatCurrency(subtotal);
    document.getElementById('inv-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('inv-total').textContent = formatCurrency(subtotal + taxAmount);
}

function exportInvoicePDF() {
    const element = document.getElementById('invoice-container');
    const opt = {
        margin: 10,
        filename: `Invoice_${document.getElementById('inv-number').value}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    html2pdf().set(opt).from(element).save();
}

// ========================
// INITIALIZE
// ========================
window.addEventListener('load', () => {
    const today = new Date();
    document.getElementById('entry-date').valueAsDate = today;
    document.getElementById('inv-date').valueAsDate = today;
    
    // Sync phone number
    document.getElementById('inv-client-phone').addEventListener('input', function(e) {
        // Phone sync logic here if needed
    });

    renderLedgerTable();
    createNewInvoice();
    updateHistoryButtons();
    
    // Close modal on outside click
    document.getElementById('modal-overlay').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
});