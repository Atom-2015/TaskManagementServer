const express = require('express');
const router=express.Router();


const shiftController=require("../Controler/Shift_Controller/Shift_Controller");
const isAuthenticated = require('../middleware/isAuthMiddleware');

router.post("/create",isAuthenticated,shiftController.createShift);

router.get("/getShift",isAuthenticated,shiftController.getShift);

router.put("/:shiftId",isAuthenticated,shiftController.editShift);

router.delete("/:shiftId",isAuthenticated,shiftController.deleteShift);

module.exports=router;
