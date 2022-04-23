const mongoose = require('mongoose'); // simple queries for mongoDB
const dotenv = require('dotenv');

// Uncaught exception (catching sync - reference error etc.)
// Always in the beginning
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught exception, shutting down...');
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app'); // only after dotenv.config

// 1. Data base connecton (async)

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose // for local DB - .connect(process.env.DATABASE_LOCAL, ...
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log('Successful connection to the DB');
  });

// 2. Start the server

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log('Server mode:', process.env.NODE_ENV);
  console.log(`App running on port ${port}`);
});

// Unhandled rejection (catching async - rejected promises)
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled rejection, shutting down...');
  server.close(() => process.exit(1));
});
