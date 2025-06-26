const express = require("express");
const router = express.Router();
const isAuthenticated = require('../middleware/isAuthMiddleware');

const holidayController=require("../Controler/Holiday_Controller/Holiday_Controller");

router.post("/createHoliday",isAuthenticated,holidayController.HandleCreateHoliday);


router.get("/getHoliday",isAuthenticated,holidayController.HandleGetHolidayList);

router.put("/editHoliday",isAuthenticated,holidayController.HandlePutHolidayByCompany);


//router holiday editing
router.put("/holiday/:holidayId",isAuthenticated,holidayController.HandleSingleHoliday);

//router holiday deleted single
router.delete("/holiday/:holidayId",isAuthenticated,holidayController.HandleDelSingleHoliday);

//router edit overrieds
router.put("/:overridesId",isAuthenticated,holidayController.HandleSingleOverridesHoliday);

//router del overrided okay
router.delete("/del/:overridesId",isAuthenticated,holidayController.HandleDelSingleOverirides);

//router add overrides 
router.post("/addOverrides",isAuthenticated,holidayController.HandleAddOverridesHoliday);

router.get("/overrides",isAuthenticated,holidayController.HandleGetOverrides);

module.exports=router;