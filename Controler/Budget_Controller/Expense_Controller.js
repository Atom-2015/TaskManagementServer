const Project = require("../../Modal/Projects");
const Expense = require("../../Modal/Expense");

// Create Expense
module.exports.HandleExpense = async (req, res) => {
  try {
    const {
      projectId,
      date,
      paidTo,
      invoiceNo,
      amount,
      gst,
      tds,
      comment,
      data,
    } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    const projectExist = await Project.findById(projectId);
    if (!projectExist) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const requiredFields = [date, paidTo, invoiceNo, amount, gst, tds];
    if (
      requiredFields.some(
        (f) => f === undefined || f === null || f.toString().trim() === ""
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const newExpense = await Expense.create({
      projectId,
      date,
      paidTo,
      invoiceNo,
      amount,
      gst,
      tds,
      comment,
      data,
    });

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: newExpense,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating expense",
    });
  }
};

// Get All Expenses
module.exports.HandleGetExpense = async (req, res) => {
  try {
    const allExpenses = await Expense.find();

    return res.status(200).json({
      success: true,
      message: "Successfully fetched expenses",
      data: allExpenses,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching expenses",
    });
  }
};

// Edit/Update Expense
// Edit/Update Expense
module.exports.HandleEditExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const updates = req.body;

    const updatedExpense = await Expense.findByIdAndUpdate(
      expenseId,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating expense",
    });
  }
};


// Delete Expense
module.exports.HandleDeleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const deletedExpense = await Expense.findByIdAndDelete(expenseId);

    if (!deletedExpense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found or already deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
      data: deletedExpense,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting expense",
    });
  }
};
