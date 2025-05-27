const express = require('express');
const router = express.Router();
const UserControler = require('../Controler/User_Controler/UserControler');
const isAuthenticated = require('../middleware/isAuthMiddleware');
const upload = require("../middleware/UserUploadImage");





 
// Api to create Sessin 
router.post('/signin', UserControler.HandleSignin);


router.post('/adduser',upload , UserControler.HandleAddUser);

// Api to get list of users
router.get('/userlist' , UserControler.HandleAllUserlist );

// Edit user
router.put('/updateuser/:userId',upload , UserControler.HandleEditUser);

//deleted user
router.delete('/delete/:id',UserControler.HandleDeleteUser);



module.exports = router;   