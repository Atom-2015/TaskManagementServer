const mongoose = require('mongoose');

const ExpenceDiscussionSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    clientName: {
        type: String,
        required: true
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
const ExpenseDiscussion = mongoose.model('ExpenseDiscussion', ExpenceDiscussionSchema);
module.exports = ExpenseDiscussion;