const { ObjectId } = require('mongodb');
const db = require('../libs/connectdb');
const {
  getPagination,
  getDataOfEachProductOfTheOrder
} = require('./utils');

const getOrders = async (req, resp, next) => {
  const { page = 1, limit = 10 } = req.query;
  const numberOfDocumentsToSkip = (parseInt(page, 10) * parseInt(limit, 10)) - parseInt(limit, 10);
  const collectionOrders = (await db()).collection('orders');
  const numberOfDocuments = await collectionOrders.countDocuments();
  const orders = (await getDataOfEachProductOfTheOrder(collectionOrders, [
    { $limit: parseInt(limit, 10) },
    { $skip: numberOfDocumentsToSkip }
  ]));
  const link = getPagination({
    collectionName: 'orders',
    numberOfDocuments,
    limit,
    currentPage: page,
  });
  resp.set('link', `${link.first}, ${link.prev}, ${link.next}, ${link.last}`);
  resp.send(orders);
}

const getOrderById = async (req, resp, next) => {
  const { orderId } = req.params;
  const collectionOrders = (await db()).collection('orders');
  let query;
  try {
    query = { _id: new ObjectId(orderId)};
  } catch (error) {
    return next(404); 
  }
  const order = await collectionOrders.findOne(query);
  if (!order) {
    return next(404);
  }
  const orderDetail = (await getDataOfEachProductOfTheOrder(collectionOrders, [{ $match: query }]))[0];
  resp.send(orderDetail);
}

const addOrder = async (req, resp, next) => {
  const { userId, client = '', products, status = '' } = req.body;
  if (!userId || !(products.length)) {
    return next(400);
  }
  const collectionOrders = (await db()).collection('orders');
  const orderId = (await collectionOrders.insertOne({
    userId,
    client,
    status,
    products: products.map(product => ({ ...product, productId: new ObjectId(product.productId) })),
    dateEntry: new Date(),
  })).insertedId;
  const order = (await getDataOfEachProductOfTheOrder(collectionOrders, [{ $match: { _id: new ObjectId(orderId) } }]))[0];
  resp.send(order);
}

const deleteOrder = async (req, resp, next) => {
  const { orderId } = req.params;
  let query;
  try {
    query = { _id: new ObjectId(orderId) };
  } catch (error) {
    return next(404);
  }
  const collectionOrders = (await db()).collection('orders');
  const order = await collectionOrders.findOne(query);
  if (!order) {
    return next(404);
  }
  const orderDetail = (await getDataOfEachProductOfTheOrder(collectionOrders, [{ $match: query }]))[0];
  resp.send(orderDetail);
}

const updateOrder = async (req, resp, next) => {
  const { orderId } = req.params;
  let query;
  try {
    query = { _id: new ObjectId(orderId) };
  } catch (error) {
    return next(404);
  }
  const collectionOrders = (await db()).collection('orders'); 
  const order = await collectionOrders.findOne(query);
  if (!order) {
    return next(404);
  }
  const orderDetail = (await getDataOfEachProductOfTheOrder(collectionOrders, [ { $match: query} ]))[0];
  resp.send(orderDetail);
}

module.exports = {
  getOrders,
  getOrderById,
  addOrder,
  deleteOrder,
  updateOrder,
}
