const { getPagination } = require('../utils');

describe('getPagination', () => {
  it('Deberia retornar un objeto con los links a first, prev, next y last', () => {
    const input = {
      collectionName: 'users',
      numberOfDocuments: 45,
      limit: 10,
      currentPage: 2
    }
    const result = getPagination(input);
    expect(result).toEqual({
      first: '</users?limit=10&page=1>; rel="first"',
      prev: '</users?limit=10&page=1>; rel="prev"',
      next: '</users?limit=10&page=3>; rel="next"',
      last: '</users?limit=10&page=5>; rel="last"',
    });
  });
});
