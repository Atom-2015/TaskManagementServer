const express = require('express');
const router = express.Router();
 


router.use('/user' , require('./user_route'));



router.use('/project' , require('./project_route'));
 
router.use('/task' , require('./task_route'));

router.use('/subtask',require('./subtask_route'));

 module.exports = router; 



 