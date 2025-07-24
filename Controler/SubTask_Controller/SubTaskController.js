
const Task = require('../../Modal/Task');
const SubTask = require('../../Modal/SubTask');



module.exports.HandleSubTaskCreation = async (req, res) => {
  try {
    const {
      name,
      assigned_userid,
      priority,
      start_date,
      end_date,
      cost,
      status,
      checklist,
      comment
    } = req.body;

    const task_id = req.headers['x-task-id'];
    if (!task_id) {
      return res.status(400).json({ message: "Task ID is required in headers", status: false });
    }

    console.log(`Received subtask data: ${JSON.stringify(req.body)}`);

    // Get last subtask with the highest position for this task
    const lastSubtask = await SubTask.findOne({ task_id }).sort({ position: -1 });
    const newPosition = lastSubtask ? lastSubtask.position + 1 : 0;

    // Always create the new subtask with calculated position
    const newSubTask = await SubTask.create({
      name,
      assigned_userid,
      priority,
      start_date,
      end_date,
      cost,
      status,
      checklist,
      task_id,
      position: newPosition,
      comment
    });

    return res.status(201).json({
      success: true,
      message: "Subtask created successfully",
      data: newSubTask
    });

  } catch (error) {
    console.error("Subtask creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};




module.exports.HandleSubTaskGet = async (req, res) => {
  try {
    const task_id = req.headers['x-task-id'];
    const subtask = await SubTask.find({ task_id });

    console.log(`api response ${task_id}  ,,,,,,,,,, ${subtask}`)


    if (!task_id) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required in headers'
      });
    }

    // Return the tasks in the response
    res.status(200).json({
      success: true,
      data: subtask,
    });
  } catch (error) {
    // Handle errors and send a response
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks',
      error: error.message,
    });

  }
}

// api to edit the Subtask

module.exports.HnadleEditSubTask = async (req, res) => {
  try {
    const username = req.user.name;
    const { SubtaskId } = req.params;
    const {
      subTaskName,
      user,
      priority,
      startDate,
      endDate,
      cost,
      checklist,
      status,
      comment
    } = req.body;

    console.log(`this is data ${JSON.stringify(req.body)}`);

    const subtask = await SubTask.findById(SubtaskId);
    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: "Subtask not found",
      });
    }

    const updateHistory = [];

    // Handle end date updates
    let updatedEndDate = Array.isArray(subtask.end_date) ? [...subtask.end_date] : [];
    if (endDate && JSON.stringify(subtask.end_date) !== JSON.stringify(endDate)) {
      updatedEndDate.push({
        value: endDate,
        updatedby: username,
        timeUpdated: Date.now(),
      });

      updateHistory.push({
        userId: user,
        field: "end_date",
        oldValue: subtask.end_date,
        newValue: endDate,
        updateAt: new Date(),
      });
    } else {
      // If not changed, keep the original
      updatedEndDate = subtask.end_date;
    }

    // Handle cost updates
    let updatedCost = Array.isArray(subtask.cost) ? [...subtask.cost] : [];
    if (cost !== undefined && cost !== null && cost !== '' && JSON.stringify(subtask.cost) !== JSON.stringify(cost)) {
      updatedCost.push({
        value: cost,
        updatedby: username,
        timeUpdated: Date.now(),
      });

      updateHistory.push({
        userId: user,
        field: "cost",
        oldValue: subtask.cost,
        newValue: cost,
        updateAt: new Date(),
      });
    } else { 
      updatedCost = subtask.cost;
    }

    const subtaskuser = await SubTask.findByIdAndUpdate(
      SubtaskId,
      {
        name: subTaskName,
        assigned_userid: user,
        priority,
        start_date: startDate,
        end_date: updatedEndDate,
        cost: updatedCost,
        status,
        checklist,
        comment,
        $push: { updateHistory: { $each: updateHistory } },
      },
      { new: true }
    );

    if (!subtaskuser) {
      return res.status(404).json({
        success: false,
        message: 'Subtaskuser not found err in update',
        data: subtaskuser,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subtask updated successfully',
      data: subtaskuser,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error updating subtask",
      error: error.message,
    });
  }
};





module.exports.HandleSubtaskDelete = async (req, res) => {
  try {
    const { SubtaskId } = req.params;



    if (!SubtaskId) {
      return res.status(400).json({
        success: false,
        message: 'Subtask ID is required'
      });
    }

    const deletedSubtask = await SubTask.findByIdAndDelete(SubtaskId);

    if (!deletedSubtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subtask deleted successfully',

    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete subtask',
      error: error.message
    });
  }
};

// order arrange karne ka api
// module.exports.HandleOrderSubtasks = async (req, res) => {
//   try {
//     const { orderedSubtaskIds } = req.body;
    
//     if (!Array.isArray(orderedSubtaskIds)) {
//       return res.status(400).json({
//         success: false,
//         message: "orderedSubtaskIds must be an array",
//       });
//     }

//     // Create bulk operations
//     const bulkOps = orderedSubtaskIds.map(({ id, order }) => ({
//       updateOne: {
//         filter: { _id: id },
//         update: { $set: { position: order } },
//       },
//     }));

//     // Execute bulk write
//     const result = await SubTask.bulkWrite(bulkOps);

//     return res.status(200).json({
//       success: true,
//       message: "Subtasks reordered successfully",
//       data: result
//     });
//   } catch (error) {
//     console.error("Reordering error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to reorder subtasks",
//       error: error.message,
//     });
//   }
// };

module.exports.HandleOrderSubtasks = async (req, res) => {
  try {
    const { orderedSubtaskIds } = req.body;

    if (!Array.isArray(orderedSubtaskIds)) {
      return res.status(400).json({
        success: false,
        message: "orderedSubtaskIds must be an array",
      });
    }

    // Recalculate positions after the drag-and-drop
    let position = 0;
    const updatedSubtasks = [];

    // Loop through each subtask in the new order and update its position
    for (let i = 0; i < orderedSubtaskIds.length; i++) {
      const { id } = orderedSubtaskIds[i];
      
      // Update each subtask's position
      const updatedSubtask = await SubTask.findByIdAndUpdate(
        id,
        { position: position++ },  // Increment position
        { new: true }
      );

      updatedSubtasks.push(updatedSubtask);
    }

    return res.status(200).json({
      success: true,
      message: "Subtasks reordered successfully",
      data: updatedSubtasks
    });

  } catch (error) {
    console.error("Reordering error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reorder subtasks",
      error: error.message,
    });
  }
};
