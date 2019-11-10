const {
  getProducts
} = require('../products');

const db = require('../../libs/connectdb');

describe('getProducts', () => {
  beforeAll(async () => {
    await db();
    const collectionProducts = (await db()).collection('products');
    await collectionProducts.insertMany([
      {
        name: 'Hamburguesa simple',
        price: '10',
        image: 'http://burger-simple.img',
        type: 'hamburguesas',
        dateEntry: new Date(),
      },
      {
        name: 'Hamburguesa doble',
        price: '15',
        image: 'http://burger-double.img',
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

  it('Deberia de poder obtener los 3 productos', () => {
    const req = { query: {} };
    const resp = {
      send: (response) => {
        expect(response.length).toBe(3);
        expect(response[0].name).toBe('Hamburguesa simple');
        done();
      },
      set: (nameHeader, header) => {
        expect(nameHeader).toBe('link');
        expect(header).toBe('</products?limit=10&page=1>; rel="first", </products?limit=10&page=1>; rel="prev", </products?limit=10&page=1>; rel="next", </products?limit=10&page=1>; rel="last"')
        done();
      }
    }
    getProducts(req, resp);
  })
});