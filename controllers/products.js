const { ObjectId } = require('mongodb');
const db = require('../libs/connectdb');
const { getPagination } = require('./utils');

const getProducts = async (req, resp, next) => {
  const { page = 1, limit = 1 } = req.query;
  const numberOfDocumentsToSkip = (parseInt(page, 10) * parseInt(limit, 10)) - parseInt(limit, 10);
  try {
    const collectionProducts = (await db()).collection('products');
    const numberOfDocuments = await collectionProducts.countDocuments();
    const products = (await collectionProducts.find()
      .limit(parseInt(limit, 10))
      .skip(numberOfDocumentsToSkip)
      .toArray())
      .map(({ _id, name, price, image, type, dateEntry }) =>
        ({_id, name, price, image, type, dateEntry}));
    const link = getPagination({
      collectionName: 'products',
      numberOfDocuments,
      limit,
      currentPage: page,
    });
    resp.set('link', `${link.first}, ${link.prev}, ${link.next}, ${link.last}`);
    resp.send(products);
  } catch (error) {
    next(500)
  }
}

const getProductById = async (req, resp, next) => {
  const { uid } = req.params;
  const collectionProducts = (await db()).collection('products');
  const product = await collectionProducts.findOne(new ObjectId(uid));
  if (!product) {
    next(404);
  }
  resp.send(
    ({ _id, name, price, type, dateEntry }) => ({ _id, name, price, type, dateEntry })
  );
}

module.exports = {
  getProducts
}
