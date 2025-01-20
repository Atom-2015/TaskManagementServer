require('dotenv').config();
const mongoose = require('mongoose');

// mongoose.connect("mongodb://127.0.0.1:27017/ConnectB")
// .then(()=>console.log("connected to data base"))
// .catch((err)=>console.log("errer in connecting to data base"));


(async()=>{
  try {
    const response = await mongoose.connect('mongodb://127.0.0.1:27017/taskmanagement');
    console.log("***************connected to database***************", response.connection.host);
  } catch (error) {
    console.error("*************error in connecting to database********************", error);
  }
})()