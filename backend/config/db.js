const mongoose = require('mongoose');

const connectDB = async () => {
  // On hosting (Render/Heroku/etc.) MONGO_URI is required.
  // NEVER fall back to the in-memory DB when it is set — otherwise
  // data is silently wiped on every restart and the memory server
  // binary download commonly fails on hosted platforms.
  if (process.env.MONGO_URI) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 30000,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`MongoDB Connection Error: ${error.message}`);
      console.error('Check that MONGO_URI is correct and MongoDB Atlas allows connections from anywhere (0.0.0.0/0).');
      process.exit(1);
    }
  }

  // Development fallback: local MongoDB, then in-memory server.
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017/taskmanager', {
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
