const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Visa Land is running successfully!');
});
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8txi2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const VisasCollection = client.db('VisaLand').collection('Visas');
    const BookingCollection = client.db('VisaLand').collection('Booking');
    app.get('/all-visas', async (req, res) => {
      const result = await VisasCollection.find()
        .sort({ _id: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get('/visas', async (req, res) => {
      const result = await VisasCollection.find().toArray();
      res.send(result);
    });
    app.get('/visa/:email', async (req, res) => {
      const email = req.params.email;
      const result = await VisasCollection.find({
        'host.email': email,
      }).toArray();
      res.send(result);
    });
    app.delete('/visa/:id', async (req, res) => {
      const id = req.params.id;
      const result = await VisasCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get('/visa-details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await VisasCollection.findOne(query);
      res.send(result);
    });

    app.post('/visas', async (req, res) => {
      const newVisa = req.body;
      const result = await VisasCollection.insertOne(newVisa);
      res.send(result);
    });
    app.put('/visa-update/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedVisa = req.body;

      const updateVisa = {
        $set: updatedVisa,
      };
      const result = await VisasCollection.updateOne(
        filter,
        updateVisa,
        options
      );
      res.send(result);
    });

    app.post('/apply-visa', async (req, res) => {
      const bookingData = req.body;
      const result = await BookingCollection.insertOne(bookingData);
      res.send(result);
    });
    // app.get('/applied-visa/:email', async (req, res) => {
    //   const email = req.params.email;
    //   const result = await BookingCollection.find({
    //     'host.email': email,
    //   }).toArray();
    //   res.send(result);
    // });
    app.delete('/visa-cancel/:id', async (req, res) => {
      const { id } = req.params;
      console.log(id);
      const result = await BookingCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });



    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Visa Land server listening on port ${port}`);
});
