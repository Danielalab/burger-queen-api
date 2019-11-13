const { ObjectId } = require('mongodb');
const db = require('../libs/connectdb');
const { getPagination } = require('./utils');

const getOrders = async (req, resp, next) => {
  const { page = 1, limit = 10 } = req.query;
  const numberOfDocumentsToSkip = (parseInt(page, 10) * parseInt(limit, 10)) - parseInt(limit, 10);
  const collectionOrders = (await db()).collection('orders');
  const numberOfDocuments = await collectionOrders.countDocuments();
  const orders = (await collectionOrders.find()
    .limit(parseInt(limit, 10))
    .skip(numberOfDocumentsToSkip)
    .toArray());
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
  resp.send(order);
}

const addOrder = async (req, resp, next) => {
  const { userId, client, products, status } = req.body;
  if (!userId || !client || !(products.length) || !status) {
    return next(400);
  }
  const collectionOrders = (await db()).collection('orders');
  const orderId = (await collectionOrders.insertOne({
    userId,
    client,
    status,
    products
  })).insertedId;
  const order = (await (await collectionOrders.aggregate([
   // { $match: '' },
    { $unwind : '$products' },
    {
      $lookup:
        {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'product-data'
        }
    },
    { $unwind: '$product-data' },
    { $addFields: { 'products.product': '$product-data' } },
    { $addFields: { 'products.product.qty': '$products.qty' } },
    { $group: {
      _id: '$_id',
      userId: { $first: '$userId' },
      client: { $first: '$client' },
      products: { $push: '$products.product' },
      status: { $first: '$status' },
    }}
  ])).toArray())[0];
  resp.send(order);
}

module.exports = {
  getOrders,
  getOrderById,
  addOrder,
}
