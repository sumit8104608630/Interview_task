const up = async (knex) => {
  await knex.schema.raw(`CREATE TYPE user_role AS ENUM ('ADMIN', 'SALES')`);
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('name', 120).notNullable();
    t.string('email', 160).unique().notNullable();
    t.text('password_hash').notNullable();
    t.specificType('role', 'user_role').notNullable().defaultTo('SALES');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
};

const down = async (knex) => {
  await knex.schema.dropTableIfExists('users');
  await knex.schema.raw('DROP TYPE IF EXISTS user_role');
};

exports.up = up;
exports.down = down;
