
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
      checklist
    } = req.body;



    
    const task_id = req.headers['x-task-id'];


    // console.log(`this is response ${req.body}`)
     
    


    const task = await SubTask.find({task_id: task_id});
    if (!task) {

      const subtask = await SubTask.create({
        name,
      
        assigned_userid,
        task_id,
        priority,
        start_date,
        end_date,
        cost,
        status,
        checklist
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
      task_id,
      end_date,
      cost,
      status,
      checklist
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

module.exports.HnadleEditSubTask=async(req,res)=>{
  try{
    const {SubtaskId}=req.params;
    const { subTaskName,user,
      priority,
      startDate,
      
      endDate,
      cost,checklist,
      status}=req.body;
      console.log(`subtask paramse se ${SubtaskId}`)
      console.log(req.body);

      const subtaskuser = await SubTask.findByIdAndUpdate(
        SubtaskId,
        {
          name:subTaskName,
          assigned_userid:user,
          priority,
          start_date:startDate,
          end_date:endDate,
          cost,
          status,
          checklist
        },
        { new: true }
      );
      

    if (!subtaskuser) {
      return res.status(404).json({
        success: false,
        message: 'Subtaskuser not found err in updtae'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subtask updated successfully',
      data: subtaskuser
    });


  }
  catch(error){
    console.log(error)
    return res.status(500).json({
      success:false,
      message:"Error to update subtask",
      Error:error,
    })

  }
}


module.exports.HandleSubtaskDelete = async (req, res) => {
  try {
    const { SubtaskId} = req.params;
   

    
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
