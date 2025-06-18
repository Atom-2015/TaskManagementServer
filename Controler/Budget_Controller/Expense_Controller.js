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







const ExpenseDiscussion = require('../../Modal/expencesDiscussion'); // Adjust the path as needed


// Api to add the expence discussion 

module.exports.HandleAddExpenceDiscussion = async (req, res) => {
  try {
    // console.log("Received form body:", req.body);

    const { clientName, discussedBy, pending, comment, nextFollowUp } = req.body;
    const projectId = req.headers['x-project-id'];

    // Validations
    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ success: false, message: 'Project ID is required in header' });
    }

    if (!clientName || typeof clientName !== 'string' || clientName.trim() === '') {
      return res.status(400).json({ success: false, message: 'Client Name is required and must be a string' });
    }

    if (!discussedBy || typeof discussedBy !== 'string' || discussedBy.trim() === '') {
      return res.status(400).json({ success: false, message: 'Discussed By is required and must be a string' });
    }

    if (typeof pending !== 'boolean' && pending !== 'true' && pending !== 'false') {
      return res.status(400).json({ success: false, message: 'Pending must be a boolean value' });
    }

    const pendingBool = pending === 'true' || pending === true;

    if (comment && typeof comment !== 'string') {
      return res.status(400).json({ success: false, message: 'Comment must be a string' });
    }

    if (nextFollowUp && isNaN(Date.parse(nextFollowUp))) {
      return res.status(400).json({ success: false, message: 'Next FollowUp must be a valid date' });
    }

    const validateProject = await Project.findById(projectId);
    if (!validateProject) {
      return res.status(403).json({ success: false, message: 'Project Not found' });
    }

    // Save to DB
    const newDiscussion = new ExpenseDiscussion({
      projectId,
      date,
      clientName,
      discussedBy,
      pending: pendingBool,
      comment,
      nextFollowUp
    });

    const savedDiscussion = await newDiscussion.save();

    res.status(201).json({
      success: true,
      message: 'Discussion added successfully',
      data: savedDiscussion
    });

  } catch (error) {
    console.error('Error adding discussion:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};



// api to delete the discussion 
module.exports.HandleDeleteDiscussion = async (req, res) => {
  try {
    const discussionId = req.headers['x-discussion-id'];

    // Validate discussionId
    if (!discussionId || typeof discussionId !== 'string' || discussionId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Discussion ID is required in the x-discussion-id header.',
      });
    }

    // Delete discussion
    const deletedDiscussion = await ExpenseDiscussion.findByIdAndDelete(discussionId.trim());

    if (!deletedDiscussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found or already deleted.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Discussion deleted successfully.',
    });

  } catch (error) {
    console.error('Error deleting discussion:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error while deleting discussion.',
    });
  }
};






// api to get the data of the Expence Discussion 
module.exports.HandleGetExpenseDiscussion = async (req, res) => {
  try {
    const projectId = req.headers['x-project-id'];

    // Basic validation
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing Project ID in headers.',
      });
    }

    // Fetch discussions
    const discussions = await ExpenseDiscussion.find({ projectId });

    if (!discussions || discussions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No discussions found for the given Project ID.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Discussions retrieved successfully.',
      data: discussions,
    });

  } catch (error) {
    console.error('Error fetching discussions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error while fetching discussions.',
    });
  }
};



// api to edit the data of expence discussion 
module.exports.HandleEditExpenseDiscussion = async (req, res) => {
  try {
    const discussionId = req.headers['x-discussion-id'];

    // Validate ID
    if (!discussionId || typeof discussionId !== 'string' || discussionId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Discussion ID is required in header.',
      });
    }

    // Validate body fields
    const { date,clientName, discussedBy, pending, comment, nextFollowUp } = req.body;

    if (
      !clientName || typeof clientName !== 'string' || clientName.trim() === '' ||
      !discussedBy || typeof discussedBy !== 'string' || discussedBy.trim() === '' ||
      typeof pending !== 'boolean' ||
      !comment || typeof comment !== 'string' ||
      !nextFollowUp || isNaN(Date.parse(nextFollowUp))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input. Please ensure all fields are filled correctly.',
      });
    }

    // Update document
    const updatedDiscussion = await ExpenseDiscussion.findByIdAndUpdate(
      discussionId.trim(),
      {
        date,
        clientName: clientName.trim(),
        discussedBy: discussedBy.trim(),
        pending,
        comment: comment.trim(),
        nextFollowUp: new Date(nextFollowUp)
      },
      { new: true }
    );

    if (!updatedDiscussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Discussion updated successfully.',
      data: updatedDiscussion
    });

  } catch (error) {
    console.error('Error updating discussion:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating discussion.',
    });
  }
};





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