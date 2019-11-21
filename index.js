const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/error');
const routes = require('./routes');
const pkg = require('./package.json');
const connectToMongoDB = require('./libs/connectdb');

const { port, dbUrl, secret } = config;
const app = express();

// TODO: Conexión a la BD en mogodb ver promesas
// no se vuelve a hacer conexion hasta que se cierra el servidor
// y se pierde el valor de la bd

const init = async () => {
  connectToMongoDB(dbUrl)
    .then(() => {
      app.set('config', config);
      app.set('pkg', pkg);

      // configura cors
      app.use(cors());

      app.use(helmet());
      // parse application/x-www-form-urlencoded
      // Va a entender datos sencillos (texto) de un formulario
      app.use(express.urlencoded({ extended: false }));
      // nos ayuda a que podamos recibir y comprender el formato json()
      app.use(express.json());
      app.use(authMiddleware(secret));

      // Registrar rutas
      routes(app, (err) => {
        if (err) {
          throw err;
        }

        app.use(errorHandler);

        app.listen(port, () => {
          console.info(`App listening on port ${port}`);
        });
      });
    });
};
// initializing db and server
init();
