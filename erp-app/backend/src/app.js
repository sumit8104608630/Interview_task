const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const errorHandler = require('../middlewares/errorHandler');

const auth = require('../routes/authRoutes');
const customers = require('../routes/customerRoutes');
const products = require('../routes/productRoutes');
const inventory = require('../routes/inventoryRoutes');
const enquiries = require('../routes/enquiryRoutes');
const quotations = require('../routes/quotationRoutes');
const salesOrders = require('../routes/salesOrderRoutes');
const dispatches = require('../routes/dispatchRoutes');
const dashboard = require('../routes/dashboardRoutes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const opts = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'PERN ERP API', version: '1.0.0', description: 'PERN ERP Backend' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: [path.join(__dirname, '..', 'routes', '*Routes.js')],
};
try {
  const spec = swaggerJsdoc(opts);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
} catch (e) { /* ignore */ }

app.get('/api/health', (req, res) => res.json({ data: { status: 'ok', timestamp: new Date().toISOString() }, error: null }));
app.use('/api/auth', auth);
app.use('/api/customers', customers);
app.use('/api/products', products);
app.use('/api/inventory', inventory);
app.use('/api/enquiries', enquiries);
app.use('/api/quotations', quotations);
app.use('/api/sales-orders', salesOrders);
app.use('/api/dispatches', dispatches);
app.use('/api/dashboard', dashboard);

app.use('/api/*', (req, res) => {
  res.status(404).json({ data: null, error: { message: `Endpoint not found: ${req.method} ${req.originalUrl}` } });
});

app.use(errorHandler);
module.exports = app;
