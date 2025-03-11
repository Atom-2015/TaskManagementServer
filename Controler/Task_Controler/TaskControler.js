const Project = require('../../Modal/Projects');
const User = require('../../Modal/User');
const Task = require('../../Modal/Task');


 

// module.exports.HandleTaskCreation = async (req, res) => {
//     const { title, description, assigned_to, assigned_by, due_date, priority, totalunit, unittype } = req.body;

//     // Validate required fields
//     if ([title, assigned_to, assigned_by, due_date, totalunit, unittype ].some(field => field == null || field === '')) {
//         return res.status(400).json({
//             message: "Please fill all the fields",
//             status: false
//         });
//     }

//  const project_id = req.headers['x-project-id'];
//     try {
//         // Create the task
//         const newTask = await Task.create({
//             title,
//             description,
//             project_id,
//             assigned_to,
//             assigned_by,
//             due_date,
//             priority,
//             totalunit,
//             unittype,
             
//         });

//         if (!newTask) {
//             return res.status(500).json({
//                 message: "Task creation failed",
//                 status: false
//             });
//         }

//         // Add the task to the project's task list
//         const project = await Project.findById(project_id);
//         if (!project) {
//             return res.status(404).json({
//                 message: "Project not found",
//                 status: false
//             });
//         }

//         // console.log(`project is ${project}`);

//         project.tasks.push(newTask._id);
//         await project.save();

//         return res.status(201).json({
//             message: "Task created successfully",
//             status: true,
//             data: newTask
//         });

//     } catch (error) {
//         console.error("Error creating task:", error);
//         return res.status(500).json({
//             message: "Internal Server Error",
//             status: false
//         });
//     }
// };


module.exports.HandleTaskCreation = async (req, res) => {
    const { 
        title, description, assigned_to, assigned_by, due_date, priority, 
        totalunit, unittype, status, fileName, repeat, reminder, 
        completedUnit, comments, category, loop_user, attachment, clock 
    } = req.body;

    // Validate required fields
    if ([title, assigned_to, assigned_by, due_date].some(field => field == null || field === '')) {
        return res.status(400).json({
            message: "Please fill all the required fields",
            status: false
        });
    }

    const project_id = req.headers['x-project-id'];
    try {
        // Create the task
        const newTask = await Task.create({
            title,
            description,
            project_id,
            assigned_to,
            assigned_by,
            due_date,
            priority,
            totalunit,
            unittype,
            status,
            fileName,
            repeat,
            reminder,
            completedUnit,
            comments,
            category,
            loop_user,
            attachment,
            clock
        });

        if (!newTask) {
            return res.status(500).json({
                message: "Task creation failed",
                status: false
            });
        }

        // Add the task to the project's task list
        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({
                message: "Project not found",
                status: false
            });
        }

        project.tasks.push(newTask._id);
        await project.save();

        return res.status(201).json({
            message: "Task created successfully",
            status: true,
            data: newTask
        });
    } catch (error) {
        console.error("Error creating task:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            status: false
        });
    }
};





// Api to update the task status and unitj
 module.exports.HandleTaskUpdate = async (req, res) => {
    const { taskId, completedUnit } = req.body;

    // Validate required fields
    if (!taskId || completedUnit == null) {
        return res.status(400).json({
            message: "Task ID, priority, and completedUnit are required",
            status: false,
        });
    }

    try {
        // Update the task
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { priority, completedUnit },
            { new: true } // Return the updated task
        );

        if (!updatedTask) {
            return res.status(404).json({
                message: "Task not found or could not be updated",
                status: false,
            });
        }

        // Successful update
        return res.status(200).json({
            message: "Task updated successfully",
            status: true,
            data: updatedTask,
        });
    } catch (error) {
        console.error('Error updating task:', error);
        return res.status(500).json({
            message: "Internal Server Error",
            status: false,
        });
    }
};




// api to get list of subtasks according to projecsts
module.exports.HandleAllTaskList = async (req, res) => {
    // Check if the 'x-project-id' header is present
    // console.log("api called", req.headers['x-project-id'])
    if (!req.headers['x-project-id']) {
      return res.status(400).json({
        success: false,
        message: "Project ID is required in the 'x-project-id' header.",
      });
    }
  
    try {
      // Extract the project ID from the header
      const projectId = req.headers['x-project-id'];

      const tasks = await Task.find({ project_id: projectId });
  
      // Return the tasks in the response
      res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      // Handle errors and send a response
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve tasks',
        error: error.message,
      });
    }
  };
  



// Api to get the data of perticular users task
module.exports.HandleTaskAssignedToUser = async (req, res) => {
    const email = req.user.email;
    console.log(`user id is ${email}`)
    try {
        const userid = await User.findOne({email:email});
        if(!userid){
            return res.status(404).json({
                message:"No user found"
            })
        }
        // const task = await Task.find({assigned_to:userid._id});
        const task = await Task.find({assigned_to:userid._id}).populate('project_id');

        if(!task){
            return res.status(304).json({
                message:"No task found"
            })
        }
        return res.status(200).json({
            success:true,
            data:task
        })
    } catch (error) {
        return res.status(402).json({
            message:"Internal Server Error"
        })
    }
}



// Task Asigned by me api 
module.exports.HandleAllTaskAssignedByMe = async (req, res) => {
    try {
      // Find user ID by email
      const user = await User.findOne({ email: req.user.email }).select("_id");
      if (!user) {
        return res.status(403).json({
          message: "No user found",
        });
      }
      // Find tasks assigned by the user
      const tasks = await Task.find({ assigned_by: user._id });
      if (tasks.length === 0) {
        return res.status(404).json({
          message: "No tasks found assigned by this user",
        });
      }
      // Return tasks
      return res.status(200).json({
        message: "Tasks assigned by me",
        data: tasks,
      });
    } catch (error) {
      // Error handling
      console.error("Error in HandleAllTaskAssignedByMe:", error);
      return res.status(500).json({
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };
  
