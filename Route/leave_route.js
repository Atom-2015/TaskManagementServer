const express = require("express");
const router = express.Router();

const leaveRoutes = require("../Controler/Leave_Controller/LeaveController");

// leave balance keliye hai user hai
router.get("/balanceleave",leaveRoutes.getUserLeaveBalance);


//ye total leave nby the user wali api call ke;liyer samjhe babu
router.get("/totalleave",leaveRoutes.getUserLeaveSummary);

// ye pura leave api  with details
router.get("/allleavedata",leaveRoutes.getAllUserLeaveByCompany);

// Static or specific routes first
router.get("/usergetleave", leaveRoutes.getUserLeave);



// Leave policy
router.post("/leave", leaveRoutes.HandleAddLeavePolicy);

//update yaha karna leavepolicy ko bujhe ki nahi
router.put("/updateleave", leaveRoutes.updateLeavePolicy);

// User leave
router.post("/user-leave", leaveRoutes.createOrUpdateUserLeave);

// Then dynamic routes
router.get("/:companyId", leaveRoutes.HandleGetLeavePolicy);



module.exports = router;
