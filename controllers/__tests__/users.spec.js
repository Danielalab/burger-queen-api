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
    await (await db()).collection('users').deleteMany({})
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

describe('deleteUser', () => {
  let users = null;
  beforeAll(async () => {
    await db();
    const collectionUsers = (await db()).collection('users');
    users = await collectionUsers.insertMany([
      {
        email: 'test@test',
        roles: { admin: false },
      },
      {
        email: 'test@delete',
        roles: { admin: false },
      }
    ]);
  });

  afterAll(async () => {
    await (await db()).collection('users').deleteMany({})
    await db().close();
  });

  it('Deberia de poder eliminar un usuario por su uid', (done) => {
    const userId = users.insertedIds['0'];
    const req = {
      params: {
        uid: userId,
      }
    }

    const resp = {
      send: (response) => {
        expect(response._id).toEqual(userId);
        done();
      }
    }

    deleteUser(req, resp);
  })

  it('Deberia de poder eliminar un usuario por su email', (done) => {
    const req = {
      params: {
        uid: 'test@delete',
      }
    }

    const resp = {
      send: (response) => {
        expect(response.email).toBe('test@delete');
        done();
      }
    }

    deleteUser(req, resp);
  })

  it('Deberia de mostrar un error 404 si el usuario no existe', (done) => {
    const req = {
      params: {
        uid: 'abc123',
      }
    }

    const next = (code) => {
        expect(code).toBe(404);
        done();
      }

    deleteUser(req, {}, next);
  })
})

describe('updateUser', () => {
  let users = null;
  beforeAll(async () => {
    await db();
    const collectionUsers = (await db()).collection('users');
    users = await collectionUsers.insertMany([
      {
        email: 'test@test',
        roles: { admin: true },
      },
      {
        email: 'test2@test',
        roles: { admin: false },
      }
    ]);
  });

  afterAll(async () => {
    await (await db()).collection('users').deleteMany({})
    await db().close();
  });

  it('Deberia de poder actualizar un usuario por su uid', (done) => {
    const userId = users.insertedIds['0'];
    const req = {
      params: {
        uid: userId,
      },
      headers: {
        authenticatedUser: {
          roles: {
            admin: true,
          }
        }
      },
      body: {
        email: 'email@update'
      }
    }

    const resp = {
      send: (response) => {
        expect(response._id).toEqual(userId);
        expect(response.email).toBe('email@update');
        done();
      }
    }

    updateUser(req, resp);
  })

  it('Deberia de poder actualizar un usuario por su email', (done) => {
    const req = {
      params: {
        uid: 'test2@test',
      },
      headers: {
        authenticatedUser: {
          roles: {
            admin: true,
          }
        }
      },
      body: {
        email: 'email2@update'
      }
    }

    const resp = {
      send: (response) => {
        expect(response.email).toBe('email2@update');
        done();
      }
    }

    updateUser(req, resp);
  })

  it('Deberia de mostrar un error 404 si el usuario no existe', (done) => {
    const req = {
      params: {
        uid: 'abc123',
      },
      body: {
        email: 'test@notuser'
      }
    }

    const next = (code) => {
        expect(code).toBe(404);
        done();
      }

    updateUser(req, {}, next);
  })

  it('Deberia de mostrar un error 403 si un usuario no admin intenta modificar su role', (done) => {
    const userId = users.insertedIds['0'];
    const req = {
      params: {
        uid: userId,
      },
      headers: {
        authenticatedUser: {
          roles: {
            admin: false,
          }
        }
      },
      body: {
        roles: {
          admin: true,
        }
      }
    }

    const next = (code) => {
        expect(code).toBe(403);
        done();
      }

    updateUser(req, {}, next);
  })

  it('Deberia de mostrar un error 400 si no envia email o password', (done) => {
    const userId = users.insertedIds['0'];
    const req = {
      params: {
        uid: userId,
      },
      headers: {
        authenticatedUser: {
          roles: {
            admin: true,
          }
        }
      },
      body: {
        roles: {
          admin: true,
        }
      }
    }

    const next = (code) => {
        expect(code).toBe(400);
        done();
      }

    updateUser(req, {}, next);
  })
})

describe('getUserById', () => {
  let users = null;
  beforeAll(async () => {
    await db();
    const collectionUsers = (await db()).collection('users');
    users = await collectionUsers.insertMany([
      {
        email: 'user@test',
        roles: { admin: true },
      }
    ]);
  });

  afterAll(async () => {
    await (await db()).collection('users').deleteMany({})
    await db().close();
  });

  it('Deberia de poder obtener un usuario por su uid', (done) => {
    const userId = users.insertedIds['0'];
    const req = {
      params: {
        uid: userId,
      },
    };
    const resp = {
      send: (response) => {
        expect(response._id).toEqual(userId);
        done();
      }
    };
    getUserById(req, resp);
  })

  it('Deberia de poder obtener un usuario por su email', (done) => {
    const userId = users.insertedIds['0'];
    const req = {
      params: {
        uid: 'user@test',
      },
    };
    const resp = {
      send: (response) => {
        expect(response._id).toEqual(userId);
        done();
      }
    };
    getUserById(req, resp);
  })

  it('Deberia de mostar un error 404 si no existe el usuario', (done) => {
    const req = {
      params: {
        uid: 'fakeuid',
      },
    };
    const next = (code) => {
      expect(code).toEqual(404);
      done();
    }
    getUserById(req, {}, next);
  })
})

describe('getUsers', () => {
  beforeAll(async () => {
    await db();
    const collectionUsers = (await db()).collection('users');
    await collectionUsers.insertMany([
      {
        email: 'user@test',
        roles: { admin: true },
      },
      {
        email: 'user2@test',
        roles: { admin: false },
      },
      {
        email: 'user3@test',
        roles: { admin: false },
      }
    ]);
  });

  afterAll(async () => {
    await (await db()).collection('users').deleteMany({})
    await db().close();
  });

  it('Deberia de poder obtener 3 usuarios', (done) => {
    const req = {
      query: {},
    };

    const resp = {
      send: (response) => {
        expect(response.length).toBe(3);
        expect(response[0].email).toBe('user@test');
        done();
      },
      set: (nameHeader, header) => {
        expect(nameHeader).toBe('link');
        expect(header).toBe('</users?limit=10&page=1>; rel="first", </users?limit=10&page=1>; rel="prev", </users?limit=10&page=1>; rel="next", </users?limit=10&page=1>; rel="last"');
        done();
      }
    }
    getUsers(req, resp);
  })
  /* it('Deberia de poder obtener un usuario por su email', () => {})
  it('Deberia de mostar un error 404 si no existe el usuario', () => {}) */
})