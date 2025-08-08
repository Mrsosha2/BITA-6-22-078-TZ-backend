const db = require("../models");
const User = db.user;
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

// Get all users (admin only)
exports.findAll = async (req, res) => {
  try {
    // Optional filtering parameters
    const fullName = req.query.name;
    const role = req.query.role;
    let condition = {};
    
    if (fullName) {
      condition.full_name = { [Op.iLike]: `%${fullName}%` };
    }
    
    if (role) {
      condition.role = role;
    }

    const users = await User.findAll({
      where: condition,
      attributes: ['user_id', 'full_name', 'email', 'phone', 'role', 'created_at']
    });

    res.status(200).send(users);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving users."
    });
  }
};

// Get a single user by ID
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    
    const user = await User.findByPk(id, {
      attributes: ['user_id', 'full_name', 'email', 'phone', 'role', 'created_at']
    });
    
    if (!user) {
      return res.status(404).send({
        message: `User with id=${id} was not found.`
      });
    }
    
    res.status(200).send(user);
  } catch (err) {
    res.status(500).send({
      message: `Error retrieving User with id=${req.params.id}`
    });
  }
};

// Update a user
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Check if the requesting user is updating their own profile or is an admin
    if (req.userId != id && req.userRole !== 'admin') {
      return res.status(403).send({
        message: "You are not authorized to update this user!"
      });
    }
    
    // Prepare update object
    const updateData = {};
    
    if (req.body.full_name) updateData.full_name = req.body.full_name;
    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.body.password) updateData.password = bcrypt.hashSync(req.body.password, 8);
    
    // Only admin can update role
    if (req.body.role && req.userRole === 'admin') {
      updateData.role = req.body.role;
    }
    
    const [updated] = await User.update(updateData, {
      where: { user_id: id }
    });
    
    if (updated === 0) {
      return res.status(404).send({
        message: `Cannot update User with id=${id}. User was not found or no changes were made.`
      });
    }
    
    res.status(200).send({
      message: "User was updated successfully."
    });
  } catch (err) {
    res.status(500).send({
      message: `Error updating User with id=${req.params.id}: ${err.message}`
    });
  }
};

// Delete a user (admin only)
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    
    const deleted = await User.destroy({
      where: { user_id: id }
    });
    
    if (deleted === 0) {
      return res.status(404).send({
        message: `Cannot delete User with id=${id}. User was not found.`
      });
    }
    
    res.status(200).send({
      message: "User was deleted successfully!"
    });
  } catch (err) {
    res.status(500).send({
      message: `Could not delete User with id=${req.params.id}: ${err.message}`
    });
  }
};