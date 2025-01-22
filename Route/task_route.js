const express = require('express');
const router = express.Router();
const TaskControler = require('../Controler/Task_Controler/TaskControler');
const isAuthenticated = require('../middleware/isAuthMiddleware');

router.post('/createTask' , TaskControler.HandleTaskCreation);

//Update Task Employee
router.put('/updatetask' , TaskControler.HandleTaskUpdate)


// api to get all tasks 
router.get('/alltask' , TaskControler.HandleAllTaskList );

// Api to get all the data of task assigned to preticular user
router.get('/taskassigned' ,isAuthenticated, TaskControler.HandleTaskAssignedToUser);


// route to see tasks assigned by me 
router.get('/taskassignedby' ,isAuthenticated, TaskControler.HandleAllTaskAssignedByMe);




module.exports = router; 