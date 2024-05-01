const mongoose = require('mongoose');
require('dotenv').config()

// define the mongodb connection url
//const mongoUrl = process.env.DB_URL_LOCAL;
const mongoUrl = process.env.DB_URL;
// replace 'mydatabase' with your databas e name

// set up mongodb connection
mongoose.connect(mongoUrl)

// get the default connection
// Mongoose maintains a default connection object representing the mongodb connection
const db = mongoose.connection;

// default event listener for database connection
db.on('connected', () => {
    console.log('Connected to MongoDB server');
})
db.on('error', (err) => {
    console.error('MongoDB connecton error', err);
})
db.on('disconnected', () => {
    console.log('MongoDB disconnected');
})

// export the database connection
module.exports=db;