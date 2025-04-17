const express = require('express');
const router = express.Router();

const isAuthenticated = require('../middleware/isAuthMiddleware');
const SubTaskController=require('../Controler/SubTask_Controller/SubTaskController');

router.post('/createSubtask',SubTaskController.HandleSubTaskCreation);
router.get('/getSubtask',SubTaskController.HandleSubTaskGet);
router.put('/Subtask/:SubtaskId',SubTaskController.HnadleEditSubTask);
router.delete('/Subtask/:SubtaskId',SubTaskController.HandleSubtaskDelete);

module.exports=router