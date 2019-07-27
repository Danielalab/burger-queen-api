const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../mongodb');

const { secret } = config;

/** @module auth */
module.exports = (app, nextMain) => {
  /**
   * @name /auth
   * @description Crea token de autenticación.
   * @path {POST} /auth
   * @body {String} email Correo
   * @body {String} password Contraseña
   * @response {String} token Token a usar para los requests sucesivos
   * @code {200} si la autenticación es correcta
   * @code {400} si no se proveen `email` o `password` o ninguno de los dos
   * @auth No requiere autenticación
   */
  app.post('/auth', async (req, resp, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(400);
    }

    // TODO: autenticar a la usuarix
    
    // verificar que existe en el usuario en la DB
    const emailExist = await (await db()).collection('users').findOne({ email: req.body.email });
    if (emailExist) return next(401);
    // verificar que la contraseña coincida con el email

  });

  return nextMain();
};
