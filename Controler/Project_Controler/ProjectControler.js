const User = require('../../Modal/User');
const Projects = require('../../Modal/Projects');
const Task = require('../../Modal/Task');


module.exports.createProject = async (req, res) => {
    const { name, description, start_date, end_date, team_members, sector, budget,country,state,city, Area } = req.body;

    // Validate required fields
    if (!name || !start_date) {
        console.log('Validation failed: Missing required fields');
        return res.status(400).json({ message: 'Name, start_date, and status are required' });
    }

    // Validate status
    // const validStatuses = ['Active', 'Completed', 'On Hold'];
    // if (!validStatuses.includes(status)) {
    //     console.log('Validation failed: Invalid status');
    //     return res.status(400).json({ message: `Status must be one of ${validStatuses.join(', ')}` });
    // }

    try {
        // Create new project
        const newProject = await Projects.create({
            name,
            description,
            start_date,
            end_date,
            team_members,
            sector,
            budget,
            country,
            state,
            city,
            Area
        });

        console.log('Project created successfully');
        return res.status(201).json({ message: 'Project created successfully', project: newProject });
    } catch (error) {
        console.error('Error creating project:', error);
        return res.status(500).json({ message: 'Failed to create project' });
    }
};




module.exports.HandleAllProjects = async (req, res) => {

  console.log(`body ${JSON.stringify(req.body)}`)
    try {
      // Fetch all projects from the database
      const projects = await Projects.find();
     
      if(!projects){
        return res.status(301).json({
          message: "No Projects found"
        })
    }
      // Return the projects in the response
      return res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      // Handle errors and send a response
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve projects',
        error: error.message,
      });
    }
  };






  // api to get the data of specific data 

module.exports.HandleGetDetailProjectData = async (req  , res)=>{
   const projectid = req.headers['x-project-id'];
   //
   if(!projectid){
    return res.status(302).json({
      message:"Project Id is wrong or missing"
    })
   }
   try {
    const response = await Projects.findById(projectid).populate('tasks'    ).exec();
    if(!response){
      return res.status(405).json({
        message:"Missing Data"
      })
    }


    // const response2 = await Promise.all(
    //   response.tasks.map((t) => Task.findById(t._id).select(" title "))
    // );
    

    return res.status(200).json({
      message:"Data found",
      data : response,
      // task:response2
    })
   } catch (error) {
    console.log(error)
    return res.status(404).json({
      message:"Internal server Error"
    })
   }
}

module.exports.HandleDeleteProject = async (req, res) => {
  try {
    const projectId = req.headers['x-project-id'] || req.params.projectId;


    //const {projectId} = req.params;
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project ID is missing in the request.",
      });
    }

    const deletedProject = await Projects.findByIdAndDelete(projectId);

    if (!deletedProject) {
      return res.status(404).json({
        success: false,
        message: "No project found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully",
      data: deletedProject,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while deleting the project.",
    });
  }
};


  