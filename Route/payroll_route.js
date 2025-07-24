const express = require("express");
const router = express.Router();  

const PayrollController = require("../Controler/PayrollController/Payroll_Controller");
const isAuthenticated = require("../middleware/isAuthMiddleware");

router.post("/create", isAuthenticated, PayrollController.HandleAutoPayroll);

//router the post salary for userid
router.post("/Usersalary",isAuthenticated,PayrollController.HandlePerUserWholeSalary);

// 🔁 move these above the dynamic route
router.get("/getall", isAuthenticated, PayrollController.getMonthlyPayrollSummary);

//all details of payemnt history of user
router.get("/User",isAuthenticated,PayrollController.GetUserAnnualSalarySummary);

//ye monthlu wise all user ka data dega 
router.get("/Getreport", isAuthenticated, PayrollController.GetPayrollReport);

//salary represent in graph using it
router.get("/Allmonth",isAuthenticated,PayrollController.HandleCompanySalaryWithChange)

//salary by user get it
router.get("/getUser",isAuthenticated,PayrollController.HandleMyMonthlySalary)



//its locked all the payroll of the router
router.patch("/lockall",isAuthenticated,PayrollController.HandlePayrollLockedAll)

//payroll is lock route here
router.patch("/lock/:payrollId",isAuthenticated,PayrollController.HandleLockedPayroll);



//incentive delete api here should it
router.delete("/:incentiveId", isAuthenticated, PayrollController.DeletePayrollDeleteIncentive);

//payroll delete api
router.delete("/Delpayroll",isAuthenticated,PayrollController.HandleDeletePayroll);




//router updated payrollId and incentiveId and status
router.patch("/:payrollId",isAuthenticated, PayrollController.UpdatePayrollStatus);

// 👇 this MUST be last
router.get("/:userId", isAuthenticated, PayrollController.GetMonthlyPayrollPerUser);

module.exports = router;
