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
  const specificOrderData = await collectionOrders.aggregate([
    ...queries,
    {
      $lookup:
        {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'product-data',
        },
    },
    {
      $addFields: {
        products: {
          $reduce: {
            input: '$products',
            initialValue: [],
            in: {
              $concatArrays: ['$$value', [
                {
                  product: { $arrayElemAt: ['$product-data', { $indexOfArray: ['$products', '$$this'] }] },
                  qty: '$$this.qty',
                },
              ]],
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        client: 1,
        products: 1,
        status: 1,
        dateEntry: 1,
        dateProcessed: 1,
      },
    },
  ]).toArray();
  console.log(JSON.stringify(specificOrderData, null, 4));

  return specificOrderData;
};

module.exports = {
  isEmailValid,
  isPasswordValid,
  getPagination,
  getDataOfEachProductOfTheOrder,
};
