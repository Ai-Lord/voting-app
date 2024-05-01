// const express = require('express')
const router = require('express').Router();
const User = require('../models/user');
const {jwtAuthMiddleware, generateToken} = require('../jwt');

router.post('/signup', async (req, res) => {
    try{
    const data = req.body // Assuming the request body contains the user data
  
    // Create a new user document using the mongoose model
    const newUser = new User(data);
  
    // save the new user to the database
    const response = await newUser.save()
    console.log('data saved')

    const payload = {
      id: response.id,
    }
    console.log(JSON.stringify(payload))
    const token = generateToken(payload);
    console.log("Token is : ", token);

    res.status(200).json({response: response, token: token});
    }
    catch(err){
      console.log(err)
      res.status(500).json({error: 'Internal server Error'})
    }
  })
  // Login Route
router.post('/login', async (req, res) =>{
    try{
      // Extract aadharCardNumber and password from request body
      const {aadharCardNumber, password} = req.body;
  
      // Find the user by aadharCardNumber
      const user = await User.findOne({aadharCardNumber: aadharCardNumber});
  
      // if user does not exist or password does not match, return error
      if(!user || !(await user.comparePassword(password))){
        return res.status(401).json({error: 'Invalid aadharCardNumber or password'})
      }
      // generate token
      const payload = {
        id: user.id,
      }
      const token = generateToken(payload)
  
      // return token as response
      res.json({token})
    }
    catch(err){
      console.error(err)
      res.status(500).json({error: 'Internal server error'})
    }
  })

  // profile route
  router.get('/profile', jwtAuthMiddleware, async (req, res) =>{
    try{
      const userData = req.user;
      console.log('User data: ', userData);

      const userId = userData.id;
      const user = await User.findById(userId);

      res.status(200).json({user});
    }catch(err){
      console.error(err);
      res.status(500).json({error: 'Internal server error'})
    }
  })

// PUT for updation
router.put('/profile/password', jwtAuthMiddleware, async (req, res) =>{
  try{
    const userId = req.user // Extract the id from the token
    const {currentPassword, newPassword} = req.body; // Extract current and new passwords from user
    //Find the user by userID
    const user = await User.findById(userId);

    // if password does not match, return error
    if(!(await user.comparePassword(currentPassword))){
        return res.status(401).json({error: 'Invalid password'})
      }
    // Update the users password
    user.password = newPassword;
    await user.save();

    console.log('password updated')
    res.status(200).json({message: 'Password updated'})
  }catch(err){
    console.log(err)
    res.status(500).json({error: 'Internal server error'})
  }
})

module.exports = router