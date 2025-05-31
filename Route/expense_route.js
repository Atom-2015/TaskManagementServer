const express = require("express");
const router = express.Router();

const ExpenseController = require("../Controler/Budget_Controller/Expense_Controller");

router.post('/Addexpense',ExpenseController.HandleExpense);

router.get('/Allexpense',ExpenseController.HandleGetExpense);

router.delete("/:expenseId",ExpenseController.HandleDeleteExpense);

router.put('/:expenseId',ExpenseController.HandleEditExpense);






// ******************************************************************************************************* Expence Discussion ********************************************************************************************************* //
router.post('/AddexpenseDiscussion',ExpenseController.HandleAddExpenceDiscussion);


// get all expense discussion
router.get('/AllexpenseDiscussion',ExpenseController.HandleGetExpenseDiscussion);


router.delete('/deletediscussionid',ExpenseController.HandleDeleteDiscussion)



router.post('/sendteskmail',ExpenseController.HandleSendTaskEmail);

module.exports = router;