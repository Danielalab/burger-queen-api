const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const db = require('../libs/connectdb');

module.exports = (secret) => async (req, resp, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return next();
  }

  const [type, token] = authorization.split(' ');

  if (type.toLowerCase() !== 'bearer') {
    return next();
  }

  try {
    const decodedToken = jwt.verify(token, secret);
    // TODO: Verificar identidad del usuario usando `decodeToken.uid`
    const userExist = await (await db()).collection('users').findOne(
      { _id: new ObjectId(decodedToken.uid) },
    );
    if (!userExist) {
      return next(404);
    }
    req.headers.authenticatedUser = userExist;
    next();
  } catch (error) {
    return next(403);
  }
};


module.exports.isAuthenticated = (req) => (
  // TODO: decidir por la informacion del request si la usuaria esta autenticada
  req.headers.authenticatedUser
);


module.exports.isAdmin = (req) => (
  // TODO: decidir por la informacion del request si la usuaria es admin
  req.headers.authenticatedUser.roles.admin
);


module.exports.isTheUserToConsult = (req) => (
  req.headers.authenticatedUser._id.toString() === req.params.uid
  || req.headers.authenticatedUser.email === req.params.uid
);

module.exports.requireAdminOrTheUserToConsult = (req, resp, next) => (
  module.exports.isAdmin(req) || module.exports.isTheUserToConsult(req)
    ? next()
    : next(403)
);


module.exports.requireAuth = (req, resp, next) => (
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : next()
);


module.exports.requireAdmin = (req, resp, next) => (
  // eslint-disable-next-line no-nested-ternary
  (!module.exports.isAuthenticated(req))
    ? next(401)
    : (!module.exports.isAdmin(req))
      ? next(403)
      : next()
);
