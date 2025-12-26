let db;
const DB_NAME = 'FinanceTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

function initdb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (event) => {
            db = event.target.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objstore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                objstore.createIndex('type', 'type', { unique: false });
                objstore.createIndex('date', 'date', { unique: false });
            }
        };
        req.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
        req.onerror = (event) => {
            reject('Database Error:' + event.target.error);
        };
    });
}

const form = document.querySelector('form');
const datadisplay = document.querySelector('.list');

document.addEventListener('DOMContentLoaded', async () => {
    const dateinput = document.getElementById('date');
    const tdy = new Date().toISOString().split('T')[0];
    dateinput.value = tdy;
    await initdb();
    displaydata();
});


form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const type = document.getElementById('type').value;
    const specification = document.getElementById('specification').value;
    const amount = document.getElementById('amount').value;
    const date = document.getElementById('date').value;

    const transactions = {
        type,
        specification,
        amount: parseFloat(amount),
        date,
        timestamp: Date.now()
    };

    await savetransactions(transactions);

    form.reset();
    const tdy = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = tdy;
    displaydata();
});


function savetransactions(transactions) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.add(transactions);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function getalltransactions() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function displaydata() {
    const alltransactions = await getalltransactions();

    if (alltransactions.length === 0) {
        datadisplay.innerHTML = '<p style="text-align: center; color: black;">No transactions entered yet.</p>';
        return;
    }

    const income = alltransactions.filter(t => t.type === 'income');
    const expense = alltransactions.filter(t => t.type === 'expense');

    const totalincome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalexpense = expense.reduce((sum, item) => sum + item.amount, 0);
    const balance = totalincome - totalexpense;

    let html = '';

    html += `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px 0; color: white;">Financial Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center;">
                    <div>
                        <div style="font-size: 14px; opacity: 0.9;">Total Income</div>
                        <div style="font-size: 24px; font-weight: bold;">₹${totalincome.toFixed(2)}</div>
                    </div>
                    <div>
                        <div style="font-size: 14px; opacity: 0.9;">Total Expense</div>
                        <div style="font-size: 24px; font-weight: bold;">₹${totalexpense.toFixed(2)}</div>
                    </div>
                    <div>
                        <div style="font-size: 14px; opacity: 0.9;">Balance</div>
                        <div style="font-size: 24px; font-weight: bold; color: ${balance >= 0 ? '#4ade80' : '#f87171'};">₹${balance.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;

    html += `<h3 style="color:  #667eea; margin-bottom: 15px;">All Transactions</h3>`;
    html += createCombinedTable(alltransactions, totalincome, totalexpense);
    datadisplay.innerHTML = html;
}

function createCombinedTable(transactions, totalincome, totalexpense) {
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    let tableHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
                <tr style="background: #667eea; color: white;">
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Type</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Specification</th>
                    <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Amount (₹)</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Date</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Action</th>
                </tr>
            </thead>
            <tbody>
        `;

    transactions.forEach(item => {
        const rowCol = item.type === 'income' ? '#51ff91ff' : '#fd5353ff';
        const textCol = item.type === 'income' ? '#076d38ff' : '#991b1b';
        tableHTML += `
                 <tr style="border-bottom: 1px solid #ddd; background: #ffffffff;">
                <td style="padding: 10px; border: 1px solid #ddd; color: ${textCol}; font-weight: bold; text-transform: capitalize;">${item.type}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.specification}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd; color: #000; font-weight: bold;">${item.amount.toFixed(2)}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${formatDate(item.date)}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">
                    <button onclick="deleteTransaction(${item.id})" style="width: auto; padding: 5px 15px; background: #dc3545; font-size: 14px; cursor: pointer;">Delete</button>
                </td>
            </tr>
            `;
    });
    // tableHTML += `
    //         <tbody>
    //         <tfoot>
    //             <tr style="background: #d1fae5; font-weight: bold;">
    //                 <td style="padding: 12px; border: 1px solid #ddd;" colspan="2">TOTAL INCOME</td>
    //                 <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: #000000ff;">₹${totalincome.toFixed(2)}</td>
    //                 <td colspan="2" style="padding: 12px; border: 1px solid #ddd;"></td>
    //             </tr>
    //             <tr style="background: #fee2e2; font-weight: bold;">
    //                 <td style="padding: 12px; border: 1px solid #ddd;" colspan="2">TOTAL EXPENSE</td>
    //                 <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: #000000ff;">₹${totalexpense.toFixed(2)}</td>
    //                 <td colspan="2" style="padding: 12px; border: 1px solid #ddd;"></td>
    //             </tr>
    //         </tfoot>
    //         </table>
    //     `;
    return tableHTML;
}

// function createTable(transactions,type){
//     const color = type === 'income' ? '#16a34a' : '#dc2626';
//     const total = transactions.reduce((sum, item) => sum + item.amount, 0);

//     let tableHTML = `
//         <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">  
//         <thead>
//             <tr style="background: ${color}; color: white;">
//                     <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Specification</th>
//                     <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Amount (₹)</th>
//                     <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Date</th>
//                     <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Action</th>
//                 </tr>
//         </thead>
//         <tbody> 
//     `;

//     transactions.sort((a,b)=> new Date(b.date)-new Date(a.date));

//     transactions.forEach(item=>{
//         tableHTML += `
//             <tr style="border-bottom: 1px solid #ddd;">
//                 <td style="padding: 10px; border: 1px solid #ddd;">${item.specification}</td>
//                 <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${item.amount.toFixed(2)}</td>
//                 <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${formatDate(item.date)}</td>
//                 <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">
//                     <button onclick="deleteTransaction(${item.id})" style="width: auto; padding: 5px 15px; background: #dc3545; font-size: 14px;">Delete</button>
//                 </td>
//             </tr>
//         `;
//     });

//     tableHTML += `
//             </tbody>
//             <tfoot>
//                 <tr style="background: #f8f9fa; font-weight: bold;">
//                     <td style="padding: 12px; border: 1px solid #ddd;">TOTAL</td>
//                     <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: ${color};">₹${total.toFixed(2)}</td>
//                     <td colspan="2" style="padding: 12px; border: 1px solid #ddd;"></td>
//                 </tr>
//             </tfoot>
//         </table>
//     `;

//     return tableHTML;
// }

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

function deleteTransaction(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);

        req.onsuccess = () => {
            displaydata();
            resolve();
        };
        req.onerror = () => reject(req.error);
    });
}


