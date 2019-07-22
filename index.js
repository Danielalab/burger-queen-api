const express = require('express');
const config = require('./config');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/error');
const routes = require('./routes');
const pkg = require('./package.json');
const mongo = require('mongodb').MongoClient;

const { port, dbUrl, secret } = config;
const app = express();

// TODO: Conexión a la BD en mogodb

mongo.connect(dbUrl, { useNewUrlParser: true }, (err, client) => {
  if (err) {
    console.error('error', err)
    return
  }
  console.log('se conecto a la bd')
  // const db = client.db('burger-queen')
});

app.set('config', config);
app.set('pkg', pkg);

// parse application/x-www-form-urlencoded
// Va a entender datos sencillos (texto) de un formulario
app.use(express.urlencoded({ extended: false }));
// nos ayuda a que podamos recibir y comprender el formato json()
app.use(express.json());
app.use(authMiddleware(secret));

// Registrar rutas
routes(app, (err) => {
  if (err) {
    console.log(error)
    throw err;
  }

  app.use(errorHandler);

  app.listen(port, () => {
    console.info(`App listening on port ${port}`);
  });
});
