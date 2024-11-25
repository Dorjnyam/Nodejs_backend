import dotenv from 'dotenv';
import express from 'express';
import userRoutes from './routes/userRoutes.js'; 

dotenv.config(); 

const app = express();
app.use(express.json()); 

app.use('/users', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://10.3.202.117:${PORT}`);   // fixed zohiomol ip address
});
