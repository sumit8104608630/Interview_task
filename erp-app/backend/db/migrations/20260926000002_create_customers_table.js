exports.up = (knex) => knex.schema.createTable('customers', (t) => {
  t.increments('id').primary();
  t.string('company_name', 160).notNullable();
  t.string('contact_person', 120).notNullable();
  t.string('mobile', 20).notNullable();
  t.string('email', 160);
  t.string('city', 80);
  t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
});
exports.down = (knex) => knex.schema.dropTableIfExists('customers');
