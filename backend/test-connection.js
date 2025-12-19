
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function test() {
  console.log('Testing connection...');
  try {
    console.log('Trying local mongo...');
    await mongoose.connect('mongodb://127.0.0.1:27017/college_voting', { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to local mongo');
    await mongoose.disconnect();
  } catch (err) {
    console.log('Local mongo failed:', err.message);
    console.log('Trying in-memory mongo...');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('In-memory URI:', uri);
    await mongoose.connect(uri);
    console.log('Connected to in-memory mongo');
    await mongoose.disconnect();
    await mongod.stop();
  }
}

test().catch(console.error);
