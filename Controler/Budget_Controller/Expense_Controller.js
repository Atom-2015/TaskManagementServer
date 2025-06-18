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

















// ******************************************************************************************************* Expence Discussion ********************************************************************************************************* //
// ************************************************************************************************************************************************************************************************************************************ //









// Api to add the expence discussion 




require("dotenv").config();
const nodemailer = require("nodemailer");
const crypto = require("crypto"); // For generating OTP

// task mail api G mail logic

module.exports.HandleSendTaskEmail = async (req, res) => {
  try {
    console.log(`body hai ye ${req.body.email}`)
    const  email  = req.body.email; // User's email from request

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999);

    // Configure Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER || "atom.data.01@gmail.com", // Your Gmail
        pass: process.env.GMAIL_PASS || "qijd sukq smib uzav", // App Password (Not actual Gmail password)
      },
    });
    const tasktitle = req.body.tasktitle;

    // Email content
    const mailOptions = {
      from: "atom.data.01@gmail.com",
      to: email ,
      subject: "You Have Been Assigned New Task",
      text: `Hii   
       
      ${tasktitle}
      
      `,
    };

    // Send Email
    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent: " + info.response);
    // return res.status(200).json({ message: "OTP sent successfully", otp }); 
    return res.status(200).json({ message: "Message Email Sent" }); 
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return res.status(500).json({ error: "Failed to send OTP email" });
  }
};