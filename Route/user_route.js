const express = require('express');
const router = express.Router();
const UserControler = require('../Controler/User_Controler/UserControler');
const isAuthenticated = require('../middleware/isAuthMiddleware');
 
// Api to create Sessin 
router.post('/signin', UserControler.HandleSignin);


router.post('/adduser' , UserControler.HandleAddUser);

// Api to get list of users
router.get('/userlist' , UserControler.HandleAllUserlist );

// Edit user
router.put('/updateuser/:id' , UserControler.HandleEditUser);



module.exports = router; 