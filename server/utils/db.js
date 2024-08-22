require('dotenv').config();
const chalk = require('chalk');
const mongoose = require('mongoose');
const keys = require('../config/keys');
const { database } = keys;

let cachedDb = null;

const setupDB = async () => {
  if (cachedDb) {
    console.log(
      `${chalk.green('✓')} ${chalk.blue('Using cached database connection')}`
    );
    return cachedDb;
  }

  try {
    // Connect to MongoDB
    mongoose.set('useCreateIndex', true);
    await mongoose.connect(database.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    });

    cachedDb = mongoose.connection;
    console.log(`${chalk.green('✓')} ${chalk.blue('MongoDB Connected!')}`);
    return cachedDb;
  } catch (error) {
    console.error(
      `${chalk.red('✗')} ${chalk.red('MongoDB connection error:')}`,
      error
    );
    throw error; // Throw the error instead of returning null
  }
};

module.exports = setupDB;

// require('dotenv').config();
// const chalk = require('chalk');
// const mongoose = require('mongoose');

// const keys = require('../config/keys');
// const { database } = keys;

// const setupDB = async () => {
//   try {
//     // Connect to MongoDB
//     mongoose.set('useCreateIndex', true);
//     mongoose
//       .connect(database.url, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//         useFindAndModify: false
//       })
//       .then(() =>
//         console.log(`${chalk.green('✓')} ${chalk.blue('MongoDB Connected!')}`)
//       )
//       .catch(err => console.log(err));
//   } catch (error) {
//     return null;
//   }
// };

// module.exports = setupDB;
