exports.up = (knex) => knex.schema.createTable('inventory', (t) => {
  t.increments('id').primary();
  t.integer('product_id').unique().notNullable().references('id').inTable('products').onDelete('CASCADE');
  t.integer('physical_qty').notNullable().defaultTo(0);
  t.integer('reserved_qty').notNullable().defaultTo(0);
  t.integer('damaged_qty').notNullable().defaultTo(0);
  t.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  t.check('?? + ?? <= ??', ['reserved_qty', 'damaged_qty', 'physical_qty'], 'reserved_not_exceed_physical');
});
exports.down = (knex) => knex.schema.dropTableIfExists('inventory');
