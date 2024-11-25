import dotenv from 'dotenv';
import express from 'express';
import userRoutes from './routes/userRoutes.js'; // Import user routes

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json()); // Middleware to parse JSON requests

// Use the user routes
app.use('/users', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://10.3.202.117:${PORT}`);
});
