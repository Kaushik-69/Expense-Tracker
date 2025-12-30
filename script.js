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
        datadisplay.innerHTML = '<p style="text-align: center; color: #b0b0b0;">No transactions entered yet.</p>';
        return;
    }

    const income = alltransactions.filter(t => t.type === 'income');
    const expense = alltransactions.filter(t => t.type === 'expense');

    const totalincome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalexpense = expense.reduce((sum, item) => sum + item.amount, 0);
    const balance = totalincome - totalexpense;

    let html = '';

    html += `
            <div style="background: linear-gradient(150deg, #FF6B35 0%, #F7931E 30%, #FF3F8E 70%, #C738D8 100%); color: white; padding: 25px; border-radius: 15px; margin-bottom: 30px; box-shadow: 0 8px 32px rgba(255, 107, 53, 0.4);">
                <h3 style="margin: 0 0 20px 0; color: white; font-size: 22px;">Financial Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center;">
                    <div>
                        <div style="font-size: 13px; opacity: 0.95; letter-spacing: 0.5px; text-transform: uppercase;">Total Income</div>
                        <div style="font-size: 26px; font-weight: bold; margin-top: 8px;">₹${totalincome.toFixed(2)}</div>
                    </div>
                    <div>
                        <div style="font-size: 13px; opacity: 0.95; letter-spacing: 0.5px; text-transform: uppercase;">Total Expense</div>
                        <div style="font-size: 26px; font-weight: bold; margin-top: 8px;">₹${totalexpense.toFixed(2)}</div>
                    </div>
                    <div>
                        <div style="font-size: 13px; opacity: 0.95; letter-spacing: 0.5px; text-transform: uppercase;">Balance</div>
                        <div style="font-size: 26px; font-weight: bold; margin-top: 8px;">₹${balance.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;

    html += `<h3 style="color: #ffffff; margin-bottom: 20px; font-size: 20px;">All Transactions</h3>`;
    html += createCombinedTable(alltransactions, totalincome, totalexpense);
    datadisplay.innerHTML = html;
}

function createCombinedTable(transactions, totalincome, totalexpense) {
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    let tableHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; overflow: hidden; border-radius: 10px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);">
            <thead>
                <tr style="background: linear-gradient(135deg, #0099FF 0%, #00B8FF 100%); color: white;">
                    <th style="padding: 14px; text-align: left; border: none; font-weight: 600;">Type</th>
                    <th style="padding: 14px; text-align: left; border: none; font-weight: 600;">Specification</th>
                    <th style="padding: 14px; text-align: right; border: none; font-weight: 600;">Amount (₹)</th>
                    <th style="padding: 14px; text-align: center; border: none; font-weight: 600;">Date</th>
                    <th style="padding: 14px; text-align: center; border: none; font-weight: 600;">Action</th>
                </tr>
            </thead>
            <tbody>
        `;

    transactions.forEach(item => {
        const textCol = item.type === 'income' ? '#00FF9D' : '#FF3366';
        const bgCol = item.type === 'income' ? 'rgba(0, 255, 157, 0.05)' : 'rgba(255, 51, 102, 0.05)';
        tableHTML += `
                 <tr style="border-bottom: 1px solid #2a2a2a; background: ${bgCol}; transition: all 0.2s ease;" onmouseover="this.style.background='rgba(0, 184, 255, 0.1)'" onmouseout="this.style.background='${bgCol}'">
                <td style="padding: 12px; border: none; color: ${textCol}; font-weight: 600; text-transform: capitalize;">${item.type}</td>
                <td style="padding: 12px; border: none; color: #e0e0e0;">${item.specification}</td>
                <td style="padding: 12px; text-align: right; border: none; color: #ffffff; font-weight: 600;">${item.amount.toFixed(2)}</td>
                <td style="padding: 12px; text-align: center; border: none; color: #b0b0b0;">${formatDate(item.date)}</td>
                <td style="padding: 12px; text-align: center; border: none;">
                    <button onclick="deleteTransaction(${item.id})" style="width: auto; padding: 6px 16px; background: linear-gradient(135deg, #FF3366 0%, #FF0055 100%); color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(255, 51, 102, 0.3);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(255, 51, 102, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(255, 51, 102, 0.3)'">Delete</button>
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
    const modalHTML = `
        <div class="modal-overlay" id="deleteModal">
            <div class="modal-content">
                <h3>Confirm Deletion</h3>
                <p>You sure you wanna delete this transaction?!?!?</p>
                <div class="modal-buttons">
                    <button class="modal-btn modal-btn-cancel" onclick="closeModal()">Cancel</button>
                    <button class="modal-btn modal-btn-delete" onclick="confirmDelete(${id})">Delete</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('deleteModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

}

function closeModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.animation = 'fadeOut .2s ease';
        setTimeout(() => {
            modal.remove();
        }, 200);
    }
}

function confirmDelete(id) {
    closeModal();
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => {
        displaydata();
    };

    req.onerror = () => {
        console.error('Facing error in deleting this transaction;', req.error);
        alert('Failed to delete the transaction. Try again.😊');
    };
}


