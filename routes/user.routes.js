const userController = require("../controllers/user.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

module.exports = function(app) {
  // Middleware to extract role from token and add to request
  app.use("/api/users", verifyToken, (req, res, next) => {
    // Extract role from token and add to request
    const token = req.headers["x-access-token"] || req.headers["authorization"];
    if (token && token.startsWith('Bearer ')) {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token.slice(7), process.env.JWT_SECRET);
      req.userRole = decoded.role;
    }
    next();
  });

  // Get all users (admin only)
  app.get("/api/users", isAdmin, userController.findAll);

  // Get a single user by ID
  app.get("/api/users/:id", userController.findOne);

  // Update a user
  app.put("/api/users/:id", userController.update);

  // Delete a user (admin only)
  app.delete("/api/users/:id", isAdmin, userController.delete);
};