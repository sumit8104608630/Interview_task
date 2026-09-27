const bcrypt = require('bcryptjs');
const db = require('../db');

const findByEmail = (email) => db('users').where({ email }).first();
const findById = (id) => db('users').where({ id }).first();
const create = (d) => db('users').insert(d).returning('*');
const updatePassword = (id, ph) => db('users').where({ id }).update({ password_hash: ph }).returning('*');
module.exports = { findByEmail, findById, create, updatePassword };
