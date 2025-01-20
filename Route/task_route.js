const express = require('express');
const router = express.Router();
const TaskControler = require('../Controler/Task_Controler/TaskControler');
const isAuthenticated = require('../middleware/isAuthMiddleware');

router.post('/createTask' , TaskControler.HandleTaskCreation);

//Update Task Employee
router.put('/updatetask' , TaskControler.HandleTaskUpdate)


// api to get all tasks 
router.get('/alltask' , TaskControler.HandleAllTaskList )




module.exports = router; 