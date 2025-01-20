const User = require('../../Modal/User');
const Projects = require('../../Modal/Projects');


module.exports.createProject = async (req, res) => {
    const { name, description, start_date, end_date, team_members, status, budget } = req.body;

    // Validate required fields
    if (!name || !start_date || !status) {
        console.log('Validation failed: Missing required fields');
        return res.status(400).json({ message: 'Name, start_date, and status are required' });
    }

    // Validate status
    const validStatuses = ['Active', 'Completed', 'On Hold'];
    if (!validStatuses.includes(status)) {
        console.log('Validation failed: Invalid status');
        return res.status(400).json({ message: `Status must be one of ${validStatuses.join(', ')}` });
    }

    try {
        // Create new project
        const newProject = await Projects.create({
            name,
            description,
            start_date,
            end_date,
            team_members,
            status,
            budget,
        });

        console.log('Project created successfully');
        return res.status(201).json({ message: 'Project created successfully', project: newProject });
    } catch (error) {
        console.error('Error creating project:', error);
        return res.status(500).json({ message: 'Failed to create project' });
    }
};




module.exports.HandleAllProjects = async (req, res) => {
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
  