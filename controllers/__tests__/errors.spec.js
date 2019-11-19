const {
  addUser,
} = require('../users');

const { getProducts } = require('../products');

jest.mock('../../libs/connectdb');
const db = require('../../libs/connectdb');

describe('addUser', () => {
  beforeAll(async () => {
    await db();
  });

  afterAll(async () => {
    await db().close();
  });

  it('Deberia de mostrar un error 500 si existe un error con la DB', async (done) => {
    const req = {
      body: {
        email: 'test@error',
        password: 'test1test',
      },
    };

    const next = (code) => {
      expect(code).toBe(500);
      done();
    };

    addUser(req, {}, next);
  });
});

describe('getProducts', () => {
  beforeAll(async () => {
    await db();
  });

  afterAll(async () => {
    await db().close();
  });

  it('Deberia mostar un error 500 si ocurre un error con la DB', (done) => {
    const req = {
      query: {},
    };
    const next = (code) => {
      expect(code).toBe(500);
      done();
    };
    getProducts(req, {}, next);
  });
});
