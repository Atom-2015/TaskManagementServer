const Holiday = require("../../Modal/Holiday");
const Shift = require("../../Modal/Shift");
const User = require("../../Modal/User");

module.exports.createShift = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    const { name, punchIn, punchOut, breaks } = req.body;

    if (!name || !punchIn || !punchOut) {
      return res.status(400).json({
        success: false,
        message: "name, punchIn, and punchOut are required",
      });
    }

    const newshift = await Shift.findOneAndUpdate(
      { companyId },
      { $push: { shifts: { name, punchIn, punchOut, breaks } } },
      { new: true, upsert: true }
    );

    await newshift.save();

    return res.status(201).json({
      success: true,
      message: "Successfully craeted shift",
      data: newshift,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while creating shift",
    });
  }
};
module.exports.getShift = async (req, res) => {
  try {
    let companyId = req.user?.company_id;

    if (!companyId && req.user?.userid) {
      const user = await User.findById(req.user.userid).lean();
      if (!user || !user.Company) {
        return res.status(404).json({
          success: false,
          message: "User or associated company not found"
        });
      }
      companyId = user.Company.toString();
    }

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID not found"
      });
    }

    const shiftedData = await Shift.findOne({ companyId }).lean();

    if (!shiftedData) {
      return res.status(404).json({
        success: true,
        message: "No shifts found for this company"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Successfully fetched shift data",
      data: shiftedData
    });
  } catch (error) {
    console.error("Error in getShift:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting shift data"
    });
  }
};


module.exports.editShift = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    const shiftId = req.params.shiftId;
    const { punchIn, punchOut, name, breaks } = req.body;

    if (!shiftId || !companyId) {
      return res.status(400).json({
        success: false,
        message: "Missing companyId or shiftId",
      });
    }

    const shiftDoc = await Shift.findOne({ companyId });

    if (!shiftDoc) {
      return res.status(404).json({
        success: false,
        message: "Shift document not found for company",
      });
    }

    const shiftIndex = shiftDoc.shifts.findIndex(
      (s) => s._id.toString() === shiftId
    );

    if (shiftIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Shift not found",
      });
    }

    // Update fields if provided
    if (name) shiftDoc.shifts[shiftIndex].name = name;
    if (punchIn) shiftDoc.shifts[shiftIndex].punchIn = punchIn;
    if (punchOut) shiftDoc.shifts[shiftIndex].punchOut = punchOut;
    if (breaks) shiftDoc.shifts[shiftIndex].breaks = breaks;

    //field update nahi hua to ye karna

    await shiftDoc.save();

    return res.status(200).json({
      success: true,
      message: "Shift updated successfully",
      data: shiftDoc,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while editing shift",
    });
  }
};

module.exports.deleteShift = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    const shiftId = req.params.shiftId;

   

    // if(!companyId){
    //     return res.status(400).json({
    //         success:false,
    //         message:"companyId is missing"
    //     })
    // }

    // if(!shiftId){
    //     return res.status(400).json({
    //         success:false,
    //         message:"shiftedId not found"
    //     })
    // }


    //  await Holiday.findOne({companyId},{$push:{shift}},{new:true})

    const updatedShift = await Shift.findOneAndUpdate(
      { companyId },
      { $pull: { shifts: { _id: shiftId } } },
      { new: true }
    );

    if (!updatedShift) {
      return res.status(404).json({
        success: false,
        message: "Shift not found or already deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Shift deleted successfully",
      data: updatedShift,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: true,
      message: "Server error while deleting shifts",
    });
  }
};



module.exports.editShiftTime=async(req,res)=>{
    try{
        const companyId= req.user?.company_id;
        const shiftTimeId=req.params.shiftTimeId;

        if(!companyId || !shiftTimeId){
            return res.status(404).json({
                success:false,
                message:"Server error in id"
            })
        }

        const shifting = await Shift.findOne({companyId},{$set:{req_body}},{new:true})
        if(!shifting){
            return res.status(400).json({
                success:false,
                message:"return to data"
            })
        }

        const NewDoc = shifting.populate(name,Comment);

        return res.status(400).json({
            success:false,
            message:"real data has beeen send to the movement"
        })

      

        return res.status(401).json({
            success:false,
            message:"data not able to come it "
        })

        NewDoc.Shift.filter((Item,index)=>{Item.name,item.place,item.holiday})


    }
    catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"editSHifttime"
        })
    }
}

// {
//     "success": true,
//     "message": "successFully fetch",
//     "data": {
//         "_id": "686650374fb7313548e9d35c",
//         "companyId": "680a21d93cf3c3454660d486",
//         "__v": 2,
//         "createdAt": "2025-07-03T09:41:00.643Z",
//         "shifts": [
//             {
//                 "name": "Morning Shift",
//                 "punchIn": "10:00",
//                 "punchOut": "18:30",
//                 "breaks": [
//                     {
//                         "type": "Lunch",
//                         "start": "13:00",
//                         "end": "13:45",
//                         "remarks": "Lunch Break",
//                         "_id": "6866502ccd4c065475f6073b"
//                     },
//                     {
//                         "type": "Tea",
//                         "start": "16:00",
//                         "end": "16:15",
//                         "remarks": "Evening Tea",
//                         "_id": "6866502ccd4c065475f6073c"
//                     }
//                 ],
//                 "_id": "6866502ccd4c065475f6073a"
//             },
//             {
//                 "name": "Evening Shift",
//                 "punchIn": "17:00",
//                 "punchOut": "01:00",
//                 "breaks": [
//                     {
//                         "type": "Lunch",
//                         "start": "20:00",
//                         "end": "20:45",
//                         "remarks": "Evening Lunch",
//                         "_id": "6866503acd4c065475f60743"
//                     },
//                     {
//                         "type": "Tea",
//                         "start": "23:00",
//                         "end": "23:15",
//                         "remarks": "Late Tea",
//                         "_id": "6866503acd4c065475f60744"
//                     }
//                 ],
//                 "_id": "6866503acd4c065475f60742"
//             },
//             {
//                 "name": "Night Shift",
//                 "punchIn": "22:00",
//                 "punchOut": "06:30",
//                 "breaks": [
//                     {
//                         "type": "Lunch",
//                         "start": "01:00",
//                         "end": "01:45",
//                         "remarks": "Night Lunch",
//                         "_id": "68666f9ffb0a84de1fe70347"
//                     },
//                     {
//                         "type": "Tea",
//                         "start": "04:00",
//                         "end": "04:15",
//                         "remarks": "Early Morning Tea",
//                         "_id": "68666f9ffb0a84de1fe70348"
//                     }
//                 ],
//                 "_id": "68666f9ffb0a84de1fe70346"
//             }
//         ]
//     }
// }
