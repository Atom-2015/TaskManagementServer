const { default: mongoose } = require("mongoose");

const ExpenseSchema = new mongoose.Schema({
    
    employee_id: {  type: mongoose.Schema.Types.ObjectId,required: true, ref: 'User' }, // Reference to Users
    expense_date: { type: Date, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], required: true },
    approver_id: {  type: mongoose.Schema.Types.ObjectId,
       ref: 'User' }, // Reference to Users
    attachments: [{ type: String }] // Array of attachment URLs
  });
  
//   module.exports = mongoose.model('Expense', ExpenseSchema);
const expenses = mongoose.model('Expense', ExpenseSchema);
module.exports = expenses;