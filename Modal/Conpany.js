const { default: mongoose } = require("mongoose");

// const [formData, setFormData] = useState({
//     company_name: editingCompany?.company_name || "",
//     client_name: editingCompany?.client_name || "",
//     email: editingCompany?.email || "",
//     joinDate: editingCompany?.joinDate || "",
//     validity:editingCompany?.validity ||"",
//     cost:editingCompany?.cost||"",
//     location: editingCompany?.location || [
//       {
//         country: defaultCountry,
//         state: "",
//         cities: [],
//       },
//     ],
//   });


const CompanySchema=new mongoose.Schema({
    company_name:{
        type:String,
        required:true,
    },

    client_name:{
        type:String,
        required:true,
    },

    email:{
        type:String,
        required:true,
    },

    joinDate:{
        type:Date,
        required:true,
    },

    validity:{
        type:Date,
        required:true,
    },

    cost:{
        type:Number,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },

    location:[{
        _id: false,
        country:{
            type:String,
        },
        state:{
            type:String,
        },
        cities:{
            type:String
        }
    }]


    
});

module.exports =mongoose.model('Company',CompanySchema);