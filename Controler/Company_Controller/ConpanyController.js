const Company=require("../../Modal/Conpany");
 
module.exports.HandleCompanyCreate= async (req,res) => {
    const {company_name,client_name,email,joinDate,validity,cost,password,location}=req.body;


    if([company_name,client_name,joinDate,validity,].some(field=> !field || field.trim() === "")){
        console.log("Validation failed: Missing fields");
        return res.status(400).json({
            success:false,
            message:"All field are requried"
        })
    }

    try{
        const existingCompany= await Company.findOne({email})

        if(existingCompany){
            console.log("Company already registered")
            return res.status(400).json({
                success:false,
                message:"already company exists"
            })
        }

        const newCompany= await Company.create({
            company_name,
            client_name,
            email,
            joinDate,
            validity,
            cost,
            password,
            location
        })

        console.log(`karo api ${newCompany}`)

        return res.status(201).json({
            success:"true",
            message:"company added successfully",
            data:newCompany
        })

    }
    catch(error) {
        console.log('Error creating company',error);
        return res.status(500).json({
            success:false,
            message:"failed to create company"
        })
    }

}

module.exports.HandleGetAllCompany= async(req,res) =>{
    try{

        const allcompany = await Company.find();

        if(!allcompany){
            return res.status(400).json({
                success:false,
                message:"company is empty",
            })
        }

        return res.status(201).json({
            success:true,
            message:"Company Successfully fetch",
            data:allcompany
        })


    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"failed to load company",
        })
    }
}


module.exports.HandleCompanyEdit = async(req,res) => {
    try{
        const {companyId} = req.params;
        const {
            company_name,
            client_name,
            email,
            joinDate,
            validity,
            cost,
            location
        }=req.body;

        const editcompany = await Company.findByIdAndUpdate(companyId,{company_name,
            client_name,
            email,
            joinDate,
            validity,
            cost,
            location},{new : true});

        if(!editcompany){
            return res.status(404).json({
                success:false,
                message:"company is not found to edit"
            })
        }

        return  res.status(200).json({
            success:true,
            message:"edit company successfully",
            data:editcompany
        })

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"error in  company edit"
        })

    }
}

module.exports.HandleCompanyDelete = async(req,res) => {
    try{
        const {companyId} = req.params;

        if(!companyId){
            return res.status(400).json({
                success:false,
                message:"companyId is required"
            })
        }

        const deleteCompany = await Company.findByIdAndDelete(companyId)

        if(!deleteCompany) {
            return res.status(404).json({
                success:false,
                message:"CompanyId not found"
            })
        }

        return res.status(200).json({
            success:true,
            message:"company deleted successfully",
        })

    }
    catch(error)
    {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed to delted company id",
            error:error.message
        })
    }
}