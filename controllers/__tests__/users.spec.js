const {
  getUsers,
  getUserById,
  addUser,
  deleteUser,
  updateUser,
} = require('../users');

const db = require('../../libs/connectdb');

describe('addUsers', () => {
  beforeAll(async () => {
    await db();
  });

  afterAll(async () => {
    await db().close();
  });

  it('Deberia de poder agregar un usuario', (done) => {
    const req = {
      body: {
        email: 'test@test',
        password: 'test1test',
        roles: {
          admin: false
        }
      }
    }

    const resp = {
      send: (response) => {
        expect(response.length).toEqual(1);
        expect(response[0].email).toBe('test@test');
        done();
      }
    }

    addUser(req, resp);
  })

  it('Deberia de mostrar un error 400 si no se envia el email', (done) => {
    const req = {
      body: {
        password: 'test1test',
        roles: {
          admin: false
        }
      }
    }

    const next = (code) => {
      expect(code).toBe(400);
      done();
    }

    addUser(req, {}, next);
  })

  it('Deberia de mostrar un error 400 si no se envia el password', (done) => {
    const req = {
      body: {
        email: 'test@test',
        roles: {
          admin: false
        }
      }
    }

    const next = (code) => {
      expect(code).toBe(400);
      done();
    }

    addUser(req, {}, next);
  })

  it('Deberia de mostrar un error 403 si existe el usuario', (done) => {
    const req = {
      body: {
        email: 'test@test',
        password: 'test1test',
      }
    }

    const next = (code) => {
      expect(code).toBe(403);
      done();
    }

    addUser(req, {}, next);
  })
})
