const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = () => {
  // Configurando url de la db
  const mongod = new MongoMemoryServer();

  return mongod.getConnectionString()
    .then((uri) => {
      process.env.DB_URL = uri;
    })
}