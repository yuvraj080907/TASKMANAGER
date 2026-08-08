const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskmanager', {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Local Database Connection Error: ${error.message}`);
    try {
      console.log('Starting In-Memory MongoDB Server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`MongoDB Memory Server Connected successfully at: ${uri}`);
    } catch (memErr) {
      console.error(`Memory DB error: ${memErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
