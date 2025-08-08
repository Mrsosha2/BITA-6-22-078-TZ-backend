const requestController = require("../controllers/request.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

module.exports = function(app) {
  // Middleware to extract role from token and add to request
  app.use("/api/requests", verifyToken, (req, res, next) => {
    // Extract role from token and add to request
    const token = req.headers["x-access-token"] || req.headers["authorization"];
    if (token && token.startsWith('Bearer ')) {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token.slice(7), process.env.JWT_SECRET);
      req.userRole = decoded.role;
    }
    next();
  });

  // Create a new request
  app.post("/api/requests", requestController.create);

  // Get all requests with optional filtering
  app.get("/api/requests", requestController.findAll);

  // Get a single request by ID
  app.get("/api/requests/:id", requestController.findOne);

  // Update request status (admin only)
  app.put("/api/requests/:id/status", requestController.updateStatus);

  // Cancel a request
  app.put("/api/requests/:id/cancel", requestController.cancel);

  // Generate reports on requests (admin only)
  app.get("/api/requests/reports/generate", requestController.generateReport);
}; 
