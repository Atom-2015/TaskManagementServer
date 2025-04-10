const express = require('express');
const router = express.Router();

const isAuthenticated = require('../middleware/isAuthMiddleware');
const SubTaskController=require('../Controler/SubTask_Controller/SubTaskController');

router.post('/createSubtask',SubTaskController.HandleSubTaskCreation);

module.exports=router