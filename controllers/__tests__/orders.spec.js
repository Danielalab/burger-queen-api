const {
  getOrders,
  getOrderById,
  addOrder,
  deleteOrder,
} = require('../orders');

const db = require('../../libs/connectdb');

const insertDocumentsToCollection = async (nameCollection, data) =>
  (await db()).collection(nameCollection).insertMany(data);

const removeAllDocumentsFromTheCollection = async (nameCollection) =>
  (await db()).collection(nameCollection).deleteMany({});

const productsData = [
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
];

describe('getOrders', () => {
  beforeAll(async () => {
    await db();
    const productsIds = (await insertDocumentsToCollection('products', productsData)).insertedIds;
    const ordersFake = [
      {
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
        dateEntry: new Date(),
      },
      {
        userId: 'testuserfake',
        client: 'Ivan',
        products: [
          {
            qty: 1,
            productId: productsIds['1'],
          }
        ],
        status: 'delivered',
        dateEntry: new Date(),
        dateProcessed: new Date()
      },
    ];
    await insertDocumentsToCollection('orders', ordersFake);
  })

  afterAll(async() => {
    await removeAllDocumentsFromTheCollection('products');
    await removeAllDocumentsFromTheCollection('orders');
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
    const productsIds = (await insertDocumentsToCollection('products', productsData)).insertedIds;
    const ordersFake = [
      {
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
        dateEntry: new Date(),
      },
      {
        userId: 'testuserfake',
        client: 'Ivan',
        products: [
          {
            qty: 1,
            productId: productsIds['1'],
          }
        ],
        status: 'delivered',
        dateEntry: new Date(),
        dateProcessed: new Date()
      },
    ];
    orders = await insertDocumentsToCollection('orders', ordersFake);
  })

  afterAll(async() => {
    await removeAllDocumentsFromTheCollection('products');
    await removeAllDocumentsFromTheCollection('orders');
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

  it('Deberia obtener un error 404 si las order no existe', (done) => {
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
    products = await insertDocumentsToCollection('products', productsData);
  })

  afterAll(async() => {
    await removeAllDocumentsFromTheCollection('products');
    await removeAllDocumentsFromTheCollection('orders');
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
        expect(response.client).toBe('Ana');
        expect(response.products.length).toBe(2);
        expect(response.products[0].name).toBe('Jugos de frutas natural');
        expect(response.products[0].qty).toBe(2);
        expect(response.products[1].name).toBe('Hamburguesa simple');
        expect(response.products[1].qty).toBe(1);
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

describe('deleteOrder', () => {
  let orders;
  beforeAll(async () => {
    const productsIds = (await insertDocumentsToCollection('products', productsData)).insertedIds;
    const ordersFake = [
      {
        userId: 'testuserfake',
        client: 'Ivan',
        products: [
          {
            qty: 1,
            productId: productsIds['1'],
          }
        ],
        status: 'delivered',
        dateEntry: new Date(),
        dateProcessed: new Date()
      },
    ];
    orders = await insertDocumentsToCollection('orders', ordersFake);
  })

  afterAll(async() => {
    await removeAllDocumentsFromTheCollection('products');
    await removeAllDocumentsFromTheCollection('orders');
    await db().close();
  })

  it('Deberia de poder eliminar una orden por su id', (done) => {
    const orderId = orders.insertedIds['0'];
    const req = {
      params: {
        orderId,
      }
    };
    const resp = {
      send: (response) => {
        expect(response.client).toBe('Ivan');
        expect(response.products.length).toBe(1);
        expect(response.products[0].name).toBe('Hamburguesa doble');
        done();
      }
    };
    deleteOrder(req, resp);
  });

  it('Deberia obtener un error 404 si las order no existe', (done) => {
    const req = {
      params: {
        orderId: '5dc99b50c5841032222222a2'
      },
    }
    const next = (code) => {
      expect(code).toBe(404);
      done();
    };
    deleteOrder(req, {}, next);
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

describe('updateOrder', () => {
  let orders;
  beforeAll(async () => {
    const productsIds = (await insertDocumentsToCollection('products', productsData)).insertedIds;
    const ordersFake = [
      {
        userId: 'testuserfake',
        client: 'Ivan',
        products: [
          {
            qty: 1,
            productId: productsIds['1'],
          }
        ],
        status: 'delivered',
        dateEntry: new Date(),
        dateProcessed: new Date()
      },
    ];
    orders = await insertDocumentsToCollection('orders', ordersFake);
  })

  afterAll(async() => {
    await removeAllDocumentsFromTheCollection('products');
    await removeAllDocumentsFromTheCollection('orders');
    await db().close();
  });

  it('Deberia de poder actualizar una orden por su id', (done) => {
    const orderId = orders.insertedIds['0'];
    const req = {
      params: {
        orderId,
      },
      body: {
        client: 'clientUpdate',
      }
    };
    const resp = {
      send: (response) => {
        expect(response.client).toBe('Ivan');
        expect(response.products.length).toBe(1);
        expect(response.products[0].name).toBe('Hamburguesa doble');
        done();
      }
    };
    deleteOrder(req, resp);
  });

  it('Deberia obtener un error 404 si las order no existe', (done) => {
    const req = {
      params: {
        orderId: '5dc99b50c5841032222222a2'
      },
    }
    const next = (code) => {
      expect(code).toBe(404);
      done();
    };
    deleteOrder(req, {}, next);
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