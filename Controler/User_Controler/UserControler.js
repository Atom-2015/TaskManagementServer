const User = require("../../Modal/User");
const Company = require("../../Modal/Conpany");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { default: mongoose } = require("mongoose");
const UploadCloudinary = require("../../Config/Cloudinary");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const OtpModel = require("../../Modal/OtpSchema");
const cloudinary = require("cloudinary").v2;

module.exports.HandleAddUser = async (req, res) => {
  const {
    name,
    email,
    Company,
    password,
    phone,
    designation,
    date_of_joining,
    dob,
    last_name,
    state,
    city,
    salary,
    role,
  } = req.body;

  // Validate required fields
  if (!name?.trim() || !email?.trim() || !password?.trim() || !role?.trim()) {
    console.log("Validation failed: Missing name, email, password, or role");
    return res
      .status(400)
      .json({ message: "Name, email, password, and role are required." });
  }

  if (!dob?.trim() || !last_name?.trim() || !state?.trim()) {
    return res.status(400).json({
      success: false,
      message: "dob, last_name, and state are required.",
    });
  }

  if (!Company?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Company is required.",
    });
  }

  try {
    // const otpRecord = await OtpSchema.findOne({email, isVerified:true})
    // if(!otpRecord || new Date(otpRecord.expiresAt) < new Date()){
    //   return res.status(403).json({
    //     success:false,
    //     message:"Please verify your email with otp before registration"
    //   })
    // }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists");
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    // Upload image if present
    let imageUrl = null;
    if (req.file) {
      console.log("Uploading image to Cloudinary...");
      const result = await UploadCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
      console.log("Image uploaded:", imageUrl);
    }

    // Create the user
    const newUser = await User.create({
      name,
      last_name,
      dob,
      state,
      email,
      password,
      phone,
      city,
      designation,
      date_of_joining,
      salary,
      role,
      Company,
      profile_image: imageUrl,
    });

    console.log("✅ User created successfully:", newUser._id);
    return res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("❌ Error creating user:", error);
    return res.status(500).json({
      message: "Failed to create user",
      error: error.message || "Internal server error",
    });
  }
};

const privated = process.env.SECRET_KEY;

module.exports.HandleSignin = async (req, res) => {
  // console.log("Api called for creating sesson")
  try {
    // console.log("This is body " ,req.body);
    const user = await User.findOne({ email: req.body.email });
    const company = await Company.findOne({ email: req.body.email });
    if (!user && !company) {
      return res.status(400).json({ message: "User not found" });
    }
    console.log(`thisis user ${user} thisis company ${company}`);
    if (
      user?.password !== req.body.password &&
      company?.company_password !== req.body.password
    ) {
      return res.status(400).json({ message: "Invalid password" });
    }
    if (user) {
      const token = jwt.sign(
        {
          email: user.email,
          name: user.name,
          company_id: user.company_id,
        },
        privated,
        { expiresIn: "30d" }
      );
      return res.json({
        status: 200,
        user: token,
        company_id: user.company_name,
      });
    }
    // console.log(company.company_name)  user company id
    // useremail => check companyemail  ( company => user table and company table check email )
    const token = jwt.sign(
      {
        email: company.email,
        name: company.company_name,
        company_id: company._id,
      },
      privated,
      { expiresIn: "30d" }
    );
    return res.json({ status: 200, user: token, isCompany: "jdkfj" });
  } catch (error) {
    console.log(
      `***************************error in Sign In**************************** ${error}`
    );
    return res.status(500).json({ message: "Internal server error", error });
  }
};

module.exports.HandleAllUserlist = async (req, res) => {
  try {
    const users = await User.find();

    if (!users) {
      return res.status(301).json({
        message: "No user found",
      });
    }

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
      error: error.message,
    });
  }
};

// api to update/edit user
module.exports.HandleEditUser = async (req, res) => {
  const { userId } = req.params;

  const {
    name,
    email,
    Company,
    password,
    phone,
    designation,
    date_of_joining,
    dob,
    last_name,
    state,
    city,
    salary,
    role,
    profile_image,
  } = req.body;

  if (!name && !email && !password && !role) {
    return res
      .status(400)
      .json({ message: "At least one field is required to update." });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No user found",
      });
    }

    const updateFields = {};

    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (Company) updateFields.Company = Company;
    if (password) updateFields.password = password;
    if (phone) updateFields.phone = phone;
    if (designation) updateFields.designation = designation;
    if (date_of_joining) updateFields.date_of_joining = date_of_joining;
    if (dob) updateFields.dob = dob;
    if (last_name) updateFields.last_name = last_name;
    if (state) updateFields.state = state;
    if (city) updateFields.city = city;
    if (salary) updateFields.salary = salary;
    if (role) updateFields.role = role;
    if (profile_image) updateFields.profile_image = profile_image;

    if (req.file) {
      if (user.profile_image) {
        const publicId = user.profile_image.split("/").pop().split(".")[0];
        const folder = "users";
        await cloudinary.uploader.destroy(`${folder}/${publicId}`);
        console.log(`${folder}/${publicId}`);
      }

      const editUploaded = await UploadCloudinary(req.file.buffer);
      updateFields.profile_image = editUploaded.secure_url;
    }

    const Upadateuser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    });

    if (!Upadateuser) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User is Edited Successfully",
      data: Upadateuser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Failed to update user" });
  }
};

module.exports.handleDeleteImageAllUser = async (req,res) => {
  try{
      const userId = req.params.id;
      
      if(!userId) {
        return res.status(400).json({
          success:false,
          message:"User not found problem"
        })
      }

      const user = await User.findById(userId);
      if(!user) {
        return res.status(404)
      }
  }
  catch(error){
    console.log(error)
    return res.status(500).json({
        success:false,
        message:"delete All User"
    })
  }
}

module.exports.HandleDeleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User  not found problem",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user Found",
      });
    }

    if (user.profile_image) {
      const publicId = user.profile_image.split("/").pop().split(".")[0];

      const folder = "users";
      await cloudinary.uploader.destroy(`${folder}/${publicId}`);
      console.log(`image deleted from cloudinary${folder}/${publicId}`);
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "No user found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "deleted User Successfully",
      data: deletedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error in deleting user",
    });
  }
};

require("dotenv").config();

module.exports.OtpUser = async (req, res) => {
  try {
    const email = req.body.email;

    const otp = crypto.randomInt(100000, 999999);

    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);

    await OtpModel.create({ email, otp, expiresAt });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "OTP for adding user to your company",
      text: `Your OTP is: ${otp}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);

    return res.status(200).json({ message: "OTP email sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Error in sending OTP",
    });
  }
};

module.exports.VerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpEntry = await OtpModel.findOne({ email, otp });

    if (!otpEntry) {
      return res.status(400).json({
        success: true,
        message: "Invalid otp",
      });
    }

    if (otpEntry.expiresAt < new Date()) {
      return res.status(400).json({
        success: true,
        message: "Invalid otp",
      });
    }

    otpEntry.isVerified = true;
    await otpEntry.save();

    return res.status(200).json({
      success: true,
      message: "Otp verifed Successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
