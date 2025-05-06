const express = require('express');
const router = express.Router();
const ProjectControler = require('../Controler/Project_Controler/ProjectControler');
const isAuthenticated = require('../middleware/isAuthMiddleware');

 router.post('/addproject' , ProjectControler.createProject);
// router.post('/addproject' , async(req , res)=>{
//    console.log(req.headers["rahul"])
//    console.log("hitted");
//    console.log(req.body);
//    return res.status(200);
// });


// end point to get list of all projects 
router.get('/allprojects' , ProjectControler.HandleAllProjects );



// end point for perticular project detail 
router.get('/projectDetail' , ProjectControler.HandleGetDetailProjectData);


//delete project ki api
router.delete('/:projectId',ProjectControler.HandleDeleteProject);


module.exports = router; 

