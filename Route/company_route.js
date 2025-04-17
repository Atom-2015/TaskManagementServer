const express=require('express');
const router=express.Router();
const CompanyController=require('../Controler/Company_Controller/ConpanyController');

router.post('/addCompany',CompanyController.HandleCompanyCreate);
router.get('/allcompany',CompanyController.HandleGetAllCompany);
router.delete('/delcompany/:companyId',CompanyController.HandleCompanyDelete);
router.put('/editcompany/:companyId',CompanyController.HandleCompanyEdit);

module.exports =router;
