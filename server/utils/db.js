require('dotenv').config();
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

const mongoose = require('mongoose');

const setupDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log more details about the error
    if (error.name === 'MongooseServerSelectionError') {
      console.error('Server selection error details:', error.reason);
    }
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = setupDB;
