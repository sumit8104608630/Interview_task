const knex = require('knex');
const knexfile = require('../knexfile');
const config = require('../config/env');

const environment = config.nodeEnv || 'development';
const dbConfig = knexfile[environment];
const db = knex(dbConfig);

module.exports = db;
