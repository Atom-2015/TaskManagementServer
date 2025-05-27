const Revenue = require("../../Modal/Revenue");
const Project = require("../../Modal/Projects");

module.exports.HandleRevenue = async (req, res) => {
  try {
    const {
      projectId,
      date,
      milestone,
      invoiceNo,
      basicAmount,
      gst,
      tds,
      received,
      pending,
      dueDate,
      status,
      comment,
    } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required",
      });
    }

    const projectExists = await Project.findById(projectId);
    if (!projectExists) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (
      [
        date,
        milestone,
        invoiceNo,
        basicAmount,
        gst,
        tds,
        received,
        pending,
        dueDate,
        status,
        comment,
      ].some(
        (field) =>
          field === undefined ||
          field === null ||
          field.toString().trim() === ""
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const newRevenue = await Revenue.create({
      projectId,
      date,
      milestone,
      invoiceNo,
      basicAmount,
      gst,
      tds,
      received,
      pending,
      dueDate,
      status,
      comment,
    });

    console.log("Revenue created:", newRevenue);

    return res.status(201).json({
      success: true,
      message: "Revenue created successfully",
      data: newRevenue,
    });
  } catch (error) {
    console.error("Error in HandleRevenue:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating revenue",
    });
  }
};

module.exports.HandleGetRevenue = async (req, res) => {
  try {
    const AllRevenue = await Revenue.find();

    if (!AllRevenue) {
      return res.status(400).json({
        success: false,
        message: "Revenue is error in getting",
      });
    }

    return res.status(200).json({
      success: true,
      message: "All revenmuew",
      data: AllRevenue,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to get Revenuew",
    });
  }
};

module.exports.HandleEditRevenue = async (req, res) => {
  try {
    const { revenueId } = req.params;
    const {
      date,
      milestone,
      invoiceNo,
      basicAmount,
      gst,
      tds,
      received,
      pending,
      dueDate,
      status,
      comment,
    } = req.body;

    if (!revenueId) {
      return res.status(400).json({
        success: false,
        message: "REveneiid Not found",
      });
    }

    const editRevenue = await Revenue.findByIdAndUpdate(
      revenueId,
      {
        date,
        milestone,
        invoiceNo,
        basicAmount,
        gst,
        tds,
        received,
        pending,
        dueDate,
        status,
        comment,
      },
      { new: true }
    );

    if (!editRevenue) {
      return res.status(404).json({
        success: false,
        message: "editRevenue is problem",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Edited Successfully",
      data: editRevenue,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "error in edit revenuew",
    });
  }
};


module.exports.HandleDeleteRevenue = async (req,res) => {
    try{
        const {revenueId} = req.params;

        if(!revenueId){
            return res.status(400).json({
                success:false,
                message:"revenue id is not found"
            })
        }

        const DeleteRevenue = await Revenue.findByIdAndDelete(revenueId)

        return res.status(200).json({
            success:true,message:"delted successfully",data:DeleteRevenue
        })
    }
    catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Delete the the revneuw error"
        })
    }
}