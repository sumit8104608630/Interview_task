const up = async (knex) => {
  await knex.schema.raw(`CREATE TYPE order_status AS ENUM ('PENDING','CONFIRMED','DISPATCHED','CANCELLED')`);
  await knex.schema.createTable('sales_orders', (t) => {
    t.increments('id').primary();
    t.string('order_number', 40).unique().notNullable();
    t.integer('quotation_id').unique().notNullable().references('id').inTable('quotations').onDelete('RESTRICT');
    t.integer('customer_id').notNullable().references('id').inTable('customers').onDelete('RESTRICT');
    t.date('order_date').notNullable().defaultTo(knex.fn.now());
    t.decimal('total_amount', 14, 2).notNullable();
    t.specificType('status', 'order_status').notNullable().defaultTo('PENDING');
    t.integer('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.integer('confirmed_by').references('id').inTable('users').onDelete('RESTRICT');
    t.timestamp('confirmed_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  await knex.schema.createTable('sales_order_items', (t) => {
    t.increments('id').primary();
    t.integer('sales_order_id').notNullable().references('id').inTable('sales_orders').onDelete('CASCADE');
    t.integer('product_id').notNullable().references('id').inTable('products').onDelete('RESTRICT');
    t.integer('quantity').notNullable();
    t.decimal('unit_price', 12, 2).notNullable();
    t.integer('reserved_qty').notNullable().defaultTo(0);
    t.integer('dispatched_qty').notNullable().defaultTo(0);
    t.check('?? <= ??', ['dispatched_qty', 'reserved_qty'], 'dispatched_not_exceed_reserved');
  });
};
const down = async (knex) => {
  await knex.schema.dropTableIfExists('sales_order_items');
  await knex.schema.dropTableIfExists('sales_orders');
  await knex.schema.raw('DROP TYPE IF EXISTS order_status');
};
exports.up = up;
exports.down = down;
