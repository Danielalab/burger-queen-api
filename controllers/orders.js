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

module.exports = {
  getOrders,
}
