const express= require("express");
const router = express.Router();

const RevenueController= require("../Controler/Budget_Controller/Revenue_Controller");

router.post('/Addrevenue',RevenueController.HandleRevenue);
router.get('/allrevenue',RevenueController.HandleGetRevenue);
router.delete('/:revenueId',RevenueController.HandleDeleteRevenue);
router.put('/:revenueId',RevenueController.HandleEditRevenue);

module.exports = router;