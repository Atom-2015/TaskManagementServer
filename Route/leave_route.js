const express = require("express");
const router = express.Router();
const leaveRoutes = require("../Controler/Leave_Controller/LeaveController");
const isAuthenticated = require("../middleware/isAuthMiddleware");
const wrappedDocUpload = require("../middleware/UserPDFImage");

// leave balance keliye hai user hai
router.get("/balanceleave",isAuthenticated,leaveRoutes.getUserLeaveBalance);


//ye total leave nby the user wali api call ke;liyer samjhe babu
router.get("/totalleave",leaveRoutes.getUserLeaveSummary);

// ye pura leave api  with details
router.get("/allleavedata",isAuthenticated,leaveRoutes.getAllUserLeaveByCompany);

// Static or specific routes first
router.get("/usergetleave",isAuthenticated,leaveRoutes.getUserLeave);



// Leave policy
router.post("/leave",isAuthenticated, leaveRoutes.HandleAddLeavePolicy);

//update yaha karna leavepolicy ko bujhe ki nahi
router.put("/updateleave", isAuthenticated, leaveRoutes.updateLeavePolicy);

// User leave
router.post("/user-leave",isAuthenticated,wrappedDocUpload, leaveRoutes.createOrUpdateUserLeave);


// Then dynamic routes
router.get("/LeavePolicy",isAuthenticated, leaveRoutes.HandleGetLeavePolicy);

  
//Only companies should be able to call this:
router.put('/update-status',isAuthenticated,leaveRoutes.updateLeaveStatusByCompany);

router.delete('/delete-policy', isAuthenticated, leaveRoutes.HandleDeleteLeavePolicy);

module.exports = router;
