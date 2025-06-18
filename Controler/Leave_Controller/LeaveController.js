const User = require("../../Modal/User");
const LeavePolicy = require("../../Modal/leavefolder/leavepolicy");
const UserLeave = require("../../Modal/leavefolder/userleaves");



// leave Policy for company ok bro||||||||||||||
// Add Leave Policy
module.exports.HandleAddLeavePolicy = async (req, res) => {
  try {
    const { companyId, leaves } = req.body;

    if (!companyId || !Array.isArray(leaves) || leaves.length === 0) {
      return res.status(400).json({
        success: false,
        message: "companyId and at least one leave type are required",
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
    console.error("Error adding leave policy:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating leave policy",
    });
  }
};

//update companyt policy by dhinchak pooja
module.exports.updateLeavePolicy = async(req,res) => {

  try{
    const {companyId, leaves} = req.body;
 
    if(!companyId || !Array.isArray(leaves) || leaves.length === 0){
      return res.status(400).json({
        success:false,
        message:"Leave and  companyId  are required"
      })
    }

    const updatedd = await LeavePolicy.findOneAndUpdate({companyId},{$set:{leaves}},{new: true,upsert:false});

    if(!updatedd) {
      return res.status(400).json({
        success:false,
        message:"leave policey not found and update"
      })
    }

    return res.status(200).json({
      success:false,
      message:"leave polsicy updated Successfully",
      data: updatedd
    })
    
  }
  catch(error){
    console.log( "ye ha upfate by company",error);
    return res.status(500).json({
      success: false,
      message:"error in update leave policey very well"
    })
  }
}


// Get Leave Policy by Company ID
module.exports.HandleGetLeavePolicy = async (req, res) => {
  try {
    const { companyId } = req.params;

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

/**************************LEAVE API FOR ALL User******************************/




module.exports.createOrUpdateUserLeave = async (req, res) => {
  try {
    const { userId, companyId, year, leaveType, fromDate, toDate } = req.body;

    if (!userId || !companyId || !leaveType || !fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "Required: userId, companyId, leaveType, fromDate, and toDate",
      });
    }

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

    const policy = await LeavePolicy.findOne({ companyId });
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Leave policy not found for this company",
      });
    }

    const policyEntry = policy.leaves.find(l => l.type === leaveTypeUpper);
    if (!policyEntry) {
      return res.status(404).json({
        success: false,
        message: `Leave type '${leaveTypeUpper}' not defined in policy`,
      });
    }

    let userLeave = await UserLeave.findOne({ userId, companyId, year: targetYear });
    let currentUsed = 0;

    if (userLeave) {
      const existing = userLeave.leavesTaken.filter(l => l.type === leaveTypeUpper);
      currentUsed = existing.reduce((sum, l) => sum + l.days, 0);
    }

    const newTotal = currentUsed + days;
    if (newTotal > policyEntry.days) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Allowed: ${policyEntry.days}, Used: ${currentUsed}, Requested: ${days}`,
      });
    }

    if (!userLeave) {
      userLeave = new UserLeave({
        userId,
        companyId,
        year: targetYear,
        leavesTaken: [{ type: leaveTypeUpper, days, fromDate: start, toDate: end }],
      });
    } else {
      userLeave.leavesTaken.push({ type: leaveTypeUpper, days, fromDate: start, toDate: end });
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
    const { userId, companyId, year } = req.query;

    if (!userId || !companyId) {
      return res.status(400).json({
        success: false,
        message: "userId and company is not found",
      });
    }

    const targetYear = year || new Date().getFullYear();

    const userLeave = await UserLeave.findOne({
      userId,
      companyId,
      year: targetYear,
    });

    if (!userLeave) {
      return res.status(404).json({
        success: false,
        message: "No leave record found in this user ",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User leave record fetch successfully",
      data: userLeave,
    });
  } catch (error) {
    console.log("Error in fetching the user leave", error);
    return res.status(500).json({
      success: false,
      message: "error getting the time",
    });
  }
};


//get leave balacne by user for balance
module.exports.getUserLeaveBalance=async (req,res) =>{
  try{
    let {userId,companyId,year} =req.query;

    if(!userId || !companyId){
      return res.status(400).json({
        success:false,
        message:"userid and comnapyid required"
      })
    }

     userId= userId.trim();
      companyId= companyId.trim();

      const targetYear= year || new Date().getFullYear();

      const policy = await LeavePolicy.findOne({companyId})
      if(!policy){
        return res.status(404).json({
          success:false,
          message:"pilocy not found"
        })
      }

      const userleave = await UserLeave.findOne({userId,companyId,year:targetYear});

      const summary={};

      for(const leavetype of policy.leaves){
        const type= leavetype.type.toUpperCase();
        const allowed = leavetype.days;

        const used = userleave?.leavesTaken.find(l=>l.type === type)?.days || 0;
        const remaining = allowed-used;

        summary[type]= {
          allowed,used,remaining,
        }
      }

      return res.status(200).json({
        success:true,
        message:"Leave balance fetched successfully",
        data: summary
      })
  }
  catch(error){
    return res.status(500).json({
      success:false,
      message:"error in user get leave balance"
    })
  }
}



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

    const leave = await UserLeave.findOne({ userId, companyId, year: targetYear });
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
    const { companyId, year } = req.query;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId is required",
      });
    }

    const targetYear = year || new Date().getFullYear();

    const leaves = await UserLeave.find({
      companyId,
      year: targetYear,
    }).populate("userId", "name");

    if (!leaves || leaves.length < 0) {
      return res.status(404).json({
        success: false,
        message: "No leave record founds",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Company user all ",
      data: leaves,
    });
  } catch (error) {
    console.log("ye error arha hai ", error);
    return res.status(500).json({
      success: false,
      message: "Server error in  fetching all user leaves",
    });
  }
};
