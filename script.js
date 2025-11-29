let db;
const DB_NAME = 'FinanceTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'transaction';

function initdb(){
    return new Promise((resolve,request)=>{
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        
        req.onupgradeneeded = (event) => {
            db = event.target.result;

            if(!db.objectStoreNames.contains(STORE_NAME)){
                    const objstore = db.createObjectStore(STORE_NAME,{keyPath: 'id', autoIncrement:true});
                objstore.createIndex('type','type',{unique:false});
                objstore.createIndex('date','date',{unique:false});
            }
        };
        req.onsuccess= (event) =>{
            db = event.target.result;
            resolve(db);
        };
        req.onerror = (event)=>{
            reject('Database Error:'+event.target.error);
        };  
    }); 
} 

const form = document.querySelector('form');
const datadisplay = document.querySelector('.list');

document.addEventListener('DOMContentLoaded',async()=>{
    const dateinput = document.getElementById('date');
    const tdy = new Date().toISOString().split('T')[0];
    dateinput.value = tdy;
    await initdb();
    displaydata();
});


form.addEventListener('submit',async(e)=>{
    e.preventDefault();

    const type = document.getElementById('type').value;
    const specifications= document.getElementById('specifications').value;
    const amount = getElementById('amount').value;
    const date = document.getElementById('date').value;
    
    const transactions = {
        type,
        specification,
        amount: parseFloat(amount),
        date,
        timestamp:Date.now()
    };

    await savetransactions(transactions);

    form.reset();
    const tdy = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = tdy;
    displaydata();
});

function savetransactions(transactions){
    return new Promise((resolve,reject)=>{
        const tx = db.transaction([STORE_NAME],'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.add(transactions);
        req.onsuccess = ()=> resolve(req.result);
        req.onerror = ()=> reject(req.error);
    });
}

function getalltransactions(){
    return new Promise((resolve,reject)=>{
        const tx = db.transaction([STORE_NAME],'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = ()=> resolve(req.result);
        req.onerror = ()=> reject(req.error); 
    });
}

async function displaydata(){
    const alltransactions = await getalltransactions();

    if(alltransactions.length===0){
        datadisplay.innerHTML = '<p style="text-align: center; color: black;>No transactions entered yet.</p>';
        return;
    }
}


const income = alltransactions.filter(t => t.type==='income');
const expense = alltransactions.filter(t=>t.type==='expense'); 

const totalincome = income.reduce((sum,item)=> sum+item.income,0);
const totalexpense = expense.reduce((sum,item)=> sum+item.expense,0);
const balance = totalincome - totalexpense;