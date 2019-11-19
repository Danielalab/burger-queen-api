const { ObjectId } = require('mongodb');
const db = require('../libs/connectdb');
const {
  getPagination,
  getDataOfEachProductOfTheOrder,
} = require('./utils');

const getOrders = async (req, resp) => {
  const { page = 1, limit = 10 } = req.query;
  const numberOfDocumentsToSkip = (parseInt(page, 10) * parseInt(limit, 10)) - parseInt(limit, 10);
  const collectionOrders = (await db()).collection('orders');
  const numberOfDocuments = await collectionOrders.countDocuments();
  const orders = (await getDataOfEachProductOfTheOrder(collectionOrders, [
    { $limit: parseInt(limit, 10) },
    { $skip: numberOfDocumentsToSkip },
  ]));
  const link = getPagination({
    collectionName: 'orders',
    numberOfDocuments,
    limit,
    currentPage: page,
  });
  resp.set('link', `${link.first}, ${link.prev}, ${link.next}, ${link.last}`);
  resp.send(orders);
};

const getOrderById = async (req, resp, next) => {
  const { orderid } = req.params;
  const collectionOrders = (await db()).collection('orders');
  let query;
  try {
    query = { _id: new ObjectId(orderid) };
  } catch (error) {
    return next(404);
  }
  const order = await collectionOrders.findOne(query);
  if (!order) {
    return next(404);
  }
  const orderDetail = (await getDataOfEachProductOfTheOrder(collectionOrders,
    [{ $match: query }]))[0];
  resp.send({ ...orderDetail, _id: orderid });
};

const addOrder = async (req, resp, next) => {
  const {
    userId, client = '', products, status = 'pending',
  } = req.body;
  if (!userId || !(products.length)) {
    return next(400);
  }
  const collectionOrders = (await db()).collection('orders');
  const orderId = (await collectionOrders.insertOne({
    userId,
    client,
    status,
    products: products.map((product) => (
      { ...product, productId: new ObjectId(product.productId) })),
    dateEntry: new Date(),
  })).insertedId;
  const order = (await getDataOfEachProductOfTheOrder(collectionOrders,
    [{ $match: { _id: new ObjectId(orderId) } }]))[0];
  resp.send({ ...order, _id: orderId });
};

const deleteOrder = async (req, resp, next) => {
  const { orderid } = req.params;
  let query;
  try {
    query = { _id: new ObjectId(orderid) };
  } catch (error) {
    return next(404);
  }
  const collectionOrders = (await db()).collection('orders');
  const order = await collectionOrders.findOne(query);
  if (!order) {
    return next(404);
  }
  const orderDetail = (await getDataOfEachProductOfTheOrder(collectionOrders,
    [{ $match: query }]))[0];
  await collectionOrders.deleteOne(query);
  resp.send(orderDetail);
};

const updateOrder = async (req, resp, next) => {
  const { orderid } = req.params;
  const {
    userId, client, products = [], status,
  } = req.body;
  let query;
  try {
    query = { _id: new ObjectId(orderid) };
  } catch (error) {
    return next(404);
  }
  if (!userId && !client && !products.length && !status) {
    return next(400);
  }
  if (status && !['pending', 'preparing', 'canceled', 'delivering', 'delivered'].includes(status)) {
    return next(400);
  }
  const collectionOrders = (await db()).collection('orders');
  const order = await collectionOrders.findOne(query);
  if (!order) {
    return next(404);
  }
  const propsUpdated = {
    userId: userId || order.userId,
    client: client || order.client,
    products: products.length
      ? products.map((product) => ({
        ...product,
        productId: new ObjectId(product.productId),
      }))
      : order.products,
    status: status || order.status,
  };
  if (status === 'delivered') {
    propsUpdated.dateProcessed = new Date();
  }
  await collectionOrders.updateOne(
    query,
    { $set: propsUpdated },
  );
  const orderDetail = (await getDataOfEachProductOfTheOrder(collectionOrders,
    [{ $match: query }]))[0];
  resp.send(orderDetail);
};

module.exports = {
  getOrders,
  getOrderById,
  addOrder,
  deleteOrder,
  updateOrder,
};
