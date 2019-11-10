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

module.exports = {
  getProducts
}
