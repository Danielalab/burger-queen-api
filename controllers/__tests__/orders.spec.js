const {
  getOrders,
  getOrderById,
  addOrder,
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
        orderId: '5dc99b50c5841032222222a2'
      },
    }
    const next = (code) => {
      expect(code).toBe(404);
      done();
    };
    getOrderById(req, {}, next);
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
    getOrderById(req, {}, next);
  })
})

describe('addOrder', () => {
  let products;
  beforeAll(async () => {
    await db();
    const collectionProducts = (await db()).collection('products');
    products = await collectionProducts.insertMany([
      {
        name: 'Hamburguesa simple',
        price: 10,
        image: 'http://burger-simple.img',
        type: 'hamburguesas',
        dateEntry: new Date(),
      },
      {
        name: 'Hamburguesa doble',
        price: 15,
        image: 'http://burger-double.img',
        type: 'hamburguesas',
        dateEntry: new Date(),
      },
      {
        name: 'Jugos de frutas natural',
        price: 7,
        image: 'http://jugo.img',
        type: 'bebidas',
        dateEntry: new Date(),
      }
    ]);
  })

  afterAll(async() => {
    await (await db()).collection(products).deleteMany({});
    await db().close();
  })

  it('Deberia de poder agregar una order', (done) => {
    const productsIds = products.insertedIds;
    const req = {
      body: {
        userId: 'test123456',
        client: 'Ana',
        products: [
          {
            qty: 2,
            productId: productsIds['2'],
          },
          {
            qty: 1,
            productId: productsIds['0'],
          }
        ],
        status: 'pending',
      },
    };

    const resp = {
      send: (response) => {
        expect(response.userId).toBe('test123456');
        expect(response.name).toBe('Ana');
        expect(response.products.length).toBe(2);
        expect(response.products[0].name).toBe('Jugos de frutas natural');
        expect(response.products[1].name).toBe('Hamburguesa simple');
        done();
      }
    }

    addOrder(req, resp);
  })

  it('Deberia de retornar un error 400 si no se envia userId', (done) => {
    const productsIds = products.insertedIds;
    const req = {
      body: {
        client: 'Ana',
        products: [
          {
            qty: 2,
            productId: productsIds['2'],
          },
          {
            qty: 1,
            productId: productsIds['0'],
          }
        ],
        status: 'pending',
      },
    };

    const next = (code) => {
      expect(code).toBe(400);
      done();
    }

    addOrder(req, {}, next);
  })

  it('Deberia de retornar un error 400 si no se envian props en body', (done) => {
    const req = {
      body: {},
    };

    const next = (code) => {
      expect(code).toBe(400);
      done();
    }

    addOrder(req, {}, next);
  })

  it('Deberia de retornar un error 400 si no se envian productos', (done) => {
    const req = {
      body: {
        userId: 'test123456',
        client: 'Ana',
        products: [],
        status: 'pending',
      },
    };

    const next = (code) => {
      expect(code).toBe(400);
      done();
    }

    addOrder(req, {}, next);
  })

})