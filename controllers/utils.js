const { ObjectId } = require('mongodb');

const getPagination = ({ collectionName, numberOfDocuments, limit, currentPage }) => {
  const totalPages = Math.ceil(numberOfDocuments / limit);
  return {
    first: `</${collectionName}?limit=${limit}&page=${1}>; rel="first"`,
    prev: `</${collectionName}?limit=${limit}&page=${currentPage - 1 === 0 ? 1 : currentPage - 1}>; rel="prev"`,
    next: `</${collectionName}?limit=${limit}&page=${currentPage + 1 > totalPages ? totalPages : currentPage + 1}>; rel="next"`,
    last: `</${collectionName}?limit=${limit}&page=${totalPages}>; rel="last"`,
  }
};

const getDataOfEachProductOfTheOrder = async (collectionOrders, queries = []) => {
  return (await (await collectionOrders.aggregate([
    ...queries,
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
    }},
    { $sort: { _id: 1 } }
  ])).toArray());
}

module.exports = {
  getPagination,
  getDataOfEachProductOfTheOrder,
};
