const express =require('express')
const cors =require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app =express()
const port =process.env.port || 5000

// middleware
app.use(cors())
app.use(express.json())





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
    await client.connect();

// assignment related api
const assignmentCollection = client.db('assignment-11').collection('assignmentCollection')
const submissionCollection = client.db('assignment-11').collection('submitAssignment')

// get all assignments 
app.get('/assignments', async(req, res)=>{
    const cursor = assignmentCollection.find()
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

// get maximum 3 assignments
app.get('/limitAssignments', async(req, res)=>{
    const cursor = assignmentCollection.find()
    const result = await cursor.limit(3).toArray()
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
      thubmnailUrl: updatedAssignment.thubmnailUrl,
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
    app.get(`/submittedAssignments/email`,async(req, res)=>{
      const email = req.query.email
      const query = {submittedUserEmail:email}
      const allEmail = submissionCollection.find(query)
      const result = await allEmail.toArray()
      res.send(result)
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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