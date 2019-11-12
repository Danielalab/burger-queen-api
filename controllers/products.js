const { ObjectId } = require('mongodb');
const db = require('../libs/connectdb');
const { getPagination } = require('./utils');

const getProducts = async (req, resp, next) => {
  const { page = 1, limit = 10 } = req.query;
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
  const { productId } = req.params;
  const collectionProducts = (await db()).collection('products');
  let query;
  try {
    query = { _id: new ObjectId(productId) }
  } catch (error) {
    return next(404);
  }
  const product = await collectionProducts.findOne(query);
  if (!product) {
    return next(404);
  }
  resp.send(product);
}

const addProduct = async (req, resp, next) => {
  const { name, price, image = '', type = '' } = req.body;
  const collectionProducts = (await db()).collection('products');
  if (!name || !price) {
    return next(400);
  }
  const productId = (await collectionProducts.insertOne({
    name,
    price,
    image,
    type
  })).insertedId;
  const product = await collectionProducts.findOne({ _id: new ObjectId(productId) })
  resp.send(product);
}

const deleteProduct = async (req, resp, next) => {
  const { productId } = req.params;
  const collectionProducts = (await db()).collection('products');
  let query;
  try {
    query = { _id: new ObjectId(productId) }
  } catch (error) {
    return next(404);
  }
  const product = await collectionProducts.findOne(query);
  if (!product) {
    return next(404);
  }
  await collectionProducts.deleteOne(query);
  resp.send(product);
}

const updateProduct = async (req, resp, next) => {
  const { productId } = req.params;
  const { name, price, image, type } = req.body;
  if (!name && !price && !image && !type) {
    return next(400);
  }
  if (!(typeof price === 'number')) {
    return next(400);
  }
  let query;
  try {
    query = { _id: new ObjectId(productId) }
  } catch (error) {
    return next(404);
  }
  const collectionProducts = (await db()).collection('products');
  const product = await collectionProducts.findOne(query);
  if (!product) {
    return next(404);
  }
  await collectionProducts.updateOne(
    query,
    {
      $set: {
        name: name || product.name,
        price: price || product.price,
        type: type || product.type,
        image: image || product.image
      }
    }
  );
  const updatedProduct = await collectionProducts.findOne(query);
  resp.send(updatedProduct);
}

module.exports = {
  getProducts,
  getProductById,
  addProduct,
  deleteProduct,
  updateProduct
}
