exports.up = async (knex) => {
  await knex.schema.createTable('dispatches', (t) => {
    t.increments('id').primary();
    t.string('dispatch_number', 40).unique().notNullable();
    t.integer('sales_order_id').notNullable().references('id').inTable('sales_orders').onDelete('RESTRICT');
    t.date('dispatch_date').notNullable().defaultTo(knex.fn.now());
    t.string('vehicle_number', 40);
    t.string('driver_name', 120);
    t.integer('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  await knex.schema.createTable('dispatch_items', (t) => {
    t.increments('id').primary();
    t.integer('dispatch_id').notNullable().references('id').inTable('dispatches').onDelete('CASCADE');
    t.integer('sales_order_item_id').notNullable().references('id').inTable('sales_order_items').onDelete('RESTRICT');
    t.integer('product_id').notNullable().references('id').inTable('products').onDelete('RESTRICT');
    t.integer('quantity').notNullable();
  });
};
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('dispatch_items');
  await knex.schema.dropTableIfExists('dispatches');
};
