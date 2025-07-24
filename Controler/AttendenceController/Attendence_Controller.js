const Attendance = require("../../Modal/Attendance");
const User = require("../../Modal/User");
const Holiday = require("../../Modal/Holiday");
const UserLeave = require("../../Modal/leavefolder/userleaves");
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

    let isHalfDayLeave = false;
    let halfDayLeaveRemark = "";
    if (leaveType && leaveType.type === "HALF" && selectedShift) {
      const lunchBreak = selectedShift.breaks.find((b) => b.type === "Lunch");
      if (lunchBreak) {
        const lunchEnd = moment(lunchBreak.end, "HH:mm");
        const checkInTime = moment(check_in_time, "HH:mm");

        if (checkInTime.isAfter(lunchEnd)) {
          isHalfDayLeave = true;
          halfDayLeaveRemark = "Present after half-day leave (override)";
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
      remarks: isHalfDayLeave
        ? halfDayLeaveRemark
        : leaveType && ["CASUAL", "SICK", "UNPAID"].includes(leaveType.type)
        ? `Override: Present on ${leaveType.type} Leave`
        : remarks,
    });

    return res.status(200).json({
      success: true,
      message: isHalfDayLeave
        ? "Attendance marked as HalfDay (half-day leave override)"
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

const getApprovedLeaveDays = (leaveRecords = []) => {
  const map = new Map();

  for (const leave of leaveRecords) {
    for (const entry of leave.leavesTaken) {
      if (entry.status !== "Approved") continue;

      const from = moment(entry.fromDate);
      const to = moment(entry.toDate);
      while (from.isSameOrBefore(to)) {
        const dateStr = from.format("YYYY-MM-DD");
        map.set(dateStr, entry.type); // "CASUAL", "HALF", etc.
        from.add(1, "day");
      }
    }
  }

  return map;
};

// 📅 Attendance Summary API

module.exports.GetMonthlyAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user.userid;
    const { month, year } = req.query;

    const startDate = moment(`${year}-${month}-01`, "YYYY-MM-DD").startOf(
      "month"
    );
    const endDate = moment(startDate).endOf("month");

    // All days in month
    const allDatesInMonth = [];
    const current = startDate.clone();
    while (current.isSameOrBefore(endDate)) {
      allDatesInMonth.push(current.clone());
      current.add(1, "day");
    }

    const attendanceRecords = await Attendance.find({
      userId,
      date: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    });

    const user = await User.findById(userId);
    const holidayData = await Holiday.findOne({ companyId: user.Company });

    // Get approved leaves in the month
    const userLeaves = await UserLeave.find({
      userId,
      "leavesTaken.status": "Approved",
      $or: [
        {
          "leavesTaken.fromDate": {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
          },
        },
        {
          "leavesTaken.toDate": {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
          },
        },
        {
          "leavesTaken.fromDate": { $lte: startDate.toDate() },
          "leavesTaken.toDate": { $gte: endDate.toDate() },
        },
      ],
    });

    // Create map of all leave days
    const leaveDaysMap = new Map();
    userLeaves.forEach((leaveDoc) => {
      leaveDoc.leavesTaken.forEach((leave) => {
        if (leave.status === "Approved") {
          const from = moment(leave.fromDate).startOf("day");
          const to = moment(leave.toDate).startOf("day");
          const temp = from.clone();

          while (temp.isSameOrBefore(to)) {
            const dateStr = temp.format("YYYY-MM-DD");
            leaveDaysMap.set(dateStr, leave.type); // e.g., CASUAL, HALF
            temp.add(1, "day");
          }
        }
      });
    });

    const today = moment().startOf("day");

    // Build the final summary
    const summary = allDatesInMonth.map((day) => {
      const dateStr = day.format("YYYY-MM-DD");
      const dayOfWeek = day.format("dddd");

      // ✅ 1. Attendance check first (overrides leave)
      const record = attendanceRecords.find(
        (att) => moment(att.date).format("YYYY-MM-DD") === dateStr
      );
      if (record) {
        if (leaveDaysMap.has(dateStr)) {
          console.log(`📌 Attendance overrides leave on ${dateStr}`);
        }
        return {
          date: dateStr,
          status: record.status,
          check_in_time: record.check_in_time,
          check_out_time: record.check_out_time,
        };
      }

      // ✅ 2. Leave check (only if no attendance)
      if (leaveDaysMap.has(dateStr)) {
        const leaveType = leaveDaysMap.get(dateStr);
        return {
          date: dateStr,
          status: leaveType === "HALF" ? "Half Day" : "Leave",
        };
      }

      // ✅ 3. Today
      if (day.isSame(today)) {
        return { date: dateStr, status: "Pending" };
      }

      // ✅ 4. Upcoming
      if (day.isAfter(today)) {
        return { date: dateStr, status: "Upcoming" };
      }

      // ✅ 5. Holiday/weekend checks
      const isWeekend = (holidayData?.weeklyOff || []).some(
        (dow) => dow.toLowerCase() === dayOfWeek.toLowerCase()
      );
      const isHoliday = (holidayData?.holidays || []).some(
        (h) => moment(h.date).format("YYYY-MM-DD") === dateStr
      );
      const overrideToday = (holidayData?.overrides || []).find(
        (o) => moment(o.date).format("YYYY-MM-DD") === dateStr
      );

      if (overrideToday) {
        return {
          date: dateStr,
          status: overrideToday.isWorkingDay ? "Absent" : "Holiday",
        };
      }

      if (isWeekend || isHoliday) {
        return { date: dateStr, status: "Holiday" };
      }

      // ✅ 6. Default fallback
      return { date: dateStr, status: "Absent" };
    });

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

module.exports.HandleGetTodayAttendance = async (req, res) => {
  try {
    const userId = req.user?.userid;

    const today = moment().startOf("day").toDate();

    const aajkaAttend = await Attendance.findOne({ userId, date: today });

    if (!aajkaAttend) {
      return res.status(404).json({
        success: false,
        message: "nahi aaj ka attendence",
      });
    }

    return res.status(200).json({
      success: true,
      message: "successfully fetch",
      data: aajkaAttend,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "server error today attendence",
    });
  }
};

module.exports.GetAttendanceStatistics = async (req, res) => {
  try {
    const userId = req.user.userid;
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const today = moment().startOf("day");
    const now = moment();
    const weekStart = moment().startOf("isoWeek");
    const monthStart = moment().startOf("month");
    const monthEnd = moment().endOf("month");

    const [holidays, leaves, records] = await Promise.all([
      Holiday.find({
        date: { $gte: monthStart.toDate(), $lte: monthEnd.toDate() },
      }),
      UserLeave.find({
        userId,
        date: { $gte: monthStart.toDate(), $lte: monthEnd.toDate() },
      }),
      Attendance.find({
        userId,
        date: { $gte: monthStart.toDate(), $lte: monthEnd.toDate() },
      }),
    ]);

    const holidayDates = holidays.map((h) =>
      moment(h.date).format("YYYY-MM-DD")
    );
    const leaveMap = new Map();
    leaves.forEach((leave) => {
      const dateStr = moment(leave.date).format("YYYY-MM-DD");
      leaveMap.set(dateStr, leave.leaveType || "full");
    });

    // Get the assigned shift
    let selectedShift = null;
    if (user.shiftId) {
      const shiftDoc = await Shift.findOne({ "shifts._id": user.shiftId });
      if (shiftDoc) {
        selectedShift = shiftDoc.shifts.find(
          (s) => s._id.toString() === user.shiftId.toString()
        );
      }
    }

    // Calculate shift duration (without excluding breaks, breaks are included)
    let shiftDuration = 0;
    if (selectedShift) {
      let punchIn = moment(selectedShift.punchIn, "HH:mm");
      let punchOut = moment(selectedShift.punchOut, "HH:mm");

      // If punchOut is before punchIn, it's an overnight shift
      if (punchOut.isBefore(punchIn)) {
        punchOut.add(1, "day");
      }

      shiftDuration = punchOut.diff(punchIn, "minutes");
    }

    let todayMinutes = 0,
      weekMinutes = 0,
      monthMinutes = 0,
      overtimeMinutes = 0,
      todayRequired = 0,
      weekRequired = 0,
      monthRequired = 0;

    records.forEach((rec) => {
      const day = moment(rec.date).startOf("day");
      const dayStr = day.format("YYYY-MM-DD");

      const isHoliday = holidayDates.includes(dayStr);
      const leaveType = leaveMap.get(dayStr);

      let mins = 0;

      if (rec.check_in_time && !rec.check_out_time && day.isSame(today)) {
        // Currently working today
        const checkIn = moment(rec.check_in_time, "HH:mm");
        mins = now.diff(checkIn, "minutes");
      } else if (rec.workingHours) {
        const [h, m] = rec.workingHours.split("h ");
        mins = parseInt(h) * 60 + parseInt(m);
      } else if (rec.check_in_time && rec.check_out_time) {
        // fallback if workingHours is not available
        const checkIn = moment(rec.check_in_time, "HH:mm");
        const checkOut = moment(rec.check_out_time, "HH:mm");
        if (checkOut.isBefore(checkIn)) {
          checkOut.add(1, "day"); // overnight shift fallback
        }
        mins = checkOut.diff(checkIn, "minutes");
      }

      let required = rec.requiredTime
        ? parseInt(rec.requiredTime.split("h")[0]) * 60 +
          parseInt(rec.requiredTime.split("h")[1])
        : shiftDuration + (rec.lateByMinutes || 0);

      const adjustedRequired = isHoliday
        ? 0
        : leaveType === "full"
        ? 0
        : leaveType === "half"
        ? Math.floor(required / 2)
        : required;

      if (day.isSame(today)) {
        todayMinutes += mins;
        todayRequired += adjustedRequired;
      }

      if (day.isSameOrAfter(weekStart)) {
        weekMinutes += mins;
        weekRequired += adjustedRequired;
      }

      monthMinutes += mins;
      monthRequired += adjustedRequired;

      const ot = rec.overtime
        ? parseInt(rec.overtime.split("h")[0]) * 60 +
          parseInt(rec.overtime.split("h")[1])
        : 0;
      overtimeMinutes += ot;
    });

    const format = (mins) =>
      `${Math.floor(mins / 60)}.${(mins % 60).toString().padStart(2, "0")}`;

    return res.status(200).json({
      success: true,
      statistics: {
        today: `${format(todayMinutes)} / ${format(todayRequired)} hrs`,
        thisWeek: `${format(weekMinutes)} / ${format(weekRequired)} hrs`,
        thisMonth: `${format(monthMinutes)} / ${format(monthRequired)} hrs`,
        remaining: `${format(
          Math.max(monthRequired - monthMinutes, 0)
        )} / ${format(monthRequired)} hrs`,
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
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: "Company ID missing in token" });
    }

    const { date, month, year } = req.query;

    const employees = await User.find({ Company: companyId })
      .select("_id name last_name designation")
      .lean();

    const employeeIdMap = new Map();
    employees.forEach((emp) => {
      employeeIdMap.set(emp._id.toString(), emp);
    });

    const employeeIds = employees.map((e) => e._id);

    let attendanceRecords = [];
    let responseDate;
    const present = [];
    const late = [];
    const onLeave = [];
    const markedIds = new Set();
    const presentStatuses = ["Present", "Late", "HalfDay"];

    if (date) {
      // 🔹 Filter by specific date
      const selectedDate = moment(date).startOf("day").toDate();

      attendanceRecords = await Attendance.find({
        userId: { $in: employeeIds },
        date: selectedDate,
      }).lean();

      responseDate = moment(selectedDate).format("YYYY-MM-DD");
    } else if (month && year) {
      // 🔹 Filter by month
      const selectedMonth = parseInt(month);
      const selectedYear = parseInt(year);

      const startOfMonth = moment(
        `${selectedYear}-${selectedMonth}-01`
      ).startOf("month");
      const endOfMonth = moment(startOfMonth).endOf("month");

      attendanceRecords = await Attendance.find({
        userId: { $in: employeeIds },
        date: {
          $gte: startOfMonth.toDate(),
          $lte: endOfMonth.toDate(),
        },
      }).lean();

      responseDate = `${selectedYear}-${String(selectedMonth).padStart(
        2,
        "0"
      )}`;
    } else {
      // 🔹 Default: Today
      const today = moment().startOf("day").toDate();

      attendanceRecords = await Attendance.find({
        userId: { $in: employeeIds },
        date: today,
      }).lean();

      responseDate = moment(today).format("YYYY-MM-DD");
    }

    // 🔁 Classify
    attendanceRecords.forEach((record) => {
      const user = employeeIdMap.get(record.userId.toString());
      if (!user) return;

      const userInfo = {
        userId: user._id,
        name: `${user.name} ${user.last_name}`,
        designation: user.designation || "N/A",
        status: record.status,
        date: moment(record.date).format("YYYY-MM-DD"),
      };

      markedIds.add(user._id.toString());

      if (record.status === "Late") {
        late.push(userInfo);
        present.push(userInfo);
      } else if (record.status === "OnLeave") {
        onLeave.push(userInfo);
      } else if (presentStatuses.includes(record.status)) {
        present.push(userInfo);
      }
    });

    const absent = employees
      .filter((emp) => !markedIds.has(emp._id.toString()))
      .map((emp) => ({
        userId: emp._id,
        name: `${emp.name} ${emp.last_name}`,
        designation: emp.designation || "N/A",
        status: "Absent",
      }));

    return res.status(200).json({
      success: true,
      type: date ? "specific-date" : month && year ? "month" : "today",
      date: responseDate,
      companyId,
      totalEmployees: employees.length,
      counts: {
        present: present.length,
        late: late.length,
        onLeave: onLeave.length,
        absent: absent.length,
      },
      employees: {
        present,
        late,
        onLeave,
        absent,
      },
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
    const isCurrentMonth =
      today.isSame(startDate, "month") && today.isSame(startDate, "year");
    const lastCountableDate = isCurrentMonth ? today : endDate;
    const totalDays = lastCountableDate.diff(startDate, "days") + 1;

    const users = await User.find({ Company: companyId });
    const userMap = {};
    users.forEach((user) => (userMap[user._id.toString()] = user.name));

    const allUserIds = users.map((u) => u._id);

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
    attendanceRecords.forEach((record) => {
      const uid = record.userId.toString();
      if (!attendanceMap[uid]) attendanceMap[uid] = [];
      attendanceMap[uid].push(record);
    });



    const result = [];

    for (const user of users) {
      const userIdStr = user._id.toString();
      const records = attendanceMap[userIdStr] || [];

      let present = 0,
        late = 0,
        onLeave = 0;

      records.forEach((record) => {
        if (["Present", "HalfDay"].includes(record.status)) present++;
        if (record.status === "Late") {
          present++;
          late++;
        }
        if (record.status === "OnLeave") onLeave++;
      });

      const countedDays = records.filter((r) =>
        ["Present", "HalfDay", "Late", "OnLeave"].includes(r.status)
      ).length;

      const absent = totalDays - countedDays;

      // const absent = totalDays - records.length;
      const attendancePercentage =
        totalDays > 0 ? ((present / totalDays) * 100).toFixed(2) : "0.00";

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
};


module.exports.GetCompanyEmployee = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
    const { date, from, to } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company Id missing ",
      });
    }

    if (!date && (!from || !to)) {
      return res.status(400).json({
        success: false,
        message: "Please providre ",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server Its GetCompanyEmployee",
    });
  }
};

module.exports.HandleGetMonthlyAttendance = async (req, res) => {
  try {
    const userId = req.user?.userid;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized: User ID not found in token",
      });
    }

    // Get month and year from query params (defaults to current month/year)
    const month = parseInt(req.query.month) || moment().month() + 1; // month is 1-based from query
    const year = parseInt(req.query.year) || moment().year();

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid month. Must be between 1 and 12.",
      });
    }

    const startDate = moment(`${year}-${month}-01`).startOf("month").toDate();
    const endDate = moment(startDate).endOf("month").toDate();

    const attendanceRecord = await Attendance.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    return res.status(200).json({
      success: true,
      message: "Monthly attendance fetched successfully",
      data: attendanceRecord,
    });
  } catch (error) {
    console.error("Error in GetMonthlyAttendance:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching monthly attendance",
    });
  }
};



module.exports.GetCompanyAttendanceWithHolidays = async (req, res) => {
  try {
    const companyId = req.user?.company_id;
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
    const lastDate = isCurrentMonth ? today : endDate;

    const totalDays = lastDate.diff(startDate, "days") + 1;

    const users = await User.find({ Company: companyId }).select("_id name last_name profile_image").lean();
    const userIds = users.map((u) => u._id);

    const [attendanceRecords, holidayData, userLeaves] = await Promise.all([
      Attendance.find({
        userId: { $in: userIds },
        date: { $gte: startDate.toDate(), $lte: lastDate.toDate() },
      }),
      Holiday.findOne({ companyId }),
      UserLeave.find({
        userId: { $in: userIds },
        "leavesTaken.status": "Approved",
        $or: [
          {
            "leavesTaken.fromDate": { $lte: endDate.toDate() },
            "leavesTaken.toDate": { $gte: startDate.toDate() },
          },
        ],
      }),
    ]);

    // Prepare leave map
    const leaveMap = new Map();
    userLeaves.forEach((leaveDoc) => {
      leaveDoc.leavesTaken.forEach((leave) => {
        if (leave.status !== "Approved") return;
        const from = moment(leave.fromDate).startOf("day");
        const to = moment(leave.toDate).startOf("day");
        while (from.isSameOrBefore(to)) {
          const key = `${leaveDoc.userId}_${from.format("YYYY-MM-DD")}`;
          leaveMap.set(key, leave.type);
          from.add(1, "day");
        }
      });
    });

    // Prepare holiday and override maps
    const holidays = (holidayData?.holidays || []).map((h) => moment(h.date).format("YYYY-MM-DD"));
    const weeklyOffs = holidayData?.weeklyOff || [];
    const overrides = {};
    (holidayData?.overrides || []).forEach((ov) => {
      overrides[moment(ov.date).format("YYYY-MM-DD")] = ov.isWorkingDay ? "Working" : "Holiday";
    });

    const dateList = [];
    let day = startDate.clone();
    while (day.isSameOrBefore(lastDate)) {
      dateList.push(day.clone());
      day.add(1, "day");
    }

    const groupedAttendance = {};
    attendanceRecords.forEach((rec) => {
      const key = `${rec.userId}_${moment(rec.date).format("YYYY-MM-DD")}`;
      groupedAttendance[key] = rec;
    });

    const finalResult = [];

    for (const user of users) {
      let present = 0,
        absent = 0,
        late = 0,
        leave = 0;
      const dailyRecords = [];

      for (const date of dateList) {
        const dateStr = date.format("YYYY-MM-DD");
        const dayOfWeek = date.format("dddd");
        const key = `${user._id}_${dateStr}`;

        let status = "Absent";
        let source = "Default";
        let check_in_time = null;
        let check_out_time = null;
        let overtime = 0; // in minutes or as stored

        // Handle holiday/override logic
        if (overrides[dateStr] === "Holiday") {
          status = "Holiday";
          source = "Override";
        } else if (overrides[dateStr] === "Working") {
          // continue
        } else if (holidays.includes(dateStr)) {
          status = "Holiday";
          source = "Holiday List";
        } else if (weeklyOffs.includes(dayOfWeek)) {
          status = "Holiday";
          source = "Weekly Off";
        }

        const attendance = groupedAttendance[key];
        if (attendance) {
          status = attendance.status;
          source = "Attendance";
          check_in_time = attendance.check_in_time || null;
          check_out_time = attendance.check_out_time || null;
          overtime = attendance.overtime || 0;

          if (["Present", "HalfDay"].includes(attendance.status)) present++;
          if (attendance.status === "Late") {
            present++;
            late++;
          }
        } else if (leaveMap.has(key) && status !== "Holiday") {
          status = leaveMap.get(key) === "HALF" ? "Half Day Leave" : "Leave";
          source = "Leave";
          leave++;
        } else if (status !== "Holiday") {
          absent++;
        }

        dailyRecords.push({
          date: dateStr,
          status,
          source,
          check_in_time,
          check_out_time,
          overtime, // added field
        });
      }

      const percentage = totalDays > 0 ? ((present / totalDays) * 100).toFixed(2) : "0.00";

      finalResult.push({
        userId: user._id,
        name: `${user.name} ${user.last_name || ""}`,
        profile_image: user.profile_image || null,
        present,
        late,
        leave,
        absent,
        attendancePercentage: `${percentage}%`,
        records: dailyRecords,
      });
    }

    return res.status(200).json({
      success: true,
      companyId,
      month: `${month}-${year}`,
      totalDays,
      data: finalResult,
    });
  } catch (error) {
    console.error("Error in GetCompanyAttendanceWithHolidays:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
