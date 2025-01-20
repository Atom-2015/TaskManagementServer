const express = require('express');
const router = express.Router();
 


router.use('/user' , require('./user_route'));



router.use('/project' , require('./project_route'));
 
router.use('/task' , require('./task_route'));


 module.exports = router; 



 