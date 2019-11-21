const {
  getOrders,
  getOrderById,
  addOrder,
  deleteOrder,
  updateOrder,
} = require('../orders');

const db = require('../../libs/connectdb');

const insertDocumentsToCollection = async (nameCollection, data) => (await db())
  .collection(nameCollection).insertMany(data);

const removeAllDocumentsFromTheCollection = async (nameCollection) => (await db())
  .collection(nameCollection).deleteMany({});

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
  },
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
    await removeAllDocumentsFromTheCollection('products');
    await removeAllDocumentsFromTheCollection('orders');
    await db().close();
  });

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
      },
    };
    getOrders(req, resp);
  });
});

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
            productId: productsIds['1'].toString(),
          },
        ],
        status: 'delivered',
        dateEntry: new Date(),
        dateProcessed: new Date(),
      },
    ];
    orders = await insertDocumentsToCollection('orders', ordersFake);
  });

  afterAll(async () => {
    await removeAllDocumentsFromTheCollection('products');
    await removeAllDocumentsFromTheCollection('orders');
    await db().close();
  });

  it('Deberia de poder obtener una order por su id', (done) => {
    const orderId = orders.insertedIds['0'];
    const req = {
      params: { orderid: orderId.toString() },
    };
    const resp = {
      send: (response) => {
        expect(response._id).toEqual(orderId.toString());
        expect(response.client).toBe('Ana');
        expect(response.products.length).toBe(2);
        expect(response.status).toBe('pending');
        done();
      },
    };
    getOrderById(req, resp);
  });

  it('Deberia obtener un error 404 si las order no existe', (done) => {
    const req = {
      params: {
        orderid: '5dc99b50c5841032222222a2',
      },
    };
    const next = (code) => {
      expect(code).toBe(404);
      done();
    };
    getOrderById(req, {}, next);
  });

  it('Deberia obtener un error 404 si el ID no es valido', (done) => {
    const req = {
      params: {
        orderid: 'fakeorderid',
      },
    };
    const next = (code) => {
      expect(code).toBe(404);
      done();
    };
    getOrderById(req, {}, next);
  });
});

describe('addOrder', () => {
  let products;
  beforeAll(async () => {
    await db();
    products = await insertDocumentsToCollection('products', productsData);
  });

  afterAll(async () => {
    await removeAllDocumentsFromTheCollection('products');
    await removeAllDocumentsFromTheCollection('orders');
    await db().close();
  });

  it.only('Deberia de poder agregar una order', (done) => {
    const productsIds = products.insertedIds;
    const req = {
      body: {
        userId: 'test123456',
        client: 'Ana',
        products: [
          {
            qty: 2,
            productId: productsIds['2'].toString(),
          },
          {
            qty: 1,
            productId: productsIds['0'].toString(),
          },
        ],
        status: 'pending',
      },
    };

    const resp = {
      send: (response) => {
        console.log(response.products);
        expect(response.userId).toBe('test123456');
        expect(response.client).toBe('Ana');
        expect(response.products.length).toBe(2);
        expect(response.products[0].product.name).toBe('Jugos de frutas natural');
        expect(response.products[0].qty).toBe(2);
        expect(response.products[1].product.name).toBe('Hamburguesa simple');
        expect(response.products[1].qty).toBe(1);
        done();
      },
    };

    addOrder(req, resp);
  });

  it('Deberia de retornar un error 400 si no se envia userId', (done) => {
    const productsIds = products.insertedIds;
    const req = {
      body: {
        client: 'Ana',
        products: [
          {
            qty: 2,
            productId: productsIds['2'].toString(),
          },
          {
            qty: 1,
            productId: productsIds['0'].toString(),
          },
        ],
        status: 'pending',
      },
    };

    const next = (code) => {
      expect(code).toBe(400);
      done();
    };

    addOrder(req, {}, next);
  });

  it('Deberia de retornar un error 400 si no se envian props en body', (done) => {
    const req = {
      body: {},
    };

    const next = (code) => {
      expect(code).toBe(400);
      done();
    };

    addOrder(req, {}, next);
  });

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
    };

    addOrder(req, {}, next);
  });
});

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
          },
        ],
        status: 'delivered',
        dateEntry: new Date(),
        dateProcessed: new Date(),
      },
    ];
    orders = await insertDocumentsToCollection('orders', ordersFake);
  });

  afterAll(async () => {
    await removeAllDocumentsFromTheCollection('products');
    await removeAllDocumentsFromTheCollection('orders');
    await db().close();
  });

  it('Deberia de poder eliminar una orden por su id', (done) => {
    const orderId = orders.insertedIds['0'];
    const req = {
      params: {
        orderid: orderId.toString(),
      },
    };
    const resp = {
      send: (response) => {
        expect(response.client).toBe('Ivan');
        expect(response.products.length).toBe(1);
        expect(response.products[0].product.name).toBe('Hamburguesa doble');
        done();
      },
    };
    deleteOrder(req, resp);
  });

  it('Deberia obtener un error 404 si las order no existe', (done) => {
    const req = {
      params: {
        orderid: '5dc99b50c5841032222222a2',
      },
    };
    const next = (code) => {
      expect(code).toBe(404);
      done();
    };
    deleteOrder(req, {}, next);
  });

  it('Deberia obtener un error 404 si el ID no es valido', (done) => {
    const req = {
      params: {
        orderid: 'fakeid',
      },
    };
    const next = (code) => {
      expect(code).toBe(404);
      done();
    };
    deleteOrder(req, {}, next);
  });
});

describe('updateOrder', () => {
  let orders;
  let productsIds;
  beforeAll(async () => {
    productsIds = (await insertDocumentsToCollection('products', productsData)).insertedIds;
    const ordersFake = [
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
    orders = await insertDocumentsToCollection('orders', ordersFake);
  });

  afterAll(async () => {
    await removeAllDocumentsFromTheCollection('products');
    await removeAllDocumentsFromTheCollection('orders');
    await db().close();
  });

  it('Deberia de poder actualizar una orden por su id', (done) => {
    const orderId = orders.insertedIds['0'];
    const req = {
      params: {
        orderid: orderId.toString(),
      },
      body: {
        client: 'clientUpdate',
        status: 'delivered',
        userId: 'userfakeId',
      },
    };
    const resp = {
      send: (response) => {
        expect(response.client).toBe('clientUpdate');
        expect(response.status).toBe('delivered');
        expect(response.products.length).toBe(1);
        expect(response.products[0].product.name).toBe('Hamburguesa doble');
        done();
      },
    };
    updateOrder(req, resp);
  });

  it('Deberia de poder actualizar los productos de una order', (done) => {
    const orderId = orders.insertedIds['0'];
    const req = {
      params: {
        orderid: orderId.toString(),
      },
      body: {
        products: [
          {
            qty: 3,
            productId: productsIds['1'].toString(),
          },
        ],
      },
    };
    const resp = {
      send: (response) => {
        expect(response.products.length).toBe(1);
        expect(response.products[0].qty).toBe(3);
        expect(response.products[0].product.name).toBe('Hamburguesa doble');
        done();
      },
    };
    updateOrder(req, resp);
  });

  it('Deberia obtener un error 400 si no se envian props', (done) => {
    const req = {
      params: {
        orderid: '5dc99b50c5841032222222a2',
      },
      body: {},
    };
    const next = (code) => {
      expect(code).toBe(400);
      done();
    };
    updateOrder(req, {}, next);
  });

  it('Deberia obtener un error 400 si envia mal la prop status', (done) => {
    const req = {
      params: {
        orderid: '5dc99b50c5841032222222a2',
      },
      body: {
        status: 'fake status',
      },
    };
    const next = (code) => {
      expect(code).toBe(400);
      done();
    };
    updateOrder(req, {}, next);
  });

  it('Deberia obtener un error 404 si las order no existe', (done) => {
    const req = {
      params: {
        orderid: '5dc99b50c5841032222222a2',
      },
      body: {
        status: 'delivered',
      },
    };
    const next = (code) => {
      expect(code).toBe(404);
      done();
    };
    updateOrder(req, {}, next);
  });

  it('Deberia obtener un error 404 si el ID no es valido', (done) => {
    const req = {
      params: {
        orderid: 'fakeorderid',
      },
      body: {},
    };
    const next = (code) => {
      expect(code).toBe(404);
      done();
    };
    updateOrder(req, {}, next);
  });
});
