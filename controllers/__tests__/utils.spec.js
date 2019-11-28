const { getPagination, getDataOfEachProductOfTheOrder } = require('../utils');
const db = require('../../libs/connectdb');

describe('getPagination', () => {
  it('Deberia retornar un objeto con los links a first, prev, next y last', () => {
    const input = {
      collectionName: 'users',
      numberOfDocuments: 45,
      limit: 10,
      currentPage: 2,
    };
    const result = getPagination(input);
    expect(result).toEqual({
      first: '</users?limit=10&page=1>; rel="first"',
      prev: '</users?limit=10&page=1>; rel="prev"',
      next: '</users?limit=10&page=3>; rel="next"',
      last: '</users?limit=10&page=5>; rel="last"',
    });
  });
});

const insertDocumentsToCollection = async (nameCollection, data) => (await db())
  .collection(nameCollection).insertMany(data);

describe('getDataOfEachProductOfTheOrder', () => {
  let productsIds;
  beforeAll(async () => {
    await db();
    const collectionProducts = (await db()).collection('products');
    productsIds = (await collectionProducts.insertMany([
      {
        name: 'Jugos de frutas natural',
        price: 7,
        image: 'http://jugo.img',
        type: 'bebidas',
        dateEntry: new Date(),
      },
      {
        name: 'Cafe americano',
        price: 5,
        image: 'http://cafe.img',
        type: 'bebidas',
        dateEntry: new Date(),
      },
    ])).insertedIds;
    const ordersFake = [
      {
        userId: 'test123456',
        client: 'Ana',
        products: [
          {
            qty: 2,
            productId: productsIds['1'],
          },
          {
            qty: 1,
            productId: productsIds['0'],
          },
        ],
        status: 'pending',
        dateEntry: new Date(),
      },
      {
        userId: 'testuserfake',
        client: 'Ivan',
        products: [
          {
            qty: 1,
            productId: productsIds['1'],
          },
        ],
        status: 'delivered',
        dateEntry: new Date(),
        dateProcessed: new Date(),
      },
    ];
    await insertDocumentsToCollection('orders', ordersFake);
  });

  afterAll(async () => {
    await (await db()).collection('products').deleteMany({});
    await db().close();
  });

  it('Deberia de obtener una orden detallada con la informacion de cada producto', async (done) => {
    const colectionOrders = (await db()).collection('orders');
    getDataOfEachProductOfTheOrder(colectionOrders)
      .then((response) => {
        expect(response[0].products.length).toBe(2);
        expect(response[0].products[0].product.name).toBe('Cafe americano');
        expect(response[0].products[0].qty).toBe(2);
        done();
      });
  });
});
