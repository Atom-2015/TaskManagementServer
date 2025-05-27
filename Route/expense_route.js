const express = require("express");
const router = express.Router();

const ExpenseController = require("../Controler/Budget_Controller/Expense_Controller");

router.post('/Addexpense',ExpenseController.HandleExpense);

router.get('/Allexpense',ExpenseController.HandleGetExpense);

router.delete("/:expenseId",ExpenseController.HandleDeleteExpense);

router.put('/:expenseId',ExpenseController.HandleEditExpense);

module.exports = router;