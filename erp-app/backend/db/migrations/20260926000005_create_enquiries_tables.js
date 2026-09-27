const up = async (knex) => {
  await knex.schema.raw(`CREATE TYPE enquiry_status AS ENUM ('NEW','QUOTED','WON','LOST')`);
  await knex.schema.createTable('enquiries', (t) => {
    t.increments('id').primary();
    t.string('enquiry_number', 40).unique().notNullable();
    t.integer('customer_id').notNullable().references('id').inTable('customers').onDelete('RESTRICT');
    t.date('enquiry_date').notNullable().defaultTo(knex.fn.now());
    t.date('required_date');
    t.text('notes');
    t.specificType('status', 'enquiry_status').notNullable().defaultTo('NEW');
    t.integer('created_by').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    t.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
  await knex.schema.createTable('enquiry_items', (t) => {
    t.increments('id').primary();
    t.integer('enquiry_id').notNullable().references('id').inTable('enquiries').onDelete('CASCADE');
    t.integer('product_id').notNullable().references('id').inTable('products').onDelete('RESTRICT');
    t.integer('quantity').notNullable();
  });
};
const down = async (knex) => {
  await knex.schema.dropTableIfExists('enquiry_items');
  await knex.schema.dropTableIfExists('enquiries');
  await knex.schema.raw('DROP TYPE IF EXISTS enquiry_status');
};
exports.up = up;
exports.down = down;
