const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://visa-land.web.app',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
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

    // ✅ Get All Visas with optional sorting
    app.get('/visas', async (req, res) => {
      const sortParam = req.query.sort;
      let sortQuery = {};

      if (sortParam === 'price_asc') {
        sortQuery = { price: 1 };
      } else if (sortParam === 'price_desc') {
        sortQuery = { price: -1 };
      }

      try {
        const result = await VisasCollection.find().sort(sortQuery).toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching visas:', error);
        res.status(500).send({ error: 'Failed to fetch visas' });
      }
    });

    // ✅ Get a specific visa by ID
    app.get('/visa-details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await VisasCollection.findOne(query);
      res.send(result);
    });

    // ✅ Add a new visa
    app.post('/visas', async (req, res) => {
      const newVisa = req.body;
      newVisa.price = parseFloat(newVisa.price);

      if (!newVisa.userEmail) {
        return res
          .status(400)
          .send({ error: 'Missing userEmail in visa data' });
      }

      const result = await VisasCollection.insertOne(newVisa);
      res.send(result);
    });

    // ✅ Get visas added by a specific user
    app.get('/user-visas', async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send({ error: 'Email query is required' });
      }

      try {
        const result = await VisasCollection.find({
          userEmail: email,
        }).toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching user visas:', error);
        res.status(500).send({ error: 'Failed to fetch user visas' });
      }
    });

    // ✅ Book/apply for a visa
    app.post('/booking', async (req, res) => {
      const booking = req.body;

      if (!booking.userEmail) {
        return res
          .status(400)
          .send({ error: 'Missing userEmail in booking data' });
      }

      const result = await BookingCollection.insertOne(booking);
      res.send(result);
    });

    // ✅ Get visa applications/bookings by a specific user
    app.get('/user-applications', async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.status(400).send({ error: 'Email query is required' });
      }

      try {
        const result = await BookingCollection.find({
          userEmail: email,
        }).toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching user applications:', error);
        res.status(500).send({ error: 'Failed to fetch user applications' });
      }
    });

    console.log('Successfully connected to MongoDB!');
  } finally {
    // await client.close(); // Not closing to keep connection alive
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Visa Land server listening on port ${port}`);
});
