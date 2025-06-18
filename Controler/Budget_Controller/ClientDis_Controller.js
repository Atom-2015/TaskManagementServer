const Project = require("../../Modal/Projects");
const User = require("../../Modal/ClientDis");
const ClientDis = require ("../../Modal/ClientDis");
//





module.exports.HandleClientDis = async(req,res)=>{
    try{
        const {projectId,client_name,discussed_by,phone_no,comment,next_update}= req.body;
        
        if(!projectId){
            return res.status(400).json({
                success:false,
                message:"Project Id is requried",
            })
        }

        const projectExists = await Project.findById(projectId)
        if(!projectExists) {
            return res.status(404).json({
                success:false,
                message:"Project is not found"
            })
        }

        const newDisscussion = await ClientDis.create({
            projectId,client_name,discussed_by,phone_no,comment,next_update
        });

        return res.status(200).json({
            success:true,
            message:"Cleindis successfully",
            data:newDisscussion
        })

    }
    catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
             message:"Clent created in error"
        })
    }
}



//edit api in client discusstion
module.exports.HandleEditClientDis = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { client_name, discussed_by, phone_no, comment, next_update } = req.body;

        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: "Client ID is required"
            });
        }

        const updatedClient = await ClientDis.findByIdAndUpdate(
            clientId,
            { client_name, discussed_by, phone_no, comment, next_update },
            { new: true }
        );

        if (!updatedClient) {
            return res.status(404).json({
                success: false,
                message: "Client discussion not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Client discussion updated successfully",
            data: updatedClient
        });
    } catch (error) {
        console.error("Edit Client Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error while editing client discussion"
        });
    }
};


//deleteAPi
module.exports.handleDeleteClientDis = async (req,res) =>{
    try{
        const {clientId} = req.params;
        console.log("ye hai id cleind"+ clientId)
        if(!clientId) {
            return res.status(400).json({
                success:false,
                message:"client Id is nit found"
            })
        }

        const deleteClient = await ClientDis.findByIdAndDelete(clientId);

        return res.status(200).json({
            success:true,
            message:"Deletes SuccessFully",
            data:deleteClient
        })
    }
    catch(error){
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Delete the client having error"
        })
    }
}

module.exports.handleGetClientDis = async (req,res) =>{
    try{
        const AllClientDis = await ClientDis.find();

        if(!AllClientDis) {
            return res.status(400).json({ 
                success:false,
                message:"Error in get Data"
            })
        }

        return res.status(200).json({
            success:false,
            message:"All cleint get Successfuuly",
            data:AllClientDis
        })

    }
    catch(error){
        console.log(error)
            return res.status(500).json({
                success:true,
                message:"Error in getting all client"
            })
        
    }
}