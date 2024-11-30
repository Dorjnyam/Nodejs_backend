import dotenv from 'dotenv';
import express from 'express';
import userRoutes from './routes/userRoutes.js'; 
import { encrypt, decrypt } from './encryption.js';

// Load environment variables from .env file
dotenv.config(); 

const app = express();
app.use(express.json()); 

// Define the routes
app.use('/users', userRoutes);

// Encryption and decryption logic can be tested in a route or inside the app logic
app.get('/test-encryption', (req, res) => {
  const originalData = "Sensitive information here";

  // Encrypt the data
  const encryptedData = encrypt(originalData);
  console.log('Encrypted Data:', encryptedData);

  // Decrypt the data
  const decryptedData = decrypt(encryptedData);
  console.log('Decrypted Data:', decryptedData);

  res.json({
    originalData,
    encryptedData,
    decryptedData
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://192.168.15.110:${PORT}`); // fixed zohiomol IP address
});
