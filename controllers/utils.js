const isEmailValid = (email) => {
  const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regex.test(String(email).toLowerCase());
};

const isPasswordValid = (password) => password.length >= 4;

const getPagination = ({
  collectionName, numberOfDocuments, limit, currentPage,
}) => {
  const totalPages = Math.ceil(numberOfDocuments / limit);
  return {
    first: `</${collectionName}?limit=${limit}&page=${1}>; rel="first"`,
    prev: `</${collectionName}?limit=${limit}&page=${currentPage - 1 === 0 ? 1 : currentPage - 1}>; rel="prev"`,
    next: `</${collectionName}?limit=${limit}&page=${currentPage + 1 > totalPages ? totalPages : currentPage + 1}>; rel="next"`,
    last: `</${collectionName}?limit=${limit}&page=${totalPages}>; rel="last"`,
  };
};

const getDataOfEachProductOfTheOrder = async (collectionOrders, queries = []) => {
  const propsOrder = {
    _id: '$_id',
    userId: { $first: '$userId' },
    client: { $first: '$client' },
    products: { $push: '$products.data' },
    status: { $first: '$status' },
    dateEntry: { $first: '$dateEntry' },
    dateProcessed: { $first: '$dateProcessed' },
  };

  const cb = (order) => (
    order.dateProcessed !== null
      ? { ...order }
      : {
        _id: order._id,
        userId: order.userId,
        client: order.client,
        products: order.products,
        status: order.status,
        dateEntry: order.dateEntry,
      }
  );

  const specificOrderData = await (await (await collectionOrders.aggregate([
    ...queries,
    { $unwind: '$products' },
    {
      $lookup:
        {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'product-data',
        },
    },
    { $unwind: '$product-data' },
    { $addFields: { 'products.data.product': '$product-data' } },
    { $addFields: { 'products.data.qty': '$products.qty' } },
    { $group: propsOrder },
    { $sort: { _id: 1 } },
  ])).map(cb)).toArray();

  return specificOrderData;
};

module.exports = {
  isEmailValid,
  isPasswordValid,
  getPagination,
  getDataOfEachProductOfTheOrder,
};
