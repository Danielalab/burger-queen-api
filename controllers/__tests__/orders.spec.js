const {
  getOrders,
  getOrderById
} = require('../orders');

const db = require('../../libs/connectdb');

describe('getOrders', () => {
  beforeAll(async () => {
    await db();
    await (await db()).collection('orders').insertMany([
      {
        userId: 'test123456',
        client: 'Ana',
        products: [
          {
            qty: 2,
            product: {
              name: 'Jugos de frutas natural',
              price: 7,
              image: 'http://jugo.img',
              type: 'bebidas',
              dateEntry: new Date(),
            }
          },
          {
            qty: 1,
            product: {
              name: 'Hamburguesa simple',
              price: 10,
              image: 'http://burger-simple.img',
              type: 'hamburguesas',
              dateEntry: new Date(),
            }
          }
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
            product: {
              name: 'Hamburguesa doble',
              price: 15,
              image: 'http://burger-double.img',
              type: 'hamburguesas',
              dateEntry: new Date(),
            }
          }
        ],
        status: 'delivered',
        dateEntry: new Date(),
        dateProcessed: new Date()
      },
    ])
  })

  afterAll(async() => {
    await (await db()).collection('orders').deleteMany({});
    await db().close();
  })

  it('Deberia de obtener 2 ordenes', (done) => {
    const req = { query: {} };
    const resp = {
      send: (response) => {
        expect(response.length).toBe(2);
        expect(response[0].client).toBe('Ana');
        expect(response[0].products.length).toBe(2);
        expect(response[0].status).toBe('pending');
        expect(response[1].client).toBe('Ivan');
        expect(response[1].products.length).toBe(1);
        expect(response[1].status).toBe('delivered');
        done();
      },
      set: (nameHeader, header) => {
        expect(nameHeader).toBe('link');
        expect(header).toBe('</orders?limit=10&page=1>; rel="first", </orders?limit=10&page=1>; rel="prev", </orders?limit=10&page=1>; rel="next", </orders?limit=10&page=1>; rel="last"');
        done();
      }
    }
    getOrders(req, resp);
  })
})

describe('getOrderById', () => {
  let orders;
  beforeAll(async () => {
    await db();
    orders = await (await db()).collection('orders').insertMany([
      {
        userId: 'test123456',
        client: 'Ana',
        products: [
          {
            qty: 2,
            product: {
              name: 'Jugos de frutas natural',
              price: 7,
              image: 'http://jugo.img',
              type: 'bebidas',
              dateEntry: new Date(),
            }
          },
          {
            qty: 1,
            product: {
              name: 'Hamburguesa simple',
              price: 10,
              image: 'http://burger-simple.img',
              type: 'hamburguesas',
              dateEntry: new Date(),
            }
          }
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
            product: {
              name: 'Hamburguesa doble',
              price: 15,
              image: 'http://burger-double.img',
              type: 'hamburguesas',
              dateEntry: new Date(),
            }
          }
        ],
        status: 'delivered',
        dateEntry: new Date(),
        dateProcessed: new Date()
      },
    ])
  })

  afterAll(async() => {
    await (await db()).collection('orders').deleteMany({});
    await db().close();
  })

  it('Deberia de poder obtener una order por su id', (done) => {
    const orderId = orders.insertedIds['0'];
    const req = {
      params: { orderId },
    }
    const resp = {
      send: (response) => {
        expect(response._id).toEqual(orderId)
        expect(response.client).toBe('Ana');
        expect(response.products.length).toBe(2);
        expect(response.status).toBe('pending');
        done();
      }
    }
    getOrderById(req, resp);
  })

  it('Deberia obtener un error 404 si el usuario no existe', (done) => {
    const req = {
      params: {
        orderId: '2dc33b22c2222222222222a'
      },
    }
    const next = (code) => {
      expect(code).toBe(404);
      done();
    };
    getProductById(req, {}, next);
  })

  it('Deberia obtener un error 404 si el ID no es valido', (done) => {
    const req = {
      params: {
        orderId: 'fakeorderid'
      },
    }
    const next = (code) => {
      expect(code).toBe(404);
      done();
    };
    getProductById(req, {}, next);
  })
})