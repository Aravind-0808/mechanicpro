const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const userController = require('./controllers/userController');
const paymentRoutes = require('./controllers/paymentController');
const contactRoutes = require('./controllers/contactController');
const garageRoutes = require('./controllers/garageController');
const zoneRoutes = require('./controllers/zoneController');
const paymentController = require('./controllers/paymentController')

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 8000;

const corsOptions = {
  origin: '*', // Allow requests from any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// ✅ Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Mount routers
app.use('/api/users', userController);
app.use("/uploads", express.static("uploads"));
app.use('/api/payments', paymentRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/garages', garageRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/payment', paymentController);



app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
