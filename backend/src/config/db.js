const mongoose = require('mongoose');
const { env } = require('./env');

let _mongod = null;

async function connectDB() {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });

    // eslint-disable-next-line no-console
    console.log(`[DB] Connected: ${mongoose.connection.name}`);
  } catch (err) {
    // In development, fall back to an in-memory MongoDB so the app can run without a local Mongo instance.
    if (env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[DB] Failed to connect to MongoDB at', env.MONGO_URI, '- falling back to in-memory MongoDB for development.');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      _mongod = await MongoMemoryServer.create();
      const uri = _mongod.getUri();
      await mongoose.connect(uri);

      // eslint-disable-next-line no-console
      console.log(`[DB] Connected to in-memory MongoDB: ${mongoose.connection.name}`);
    } else {
      throw err;
    }
  }
}

async function stopInMemoryMongo() {
  if (_mongod) {
    await _mongod.stop();
    _mongod = null;
  }
}

module.exports = { connectDB, stopInMemoryMongo };
