const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const { MongoClient, ObjectId } = require('mongodb');

const url = process.env.DATABASE_URL;
const db_Name = process.env.DATABASE_NAME;
//import models
const CreditCard = require('./models/creditCard');
const Rental = require('./models/rental');
const Bike = require('./models/bike');
const bodyParser = require('body-parser');
const stripekey=process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')('sk_test_51NCZkbGy0kbFHoHStTfHmPIK1xCF2aMZZOUxccZOPct3dhprBZyldyDB2xtBpOfmHOGfsR4BlIUlv8b29OMVlgDI00pmktSwMw');

const axios = require('axios');


// Create a new Stripe instance and pass in your secret key.


async function startServer() {
  try {
    const db = await connectToMongo();
    
    
    const app = express();
    app.use(cors());


    // Middleware
    app.use(express.json());
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));


   
    
// GET request to retrieve bikes
app.get('/bikes', async (req, res) => {
  try {
    const bikes = await db.collection('bikes').find().toArray();
    res.status(200).json(bikes);
  } catch (error) {
    console.error('Error retrieving bikes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET request to retrieve credit cards by owner ID
app.get('/creditcards/:idOwner', async (req, res) => {
  const { idOwner } = req.params;
  try {
    const creditCards = await db.collection('creditCards').find({ idUser:new ObjectId(idOwner)  }).toArray();
    res.json(creditCards);
  } catch (error) {
    console.error('Error retrieving credit cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST request to validate renting and process payment
app.post('/rent', async (req, res) => {
  const { idUser, idBike, period,price  } = req.body;
  const endDateTime = new Date();
    endDateTime.setHours(endDateTime.getHours() + period);
    const endDate = endDateTime;
    const rentPrice =  period * price;
    const cardToken = await createTestToken();
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: cardToken.id,
      },
    });

  try {
    const paymentResponse = await axios.post('http://localhost:3001/charge', {
      userId: idUser,
      amount: rentPrice,
      paymentMethod: paymentMethod.id, // Pass the token here
    });
    //  create rental record
  
    const rental = new Rental({
      id: new ObjectId(),
      user_id:new ObjectId(idUser),
      bike_id:new ObjectId(idBike),
      start_date: new Date(),
      end_date: endDate,
      price: rentPrice,
      status: 'pending',
    });
    await db.collection('rentals').insertOne(rental);

    // if payment succusful
    const paymentIntent = paymentResponse.data.paymentIntent;
    if (paymentIntent.status === 'succeeded') {
      // update rental status to success  
      await db.collection('rentals').updateOne({ id: rental.id }, { $set: { status: 'success' } });

    res.status(200).json({ confirmationCode:'Payment Successful' });}
    // else payment failed
    else {
      await db.collection('rentals').updateOne({ id: rental.id }, { $set: { status: 'failed' } });
      res.status(500).json({ error: 'Payment processing failed' });
    }

  } catch (error) {
    // Payment failed
    console.error('Error processing payment:',error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});




    const PORT = 3000;

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting the server:', error);
  }
}

// Connect to MongoDB
async function connectToMongo() {
  try {
    const client = await MongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Storing a reference to the database so you can use it later
    const db = client.db(db_Name);

    console.log(`Connected MongoDB: ${url}`);
    console.log(`Database: ${db_Name}`);

    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}
async function createTestToken() {
  try {
    const token = await stripe.tokens.create({
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      },
    });

    console.log(token);
    return token;
  } catch (error) {
    console.error(error);
  }
}


// Call the startServer function to begin the server initialization
startServer();


