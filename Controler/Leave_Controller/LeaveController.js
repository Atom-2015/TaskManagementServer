const User = require("../../Modal/User");
const LeavePolicy = require("../../Modal/leavefolder/leavepolicy");



const LeavePolicy = require("../models/LeavePolicy"); // adjust path as needed



// Add Leave policy
module.exports.HandleAddLeavePolicy = async (req, res) => {
  try {
    const { companyId, leaves } = req.body;

    if (!companyId || !Array.isArray(leaves) || leaves.length === 0) {
      return res.status(400).json({
        success: false,
        message: "companyId and at least one leave type are required.",
      });
    }

    // Optional: Validate each leave entry
    for (let leave of leaves) {
      if (!leave.type || typeof leave.days !== "number") {
        return res.status(400).json({
          success: false,
          message: "Each leave must have a valid 'type' and 'days' field.",
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
      message: "Leave policy created successfully.",
      data: savedPolicy,
    });
  } catch (error) {
    console.error("Error adding leave policy:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating leave policy.",
    });
  }
};







// Get Leave Policy by Company ID
module.exports.HandleGetLeavePolicy = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId is required in the URL.",
      });
    }

    const policy = await LeavePolicy.findOne({ companyId });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Leave policy not found for this company.",
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
      message: "Server error while fetching leave policy.",
    });
  }
};
