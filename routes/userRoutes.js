import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import db from '../db/index.js'; 
import dotenv from 'dotenv';

dotenv.config(); 

const router = express.Router();

// POST route to register a new user
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10

    // Insert the user into the database
    const result = await db.one(
      'INSERT INTO user_profile(username, email, password) VALUES($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'User created successfully', user: result });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// POST route to log in a user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Fetch the user by email
    const user = await db.oneOrNone('SELECT * FROM user_profile WHERE email = $1', [email]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare the provided password with the hashed password stored in DB
    console.log("password ",password);
    console.log("password logged in ",user.password);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log("password validate ",isPasswordValid);

    // Generate a JWT token if the password is valid
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET, // Secret key for signing the token
      { expiresIn: '1h' } // Token expiration time
    );

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// POST route to send password reset email
router.post('/reset-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await db.oneOrNone('SELECT * FROM user_profile WHERE email = $1', [email]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = Math.random().toString(36).substr(2, 8);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,  // Your email here
        pass: process.env.EMAIL_PASS,  // Your email password here
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `Here is your password reset token: ${resetToken}\nPlease use it to reset your password.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Failed to send email', error: error.message });
      }
      res.status(200).json({ message: 'Password reset email sent' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
});

// PATCH route to update user profile
router.patch('/update/:userId', async (req, res) => {
  const { firstName, lastName, photoUrl } = req.body;
  const { userId } = req.params;

  try {
    // Validate that the user exists in the database
    const user = await db.oneOrNone('SELECT * FROM user_profile WHERE id = $1', [userId]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {
      first_name: firstName || user.first_name,
      last_name: lastName || user.last_name,
      photo_url: photoUrl || user.photo_url,
    };

    const result = await db.one(
      'UPDATE user_profile SET first_name = $1, last_name = $2, photo_url = $3 WHERE id = $4 RETURNING id, first_name, last_name, photo_url',
      [updateData.first_name, updateData.last_name, updateData.photo_url, userId]
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      user: result,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// GET route to fetch user profile
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await db.oneOrNone('SELECT id, username, email, first_name, last_name, photo_url, created_at FROM user_profile WHERE id = $1', [userId]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      photo_url: user.photo_url,
      created_at: user.created_at,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
});

export default router;
