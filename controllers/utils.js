const getPagination = ({ collectionName, numberOfDocuments, limit, currentPage }) => {
  const totalPages = Math.ceil(numberOfDocuments / limit);
  return {
    first: `</${collectionName}?limit=${limit}&page=${1}>; rel="first"`,
    prev: `</${collectionName}?limit=${limit}&page=${currentPage - 1 ? 1 : currentPage - 1}>; rel="prev"`,
    next: `</${collectionName}?limit=${limit}&page=${currentPage + 1 > totalPages ? totalPages : currentPage + 1}>; rel="next"`,
    last: `</${collectionName}?limit=${limit}&page=${totalPages}>; rel="last"`,
  }
};

module.exports = {
  getPagination,
};
