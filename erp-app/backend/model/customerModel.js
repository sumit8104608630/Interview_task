const db = require('../db');
const findAll = () => db('customers').orderBy('created_at', 'desc');
const findById = (id) => db('customers').where({ id }).first();
const create = (d) => db('customers').insert(d).returning('*');
const update = (id, d) => db('customers').where({ id }).update(d).returning('*');
const remove = (id) => db('customers').where({ id }).del();
const count = async () => parseInt((await db('customers').count('* as total').first()).total, 10);
module.exports = { findAll, findById, create, update, remove, count };
