 
const User = require('../../Modal/User');
const jwt = require('jsonwebtoken');




module.exports.HandleAddUser = async (req, res) => {
     const { name, email, password, phone, designation, date_of_joining, salary, role , } = req.body;
 
     // Check required fields
      
     console.log(name , email , password , role)

     if ([name, email, password, role].some(field => !field || field.trim() === "")) {
         console.log('Validation failed: Missing fields');
         return res.status(400).json({ message: 'All fields are required' });
     }
 
     try {
         // Check if user already exists
         const existingUser = await User.findOne({ email });
         if (existingUser) {
             console.log('User already exists');
             return res.status(400).json({ message: 'User already exists' });
         }
  
         // Create new user
         const newUser = await User.create({
             name,
             email,
             password,
             phone,
             designation,
             date_of_joining,
             salary,
             role,
         });
 
         console.log('User created successfully');
         return res.status(201).json({ message: 'User created successfully', user: newUser });
 
     } catch (error) {
         console.error('Error creating user:', error);
         return res.status(500).json({ message: 'Failed to create user' });
     }
 };




const privated = process.env.SECRET_KEY;

module.exports.HandleSignin = async (req, res) => {
  console.log("Api called for creating sesson")
    try {    
        console.log("This is body " ,req.body);
            
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }        
        if (user.password !== req.body.password) {
            return res.status(400).json({ message: 'Invalid password' });
        }        
        const token = jwt.sign({
            email: user.email,
            name: user.name,
            company_id:user.company_id
        },privated, { expiresIn: '1d' });
        // return res.status(200).json({ token });
        // console.log("************" , user.body.email);
        return res.json({status:200 , user:token , company_id:user.company_name})

    } catch (error) {
        console.log(`***************************error in Sign In**************************** ${error}`);
        return res.status(500).json({ message: 'Internal server error', error });
    }  
};





module.exports.HandleAllUserlist = async (req, res) => {
    try {
      // Fetch all users from the database
      const users = await User.find();
    //   If no user

      if(!users){
          return res.status(301).json({
            message: "No user found"
          })
      }
      // Return the users in the response
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      // Handle errors and send a response
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: error.message,
      });
    }
  };





// api to update/edit user
module.exports.HandleEditUser = async (req, res) => {
  console.log('api called')
  const { userId } = req.params; // Assuming you pass the user ID as a parameter
  const { name, email, password, role, status } = req.body; // Fields to update

  // Validate that at least one field is provided
  if (!name && !email && !password && !role && !status) {
      return res.status(400).json({ message: 'At least one field is required to update.' });
  }

  try {
      // Find the user by ID
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Update fields only if they are provided in the request body
      if (name) user.name = name;
      if (email) user.email = email;
      if (password) user.password = password; // Ensure you hash the password before saving
      if (role) user.role = role;
      if (status) user.status = status;

      // Save the updated user details
      await user.save();

      console.log('User updated successfully');
      return res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ message: 'Failed to update user' });
  }
};

  