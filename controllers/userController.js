const express = require('express');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // For generating OTPs

const router = express.Router();

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email provider
  auth: {
    user: 'YOUR-EMAIL',
    pass: 'APP-PASSWORD' // Use an app password for Gmail
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  const { name, email, password, type } = req.body;

  if (!name || !email || !password || !type) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const user = new User({ name, email, password, type });
    await user.save();
    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an existing user
router.put('/:id', async (req, res) => {
  const { name, email, password, type } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, password, type },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password (Send OTP)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999); // 6 digit OTP

    // Save OTP to the user object temporarily (you can also use a separate collection or cache)
    user.otp = otp;
    await user.save();

    // Send OTP via email
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset is ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ error: 'Failed to send OTP' });
      }
      res.json({ message: 'OTP sent successfully' });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password using OTP
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Update the user's password
    user.password = newPassword;
    user.otp = undefined; // Clear OTP
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
