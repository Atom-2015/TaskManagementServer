const express = require('express');
const router = express.Router();
 


router.use('/user' , require('./user_route'));

router.use('/expense',require("./expense_route"));

router.use('/project' , require('./project_route'));
 
router.use('/task' , require('./task_route'));

router.use('/subtask',require('./subtask_route'));

router.use('/company',require('./company_route'));

router.use("/client",require("./clientdis_route"));

//revenue hai ye 
router.use('/revenue' , require('./revenue_route'));

 module.exports = router; 



 