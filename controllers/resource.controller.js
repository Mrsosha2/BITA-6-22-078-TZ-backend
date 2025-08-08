const db = require("../models");
const Resource = db.resource;
const { Op } = require("sequelize");

// Create a new resource (admin only)
exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.resource_name || !req.body.quantity_total) {
      return res.status(400).send({
        message: "Resource name and quantity are required fields!"
      });
    }

    // Create a new resource
    const resource = {
      resource_name: req.body.resource_name,
      quantity_total: req.body.quantity_total,
      quantity_available: req.body.quantity_available || req.body.quantity_total
    };

    // Save resource to database
    const data = await Resource.create(resource);
    
    res.status(201).send({
      message: "Resource created successfully!",
      resource: data
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Resource."
    });
  }
};

// Get all resources
exports.findAll = async (req, res) => {
  try {
    // Optional filtering parameter
    const name = req.query.name;
    const available = req.query.available;
    
    let condition = {};
    
    if (name) {
      condition.resource_name = { [Op.iLike]: `%${name}%` };
    }
    
    if (available === 'true') {
      condition.quantity_available = { [Op.gt]: 0 };
    }

    const resources = await Resource.findAll({
      where: condition,
      order: [['resource_name', 'ASC']]
    });

    res.status(200).send(resources);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving resources."
    });
  }
};

// Get a single resource by ID
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    
    const resource = await Resource.findByPk(id);
    
    if (!resource) {
      return res.status(404).send({
        message: `Resource with id=${id} was not found.`
      });
    }
    
    res.status(200).send(resource);
  } catch (err) {
    res.status(500).send({
      message: `Error retrieving Resource with id=${req.params.id}`
    });
  }
};

// Update a resource (admin only)
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    
    const resource = await Resource.findByPk(id);
    
    if (!resource) {
      return res.status(404).send({
        message: `Resource with id=${id} was not found.`
      });
    }
    
    // Prepare update object
    const updateData = {};
    
    if (req.body.resource_name !== undefined) updateData.resource_name = req.body.resource_name;
    
    if (req.body.quantity_total !== undefined) {
      updateData.quantity_total = req.body.quantity_total;
      
      // Adjust available quantity if total is changed
      const diff = req.body.quantity_total - resource.quantity_total;
      if (diff !== 0) {
        updateData.quantity_available = resource.quantity_available + diff;
      }
    }
    
    if (req.body.quantity_available !== undefined) {
      // Ensure quantity_available doesn't exceed quantity_total
      const maxAvailable = updateData.quantity_total !== undefined 
        ? updateData.quantity_total 
        : resource.quantity_total;
        
      updateData.quantity_available = Math.min(req.body.quantity_available, maxAvailable);
    }
    
    const [updated] = await Resource.update(updateData, {
      where: { resource_id: id }
    });
    
    if (updated === 0) {
      return res.status(404).send({
        message: `Cannot update Resource with id=${id}. Resource was not found or no changes were made.`
      });
    }
    
    res.status(200).send({
      message: "Resource was updated successfully."
    });
  } catch (err) {
    res.status(500).send({
      message: `Error updating Resource with id=${req.params.id}: ${err.message}`
    });
  }
};

// Delete a resource (admin only)
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    
    const deleted = await Resource.destroy({
      where: { resource_id: id }
    });
    
    if (deleted === 0) {
      return res.status(404).send({
        message: `Cannot delete Resource with id=${id}. Resource was not found.`
      });
    }
    
    res.status(200).send({
      message: "Resource was deleted successfully!"
    });
  } catch (err) {
    res.status(500).send({
      message: `Could not delete Resource with id=${req.params.id}: ${err.message}`
    });
  }
};