const mongoose = require('mongoose'); // simple queries for mongoDB
const dotenv = require('dotenv');

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
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
