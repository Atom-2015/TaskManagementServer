const Attendance = require("../../Modal/attendence");
const User = require("../../Modal/User");
const Holiday = require("../../Modal/Holiday");
const UserLeave = require("../../Modal/Leave");
const Shift = require("../../Modal/Shift");
const moment = require("moment");

module.exports.HandleCreateAttendance = async (req, res) => {
  try {
    const { check_in_time } = req.body;
    const userId = req.user.userid;

    const currentDate = moment().startOf("day").toDate();
    const todayStr = moment().format("YYYY-MM-DD");
    const dayOfWeek = moment().format("dddd");

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const shiftObjectId = user.shiftId;
    let selectedShift = null;

    if (shiftObjectId) {
      const parentShift = await Shift.findOne({ "shifts._id": shiftObjectId });
      if (parentShift) {
        selectedShift = parentShift.shifts.find(
          (s) => s._id.toString() === shiftObjectId.toString()
        );
      }
    }

    const holidayData = await Holiday.findOne({ companyId: user.Company });

    if (holidayData) {
      const overrideToday = holidayData.overrides?.find(
        (ov) => moment(ov.date).format("YYYY-MM-DD") === todayStr
      );

      if (overrideToday && !overrideToday.isWorkingDay) {
        return res.status(400).json({
          success: false,
          message:
            "Today is a holiday due to override: " + overrideToday.reason,
        });
      }

      const isWeeklyOff = holidayData.weeklyOff?.includes(dayOfWeek);
      const isHoliday = holidayData.holidays?.some((h) => h.date === todayStr);

      if (!overrideToday && (isWeeklyOff || isHoliday)) {
        return res.status(400).json({
          success: false,
          message: "Today is a weekly off or holiday",
        });
      }
    }

    const alreadyMarked = await Attendance.findOne({
      userId,
      date: currentDate,
    });
    if (alreadyMarked) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for today",
      });
    }

    const leave = await UserLeave.findOne({
      userId,
      "leavesTaken.status": "Approved",
      "leavesTaken.fromDate": { $lte: currentDate },
      "leavesTaken.toDate": { $gte: currentDate },
    });

    const leaveType = leave?.leavesTaken.find((l) => {
      return (
        moment(l.fromDate).startOf("day").isSameOrBefore(currentDate) &&
        moment(l.toDate).startOf("day").isSameOrAfter(currentDate)
      );
    });

    if (leaveType && ["CASUAL", "SICK", "UNPAID"].includes(leaveType.type)) {
      const newAttendance = await Attendance.create({
        userId,
        shiftId: shiftObjectId || null,
        date: currentDate,
        check_in_time,
        status: "OnLeave",
        isLate: false,
        lateByMinutes: 0,
        remarks: `${leaveType.type} Leave`,
      });

      return res.status(200).json({
        success: true,
        message: "Attendance marked as OnLeave.",
        data: newAttendance,
      });
    }

    let isHalfDayLeave = false;
    let halfDayLeaveRemark = "";
    if (leaveType && leaveType.type === "HALF" && selectedShift) {
      const lunchBreak = selectedShift.breaks.find((b) => b.type === "Lunch");
      if (lunchBreak) {
        const lunchEnd = moment(lunchBreak.end, "HH:mm");
        const checkInTime = moment(check_in_time, "HH:mm");

        if (checkInTime.isAfter(lunchEnd)) {
          isHalfDayLeave = true;
          halfDayLeaveRemark = "Present after half-day leave";
        }
      }
    }

    let isLate = false;
    let lateByMinutes = 0;
    let remarks = "No shift assigned";

    if (selectedShift) {
      const punchIn = moment(selectedShift.punchIn, "HH:mm");
      const checkInTime = moment(check_in_time, "HH:mm");

      lateByMinutes = checkInTime.diff(punchIn, "minutes");

      // Apply grace period of 15 minutes
      isLate = lateByMinutes > 15;
      lateByMinutes = isLate ? lateByMinutes : 0;

      remarks = isLate ? `Late by ${lateByMinutes} mins` : "On time";
    }

    const newAttendance = await Attendance.create({
      userId,
      shiftId: shiftObjectId || null,
      date: currentDate,
      check_in_time,
      status: isHalfDayLeave
        ? "HalfDay"
        : selectedShift
        ? isLate
          ? "Late"
          : "Present"
        : "Present",
      isLate: isHalfDayLeave ? false : isLate,
      lateByMinutes: isHalfDayLeave ? 0 : lateByMinutes,
      remarks: isHalfDayLeave ? halfDayLeaveRemark : remarks,
    });

    return res.status(200).json({
      success: true,
      message: isHalfDayLeave
        ? "Attendance marked as HalfDay (half-day leave)"
        : "Attendance marked successfully",
      data: newAttendance,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.HandleCheckOutAttendance = async (req, res) => {
  try {
    const { check_out_time } = req.body;
    const userId = req.user?.userid;
    const currentDate = moment().startOf("day").toDate();

    const attendance = await Attendance.findOne({ userId, date: currentDate });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "No attendance record found for today. Please check in first.",
      });
    }

    if (attendance.check_out_time) {
      return res.status(400).json({
        success: false,
        message: "Check-out already marked for today.",
      });
    }

    const shift = await Shift.findOne({ "shifts._id": attendance.shiftId });

    if (!shift) {
      return res
        .status(404)
        .json({ success: false, message: "Shift not found" });
    }

    const subShift = shift.shifts.find(
      (s) => s._id.toString() === attendance.shiftId.toString()
    );

    if (!subShift) {
      return res
        .status(404)
        .json({ success: false, message: "Sub-shift not found" });
    }

    const checkIn = moment(attendance.check_in_time, "HH:mm");
    const checkOut = moment(check_out_time, "HH:mm");
    const punchOut = moment(subShift.punchOut, "HH:mm");

    const durationMinutes = checkOut.diff(checkIn, "minutes");
    const workingHours = `${Math.floor(durationMinutes / 60)}h ${
      durationMinutes % 60
    }m`;

    let overtimeMinutes = checkOut.diff(punchOut, "minutes");
    overtimeMinutes = overtimeMinutes > 0 ? overtimeMinutes : 0;
    const overtime = `${Math.floor(overtimeMinutes / 60)}h ${
      overtimeMinutes % 60
    }m`;

    const punchIn = moment(subShift.punchIn, "HH:mm");
    const shiftDuration = moment.duration(punchOut.diff(punchIn)).asMinutes();
    const requiredDurationMinutes =
      shiftDuration + (attendance.lateByMinutes || 0);
    const requiredTime = `${Math.floor(requiredDurationMinutes / 60)}h ${
      requiredDurationMinutes % 60
    }m`;
    const isRequiredTimeCompleted = durationMinutes >= requiredDurationMinutes;

    attendance.check_out_time = check_out_time;
    attendance.workingHours = workingHours;
    attendance.overtime = overtime;
    attendance.requiredTime = requiredTime;
    attendance.isRequiredTimeCompleted = isRequiredTimeCompleted;

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Check-out marked successfully.",
      data: attendance,
    });
  } catch (error) {
    console.error("Check-out error:", error);
    return res.status(500).json({
      success: false,
      message: "Error in check-out",
      error: error.message,
    });
  }
};

module.exports.GetMonthlyAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user.userid;
    const { month, year } = req.query;

    const startDate = moment(`${year}-${month}-01`, "YYYY-MM-DD").startOf(
      "month"
    );
    const endDate = moment(startDate).endOf("month");

    const allDatesInMonth = [];
    const current = startDate.clone();
    while (current.isSameOrBefore(endDate)) {
      allDatesInMonth.push(current.clone());
      current.add(1, "day");
    }

    const attendanceRecords = await Attendance.find({
      userId,
      date: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      },
    });

    const user = await User.findById(userId);
    const holidayData = await Holiday.findOne({ companyId: user.Company });

    const today = moment().startOf("day");

    const summary = allDatesInMonth.map((day) => {
      const dateStr = day.format("YYYY-MM-DD");

      const record = attendanceRecords.find(
        (att) => moment(att.date).format("YYYY-MM-DD") === dateStr
      );

      const isWeekend =
        holidayData?.weeklyOff?.includes(day.format("dddd")) ?? false;
      const isHoliday =
        holidayData?.holidays?.some((h) => h.date === dateStr) ?? false;

      const overrideToday = holidayData?.overrides?.find(
        (o) => moment(o.date).format("YYYY-MM-DD") === dateStr
      );
      const isOverrideHoliday = overrideToday && !overrideToday.isWorkingDay;

      if (day.isSame(today)) {
        return {
          date: dateStr,
          status: record ? record.status : "Pending",
          ...(record && {
            check_in_time: record.check_in_time,
            check_out_time: record.check_out_time,
          }),
        };
      }

      if (day.isAfter(today)) {
        return {
          date: dateStr,
          status: "Upcoming",
        };
      }

      if (record) {
        return {
          date: dateStr,
          status: record.status,
          check_in_time: record.check_in_time,
          check_out_time: record.check_out_time,
        };
      } else if (isOverrideHoliday || isHoliday || isWeekend) {
        return {
          date: dateStr,
          status: "Holiday",
        };
      } else {
        return {
          date: dateStr,
          status: "Absent",
        };
      }
    });

    // Count summary (e.g. Present, Absent, Holiday)
    const countSummary = summary.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      month: `${month}-${year}`,
      summary,
      counts: countSummary,
    });
  } catch (error) {
    console.error("Error in attendance summary:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



module.exports.GetAttendanceStatistics = async (req, res) => {
  try {
    const userId = req.user.userid;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const today = moment().startOf("day");
    const weekStart = moment().startOf("isoWeek");
    const monthStart = moment().startOf("month");
    const monthEnd = moment().endOf("month");

    const records = await Attendance.find({
      userId,
      date: { $gte: monthStart.toDate(), $lte: monthEnd.toDate() },
    });

    let todayMinutes = 0,
      weekMinutes = 0,
      monthMinutes = 0,
      overtimeMinutes = 0,
      todayRequired = 0,
      weekRequired = 0,
      monthRequired = 0;

    records.forEach((rec) => {
      const day = moment(rec.date).startOf("day");
      const mins = rec.workingHours
        ? parseInt(rec.workingHours.split("h")[0]) * 60 + parseInt(rec.workingHours.split("h")[1])
        : 0;
      const required = rec.requiredTime
        ? parseInt(rec.requiredTime.split("h")[0]) * 60 + parseInt(rec.requiredTime.split("h")[1])
        : 0;

      if (day.isSame(today)) {
        todayMinutes += mins;
        todayRequired += required;
      }
      if (day.isSameOrAfter(weekStart)) {
        weekMinutes += mins;
        weekRequired += required;
      }
      monthMinutes += mins;
      monthRequired += required;

      const ot = rec.overtime
        ? parseInt(rec.overtime.split("h")[0]) * 60 + parseInt(rec.overtime.split("h")[1])
        : 0;
      overtimeMinutes += ot;
    });

    const format = (mins) => `${Math.floor(mins / 60)}.${(mins % 60).toString().padStart(2, '0')}`;

    return res.status(200).json({
      success: true,
      statistics: {
        today: `${format(todayMinutes)} / ${format(todayRequired)} hrs`,
        thisWeek: `${format(weekMinutes)} / ${format(weekRequired)} hrs`,
        thisMonth: `${format(monthMinutes)} / ${format(monthRequired)} hrs`,
        remaining: `${format(Math.max(monthRequired - monthMinutes, 0))} / ${format(monthRequired)} hrs`,
        overtime: `${format(overtimeMinutes)} / ${format(overtimeMinutes)} hrs`,
      },
    });
  } catch (error) {
    console.error("Error in GetAttendanceStatistics:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};







/////////////////////////////---BY Company---////////////////////////////




module.exports.GetCompanyAttendanceSummary = async (req, res) => {
  try {
    const companyId =  req.user?.company_id; // ✅ Company directly from token
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Company ID missing in token" });
    }

    const today = moment().startOf("day").toDate();

    // 🔹 Get all employee IDs in this company
    const employeeIds = await User.find({ Company: companyId }).distinct("_id");

    // 🔹 Get all attendance records for today
    const attendanceToday = await Attendance.find({
      userId: { $in: employeeIds },
      date: today,
    });

    // 🔹 Count logic
    let present = 0, late = 0, onLeave = 0;
    const presentStatuses = ["Present", "Late", "HalfDay"];

    attendanceToday.forEach((record) => {
      if (record.status === "Late") late++;
      if (presentStatuses.includes(record.status)) present++;
      if (record.status === "OnLeave") onLeave++;
    });

    const absent = employeeIds.length - attendanceToday.length;

    // ✅ Final response
    return res.status(200).json({
      success: true,
      date: moment(today).format("YYYY-MM-DD"),
      companyId,
      totalEmployees: employeeIds.length,
      present,
      late,
      absent,
      onLeave
    });
  } catch (error) {
    console.error("Error in GetCompanyAttendanceSummary:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}; 





module.exports.GetMonthlyCompanyAttendance = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { month, year } = req.query;

    if (!companyId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "companyId, month and year are required",
      });
    }

    const startDate = moment(`${year}-${month}-01`).startOf("month");
    const endDate = moment(startDate).endOf("month");

    // Step 1: Get employee IDs of the company
    const employeeIds = await User.find({ Company: companyId }).distinct("_id");

    // Step 2: Get all attendance records for the month
    const attendanceRecords = await Attendance.find({
      userId: { $in: employeeIds },
      date: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      },
    });

    // Step 3: Count per day how many were present
    const summary = {};

    attendanceRecords.forEach((record) => {
      const dateStr = moment(record.date).format("YYYY-MM-DD");
      const isPresent = ["Present", "Late", "HalfDay"].includes(record.status);

      if (isPresent) {
        if (!summary[dateStr]) summary[dateStr] = 0;
        summary[dateStr]++;
      }
    });

    // Step 4: Fill missing dates with 0
    const fullMonthData = [];
    const day = startDate.clone();
    while (day.isSameOrBefore(endDate)) {
      const dateStr = day.format("YYYY-MM-DD");
      fullMonthData.push({
        date: dateStr,
        presentCount: summary[dateStr] || 0,
      });
      day.add(1, "day");
    }

    return res.status(200).json({
      success: true,
      companyId,
      month: `${month}-${year}`,
      presentPerDay: fullMonthData,
    });
  } catch (error) {
    console.error("Error in GetMonthlyCompanyAttendance:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};



module.exports.GetFullCompanyUserAttendance = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { month, year } = req.query;

    if (!companyId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "companyId, month, and year are required",
      });
    }

    const startDate = moment(`${year}-${month}-01`).startOf("month");
    const endDate = moment(startDate).endOf("month");
    const today = moment();
    const isCurrentMonth = today.isSame(startDate, "month") && today.isSame(startDate, "year");
    const lastCountableDate = isCurrentMonth ? today : endDate;
    const totalDays = lastCountableDate.diff(startDate, "days") + 1;

    const users = await User.find({ Company: companyId });
    const userMap = {};
    users.forEach(user => userMap[user._id.toString()] = user.name);

    const allUserIds = users.map(u => u._id);

    // ✅ Fetch attendance for all users at once
    const attendanceRecords = await Attendance.find({
      userId: { $in: allUserIds },
      date: {
        $gte: startDate.toDate(),
        $lte: lastCountableDate.toDate(),
      },
    });

    // ✅ Group records by userId
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      const uid = record.userId.toString();
      if (!attendanceMap[uid]) attendanceMap[uid] = [];
      attendanceMap[uid].push(record);
    });

    const result = [];

    for (const user of users) {
      const userIdStr = user._id.toString();
      const records = attendanceMap[userIdStr] || [];

      let present = 0, late = 0, onLeave = 0;

      records.forEach((record) => {
        if (["Present", "HalfDay"].includes(record.status)) present++;
        if (record.status === "Late") {
          present++;
          late++;
        }
        if (record.status === "OnLeave") onLeave++;
      });

      const absent = totalDays - records.length;
      const attendancePercentage = totalDays > 0 ? ((present / totalDays) * 100).toFixed(2) : "0.00";

      result.push({
        userId: user._id,
        name: user.name,
        present,
        absent,
        late,
        onLeave,
        attendancePercentage: `${attendancePercentage}%`,
      });
    }

    return res.status(200).json({
      success: true,
      month: `${month}-${year}`,
      data: result,
    });
  } catch (error) {
    console.error("Error in GetFullCompanyUserAttendance:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}


module.exports.GetCompanyLateCount = async (req, res) => {
  try{
     const companyId = req.user?.company_id;
       const { date, from, to } = req.query;

       if(!companyId){
        return res.status(400).json({
          success:false,
          message:"Company Id missing"
        })
       }

          if (!date && (!from || !to)) {
      return res.status(400).json({
        success: false,
        message: "Please provide either 'date' or both 'from' and 'to'",
      });
    }

    const employeeIds= await User.find({Company:companyId}).distinct("_id")

    let dateFilter={};

    if(date){
      const targetDate = moment(date, "YYYY-MM-DD").startOf("day").toDate();
      dateFilter.date = { $eq: targetDate };
    }
    else{
       const fromDate = moment(from, "YYYY-MM-DD").startOf("day").toDate();
      const toDate = moment(to, "YYYY-MM-DD").endOf("day").toDate();
      dateFilter.date = { $gte: fromDate, $lte: toDate };
    }

    const lateCount = await Attendance.countDocuments({
      userId: { $in: employeeIds },
      status: "Late",
      ...dateFilter,
    }); 


     const totalEmployees = employeeIds.length;

    return res.status(200).json({
      success: true,
      companyId,
      date: date || `${from} to ${to}`,
      totalEmployees,
      lateCount,
      percentageLate: ((lateCount / totalEmployees) * 100).toFixed(2) + "%",
    });

  }
  catch(error){
    console.log(error)

      return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}



module.exports.GetCompanyAbsentUsers = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    const { date, from, to } = req.query;

    if (!companyId) {
      return res.status(400).json({ success: false, message: "Company ID missing" });
    }

    if (!date && (!from || !to)) {
      return res.status(400).json({
        success: false,
        message: "Provide either 'date' or both 'from' and 'to'",
      });
    }

    // 1️⃣ Get users
    const users = await User.find({ Company: companyId }).select("_id name email");
    const userIds = users.map((u) => u._id.toString());
    const userMap = {};
    users.forEach((u) => (userMap[u._id.toString()] = u));

    // 2️⃣ Prepare date list
    let dateList = [];

    if (date) {
      dateList = [moment(date, "YYYY-MM-DD").startOf("day")];
    } else {
      const start = moment(from, "YYYY-MM-DD").startOf("day");
      const end = moment(to, "YYYY-MM-DD").endOf("day");
      let current = start.clone();
      while (current.isSameOrBefore(end)) {
        dateList.push(current.clone());
        current.add(1, "day");
      }
    }

    // 3️⃣ Get ALL attendance in one go
    const attendances = await Attendance.find({
      userId: { $in: userIds },
      date: { $gte: dateList[0].toDate(), $lte: dateList[dateList.length - 1].toDate() },
    });

    // 4️⃣ Build map: { "userId|YYYY-MM-DD": true }
    const attendanceMap = {};
    attendances.forEach((att) => {
      const key = `${att.userId.toString()}|${moment(att.date).format("YYYY-MM-DD")}`;
      attendanceMap[key] = true;
    });

    // 5️⃣ Find absent entries
    const absents = [];

    for (const dateObj of dateList) {
      const dateStr = dateObj.format("YYYY-MM-DD");
      for (const userId of userIds) {
        const key = `${userId}|${dateStr}`;
        if (!attendanceMap[key]) {
          const user = userMap[userId];
          absents.push({
            date: dateStr,
            userId,
            name: user.name,
            email: user.email,
            status: "Absent",
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      count: absents.length,
      data: absents,
    });
  } catch (error) {
    console.error("Error in GetCompanyAbsentUsers:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};