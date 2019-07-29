const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const db = require('../connectdb');

const getUsers = (req, resp) => {};

const getUserById = async (req, resp, next) => {
  const { uid } = req.params;
  const collectionUsers = (await db()).collection('users');
  const user = await collectionUsers.findOne({ _id: new ObjectId(uid) });
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
  try {
    const collectionUsers = (await db()).collection('users');
    const userExist = await collectionUsers.findOne({ email });
    if (userExist) {
      return next(403);
    }
    await collectionUsers.insertOne({
      email,
      password: bcrypt.hashSync(password, 10),
      roles: roles || { admin: false },
    });
    const users = (await collectionUsers.find().toArray())
      .map(({ _id, email, roles }) => ({ _id, email, roles }));
    resp.send(users);
  } catch (error) {
    return next(500);
  }
};

const deletedUser = (req, resp, next) => {};

const updateUser = (req, resp, next) => {};

module.exports = {
  getUsers,
  getUserById,
  addUser,
  deletedUser,
  updateUser,
};
