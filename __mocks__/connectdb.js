const { mongo } = require('mongodb').MongoClient;
const { MongoMemoryServer } = require('mongodb-memory-server');

let db;

module.exports = async (url) => {
  if (!db) {
    const mongod = new MongoMemoryServer();
    const url = await mongod.getConnectionString();
    const client = await mongo.connect(url, { useNewUrlParser: true });
    db = client.db('burger-queen');
  }
  return db;
};
