const path = require('path');

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/erp_db',
    migrations: { directory: path.join(__dirname, 'db', 'migrations') },
    seeds: { directory: path.join(__dirname, 'db', 'seeds') },
    pool: { min: 2, max: 10 },
  },
  test: {
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/erp_db_test',
    migrations: { directory: path.join(__dirname, 'db', 'migrations') },
    seeds: { directory: path.join(__dirname, 'db', 'seeds') },
    pool: { min: 2, max: 10 },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: { directory: path.join(__dirname, 'db', 'migrations') },
    seeds: { directory: path.join(__dirname, 'db', 'seeds') },
    pool: { min: 2, max: 20 },
  },
};
