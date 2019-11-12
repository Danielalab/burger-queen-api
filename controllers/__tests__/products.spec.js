const {
  getProducts,
  getProductById,
  addProduct,
  deleteProduct
} = require('../products');

const db = require('../../libs/connectdb');

describe('getProducts', () => {
  beforeAll(async () => {
    await db();
    const collectionProducts = (await db()).collection('products');
    await collectionProducts.insertMany([
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

  afterAll(async () => {
    await (await db()).collection('products').deleteMany({});
    await db().close();
  })

  it('Deberia de poder obtener los 3 productos', (done) => {
    const req = { query: {} };
    const resp = {
      send: (response) => {
        expect(response.length).toBe(3);
        expect(response[0].name).toBe('Hamburguesa simple');
        done();
      },
      set: (nameHeader, header) => {
        expect(nameHeader).toBe('link');
        expect(header).toBe('</products?limit=10&page=1>; rel="first", </products?limit=10&page=1>; rel="prev", </products?limit=10&page=1>; rel="next", </products?limit=10&page=1>; rel="last"');
        done();
      }
    }
    getProducts(req, resp);
  })
});

describe('getProductById', () => {
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

  afterAll(async () => {
    await (await db()).collection('products').deleteMany({});
    await db().close();
  })

  it('Deberia de poder obtener un producto por su uid', (done) => {
    const idProduct = products.insertedIds['2'];
    const req = {
      params: {
        uid: idProduct,
      }
    };
    const resp = {
      send: (response) => {
        expect(response._id).toEqual(idProduct);
        expect(response.name).toBe('Jugos de frutas natural');
        done();
      }
    };
    getProductById(req, resp);
  })

  it('Deberia de poder obtener un error 404 si no existe el producto', (done) => {
    const req = {
      params: {
        uid: '5dc99b50c5841032222222a2',
      }
    };
    const next = (code) => {
      expect(code).toBe(404);
      done();
    };
    getProductById(req, {}, next);
  })
});

describe('addProduct', () => {
  beforeAll(async () => {
    await db();
  })

  afterAll(async () => {
    await (await db()).collection('products').deleteMany({});
    await db().close();
  })

  it('Deberia de poder agregar un producto', (done) => {
    const req = {
      body: {
        name: 'Hamburguesa simple',
        price: 10,
        image: 'http://burger-simple.jpg',
        type: 'hamburguesas',
      },
    };
    const resp = {
      send: (response) => {
        expect(response.name).toBe('Hamburguesa simple');
        expect(response.price).toBe(10);
        done();
      }
    }
    addProduct(req, resp);
  })

  it('Deberia de poder agregar un producto si no envia image', (done) => {
    const req = {
      body: {
        name: 'Hamburguesa doble',
        price: 15,
        type: 'hamburguesas',
      },
    };
    const resp = {
      send: (response) => {
        expect(response.name).toBe('Hamburguesa doble');
        expect(response.price).toBe(15);
        done();
      }
    }
    addProduct(req, resp);
  })

  it('Deberia de poder agregar un producto si no envia type', (done) => {
    const req = {
      body: {
        name: 'Cafe americano',
        price: 7,
        image: 'http://image-cafe',
      },
    };
    const resp = {
      send: (response) => {
        expect(response.name).toBe('Cafe americano');
        expect(response.price).toBe(7);
        done();
      }
    }
    addProduct(req, resp);
  })

  it('Deberia de mostrar un error 400 si no se envia name', (done) => {
    const req = {
      body: {
        price: 10,
        image: 'http://burger-simple.jpg',
        type: 'hamburguesas',
        dateEntry: new Date(),
      }
    }
    const next = (code) => {
      expect(code).toBe(400);
      done();
    }
    addProduct(req, {}, next);
  })

  it('Deberia de mostrar un error 400 si no se envia price', (done) => {
    const req = {
      body: {
        name: 'Hamburguesa simple',
        image: 'http://burger-simple.jpg',
        type: 'hamburguesas',
        dateEntry: new Date(),
      }
    }
    const next = (code) => {
      expect(code).toBe(400);
      done();
    }
    addProduct(req, {}, next);
  })
})

describe('deleteProduct', () => {
  let products;
  beforeAll(async () => {
    await db();
    const collectionProducts = (await db()).collection('products');
    products = await collectionProducts.insertMany([
      {
        name: 'Hamburguesa simple',
        price: '10',
        image: 'http://burger-simple.img',
        type: 'hamburguesas',
        dateEntry: new Date(),
      },
      {
        name: 'Jugos de frutas natural',
        price: '7',
        image: 'http://jugo.img',
        type: 'bebidas',
        dateEntry: new Date(),
      }
    ]);
  })

  afterAll(async () => {
    await (await db()).collection('products').deleteMany({});
    await db().close();
  })

  it('Deberia de poder eliminar un producto por su id', (done) => {
    const productId = products.insertedIds['0'];
    const req = {
      params: {
        productId,
      }
    };
    const resp = {
      send: (response) => {
        expect(response._id).toEqual(productId);
        expect(response.name).toBe('Hamburguesa simple');
        done();
      }
    }
    deleteProduct(req, resp);
  })

  it('Deberia de mostrar un error 404 si el producto no existe', (done) => {
    const req = {
      params: {
        productId: '5ca99b50c5841032222222a2',
      }
    };
    const next = (code) => {
      expect(code).toBe(404);
      done();
    };
    deleteProduct(req, {}, next);
  })
})

describe('updateProduct', () => {
  let products;
  beforeAll(async () => {
    await db();
    const collectionProducts = (await db()).collection('products');
    products = await collectionProducts.insertMany([
      {
        name: 'Jugos de frutas natural',
        price: 7,
        image: 'http://jugo.img',
        type: 'bebidas',
        dateEntry: new Date(),
      }
    ]);
  })

  afterAll(async () => {
    await (await db()).collection('products').deleteMany({});
    await db().close();
  })

  it('Deberia de poder actualizar un producto por su id', (done) => {
    const productId = products.insertedIds('0');
    const req = {
      params: {
        productId,
      },
      body: {
        price: 8
      }
    }

    const resp = {
      send: (response) => {
        expect(response._id).toEqual(productId);
        expect(response.price).toBe(8);
        done();
      }
    }

    updateProduct(req, resp);
  })

  it('Deberia de mostar un error 400 si no hay ninguna prop a modificar', (done) => {
    const req = {
      params: {
        productId: '5ca99b50c5841032222222a2',
      },
      body: {}
    };
    const next = (code) => {
      expect(code).toBe(400);
      done();
    };

    updateProduct(req, {}, next);
  })

  it('Deberia de mostrar un error 404 si no existe el producto', (done) => {
    const req = {
      params: {
        productId: '5ca99b50c5841032222222a2',
      }
    };

    const next = (code) => {
      expect(code).toBe(404);
      done();
    };

    updateProduct(req, {}, next);
  })
})