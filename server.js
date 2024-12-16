import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors'; // Import the CORS package
import userRoutes from './routes/userRoutes.js'; 
import { encrypt, decrypt } from './encryption.js';

dotenv.config(); 

const app = express();

// Enable CORS for all routes
app.use(cors());

// Enable JSON parsing middleware
app.use(express.json()); 

// Set up routes
app.use('/users', userRoutes);

app.get('/test-encryption', (req, res) => {
  const originalData = "Sensitive information here";

  // Encrypt and decrypt the data for testing
  const encryptedData = encrypt(originalData);
  console.log('Encrypted Data:', encryptedData);

  const decryptedData = decrypt(encryptedData);
  console.log('Decrypted Data:', decryptedData);

  // Respond with the original, encrypted, and decrypted data
  res.json({
    originalData,
    encryptedData,
    decryptedData
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://192.168.83.3:${PORT}`); 
});
