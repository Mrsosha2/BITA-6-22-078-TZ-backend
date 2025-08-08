require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const db = require('./models');
db.sequelize.sync()
  .then(() => {
    console.log("Database synchronized successfully.");
  })
  .catch((err) => {
    console.error("Failed to sync database:", err);
  });

// Simple route for testing
app.get('/', (req, res) => {
  res.json({ message: "Welcome to Automated Network Request and Resource Allocation System API." });
});

// Import routes
require('./routes/auth.routes')(app);
require('./routes/user.routes')(app);
require('./routes/request.routes')(app);
require('./routes/resource.routes')(app);
require('./routes/location.routes')(app);  // ADD THIS LINE

// Set port and start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});