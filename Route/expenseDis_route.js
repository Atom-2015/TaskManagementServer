const express = require("express");
const router = express.Router();

const ExpenseDisController=require("../Controler/Budget_Controller/ExpenseDis_Controller")


router.post('/AddexpenseDiscussion',ExpenseDisController.HandleAddExpenceDiscussion);


router.put('/discussionId',ExpenseDisController.HandleEditExpenseDiscussion);

// get all expense discussion
router.get('/AllexpenseDiscussion',ExpenseDisController.HandleGetExpenseDiscussion);


router.delete("/del",ExpenseDisController.HandleDeleteDiscussion);

module.exports = router;