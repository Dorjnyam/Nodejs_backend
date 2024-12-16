import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import db from '../db/index.js'; 
import authenticateToken from '../middleware/authenticateToken.js';
import dotenv from 'dotenv';

dotenv.config(); 

const router = express.Router();


router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    
    const hashedPassword = await bcrypt.hash(password, 10); 

    
    const result = await db.one(
      'INSERT INTO user_profile(username, email, password) VALUES($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: 'User created successfully', user: result });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    
    const user = await db.oneOrNone('SELECT * FROM user_profile WHERE email = $1', [email]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    
    console.log("password ",password);
    console.log("password logged in ",user.password);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log("password validate ",isPasswordValid);

    
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET, 
      { expiresIn: '1h' } 
    );
    console.log("token ",token)

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }

});


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
        user: process.env.EMAIL_USER,  
        pass: process.env.EMAIL_PASS,  
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


router.patch('/update/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName, photoUrl } = req.body;

  
  if (req.user.userId !== parseInt(userId, 10)) {
    return res.status(403).json({ message: 'Forbidden: You can only update your own profile' });
  }

  try {
    
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


// router.get('/:userId', async (req, res) => {
//   const { userId } = req.params;

//   try {
//     const user = await db.oneOrNone('SELECT id, username, email, first_name, last_name, photo_url, created_at FROM user_profile WHERE id = $1', [userId]);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.status(200).json({
//       id: user.id,
//       username: user.username,
//       email: user.email,
//       first_name: user.first_name,
//       last_name: user.last_name,
//       photo_url: user.photo_url,
//       created_at: user.created_at,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
//   }
// });


router.get('/token/profile', authenticateToken, async (req, res) => {
  const { userId } = req.user;  
  console.log("opens profile")
  try {
    const user = await db.oneOrNone('SELECT id, username, email, first_name, last_name, money, photo_url, created_at FROM user_profile WHERE id = $1', [userId]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      money: user.money,
      photo_url: user.photo_url,
      created_at: user.created_at,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
  }
});


router.post('/card/add-card', authenticateToken, async (req, res) => {
  const { card_number, card_holder_name, expiry_date, cvv, zip } = req.body;
  const userId = req.user.userId; 

  if (!card_number || !cvv || !card_holder_name || !expiry_date || !zip) {
    return res.status(400).json({ message: 'Card information is required' });
  }

  try {
    
    const newCard = await db.one(
      'INSERT INTO card_info(user_id, card_number, card_holder_name, expiry_date, cvv, zip) VALUES($1, $2, $3, $4, $5, $6) RETURNING id, card_holder_name, expiry_date, zip',
      [userId, card_number, card_holder_name, expiry_date, cvv, zip]
    );

    res.status(201).json({ message: 'Card added successfully', card: newCard });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add card', error: error.message });
  }
});



router.get('/card/cards', authenticateToken, async (req, res) => {
  const userId = req.user.userId; 

  try {
    
    const cards = await db.any(
      'SELECT id,card_number, card_holder_name, expiry_date, zip FROM card_info WHERE user_id = $1',
      [userId]
    );

    if (cards.length === 0) {
      return res.status(404).json({ message: 'No cards found' });
    }

    
    const decryptedCards = cards.map(card => ({
      id: card.id, 
      card_holder_name: card.card_holder_name,
      expiry_date: card.expiry_date,
      zip: card.zip, 
    }));

    res.status(200).json({ cards: decryptedCards });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cards', error: error.message });
  }
});

router.post('/card/deposit', authenticateToken, async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.userId;

  // Check for valid deposit amount
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid deposit amount' });
  }

  try {
    // Insert transaction log with 'Deposit' description
    const result = await db.one(
      'INSERT INTO transaction_log(user_id, description, amount, type) VALUES($1, $2, $3, $4) RETURNING id, user_id, description, amount, timestamp, type',
      [userId, 'Deposit', amount, 'credit']
    );

    // Update user profile with the new balance
    await db.none(
      'UPDATE user_profile SET money = money + $1 WHERE id = $2',
      [amount, userId]
    );

    // Return success response
    res.status(201).json({
      message: 'Deposit successful',
      transaction: result,
    });
  } catch (error) {
    // Handle error
    res.status(500).json({ message: 'Failed to process deposit', error: error.message });
  }
});


router.post('/expense/add', authenticateToken, async (req, res) => {
  const { user_id, transaction_name, amount, dateString } = req.body;

  
  if (!user_id || !transaction_name || !amount || isNaN(amount) || amount <= 0 || !dateString) {
    return res.status(400).json({ message: 'Missing or invalid expense information' });
  }

  try {
    
    const parsedDate = new Date(dateString);

    
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format. Please use YYYY-MM-DD' });
    }

    
    const newExpense = await db.one(
      `INSERT INTO expense (user_id, transaction_name, date, amount, is_paid, paid_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, user_id, transaction_name, date, amount, is_paid, paid_date`,
      [user_id, transaction_name, parsedDate.toISOString().slice(0, 10), amount, false, null] 
    );

    res.status(201).json({ message: 'Expense added successfully', expense: newExpense });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add expense', error: error.message });
  }
});



router.put('/expense/paid/:expenseId', authenticateToken, async (req, res) => {
  const { expenseId } = req.params;
  const { amount } = req.body;

  
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid deposit amount' });
  }

  try {
    
    const updatedExpense = await db.one(
      `UPDATE expense SET is_paid = true, paid_date = current_timestamp WHERE id = $1 AND is_paid = false RETURNING id, user_id, transaction_name, date, amount, is_paid, paid_date`,
      [expenseId]
    );

    if (!updatedExpense) {
      return res.status(404).json({ message: 'Expense not found or already paid' });
    }

    
    const userId = req.user.userId;

    
    const transactionLog = await db.one(
      `INSERT INTO transaction_log(user_id, description, amount, type) VALUES ($1, $2, $3, $4) RETURNING id, user_id, description, amount, timestamp, type`,
      [userId, 'Expense payment', amount, 'debit'] 
    );

    await db.none(
      `UPDATE user_profile SET money = money - $1 WHERE user_id = $2`,
      [amount, userId]
    );

    res.status(200).json({
      message: 'Expense marked as paid successfully',
      expense: updatedExpense,
      transaction: transactionLog,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to mark expense as paid', error: error.message });
  }
});

router.get('/transaction/log', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const transactions = await db.any(
      `
      SELECT 
        t.*, 
        u.photo_url 
      FROM 
        transaction_log t
      INNER JOIN 
        user_profile u 
      ON 
        t.user_id = u.id
      WHERE 
        t.user_id = $1
      `,
      [userId]
    );

    res.status(200).json({ transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch transaction log', error: error.message });
  }
});

export default router;
