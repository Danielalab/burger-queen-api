const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const db = require('../libs/connectdb');
const { getPagination, isEmailValid, isPasswordValid } = require('./utils');

const getUsers = async (req, resp) => {
  const { page = 1, limit = 10 } = req.query;
  const numberOfDocumentsToSkip = (parseInt(page, 10) * parseInt(limit, 10)) - parseInt(limit, 10);
  const collectionUsers = (await db()).collection('users');
  const numberOfDocuments = (await collectionUsers.countDocuments());
  const users = (await collectionUsers.find()
    .limit(parseInt(limit, 10))
    .skip(numberOfDocumentsToSkip)
    .toArray())
    .map(({ _id, email, roles }) => ({ _id, email, roles }));
  const link = getPagination({
    collectionName: 'users',
    numberOfDocuments,
    limit,
    currentPage: page,
  });
  resp.set('link', `${link.first}, ${link.prev}, ${link.next}, ${link.last}`);
  resp.send(users);
};

const getUserById = async (req, resp, next) => {
  const { uid } = req.params;
  const collectionUsers = (await db()).collection('users');
  let query;
  try {
    query = { _id: new ObjectId(uid) };
  } catch (error) {
    query = { email: uid };
  }

  const user = await collectionUsers.findOne(query);
  if (!user) {
    return next(404);
  }
  resp.send({ _id: user._id, email: user.email, roles: user.roles });
};

const addUser = async (req, resp, next) => {
  const { email, password, roles } = req.body;
  if (!email || !password) {
    return next(400);
  }
  if (!(isEmailValid(email) && isPasswordValid(password))) {
    return next(400);
  }
  try {
    const collectionUsers = (await db()).collection('users');
    const userExist = await collectionUsers.findOne({ email });
    if (userExist) {
      return next(403);
    }
    const userId = (await collectionUsers.insertOne({
      email,
      password: bcrypt.hashSync(password, 10),
      roles: roles || { admin: false },
    })).insertedId;
    const user = (await collectionUsers.findOne({ _id: new ObjectId(userId) }));
    resp.send({
      _id: user._id,
      email: user.email,
      roles: user.roles,
    });
  } catch (error) {
    return next(500);
  }
};

const deleteUser = async (req, resp, next) => {
  const { uid } = req.params;
  const collectionUsers = (await db()).collection('users');
  let query;
  try {
    query = { _id: new ObjectId(uid) };
  } catch (error) {
    query = { email: uid };
  }
  const user = await collectionUsers.findOne(query);
  if (!user) {
    return next(404);
  }
  await collectionUsers.deleteOne(query);
  resp.send({ _id: user._id, email: user.email, roles: user.roles });
};

const updateUser = async (req, resp, next) => {
  const { uid } = req.params;
  const { email, password, roles } = req.body;

  const collectionUsers = (await db()).collection('users');
  let query;
  try {
    query = { _id: new ObjectId(uid) };
  } catch (error) {
    query = { email: uid };
  }
  const user = await collectionUsers.findOne(query);
  if (!user) {
    return next(404);
  }
  if (roles && !req.headers.authenticatedUser.roles.admin && roles.admin) {
    return next(403);
  }
  if (!(email || password)) {
    return next(400);
  }

  await collectionUsers.updateOne(
    query,
    {
      $set: {
        email: email || user.email,
        password: password ? bcrypt.hashSync(password, 10) : user.password,
        roles: roles || user.roles,
      },
    },
  );
  const updatedUser = await collectionUsers.findOne({ _id: new ObjectId(user._id) });
  resp.send(updatedUser);
};

module.exports = {
  getUsers,
  getUserById,
  addUser,
  deleteUser,
  updateUser,
};
