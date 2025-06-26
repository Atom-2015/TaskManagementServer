const Holiday = require("../../Modal/Holiday");
const User = require("../../Modal/User");
module.exports.HandleCreateHoliday = async (req, res) => {
  try {
    const companyId = req.user?.company_id;

    //  Block users from creating holidays
    if (!companyId) {
      return res.status(403).json({
        success: false,
        message: "Only companies can create holidays",
      });
    }

    const { year, weeklyOff, holidays, overrides } = req.body;

    if (!year || !weeklyOff || !Array.isArray(holidays)) {
      return res.status(400).json({
        success: false,
        message: "Year, weeklyOff, and holidays are required and must be valid",
      });
    }

    const existing = await Holiday.findOne({ companyId, year });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Holiday record already exists for year ${year}`,
      });
    }

    const holiday = new Holiday({
      companyId,
      year,
      weeklyOff,
      holidays,
      overrides: overrides || [],
    });

    await holiday.save();

    return res.status(201).json({
      success: true,
      message: "Holiday configuration created successfully",
      data: holiday,
    });
  } catch (error) {
    console.error("Error in HandleCreateHoliday:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports.HandleGetHolidayList = async (req, res) => {
  try {
    let companyId = req.user.company_id;

    if (!companyId && req.user.userid) {
      const user = await User.findById(req.user.userid).select("Company");
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "user not found",
        });
      }
      companyId = user.Company;
    }

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "this company is required",
      });
    }

    const targetYear = new Date().getFullYear();

    const holiday = await Holiday.findOne({ companyId, year: targetYear });

    if (!holiday) {
      return res.status(400).json({
        success: false,
        message: "Holiday not found",
      });
    }

    return res.status(200).json({
      success: false,
      message: "holiday data fetch successfully",
      data: holiday,
    });
  } catch (error) {
    console.log("Error in HandleGetHolidayList:", error);
    return res.status(500).json({
      success: false,
      message: "error in Get the holiday list",
    });
  }
};

module.exports.HandlePutHolidayByCompany = async (req, res) => {
  try {
    const companyId = req.user?.company_id;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "company id not found very well",
      });
    }

    const { year, weeklyOff, holidays, overrides } = req.body;

    if (!year || !weeklyOff || !holidays) {
      return res.status(400).json({
        success: false,
        message: "Year, weeklyOff, and holidays are required and must be valid",
      });
    }

    const updated = await Holiday.findOneAndUpdate(
      { companyId, year },
      {
        $set: {
          weeklyOff,
          holidays,
          overrides: overrides || [],
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `No holiday record found for year ${year}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Holiday updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Here is the error in put holiday section",
    });
  }
};


// edit  single holiday  
module.exports.HandleSingleHoliday = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    const { holidayId } = req.params;
    const { name, date } = req.body;

    if (!companyId || !holidayId || !name || !date) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const updated = await Holiday.findOneAndUpdate(
      { companyId, "holidays._id": holidayId },
      {
        $set: {
          "holidays.$.name": name,
          "holidays.$.date": date,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Holiday not found" });
    }

    return res.status(200).json({ success: true, message: "Holiday updated", data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Error updating holiday" });
  }
};

module.exports.HandleDelSingleHoliday = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    const { holidayId } = req.params;


    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Missing company ID",
      });
    }

    if (!holidayId) {
      return res.status(400).json({
        success: false,
        message: "Missing holiday ID",
      });
    }

    const updated = await Holiday.findOneAndUpdate(
      { companyId, "holidays._id": holidayId },
      { $pull: { holidays: { _id: holidayId } } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found or already deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error in HandleDelSingleHoliday:", error);
    return res.status(500).json({
      success: false,
      message: "Error in delete single holiday",
    });
  }
};

module.exports.HandleAddOverridesHoliday = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
   
    const { date, isWorkingDay, reason, year } = req.body;

    if (!companyId || !date || isWorkingDay === undefined || !reason || !year) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (companyId, date, isWorkingDay, reason, year)"
      });
    }

    const updated = await Holiday.findOneAndUpdate(
      { companyId, year },
      { $push: { overrides: { date, isWorkingDay, reason } } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Holiday record for the given year not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Override added successfully",
      data: updated,
    });

  } catch (error) {
    console.error("Error in HandleAddOverridesHoliday:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while adding override",
    });
  }
};

module.exports.HandleSingleOverridesHoliday = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    const { overridesId } = req.params;
    const { date, isWorkingDay, reason } = req.body;

    if (!companyId || !overridesId || !date || isWorkingDay === undefined || !reason) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const updated = await Holiday.findOneAndUpdate(
      { companyId, "overrides._id": overridesId },
      {
        $set: {
          "overrides.$.date": date,
          "overrides.$.isWorkingDay": isWorkingDay,
          "overrides.$.reason": reason,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Override not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Override updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error in HandleSingleOverridesHoliday:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating override",
    });
  }
};

//delete api for overrides day ok ram ram
module.exports.HandleDelSingleOverirides = async (req,res) =>{
  try{
    const companyId= req.user?.company_id;

    const {overridesId} = req.params;

    console.log("comapanyid",companyId);
    console.log("overrideId",overridesId);

    if(!companyId || !overridesId){
      return res.status(400).json({
        success:false,
        message:"companyid and overrides Id not found here"
      })
    }

   const updated = await Holiday.findOneAndUpdate({companyId,"overrides._id":overridesId},{$pull:{overrides:{_id:overridesId}}},{new:true})

   if(!updated){
    return res.status(404).json({success:false,message:"Override not found"})
   }

   return res.status(200).json({
    success:false,
    message:"dele successfully ",
    data:updated
   })
  }
  catch(error){
    console.log(error)
    return res.status(500).json({
      success:false,
      message:"Internal servere error while "
    })
  }
}

//get data with overriedes
module.exports.HandleGetOverrides = async (req, res) => {
  try {
    let companyId = req.user?.company_id;

    // If companyId is not present, try fetching it from the user object
    if (!companyId && req.user?.userid) {
      const user = await User.findById(req.user.userid).select("Company");
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
      companyId = user.Company;
    }

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is not found",
      });
    }

    const holidayDoc = await Holiday.findOne({ companyId });

    if (!holidayDoc) {
      return res.status(404).json({
        success: false,
        message: "Holiday record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Overrides fetched successfully",
      overrides: holidayDoc.overrides || [],
    });
  } catch (error) {
    console.error("Error in HandleGetOverrides:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching overrides",
    });
  }
};
