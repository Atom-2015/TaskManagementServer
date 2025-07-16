const express = require("express");
const router = express.Router();


const { HandleCreateAttendance,HandleGetMonthlyAttendance,GetCompanyAttendanceWithHolidays,GetCompanyAbsentUsers, GetAttendanceStatistics,GetCompanyLateCount,GetMonthlyCompanyAttendance,GetFullCompanyUserAttendance, HandleGetTodayAttendance } = require("../Controler/AttendenceController/Attendence_Controller");
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
router.get("/today",isAuthenticated,HandleGetTodayAttendance);

router.get("/getMonthly",isAuthenticated,HandleGetMonthlyAttendance)



//
//
//by Company
router.get("/getEmployee",isAuthenticated,GetCompanyAttendanceSummary);
router.get("/getPresentCompany",isAuthenticated,GetMonthlyCompanyAttendance)
router.get("/getList",isAuthenticated,GetFullCompanyUserAttendance);
router.get("/getAllAttend",isAuthenticated,GetCompanyAttendanceWithHolidays)
// router.get("/getLate",isAuthenticated,GetCompanyLateCount);
// router.get("/getAbsent",isAuthenticated,GetCompanyAbsentUsers);


module.exports = router;
