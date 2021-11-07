require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const app = express();
const port = process.env.PORT || 5000;

//MiddleWare
app.use(cors());
app.use(express.json());

// MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.${process.env.DB_C}.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function mongodbCURD() {
  try {
    /* ------------------------------------- 
     checking connection with DB
    ------------------------------------- */
    await client.connect();
    console.log('db connected');
    /* ------------------------------------- 
    database name and collection init
    ------------------------------------- */
    const database = client.db('doctorPortal');
    const appointmentCollection = database.collection('appointments');
    const userCollection = database.collection('users');
    /* ------------------------------------- 
    Appointments APIs
    ------------------------------------- */
    app.get('/appointments', async (req, res) => {
      const email = req.query.email;
      const date = new Date(req.query.date).toLocaleDateString();
      const query = { email: email, date: date };
      console.log(date, email, query);
      const cursor = appointmentCollection.find(query);
      const appointments = await cursor.toArray();
      res.json(appointments);
    });
    app.post('/appointments', async (req, res) => {
      const appointment = req.body;
      const result = await appointmentCollection.insertOne(appointment);
      // console.log(result);
      res.json(result);
    });
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      let isAdmin = false;
      if (result?.role === 'admin') {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      // console.log(result);
      res.json(result);
    });

    app.put('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await userCollection.updateOne(query, updateDoc, options);
      res.json(result);
    });

    app.put('/users/admin', async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: 'admin' } };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}

mongodbCURD().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Running Server');
});

app.listen(port, () => console.log(`Server running on port ${port}`));
