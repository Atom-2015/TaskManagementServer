const Project = require("../../Modal/Projects");
const Expense = require("../../Modal/Expense");

const ExpenseDiscussion = require('../../Modal/expencesDiscussion'); 



module.exports.HandleAddExpenceDiscussion = async (req, res) => {
  try {
    // console.log("Received form body:", req.body);

    const { clientName,date, discussedBy, pending, comment, nextFollowUp } = req.body;
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
    console.log("ye id hai "+discussionId);

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
        message: 'No discussions found for the given Project ID.',Y
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
    const discussionId = req.params.id;

    // Validate discussionId
    if (!discussionId || typeof discussionId !== 'string' || discussionId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Discussion ID is required in the URL parameter.',
      });
    }

    const { clientName, date, discussedBy, pending, comment, nextFollowUp } = req.body;

    // Update discussion
    const updatedDiscussion = await ExpenseDiscussion.findByIdAndUpdate(
      discussionId,
      {
        clientName,
        date,
        discussedBy,
        pending,
        comment,
        nextFollowUp,
      },
      { new: true }
    );

    if (!updatedDiscussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Discussion updated successfully',
      data: updatedDiscussion,
    });

  } catch (error) {
    console.error('Error editing discussion:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while updating expense' });
  }
};

