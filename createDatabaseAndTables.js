import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create a new client for connecting to PostgreSQL
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Function to create the database and tables
async function createDatabaseAndTables() {
  try {
    // Connect to PostgreSQL
    await client.connect();

    // 1. Create the database
    const createDatabaseQuery = `CREATE DATABASE ${process.env.DB_NAME};`;
    await client.query(createDatabaseQuery);
    console.log(`Database ${process.env.DB_NAME} created successfully.`);

    // Reconnect to the new database
    client.end();
    client.database = process.env.DB_NAME;
    await client.connect();

    // 2. Create tables
    const createTablesQuery = `
      CREATE TABLE IF NOT EXISTS user_profile (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        money DECIMAL DEFAULT 0,
        photo_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS card_info (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES user_profile(id),
        card_number VARCHAR(16) NOT NULL,
        card_holder_name VARCHAR(255) NOT NULL,
        expiry_date VARCHAR(5) NOT NULL,
        cvv VARCHAR(3) NOT NULL,
        zip VARCHAR(5)
      );

      CREATE TABLE IF NOT EXISTS saved_transaction (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES user_profile(id),
        title VARCHAR(255),
        amount DECIMAL NOT NULL,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transaction_log (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES user_profile(id),
        description TEXT NOT NULL,
        amount DECIMAL NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        type VARCHAR(10) CHECK(type IN ('credit', 'debit')) NOT NULL
      );
    `;
    
    // Execute the query to create the tables
    await client.query(createTablesQuery);
    console.log('Tables created successfully.');

  } catch (err) {
    console.error('Error creating database and tables:', err);
  } finally {
    // Close the client connection
    await client.end();
  }
}

// Run the function
createDatabaseAndTables();
