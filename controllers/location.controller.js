const db = require("../models");
const Location = db.location;
const { Op } = require("sequelize");

// Get all locations or filter by availability
exports.findAll = async (req, res) => {
  try {
    const available = req.query.available;
    
    let condition = {};
    
    // Filter by network availability if specified
    if (available === 'true') {
      condition.is_network_available = true;
    } else if (available === 'false') {
      condition.is_network_available = false;
    }
    
    const locations = await Location.findAll({
      where: condition,
      order: [['area_name', 'ASC']]
    });
    
    res.status(200).send(locations);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving locations."
    });
  }
};

// Get a single location by ID
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    
    const location = await Location.findByPk(id);
    
    if (!location) {
      return res.status(404).send({
        message: `Location with id=${id} was not found.`
      });
    }
    
    res.status(200).send(location);
  } catch (err) {
    res.status(500).send({
      message: `Error retrieving Location with id=${req.params.id}: ${err.message}`
    });
  }
};

// Create a new location (admin only)
exports.create = async (req, res) => {
  try {
    // Check if user is admin
    if (req.userRole !== 'admin') {
      return res.status(403).send({
        message: "You are not authorized to create locations!"
      });
    }

    // Validate request
    if (!req.body.area_name) {
      return res.status(400).send({
        message: "Area name is required!"
      });
    }

    // Create location - REMOVED description field
    const location = {
      area_name: req.body.area_name,
      is_network_available: req.body.is_network_available || false
    };

    const newLocation = await Location.create(location);
    
    res.status(201).send({
      message: "Location created successfully!",
      location: newLocation
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Location."
    });
  }
};

// Update a location (admin only)
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Check if user is admin
    if (req.userRole !== 'admin') {
      return res.status(403).send({
        message: "You are not authorized to update locations!"
      });
    }

    const location = await Location.findByPk(id);
    
    if (!location) {
      return res.status(404).send({
        message: `Location with id=${id} was not found.`
      });
    }

    // Update location - REMOVED description field
    await location.update({
      area_name: req.body.area_name || location.area_name,
      is_network_available: req.body.is_network_available !== undefined 
        ? req.body.is_network_available 
        : location.is_network_available
    });
    
    res.status(200).send({
      message: "Location updated successfully!",
      location: location
    });
  } catch (err) {
    res.status(500).send({
      message: `Error updating Location with id=${req.params.id}: ${err.message}`
    });
  }
};

// Delete a location (admin only)
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Check if user is admin
    if (req.userRole !== 'admin') {
      return res.status(403).send({
        message: "You are not authorized to delete locations!"
      });
    }

    const location = await Location.findByPk(id);
    
    if (!location) {
      return res.status(404).send({
        message: `Location with id=${id} was not found.`
      });
    }

    await location.destroy();
    
    res.status(200).send({
      message: "Location deleted successfully!"
    });
  } catch (err) {
    res.status(500).send({
      message: `Error deleting Location with id=${req.params.id}: ${err.message}`
    });
  }
};