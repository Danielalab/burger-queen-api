const mongo = require('mongodb').MongoClient;
let db;

module.exports = async (url) => {
  if (!db) {
    const client = await mongo.connect(url, { useNewUrlParser: true });
    db = client.db('burger-queen');
  }
  return db;
}