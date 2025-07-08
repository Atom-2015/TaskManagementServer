const express = require("express");
const router = express.Router();


const { HandleCreateAttendance,GetCompanyAbsentUsers, GetAttendanceStatistics,GetCompanyLateCount,GetMonthlyCompanyAttendance,GetFullCompanyUserAttendance } = require("../Controler/AttendenceController/Attendence_Controller");
//const {HandleCheckOutAttendence}=require("../Controler/AttendenceController/Attendence_Controller")
const { HandleCheckOutAttendance } = require("../Controler/AttendenceController/Attendence_Controller");
const {GetMonthlyAttendanceSummary} =require("../Controler/AttendenceController/Attendence_Controller");
//const {GetAttendanceStatistics} =require("../Controler/AttendenceController/Attendence_Controller")
const {GetCompanyAttendanceSummary} =require("../Controler/AttendenceController/Attendence_Controller");



const isAuthenticated = require("../middleware/isAuthMiddleware");

//by user
router.post("/create", isAuthenticated, HandleCreateAttendance);
router.post("/checkout",isAuthenticated,HandleCheckOutAttendance);
router.get("/getSummary",isAuthenticated,GetMonthlyAttendanceSummary);
router.get("/getStatic",isAuthenticated,GetAttendanceStatistics);




//by Company
router.get("/getEmployee",isAuthenticated,GetCompanyAttendanceSummary);
router.get("/getPresentCompany",isAuthenticated,GetMonthlyCompanyAttendance)
router.get("/getList",isAuthenticated,GetFullCompanyUserAttendance);
router.get("/getLate",isAuthenticated,GetCompanyLateCount);
router.get("/getAbsent",isAuthenticated,GetCompanyAbsentUsers);

module.exports = router;
