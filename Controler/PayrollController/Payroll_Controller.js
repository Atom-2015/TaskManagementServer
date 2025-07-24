const mongoose = require("mongoose");
const User = require("../../Modal/User");
const Payroll = require("../../Modal/Payroll");
const Attendance = require("../../Modal/Attendance");
const Holiday = require("../../Modal/Holiday");
const UserLeave = require("../../Modal/leavefolder/userleaves");
const moment = require("moment");

const getDatesInRange = (start, end) => {
  const dates = [];
  let current = moment(start);
  const last = moment(end);
  while (current <= last) {
    dates.push(current.format("YYYY-MM-DD"));
    current.add(1, "days");
  }
  return dates;
};

module.exports.HandleAutoPayroll = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(401).json({ message: "Company ID missing in token" });
    }

    const {
      userId,
      month,
      year,
      salary: overrideSalary,
      incentives = [], // <-- now array
    } = req.body;
    console.log("Request body:", req.body);

    if (!userId || !month || !year) {
      return res
        .status(400)
        .json({ message: "Missing required fields: userId, month, year" });
    }

    // Validate incentives array
    if (!Array.isArray(incentives)) {
      return res.status(400).json({
        message:
          "Incentives should be an array of objects with 'label' and 'amount'",
      });
    }

    for (let i = 0; i < incentives.length; i++) {
      const { label, amount } = incentives[i];
      if (typeof label !== "string" || typeof amount !== "number") {
        return res
          .status(400)
          .json({ message: `Invalid incentive at index ${i}` });
      }
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.Company.toString() !== companyId.toString()) {
      return res
        .status(403)
        .json({ message: "User does not belong to this company" });
    }

    const salary = overrideSalary || user.salary;
    if (!salary) {
      return res.status(400).json({
        message: "Salary not found for user. Please provide salary in request.",
      });
    }

    const startOfMonth = moment(
      `${year}-${String(month).padStart(2, "0")}-01`
    ).startOf("month");
    const endOfMonth = moment(startOfMonth).endOf("month");
    const allDates = getDatesInRange(startOfMonth, endOfMonth);

    const holidayDoc = await Holiday.findOne({ companyId, year });
    let holidaysDates = new Set();

    if (holidayDoc?.weeklyOff?.length) {
      allDates.forEach((date) => {
        const weekDay = moment(date).format("dddd");
        if (holidayDoc.weeklyOff.includes(weekDay)) {
          holidaysDates.add(date);
        }
      });
    }

    holidayDoc?.holidays?.forEach((h) =>
      holidaysDates.add(moment(h).format("YYYY-MM-DD"))
    );

    holidayDoc?.overrides?.forEach((override) => {
      const oDate = moment(override.date).format("YYYY-MM-DD");
      if (override.type === "WOKRING") holidaysDates.delete(oDate);
      else if (override.type === "HOLIDAY") holidaysDates.add(oDate);
    });

    const WorkingDays = allDates.filter((date) => !holidaysDates.has(date));

    const attendances = await Attendance.find({
      userId,
      date: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
    });

    const presentDates = new Set(
      attendances.map((a) => moment(a.date).format("YYYY-MM-DD"))
    );

    const leaveDoc = await UserLeave.findOne({ userId, companyId, year });

    let paidLeaves = 0;
    let unpaidLeaves = 0;
    let halfDayUnapprovedCount = 0;

    if (leaveDoc) {
      for (const leave of leaveDoc.leavesTaken) {
        const leaveDates = getDatesInRange(leave.fromDate, leave.toDate);
        for (const date of leaveDates) {
          if (!WorkingDays.includes(date)) continue;
          if (presentDates.has(date)) continue;

          const isApproved = leave.status === "Approved";

          if (leave.type === "HALF") {
            if (isApproved) paidLeaves += 0.5;
            else halfDayUnapprovedCount += 0.5;
          } else if (!isApproved || leave.type === "UNPAID") {
            unpaidLeaves++;
          } else if (leave.type === "CASUAL" || leave.type === "SICK") {
            paidLeaves++;
          }
        }
      }
    }

    let effectivePresent = 0;
    WorkingDays.forEach((date) => {
      if (presentDates.has(date)) effectivePresent++;
    });

    const totalWorkingDays = WorkingDays.length;
    if (totalWorkingDays === 0) {
      return res.status(400).json({
        success: false,
        message: "No working days in this month — cannot compute payroll.",
      });
    }

    const absentDays =
      totalWorkingDays -
      effectivePresent -
      paidLeaves -
      unpaidLeaves -
      halfDayUnapprovedCount;

    const salaryPerDay = salary / totalWorkingDays;
    const totalDeductions =
      (unpaidLeaves + absentDays + halfDayUnapprovedCount) * salaryPerDay;

    const totalIncentive = incentives.reduce((sum, inc) => sum + inc.amount, 0);
    const netPay = salary - totalDeductions + totalIncentive;

    const existingPayroll = await Payroll.findOne({
      userId,
      companyId,
      month,
      year,
    });

    let result;
    if (existingPayroll) {
      existingPayroll.earnings = {
        salary,
        incentives,
      };
      existingPayroll.deductions = {
        absentDays,
        unpaidLeaves,
        totalDeductions,
      };
      existingPayroll.netPay = netPay;
      existingPayroll.generatedAt = new Date();
      await existingPayroll.save();
      result = existingPayroll;
    } else {
      result = await Payroll.create({
        userId,
        companyId,
        month,
        year,
        earnings: {
          salary,
          incentives,
        },
        deductions: {
          absentDays,
          unpaidLeaves,
          totalDeductions,
        },
        netPay,
        status: "Not Paid",
        generatedAt: new Date(),
      });
    }

    return res.status(201).json({
      success: true,
      message: existingPayroll
        ? "Payroll updated successfully"
        : "Payroll created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Payroll Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating/updating payroll",
    });
  }
};

module.exports.getMonthlyPayrollSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const companyId = req.user?.company_id;

    if (!companyId) {
      return res
        .status(401)
        .json({ success: false, message: "CompanyId missing in token" });
    }

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required to fetch payroll summary",
      });
    }

    const payrolls = await Payroll.find({
      companyId,
      month: parseInt(month),
      year: parseInt(year),
    }).populate("userId", "name email");

    const summary = payrolls.map((payroll) => ({
      userId: payroll.userId._id,
      name: payroll.userId.name,
      email: payroll.userId.email,
      earnings: {
        salary: payroll.earnings.salary || 0,
        incentives: payroll.earnings.incentives || [],
      },
      deductions: {
        totalDeductions: payroll.deductions.totalDeductions || 0,
        absentDays: payroll.deductions.absentDays || 0,
        unpaidLeaves: payroll.deductions.unpaidLeaves || 0,
      },
      netPay: payroll.netPay,
      status: payroll.status,
      generatedAt: payroll.generatedAt,
    }));
    return res.status(200).json({
      success: true,
      data: summary,
      message: "Payroll summary fetched successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching payroll summary",
    });
  }
};

module.exports.GetMonthlyPayrollPerUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const companyId = req.user?.company_id;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "CompanyId missing in taken",
      });
    }

    const user = await User.findById(userId);

    if (!user || user.Company.toString() !== companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: "User does not belong to this company",
      });
    }

    const payrolls = await Payroll.findOne({ userId, companyId }).sort({
      year: -1,
      month: -1,
    });

    return res.status(200).json({
      success: true,
      message: "User payroll fetched Successfully",
      data: payrolls,
    });
  } catch (error) {
    console.error("Error in GetMonthlyPayrollPerUser:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching user payroll",
    });
  }
};

module.exports.GetPayrollReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const companyId = req.user?.company_id;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "CompanyId missing in token",
      });
    }

    const payrolls = await Payroll.find({
      companyId,
      month: parseInt(month),
      year: parseInt(year),
    });

    const report = payrolls.reduce(
      (acc, p) => {
        acc.totalSalary += p.earnings.salary || 0;
        acc.totalIncentives += Array.isArray(p.earnings.incentives)
          ? p.earnings.incentives.reduce((sum, i) => sum + i.amount, 0)
          : 0;
        acc.totalDeductions += p.deductions.totalDeductions || 0;
        acc.totalNetPay += p.netPay || 0;
        return acc;
      },
      {
        totalSalary: 0,
        totalIncentives: 0,
        totalDeductions: 0,
        totalNetPay: 0,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Payroll report fetched successfully",
      data: report,
    });
  } catch (error) {
    console.error("Error in GetPayrollReport:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching payroll report",
    });
  }
};

module.exports.GetUserAnnualSalarySummary = async (req, res) => {
  try {
    const { userId, year } = req.query;
    if (!userId || !year) {
      return res.status(400).json({
        success: false,
        message: "UserId and year are required to fetch annual salary summary",
      });
    }

    const payrolls = await Payroll.find({ userId, year: parseInt(year) });
  } catch (error) {
    console.log("Error in GetUserAnnualSalarySummary:", error);
    return res.status(500).json({
      success: false,
      message: "Seerve error while fetching annual salary summary",
    });
  }
};

module.exports.GetUserAnnualSalarySummary = async (req, res) => {
  try {
    const { userId, year } = req.query;
    if (!userId || !year) {
      return res.status(400).json({
        success: false,
        message: "UserId and year are required to fetch annual salary summary",
      });
    }

    const payrolls = await Payroll.find({ userId, year: parseInt(year) });

    const summary = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      salary: 0,
      incentives: 0,
      deductions: 0,
      netPay: 0,
    }));

    payrolls.forEach((payroll) => {
      const monthIndex = payroll.month - 1;
      summary[monthIndex].salary = payroll.earnings.salary || 0;
      summary[monthIndex].incentives = Array.isArray(
        payroll.earnings.incentives
      )
        ? payroll.earnings.incentives.reduce((sum, i) => sum + i.amount, 0)
        : 0;
      summary[monthIndex].deductions = payroll.deductions.totalDeductions || 0;
      summary[monthIndex].netPay = payroll.netPay || 0;
    });

    return res.status(200).json({
      success: true,
      message: "Annual salary summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    console.log("Error in GetUserAnnualSalarySummary:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching annual salary summary",
    });
  }
};

module.exports.UpdatePayrollStatus = async (req, res) => {
  try {
    const { payrollId } = req.params;
    const { salary, incentives } = req.body;
    const companyId = req.user?.company_id;

    if (!companyId) {
      return res
        .status(401)
        .json({ success: false, message: "CompanyId missing in token" });
    }

    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res
        .status(404)
        .json({ success: false, message: "Payroll not found" });
    }

    if (String(payroll.companyId) !== String(companyId)) {
      return res.status(403).json({
        success: false,
        message: "Payroll does not belong to this company",
      });
    }

    if (salary !== undefined) {
      payroll.earnings.salary = salary;
    }

    if (Array.isArray(incentives)) {
      incentives.forEach(({ _id, label, amount }) => {
        const existing = payroll.earnings.incentives.find(
          (i) => String(i._id) === String(_id)
        );
        if (existing) {
          existing.label = label;
          existing.amount = amount;
        } else {
          payroll.earnings.incentives.push({ label, amount });
        }
      });
    }

    const baseSalary = payroll.earnings.salary || 0;
    const totalIncentives = payroll.earnings.incentives.reduce(
      (sum, inc) => sum + (inc.amount || 0),
      0
    );
    const totalDeductions = payroll.deductions?.totalDeductions || 0;

    payroll.netPay = baseSalary + totalIncentives - totalDeductions;

    await payroll.save();

    return res.status(200).json({
      success: true,
      message: "Payroll status updated successfully",
      data: payroll,
    });
  } catch (error) {
    console.error("UpdatePayrollStatus Error:", error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: "Server error while updating payroll status",
    });
  }
};

module.exports.DeletePayrollDeleteIncentive = async (req, res) => {
  try {
    const { incentiveId } = req.params;

    const companyId = req.user?.company_id;

    const { userId } = req.body;

    console.log("CompanyId:", companyId);
    console.log("UserId:", userId);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "user id is not found",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(incentiveId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid incentive ID",
      });
    }

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "CompanyId missuing in token",
      });
    }

    const payroll = await Payroll.findOne({
      companyId,
      userId,
      "earnings.incentives._id": incentiveId,
    });
    console.log("ye hai poayroll", payroll);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "payroll not found",
      });
    }

    payroll.earnings.incentives = payroll.earnings.incentives.filter(
      (inc) => String(inc._id) !== String(incentiveId)
    );

    const baseSalary = payroll.earnings.salary || 0;
    const totalIncentives = payroll.earnings.incentives.reduce(
      (sum, inc) => sum + (inc.amount || 0),
      0
    );

    const totalDeductions = payroll.deductions.totalDeductions || 0;

    payroll.netPay = baseSalary + totalIncentives - totalDeductions;

    await payroll.save();

    return res.status(200).json({
      success: true,
      message: `Incentive deleted`,
      data: payroll,
    });
  } catch (error) {
    console.log("deleteing encentiver error", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting payroll incentive",
    });
  }
};

module.exports.HandleDeletePayroll = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { userId, month, year } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "company id not found",
      });
    }

    if (!userId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "userId month year not found here",
      });
    }

    const payroll = await Payroll.findByIdAndDelete({
      companyId,
      userId,
      month,
      year,
    });

    if (!payroll) {
      return res.status(400).json({
        success: false,
        message: "payroll not found",
      });
    }

    return res.status(200).json({
      success: false,
      message: "payroll deleted successfully",
      data: payroll,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "error in Delete Payroll",
    });
  }
};

module.exports.HandleLockedPayroll = async (req, res) => {
  try {
    const { payrollId } = req.params;
    const { locked } = req.body;
    const companyId = req.user?.company_id;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "company ka id missing",
      });
    }

    if (typeof locked !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Locked value must be a boolean (true or false)",
      });
    }

    const payroll = await Payroll.findById(payrollId);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "payroll not found",
      });
    }

    if (payroll.companyId.toString() !== companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: "payroll doesnot belong to this company",
      });
    }

    payroll.locked = locked;
    await payroll.save();

    return res.status(200).json({
      success: true,
      message: `Payroll has been ${
        locked ? "locked" : "unlocked"
      } successfully`,
      data: payroll,
    });
  } catch (error) {
    console.log("error in handleLocked", error);
    return res.status(500).json({
      success: false,
      message: "server error in locked",
    });
  }
};

module.exports.HandlePayrollLockedAll = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    const { month, year, locked } = req.body;
    

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "company is not found",
      });
    }

    if (typeof locked !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "this is not locked types",
      });
    }

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required",
      });
    }

    const updated = await Payroll.updateMany(
      { companyId, month, year },
      { $set: { locked } }
    );

    return res.status(200).json({
      success: false,
      message: `All payrolls for ${month}/${year} have been ${
        locked ? "locked" : "unlocked"
      }.`,
      matchedCount: updated.matchedCount,
      modifiedCount: updated.modifiedCount,
    });
  } catch (error) {
    console.log("Error in HAndle Payroll locked ", error);
    return res.status(500).json({
      success: false,
      message: "Server error while bulk locking payrolls",
    });
  }
};


module.exports.HandleCompanySalaryWithChange = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    const { year } = req.query;

    if (!companyId || !year) {
      return res.status(400).json({ success: false, message: "companyId and year are required" });
    }

    const salaryData = await Payroll.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          year: parseInt(year)
        }
      },
      {
        $group: {
          _id: "$month",
          totalNetPay: { $sum: "$netPay" }
        }
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          totalNetPay: 1
        }
      }
    ]);

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Map into full 12-month format
    let monthlySalary = months.map((name, index) => {
      const found = salaryData.find((m) => m.month === index + 1);
      return {
        month: name,
        totalNetPay: found ? found.totalNetPay : 0
      };
    });

    // Calculate % change
    // Calculate % change
for (let i = 1; i < monthlySalary.length; i++) {
  const prev = monthlySalary[i - 1].totalNetPay;
  const curr = monthlySalary[i].totalNetPay;
  monthlySalary[i].change = prev > 0 ? Number((((curr - prev) / prev) * 100).toFixed(2)) : 0;
}
monthlySalary[0].change = null;


    return res.status(200).json({
      success: true,
      year,
      monthlySalary
    });
  } catch (err) {
    console.error("Error in GetCompanyMonthlySalaryWithChange:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


module.exports.HandleMyMonthlySalary = async (req, res) => {
  try {
    const userId = req.user?.userid;
  
    const { month, year } = req.query;

    if (!userId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required"
      });
    }

    const payroll = await Payroll.findOne({
      userId,
      month: parseInt(month),
      year: parseInt(year)
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "No payroll found for given month and year"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        month: parseInt(month),
        year: parseInt(year),
        payroll
      }
    });

  } catch (error) {
    console.error("Error in HandleMyMonthlySalary:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


module.exports.HandlePerUserWholeSalary = async (req, res) => {
  try {
    const userId = req.user?.userid;
    const { year } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing from token"
      });
    }

    const payroll = await Payroll.find({ userId, year: parseInt(year) });

    if (!payroll || payroll.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "User payroll fetched successfully",
      data: payroll
    });
  } catch (error) {
    console.log("Error in HandlePerUserWholeSalary:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in fetching payroll by user ID"
    });
  }
};


module.exports.HandleWholeSalary=async(req,res)=>{
  try{
    const userId=req.user?.userid;
    

  }
  catch(error){
    console.log("okaythdfjsd",error)
  }
}