const isExpensepage = document.title === "Finance Tracker" && document.querySelector("h1").textContent === "Expense";
const storagekey = isExpensepage ? "expense" : "earning";
const form = document.querySelector("form");
const Display = document.querySelector(".list");