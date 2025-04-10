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


    // console.log(`this is response ${req.body}`)
     
    


    const task = await Task.findById({_id: task_id});
    if (!task) {

      const subtask = await SubTask.create({
        name,
      
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



module.exports.HandleSubTaskGet=async (req,res)=>{
  try{
  const task_id = req.headers['x-task-id'];
  const subtask = await SubTask.find({task_id});

 
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

