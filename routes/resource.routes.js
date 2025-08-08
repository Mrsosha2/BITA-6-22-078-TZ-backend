const resourceController = require("../controllers/resource.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

module.exports = function(app) {
  // Get all resources (public)
  app.get("/api/resources", resourceController.findAll);

  // Get a single resource by ID (public)
  app.get("/api/resources/:id", resourceController.findOne);

  // Admin-only routes below
  // Middleware to verify token for admin routes
  app.use("/api/admin/resources", verifyToken, isAdmin);

  // Create a new resource (admin only)
  app.post("/api/admin/resources", resourceController.create);

  // Update a resource (admin only)
  app.put("/api/admin/resources/:id", resourceController.update);

  // Delete a resource (admin only)
  app.delete("/api/admin/resources/:id", resourceController.delete);
};