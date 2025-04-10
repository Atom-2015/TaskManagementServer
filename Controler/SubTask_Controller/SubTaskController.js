const Project = require('../../Modal/Projects');
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
      status
    } = req.body;



    const project_id = req.headers['x-project-id'];
    const task_id = req.headers['x-task-id'];


    if (!name || !assigned_userid || !priority  || !task_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }
 


    const task = await Task.findById(task_id);
    if (!task) {

      const subtask = await SubTask.create({
        name,
        project_id,
        assigned_userid,
        task_id,
        priority,
        start_date,
        end_date,
        cost,
        status
      })

      if(!subtask){
        return res.status(500).json({ message: "Failed to create subtask" });
      }
      return res.status(201).json({ success: true, data:subtask });

    }

    const newSubTask = await SubTask.create({
      name,
      assigned_userid,
      priority,
      start_date,
      end_date,
      cost,
      status
    });

    if(!newSubTask){
      return res.status(500).json({ message: "Failed to create subtask" });
    }

    return res.status(201).json({
      message: "Subtask created successfully",
      status: true,
      data: newSubTask
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      status: false
    });
  }
};


