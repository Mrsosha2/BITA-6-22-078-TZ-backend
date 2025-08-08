// routes/location.routes.js
const locationController = require("../controllers/location.controller");
const { verifyToken } = require("../middleware/auth.middleware");

module.exports = function(app) {
  // Middleware to extract role from token and add to request
  app.use("/api/locations", verifyToken, (req, res, next) => {
    // Extract role from token and add to request
    const token = req.headers["x-access-token"] || req.headers["authorization"];
    if (token && token.startsWith('Bearer ')) {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token.slice(7), process.env.JWT_SECRET);
      req.userRole = decoded.role;
    }
    next();
  });

  // Get all locations with optional filtering
  app.get("/api/locations", locationController.findAll);

  // Get a single location by ID
  app.get("/api/locations/:id", locationController.findOne);

  // Create a new location (admin only)
  app.post("/api/locations", locationController.create);

  // Update a location (admin only)
  app.put("/api/locations/:id", locationController.update);

  // Delete a location (admin only)
  app.delete("/api/locations/:id", locationController.delete);
};