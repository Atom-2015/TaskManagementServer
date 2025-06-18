const mongoose = require('mongoose');
const Project = require("../Modal/Projects");

const ExpenseDiscussionSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        
    },
    clientName: {
        type: String,
        required: true
    },
    date:{
        type: Date,
        
    },
    discussedBy: {
        type: String,
        required: true
    },
    pending: {
        type: Boolean,
        default: true
    },
    comment: {
        type: String
    },
    nextFollowUp: {
        type: Date
    }
});

// module.exports = mongoose.model('e', expenceDiscussion);
const ExpenseDiscussion = mongoose.model('ExpenseDiscussion', ExpenseDiscussionSchema);
module.exports = ExpenseDiscussion;