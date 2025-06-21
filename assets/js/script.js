// Application State
let customers = [];
let receiptCounter = 1;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateStats();
});

function initializeApp() {
    // Set today's date as default
    document.getElementById('receipt-date').value = new Date().toISOString().split('T')[0];
    
    // Generate initial receipt number
    generateReceiptNumber();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            showPage(pageId);
            
            // Update active nav
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Receipt form
    document.getElementById('receipt-form').addEventListener('submit', generatePDF);
    document.getElementById('preview-btn').addEventListener('click', previewReceipt);
    
    // Customer list actions
    document.getElementById('export-csv').addEventListener('click', exportToCSV);
    document.getElementById('clear-list').addEventListener('click', clearCustomerList);
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    if (pageId === 'list') {
        updateCustomerList();
    }
}

function generateReceiptNumber() {
    const receiptNum = `RCP${Date.now().toString().slice(-6)}${receiptCounter.toString().padStart(3, '0')}`;
    document.getElementById('receipt-number').value = receiptNum;
    receiptCounter++;
}

function previewReceipt() {
    const formData = getFormData();
    if (!formData.customerName || !formData.itemDescription || !formData.amount) {
        alert('Please fill in all required fields');
        return;
    }

    const preview = document.getElementById('receipt-preview');
    preview.innerHTML = createReceiptHTML(formData);
    
    // Generate barcode
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, formData.receiptNumber, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: true
    });
    
    const barcodeContainer = preview.querySelector('.barcode-container');
    barcodeContainer.innerHTML = '';
    barcodeContainer.appendChild(canvas);
}

function generatePDF(e) {
    e.preventDefault();
    
    const formData = getFormData();
    if (!formData.customerName || !formData.itemDescription || !formData.amount) {
        alert('Please fill in all required fields');
        return;
    }

    // Add customer to list
    addCustomer(formData.customerName);
    
    // Generate PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Company header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('ReceiptPro', 20, 30);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Professional Receipt System', 20, 40);
    doc.text('www.receiptpro.com | info@receiptpro.com', 20, 50);
    
    // Line separator
    doc.line(20, 60, 190, 60);
    
    // Receipt details
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('RECEIPT', 20, 80);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Receipt #: ${formData.receiptNumber}`, 20, 95);
    doc.text(`Date: ${formData.date}`, 20, 105);
    doc.text(`Customer: ${formData.customerName}`, 20, 115);
    
    // Item details
    doc.line(20, 125, 190, 125);
    doc.setFont(undefined, 'bold');
    doc.text('Item Description', 20, 135);
    doc.text('Amount', 150, 135);
    doc.line(20, 140, 190, 140);
    
    doc.setFont(undefined, 'normal');
    doc.text(formData.itemDescription, 20, 150);
    doc.text(`$${parseFloat(formData.amount).toFixed(2)}`, 150, 150);
    
    if (formData.notes) {
        doc.text(`Notes: ${formData.notes}`, 20, 165);
    }
    
    // Total
    doc.line(20, 175, 190, 175);
    doc.setFont(undefined, 'bold');
    doc.text(`Total: $${parseFloat(formData.amount).toFixed(2)}`, 150, 185);
    
    // Generate barcode as image and add to PDF
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, formData.receiptNumber, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: true
    });
    
    const barcodeDataURL = canvas.toDataURL();
    doc.addImage(barcodeDataURL, 'PNG', 20, 200, 100, 25);
    
    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for your business!', 20, 250);
    doc.text('This receipt was generated automatically.', 20, 260);
    
    // Save PDF
    doc.save(`receipt-${formData.receiptNumber}.pdf`);
    
    // Show success message
    const successMsg = document.getElementById('success-message');
    successMsg.style.display = 'block';
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 3000);
    
    // Reset form and generate new receipt number
    document.getElementById('receipt-form').reset();
    document.getElementById('receipt-date').value = new Date().toISOString().split('T')[0];
    generateReceiptNumber();
    document.getElementById('receipt-preview').innerHTML = '<p>Receipt preview will appear here</p>';
    
    // Update stats
    updateStats();
}

function getFormData() {
    return {
        customerName: document.getElementById('customer-name').value,
        receiptNumber: document.getElementById('receipt-number').value,
        date: document.getElementById('receipt-date').value,
        itemDescription: document.getElementById('item-description').value,
        amount: document.getElementById('amount').value,
        notes: document.getElementById('notes').value
    };
}

function createReceiptHTML(data) {
    return `
        <div style="text-align: left; max-width: 400px; margin: 0 auto; font-family: monospace;">
            <h3>ReceiptPro</h3>
            <p>Professional Receipt System</p>
            <hr>
            <p><strong>Receipt #:</strong> ${data.receiptNumber}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Customer:</strong> ${data.customerName}</p>
            <hr>
            <p><strong>Item:</strong> ${data.itemDescription}</p>
            <p><strong>Amount:</strong> $${parseFloat(data.amount).toFixed(2)}</p>
            ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
            <hr>
            <p><strong>Total: $${parseFloat(data.amount).toFixed(2)}</strong></p>
            <div class="barcode-container" style="margin: 1rem 0;"></div>
            <p style="font-size: 0.8em;">Thank you for your business!</p>
        </div>
    `;
}

function addCustomer(name) {
    const customer = {
        name: name,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
    };
    
    // Check if customer already exists
    const existingIndex = customers.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
    if (existingIndex === -1) {
        customers.push(customer);
    } else {
        customers[existingIndex] = customer; // Update timestamp
    }
}

function updateCustomerList() {
    const customerList = document.getElementById('customer-list');
    const customerCount = document.getElementById('customer-count');
    
    customerCount.textContent = customers.length;
    
    if (customers.length === 0) {
        customerList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">No customers yet. Generate some receipts to see them here!</p>';
        return;
    }
    
    customerList.innerHTML = customers
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(customer => `
            <div class="name-item">
                <div>
                    <div class="name-text">${customer.name}</div>
                    <div class="name-date">Last receipt: ${customer.date}</div>
                </div>
                <button class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick="removeCustomer('${customer.name}')">Remove</button>
            </div>
        `).join('');
}

function removeCustomer(name) {
    customers = customers.filter(c => c.name !== name);
    updateCustomerList();
    updateStats();
}

function exportToCSV() {
    if (customers.length === 0) {
        alert('No customers to export');
        return;
    }
    
    const headers = ['Customer Name', 'Last Receipt Date', 'Added'];
    const csvContent = [
        headers.join(','),
        ...customers.map(customer => [
            `"${customer.name}"`,
            customer.date,
            customer.timestamp
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function clearCustomerList() {
    if (customers.length === 0) {
        alert('No customers to clear');
        return;
    }
    
    if (confirm('Are you sure you want to clear all customers? This action cannot be undone.')) {
        customers = [];
        updateCustomerList();
        updateStats();
    }
}

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayCustomers = customers.filter(c => c.date === today).length;
    
    document.getElementById('total-receipts').textContent = receiptCounter - 1;
    document.getElementById('total-customers').textContent = customers.length;
    document.getElementById('today-receipts').textContent = todayCustomers;
}