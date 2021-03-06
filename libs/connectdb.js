const mongo = require('mongodb').MongoClient;

const { dbUrl } = require('../config');

let db;

module.exports = async () => {
  if (!db) {
    const client = await mongo.connect(dbUrl, { useUnifiedTopology: true });
    db = client.db('burger-queen');
  }
  return db;
};
