exports.up = (knex) => knex.schema.createTable('products', (t) => {
  t.increments('id').primary();
  t.string('product_code', 40).unique().notNullable();
  t.string('product_name', 160).notNullable();
  t.string('category', 80);
  t.string('unit', 20).notNullable();
  t.decimal('base_price', 12, 2).notNullable();
  t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
});
exports.down = (knex) => knex.schema.dropTableIfExists('products');
