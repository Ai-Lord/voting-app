const router = require('express').Router();
const Candidate = require('../models/candidate');
const {jwtAuthMiddleware, generateToken} = require('../jwt');
const {message} = require('prompt');
const User = require('../models/user');

const checkAdminRole = async (userId) =>{
    try{
        const user = await User.findById(userId);
        if(user.role === 'admin'){
          return true;
        }
    }catch(err){
        return false;
    }
}

// Post route to add a candidate
router.post('/', jwtAuthMiddleware, async (req, res) => {
    try{
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'user does not have admin role'})

    const data = req.body // Assuming the request body contains the candidate data
  
    // Create a new user document using the mongoose model
    const newCandidate = new Candidate(data);
  
    // save the new candidate to the database
    const response = await newCandidate.save()
    console.log('data saved')

    res.status(200).json({response: response});
    }
    catch(err){
      console.log(err)
      res.status(500).json({error: 'Internal server Error'})
    }
  })

// PUT for updation
router.put('/:candidateId', jwtAuthMiddleware, async (req, res) =>{
  try{
    if(!checkAdminRole(req.user.id))
    return res.status(403).json({message: 'user does not have admin role'})

    const candidateId = req.params.candidateId // Extract the id from Url parameter
    const updatedCandidateData = req.body; // Updated data for person

    const response = await Candidate.findByIdAndUpdate(candidateId, updatedCandidateData, {
      new: true, // Return updated document
      runValidators: true // Run Mongoose validation
    })
    if(!response){
      return res.status(404).json({error: 'Candidate not found'})
    }
    console.log('Candidate data updated')
    res.status(200).json(response)
  }catch(err){
    console.log(err)
    res.status(500).json({error: 'Internal server error'})
  }
})

// delete candidate
router.delete('/:candidateId', jwtAuthMiddleware, async (req, res) =>{
  try{
    if(!checkAdminRole(req.user.id))
    return res.status(403).json({message: 'user does not have admin role'})

    const candidateId = req.params.candidateId // Extract the id from Url parameter

    const response = await Candidate.findByIdAndDelete(candidateId)
    if(!response){
      return res.status(404).json({error: 'Candidate not found'})
    }
    console.log('Candidate deleted')
    res.status(200).json(response)
  }catch(err){
    console.log(err)
    res.status(500).json({error: 'Internal server error'})
  }
})

// lets start voting
router.post('/vote/:candidateId', jwtAuthMiddleware, async (req, res)=>{
  // no admin can vote
  // user can only vote once

  candidateId = req.params.candidateId;
  userId = req.user.id;

  try{
    // Find candidate document with specified candidateId
    const candidate = await Candidate.findById(candidateId)
    if(!candidate){
      return res.status(404).json({message: 'Candidate not found'})
    }
    const user = await User.findById(userId)
    if(!user){
       return res.status(404).json({message: 'user not found'})
    } 
    if(user.isVoted){
      res.status(400).json({message: 'You have already voted'})
    }
    if(user.role == 'admin'){
      res.status(403).json({message: 'admin is not allowed'})
    }

    //Update the candidate document to record the vote
    candidate.votes.push({user: userId})
    candidate.voteCount++;
    await candidate.save();

    // update the user document
    user.isVoted = true
    await user.save();

    res.status(200).json({message: 'vote recorded successfully'})

  }catch(err){
    console.log(err)
    res.status(500).json({error: 'Internal server error'})
  }
})

// vote count
router.get('/vote/count', async (req,res)=>{
  try{
    // find all candidates and sort them by voteCount in descending order
    const candidate = await Candidate.find().sort({voteCount: 'desc'})

    // Map the candidates to only return their name and voteCount
    const voteRecord = candidate.map((data)=>{
      return{
        party: data.party,
        count: data.voteCount
      }
    })
    return res.status(200).json(voteRecord)
  }catch(err){
    console.log(err)
    res.status(500).json({error: 'Internal server error'})
  }
})

// list of candidates
router.get('/', async (req, res)=> {
  try{
      const candidate = await Candidate.find()

      // show name and party
      const candidateRecord = candidate.map((data)=>{
        return{
          name: data.name,
          party: data.party
        }
      })

      res.status(200).json({candidateRecord});
    }catch(err){
      console.error(err);
      res.status(500).json({error: 'Internal server error'})
    }
})

module.exports = router