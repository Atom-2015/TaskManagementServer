const express = require ("express");
const router=express.Router();
const ClientDisController= require("../Controler/Budget_Controller/ClientDis_Controller");

//add client disscurrsion api
router.post("/Addclient",ClientDisController.HandleClientDis);

//delete client discussion api
router.delete("/:clientId",ClientDisController.handleDeleteClientDis);

//get client discussion api 
router.get("/allClient",ClientDisController.handleGetClientDis);

//edit client discussion api 
router.put("/:clientId",ClientDisController.HandleEditClientDis);

module.exports = router;