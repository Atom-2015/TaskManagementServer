const User = require("../../Modal/User");
const LeavePolicy = require("../../Modal/leavefolder/leavepolicy");
const UserLeave = require("../../Modal/leavefolder/userleaves");

// leave Policy for company ok bro||||||||||||||
// Add Leave Policy
module.exports.HandleAddLeavePolicy = async (req, res) => {
  try {
    const companyId = req.user?.company_id;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId is required in the token",
      });
    }

    const { leaves } = req.body;

    if (!Array.isArray(leaves) || leaves.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one leave type is required",
      });
    }

    for (let leave of leaves) {
      if (!leave.type || typeof leave.days !== "number") {
        return res.status(400).json({
          success: false,
          message: "Each leave must have a valid type and days (number)",
        });
      }
    }

    const existingPolicy = await LeavePolicy.findOne({ companyId });

    if (existingPolicy) {
      const updatedLeaves = [...existingPolicy.leaves];

      for (const newLeave of leaves) {
        const existingIndex = updatedLeaves.findIndex(
          (leave) => leave.type === newLeave.type
        );

        if (existingIndex !== -1) {
          // If leave type exists, update days
          updatedLeaves[existingIndex].days = newLeave.days;
        } else {
          // If leave type doesn't exist, push new
          updatedLeaves.push(newLeave);
        }
      }

      existingPolicy.leaves = updatedLeaves;
      const updatedPolicy = await existingPolicy.save();

      return res.status(200).json({
        success: true,
        message: "Leave policy updated successfully",
        data: updatedPolicy,
      });
    }

    // Create new policy
    const newPolicy = new LeavePolicy({
      companyId,
      leaves,
    });

    const savedPolicy = await newPolicy.save();

    return res.status(201).json({
      success: true,
      message: "Leave policy created successfully",
      data: savedPolicy,
    });
  } catch (error) {
    console.error("Error adding/updating leave policy:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating/updating leave policy",
    });
  }
};



//update companyt policy by dhinchak pooja
module.exports.updateLeavePolicy = async (req, res) => {
  try {
    const companyId = req.user?.company_id; 
    if(!companyId){
      return res.status(400).json({
        success: false,
        message: "companyId is required in the token",
      })
    }
    const { leaves } = req.body;

    if (!companyId || !Array.isArray(leaves) || leaves.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Leave and  companyId  are required",
      });
    }

    const updatedd = await LeavePolicy.findOneAndUpdate(
      { companyId },
      { $set: { leaves } },
      { new: true, upsert: false }
    );

    if (!updatedd) {
      return res.status(400).json({
        success: false,
        message: "leave policey not found and update",
      });
    }

    return res.status(200).json({
      success: false,
      message: "leave polsicy updated Successfully",
      data: updatedd,
    });
  } catch (error) {
    console.log("ye ha update by company", error);
    return res.status(500).json({
      success: false,
      message: "error in update leave policey very well",
    });
  }
};

// Get Leave Policy by Company ID
module.exports.HandleGetLeavePolicy = async (req, res) => {
  try {
    // const { companyId } = req.params;
    const companyId=req.user?.company_id; 

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId is required in the URL",
      });
    }

    const policy = await LeavePolicy.findOne({ companyId });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Leave policy not found for this company",
      });
    }

    return res.status(200).json({
      success: true,
      data: policy,
    });
  } catch (error) {
    console.error("Error fetching leave policy:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching leave policy",
    });
  }
};


// DELETE /api/leave-policy?type=CASUAL
module.exports.HandleDeleteLeavePolicy = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    const { type } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId is required in the token",
      });
    }

    if (!type || typeof type !== "string") {
      return res.status(400).json({
        success: false,
        message: "Leave type is required in query (e.g. ?type=CASUAL)",
      });
    }

    const existingPolicy = await LeavePolicy.findOne({ companyId });

    if (!existingPolicy) {
      return res.status(404).json({
        success: false,
        message: "Leave policy not found for this company",
      });
    }

    const originalLength = existingPolicy.leaves.length;
    existingPolicy.leaves = existingPolicy.leaves.filter(
      (leave) => leave.type !== type
    );

    if (originalLength === existingPolicy.leaves.length) {
      return res.status(404).json({
        success: false,
        message: `Leave type "${type}" not found in the policy`,
      });
    }

    const updatedPolicy = await existingPolicy.save();

    return res.status(200).json({
      success: true,
      message: `Leave type "${type}" deleted successfully`,
      data: updatedPolicy,
    });
  } catch (error) {
    console.error("Error deleting leave type:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting leave type from policy",
    });
  }
};


/**************************LEAVE API FOR ALL User******************************/

module.exports.createOrUpdateUserLeave = async (req, res) => {
  try {
    const userId = req.user?.userid; // ✅ Extract from token
    const { leaveType, fromDate, toDate, reason, year } = req.body;

    if (!userId || !leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        message:
          "Required: userId (from token), leaveType, fromDate, toDate, and reason",
      });
    }

    const user = await User.findById(userId).lean();
    if (!user || !user.Company) {
      return res.status(404).json({
        success: false,
        message: "User or associated company not found",
      });
    }

    const companyId = user.Company.toString();

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "fromDate cannot be after toDate",
      });
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const targetYear = year || new Date().getFullYear();
    const leaveTypeUpper = leaveType.toUpperCase();

    const policy = await LeavePolicy.findOne({ companyId }).lean();
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Leave policy not found for this company",
      });
    }

    const policyEntry = policy.leaves.find((l) => l.type === leaveTypeUpper);
    if (!policyEntry) {
      return res.status(404).json({
        success: false,
        message: `Leave type '${leaveTypeUpper}' not defined in policy`,
      });
    }

    let userLeave = await UserLeave.findOne({
      userId,
      companyId,
      year: targetYear,
    });

    let currentUsed = 0;
    if (userLeave) {
      // Auto-fill missing reasons in old records
      userLeave.leavesTaken = userLeave.leavesTaken.map((entry) => ({
        ...entry,
        reason: entry.reason || "Auto-filled",
      }));

      const existing = userLeave.leavesTaken.filter(
        (l) => l.type === leaveTypeUpper && l.status === "Approved"
      );
      currentUsed = existing.reduce((sum, l) => sum + l.days, 0);
    }

const newTotal = currentUsed + days;
let infoMessage = "Leave applied successfully";

if (newTotal > policyEntry.days) {
  const available = policyEntry.days - currentUsed;
  if (available > 0) {
    infoMessage = `Partial balance available. Requested: ${days}, Available: ${available}. Remaining ${
      days - available
    } will be adjusted as UNPAID leave upon approval.`;
  } else {
    infoMessage = `No balance left for ${leaveTypeUpper}. Entire ${days} days will be marked as UNPAID leave upon approval.`;
  }
}


    const leaveEntry = {
      type: leaveTypeUpper,
      reason,
      days,
      fromDate: start,
      toDate: end,
      status: "Pending",
    };

    if (!userLeave) {
      userLeave = new UserLeave({
        userId,
        companyId,
        year: targetYear,
        leavesTaken: [leaveEntry],
      });
    } else {
      userLeave.leavesTaken.push(leaveEntry);
    }

    const saved = await userLeave.save();

    return res.status(200).json({
      success: true,
      message: "Leave applied successfully",
      data: saved,
    });
  } catch (error) {
    console.error("Error applying leave:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while applying leave",
    });
  }
};

module.exports.getUserLeave = async (req, res) => {
  try {
    const userId = req.user.userid;
    const user = await User.findById(userId).lean();

    if (!user || !user.Company) {
      return res.status(404).json({
        success: false,
        message: "User or assscoicrted",
      });
    }

    const companyId = user.Company.toString();

    const targetYear = req.query.year || new Date().getFullYear();

    const userleave = await UserLeave.findOne({
      userId,
      companyId,
      year: targetYear,
    });

    if (!userleave) {
      return res.status(404).json({
        success: false,
        message: "No leave record found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User leave record successfully",
      data: userleave,
    });
  } catch (error) {
    console.log("error in fetchong ", error);
    return res.status(500).json({
      success: false,
      message: "error in fetching leave user",
    });
  }
};

module.exports.getUserLeaveBalance = async (req, res) => {
  try {
    const userId = req.user?.userid; // from token
    const year = new Date().getFullYear(); // or req.query.year if dynamic

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing from token",
      });
    }

    // Fetch user to get companyId
    const user = await User.findById(userId).lean();
    if (!user || !user.Company) {
      return res.status(404).json({
        success: false,
        message: "User or associated company not found",
      });
    }

    const companyId = user.Company.toString();

    // Fetch leave policy for this company
    const policy = await LeavePolicy.findOne({ companyId }).lean();
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Leave policy not found for this company",
      });
    }

    // Fetch user's leave record for the current year
    const userLeave = await UserLeave.findOne({
      userId,
      companyId,
      year,
    }).lean();

    // Build summary
    const summary = {};
    for (const leaveType of policy.leaves) {
      const type = leaveType.type.toUpperCase();
      const allowed = leaveType.days;

      const used =
        userLeave?.leavesTaken
          ?.filter((l) => l.type === type && l.status === "Approved") // ✅ Only approved counted
          ?.reduce((acc, l) => acc + l.days, 0) || 0;

      summary[type] = {
        allowed,
        used,
        remaining: allowed - used,
      };
    }

    return res.status(200).json({
      success: true,
      message: "Leave balance fetched successfully",
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching leave balance:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching leave balance",
    });
  }
};

//get total leave summery by user in this field samjhe re bachwa
module.exports.getUserLeaveSummary = async (req, res) => {
  try {
    let { userId, companyId, year } = req.query;

    if (!userId || !companyId) {
      return res.status(400).json({
        success: false,
        message: "userId and companyId are required",
      });
    }

    userId = userId.trim();
    companyId = companyId.trim();
    const targetYear = year || new Date().getFullYear();

    const leave = await UserLeave.findOne({
      userId,
      companyId,
      year: targetYear,
    });
    const summary = {};

    if (leave) {
      for (const l of leave.leavesTaken) {
        summary[l.type] = l.days;
      }
    }

    return res.status(200).json({
      success: true,
      message: "User leave summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    console.log("Error in getUserLeaveSummary:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching summary",
    });
  }
};

/********************all leave by the company***********************/
module.exports.getAllUserLeaveByCompany = async (req, res) => {
  try {
    const companyId = req.user?.company_id; // ✅ Extract from token
    const { year } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID missing from token. Unauthorized access.",
      });
    }

    const targetYear = year || new Date().getFullYear();

    const leaves = await UserLeave.find({
      companyId,
      year: targetYear,
    }).populate("userId", "name");

    if (!leaves || leaves.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No leave records found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "All user leaves fetched for this company",
      data: leaves,
    });
  } catch (error) {
    console.log("Error in getAllUserLeaveByCompany:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user leaves",
    });
  }
};

/**********************updateleavebyuserbycompany***********************/

module.exports.updateLeaveStatusByCompany = async (req, res) => {
  try {
    const { userId, leaveId, status } = req.body;
    const companyId = req.user?.company_id;

    if (!userId || !leaveId || !status) {
      return res.status(400).json({
        success: false,
        message: "userId, leaveId, and status are required",
      });
    }

    const validStatuses = ["approved", "rejected"];
    const normalizedStatus = status.toLowerCase();
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'",
      });
    }

    const formattedStatus =
      normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

    const user = await User.findById(userId);
    if (!user || user.Company.toString() !== companyId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const year = new Date().getFullYear();
    const userLeave = await UserLeave.findOne({ companyId, userId, year });

    if (!userLeave) {
      return res.status(404).json({
        success: false,
        message: "Leave record not found",
      });
    }

    const leaveEntry = userLeave.leavesTaken.id(leaveId);
    if (!leaveEntry) {
      return res.status(404).json({
        success: false,
        message: "Leave entry not found",
      });
    }

    if (formattedStatus === "Approved") {
      const policy = await LeavePolicy.findOne({ companyId }).lean();
      if (!policy) {
        return res.status(404).json({
          success: false,
          message: "Leave policy not found",
        });
      }

      const requestedType = leaveEntry.type;
      const requestedDays = leaveEntry.days;

      const policyEntry = policy.leaves.find((l) => l.type === requestedType);
      const unpaidPolicy = policy.leaves.find((l) => l.type === "UNPAID");

      if (!policyEntry || !unpaidPolicy) {
        return res.status(404).json({
          success: false,
          message: "Leave type or UNPAID leave not defined in policy",
        });
      }

      const approvedLeaves = userLeave.leavesTaken.filter(
        (l) => l.type === requestedType && l.status === "Approved"
      );
      const alreadyApproved = approvedLeaves.reduce((sum, l) => sum + l.days, 0);
      const balance = policyEntry.days - alreadyApproved;

      if (balance >= requestedDays) {
        leaveEntry.status = "Approved";
      } else if (balance > 0) {
        leaveEntry.days = balance;
        leaveEntry.status = "Approved";

        const unpaidPart = {
          type: "UNPAID",
          reason: leaveEntry.reason + " (Auto-adjusted unpaid)",
          fromDate: leaveEntry.toDate,
          toDate: leaveEntry.toDate,
          days: requestedDays - balance,
          status: "Approved",
        };

        userLeave.leavesTaken.push(unpaidPart);
      } else {
        leaveEntry.type = "UNPAID";
        leaveEntry.status = "Approved";
      }
    } else {
      leaveEntry.status = formattedStatus;
    }

    userLeave.leavesTaken = userLeave.leavesTaken.map((entry) => ({
      ...entry.toObject(),
      reason: entry.reason || "Auto-filled by admin",
    }));

    await userLeave.save();

    return res.status(200).json({
      success: true,
      message: `Leave ${formattedStatus.toLowerCase()} successfully`,
      data: leaveEntry,
    });
  } catch (error) {
    console.log("Error in updateLeaveStatusByCompany:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating leave status",
    });
  }
};
