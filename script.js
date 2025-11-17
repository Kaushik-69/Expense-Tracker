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
                    const objstore = db.createObjectStor(STORE_NAME,{keyPath: 'id', autoIncrement:true});
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



