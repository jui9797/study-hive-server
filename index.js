const express =require('express')
const cors =require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app =express()
const jwt =require('jsonwebtoken')
const cookieParser =require('cookie-parser')
const port =process.env.port || 5000

// middleware
app.use(cors({
  origin:['http://localhost:5173',
    'https://assignment-11-client-c292f.web.app',
    'https://assignment-11-client-c292f.firebaseapp.com'
  ],
  credentials:true
}))
app.use(express.json())
app.use(cookieParser())

// token verification
const verifyToken =(req, res, next)=>{
  const token =req.cookies?.token
  console.log('token insde the verifyToken')
  if(!token){
    return res.status(401).send({message:'Unauthorized access'})
  }

  // verify token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message:'Unauthorized access'})
    }
    req.user= decoded
    next()
  })
}





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jwr0f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

// assignment related api
const assignmentCollection = client.db('assignment-11').collection('assignmentCollection')
const submissionCollection = client.db('assignment-11').collection('submitAssignment')

// get all assignments 
app.get('/assignments', async(req, res)=>{
  const filter =req.query.filter
  const search =req.query.search
  let query ={title:{
    $regex: search ||'',
    $options: 'i',
  },}
  if(filter) query.difficulty =filter
    const cursor = assignmentCollection.find(query)
    const result = await cursor.toArray()
    res.send(result)
})

// get single data by id
app.get('/assignments/:id', async(req, res)=>{
  const id =req.params.id
  const query ={_id: new ObjectId(id)}
  const result =await assignmentCollection.findOne(query)
  res.send(result)
  })

// get maximum 4 assignments
app.get('/limitAssignments', async(req, res)=>{
    const cursor = assignmentCollection.find()
    const result = await cursor.limit(4).toArray()
    res.send(result)
})

// post new assignment
app.post('/assignments', async(req, res)=>{
    const assignment =req.body
    const result =await assignmentCollection.insertOne(assignment)
    res.send(result)
})

// patch for update assignment
app.patch('/assignments/:id', async(req,res)=>{
  const id =req.params.id
  const filter={_id: new ObjectId(id)}
  const options ={upsert:true}
  const updatedAssignment =req.body
  const assignment ={
    $set:{
      
      title: updatedAssignment.title,
      description: updatedAssignment.description,
      marks: updatedAssignment.marks,
      thumbnailUrl: updatedAssignment.thumbnailUrl,
      difficulty: updatedAssignment.difficulty,
      dueDate: updatedAssignment.dueDate,
      creatorName: updatedAssignment.creatorName,
      creatorEmail: updatedAssignment.creatorEmail
      
    }
  }
  const result =await assignmentCollection.updateOne(filter, assignment, options)
  res.send(result)
})

// delete
app.delete('/assignments/:id', async(req, res)=>{
    const id =req.params.id
    const query ={_id: new ObjectId(id)}
    const result =await assignmentCollection.deleteOne(query)
    res.send(result)
    })

    // submitAssignment related api
    app.post('/submittedAssignments', async(req, res)=>{
    const submitAssignment =req.body
    const result = await submissionCollection.insertOne(submitAssignment)
    res.send(result)
    })

  //  get all submitted assignments
    app.get('/submittedAssignments', async(req, res)=>{
      const cursor = submissionCollection.find()
      const result = await cursor.toArray()
      res.send(result)
  })

    // get submitted assignment by spcific email
    app.get(`/submittedAssignments/email`,verifyToken,async(req, res)=>{
      const email = req.query.email
      
      const query = {submittedUserEmail:email}
      
      const allEmail = submissionCollection.find(query)
      const result = await allEmail.toArray()
      // email same na
      if(req.user.email !== req.query.email){
        return res.status(403).send({message:'Forbidden access'})
      }
      
      res.send(result)
    })


    // get pending assignment by spcific id
    app.get('/submittedAssignments/:id', async(req, res)=>{
      const id =req.params.id
      const query ={_id: new ObjectId(id)}
      const result =await submissionCollection.findOne(query)
      res.send(result)
      })

      //update status obtainMark, feedback 
      app.patch('/status/:id', async (req, res) => {
        const id = req.params.id
        const { status, obtainedMarks, feedback } = req.body
        const query = { _id: new ObjectId(id) }
        const updateDoc = {
          $set: {
            status,
            obtainedMarks,
            feedback,
        },
        }
        const result = await submissionCollection.updateOne(query, updateDoc)
        res.send(result)
      })

      // jwt token api
      app.post('/jwt' , (req, res)=>{
        const user =req.body
        const token =jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'5hr'})
        res.cookie('token', token, {httpOnly:true, secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",})
        .send({success:true})

      })
      // remove token api
      app.post('/logOut', (req, res)=>{
        res.clearCookie('token', {httpOnly:true, secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",})
        .send({success:true})
      })


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('Assignment is falling from sky')
})

app.listen(port, ()=>{
    console.log(`Assignment are waitting at ${port}`)
})