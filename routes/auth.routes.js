const authController = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth.middleware");

module.exports = function(app) {
  // Set headers to handle CORS and set content type
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept, x-access-token, Authorization"
    );
    next();
  });

  // Register a new user
  app.post("/api/auth/register", authController.signup);

  // User login
  app.post("/api/auth/login", authController.signin);
  
  // Get user profile
  app.get("/api/auth/profile", verifyToken, authController.profile);
};