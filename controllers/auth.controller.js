const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../models");
const User = db.user;

// Register a new user
exports.signup = async (req, res) => {
  try {
    // Validate request
    if (!req.body.full_name || !req.body.email || !req.body.password) {
      return res.status(400).send({
        message: "Full name, email, and password are required fields!"
      });
    }

    // Create a new user
    const user = {
      full_name: req.body.full_name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      phone: req.body.phone || null,
      role: req.body.role || "user"
    };

    // Save user to database
    const data = await User.create(user);
    
    res.status(201).send({
      message: "User registered successfully!",
      userId: data.user_id
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).send({
        message: "Email is already in use!"
      });
    }
    
    res.status(500).send({
      message: err.message || "Some error occurred while registering the user."
    });
  }
};

// Sign in a user
exports.signin = async (req, res) => {
  try {
    // Find user by email
    const user = await User.findOne({
      where: {
        email: req.body.email
      }
    });

    if (!user) {
      return res.status(404).send({
        message: "User not found."
      });
    }

    // Verify password
    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid password!"
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: 86400 } // 24 hours
    );

    // Return user information and token
    res.status(200).send({
      id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      accessToken: token
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred during login."
    });
  }
};

// Get current user profile
exports.profile = async (req, res) => {
  try {
    // Find user by id
    const user = await User.findByPk(req.userId, {
      attributes: ['user_id', 'full_name', 'email', 'phone', 'role', 'created_at']
    });

    if (!user) {
      return res.status(404).send({
        message: "User not found."
      });
    }

    res.status(200).send(user);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving user profile."
    });
  }
};