// This is the main file of the "server" (the back-end). The server is the program that
// stores your data and answers requests from the website. Run it to start everything.

// Load secret settings (passwords, keys) from the hidden ".env" file into the program.
require('dotenv').config();

// Import the tools (libraries) other developers built that we rely on.
const express = require('express');     // Makes it easy to build a web server
const mongoose = require('mongoose');   // Lets us talk to the MongoDB database
const cors = require('cors');           // Controls which websites may talk to this server
const helmet = require('helmet');       // Adds basic security protections to every response

// Create the server application.
const app = express();

// Turn on the security protections.
app.use(helmet());

// Only allow our own website (running on these two addresses) to send requests to this server.
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));

// Stripe Webhooks MUST use raw body parsing, so do this before express.json()
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
// Let the server understand data sent to it in JSON format (the usual way websites send data).
app.use(express.json());

// Connect each "route file" to a web address. A route is a URL the website can call.
app.use('/api/auth', require('./routes/auth'));                    // Sign up and log in
app.use('/api/subscriptions', require('./routes/subscriptions'));  // Add, edit, delete, and total subscriptions
app.use('/api/plaid', require('./routes/plaid'));                  // Connect a bank and find subscriptions

// Connect to the database. The address comes from the secret .env file.
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))   // Success: print a message
    .catch(err => console.log(err));                // Failure: print the error

// Start listening for requests on the port number (door number) set in .env.
app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));