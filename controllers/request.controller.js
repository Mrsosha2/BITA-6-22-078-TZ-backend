const db = require("../models");
const Request = db.request;
const Location = db.location;
const Resource = db.resource;
const RequestResource = db.requestResource;
const Notification = db.notification;
const User = db.user;
const { Op } = require("sequelize");

// Create a new network request
exports.create = async (req, res) => {
  const t = await db.sequelize.transaction();
  
  try {
    // Validate request
    if (!req.body.location_id || !req.body.connection_type) {
      return res.status(400).send({
        message: "Location and connection type are required fields!"
      });
    }

    // Check if network is available at the requested location
    const location = await Location.findByPk(req.body.location_id);
    
    if (!location) {
      return res.status(404).send({
        message: "Location not found!"
      });
    }
    
    if (!location.is_network_available) {
      return res.status(400).send({
        message: "Network is not available at the requested location!"
      });
    }

    // Create a new request
    const request = {
      user_id: req.userId,
      location_id: req.body.location_id,
      connection_type: req.body.connection_type,
      status: "Pending"
    };

    // Save request to database
    const newRequest = await Request.create(request, { transaction: t });
    
    // If resources are specified, check and allocate them
    if (req.body.resources && req.body.resources.length > 0) {
      for (const resource of req.body.resources) {
        const resourceData = await Resource.findByPk(resource.resource_id, { transaction: t });
        
        if (!resourceData) {
          await t.rollback();
          return res.status(404).send({
            message: `Resource with id=${resource.resource_id} not found!`
          });
        }
        
        if (resourceData.quantity_available < resource.quantity) {
          await t.rollback();
          return res.status(400).send({
            message: `Insufficient quantity of ${resourceData.resource_name} available!`
          });
        }
        
        // Add resource to request
        await RequestResource.create({
          request_id: newRequest.request_id,
          resource_id: resource.resource_id,
          quantity_used: resource.quantity
        }, { transaction: t });
        
        // Update available resource quantity
        await resourceData.update({
          quantity_available: resourceData.quantity_available - resource.quantity
        }, { transaction: t });
      }
    }
    
    // Create notification for the user
    await Notification.create({
      user_id: req.userId,
      message: `Your network request #${newRequest.request_id} has been submitted and is pending review.`,
      seen: false
    }, { transaction: t });
    
    await t.commit();
    
    res.status(201).send({
      message: "Network request submitted successfully!",
      requestId: newRequest.request_id
    });
  } catch (err) {
    await t.rollback();
    res.status(500).send({
      message: err.message || "Some error occurred while creating the Request."
    });
  }
};

// Get all requests or filter by user_id, status, or date range
exports.findAll = async (req, res) => {
  try {
    // Build query conditions
    const userId = req.query.user_id;
    const status = req.query.status;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    
    let condition = {};
    
    // If not admin, show only user's own requests
    if (req.userRole !== 'admin') {
      condition.user_id = req.userId;
    } else if (userId) {
      condition.user_id = userId;
    }
    
    if (status) {
      condition.status = status;
    }
    
    if (startDate && endDate) {
      condition.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      condition.created_at = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      condition.created_at = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    const requests = await Request.findAll({
      where: condition,
      include: [
        {
          model: Location,
          attributes: ['location_id', 'area_name']
        },
        {
          model: User,
          attributes: ['user_id', 'full_name', 'email']
        },
        {
          model: Resource,
          through: {
            attributes: ['quantity_used']
          },
          attributes: ['resource_id', 'resource_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).send(requests);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving requests."
    });
  }
};

// Get a single request by ID
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    
    const request = await Request.findByPk(id, {
      include: [
        {
          model: Location,
          attributes: ['location_id', 'area_name']
        },
        {
          model: User,
          attributes: ['user_id', 'full_name', 'email']
        },
        {
          model: Resource,
          through: {
            attributes: ['quantity_used']
          },
          attributes: ['resource_id', 'resource_name']
        }
      ]
    });
    
    if (!request) {
      return res.status(404).send({
        message: `Request with id=${id} was not found.`
      });
    }
    
    // Check if user is authorized to view this request
    if (req.userRole !== 'admin' && request.user_id !== req.userId) {
      return res.status(403).send({
        message: "You are not authorized to view this request!"
      });
    }
    
    res.status(200).send(request);
  } catch (err) {
    res.status(500).send({
      message: `Error retrieving Request with id=${req.params.id}: ${err.message}`
    });
  }
};

// Update a request status
exports.updateStatus = async (req, res) => {
  const t = await db.sequelize.transaction();
  
  try {
    const id = req.params.id;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).send({
        message: "Status is required!"
      });
    }
    
    // Only admin can update request status
    if (req.userRole !== 'admin') {
      return res.status(403).send({
        message: "You are not authorized to update request status!"
      });
    }
    
    const request = await Request.findByPk(id, { transaction: t });
    
    if (!request) {
      await t.rollback();
      return res.status(404).send({
        message: `Request with id=${id} was not found.`
      });
    }
    
    // Update request status
    await request.update({ status }, { transaction: t });
    
    // Create notification for the user
    await Notification.create({
      user_id: request.user_id,
      message: `Your network request #${id} status has been updated to ${status}.`,
      seen: false
    }, { transaction: t });
    
    await t.commit();
    
    res.status(200).send({
      message: "Request status updated successfully!"
    });
  } catch (err) {
    await t.rollback();
    res.status(500).send({
      message: `Error updating Request status with id=${req.params.id}: ${err.message}`
    });
  }
};

// Cancel a request
exports.cancel = async (req, res) => {
  const t = await db.sequelize.transaction();
  
  try {
    const id = req.params.id;
    
    const request = await Request.findByPk(id, {
      include: [
        {
          model: Resource,
          through: {
            attributes: ['quantity_used']
          }
        }
      ],
      transaction: t
    });
    
    if (!request) {
      await t.rollback();
      return res.status(404).send({
        message: `Request with id=${id} was not found.`
      });
    }
    
    // Check if user is authorized to cancel this request
    if (req.userRole !== 'admin' && request.user_id !== req.userId) {
      await t.rollback();
      return res.status(403).send({
        message: "You are not authorized to cancel this request!"
      });
    }
    
    // Can only cancel pending requests
    if (request.status !== 'Pending') {
      await t.rollback();
      return res.status(400).send({
        message: `Cannot cancel request with status ${request.status}. Only pending requests can be cancelled.`
      });
    }
    
    // Return allocated resources
    if (request.resources && request.resources.length > 0) {
      for (const resourceItem of request.resources) {
        const resource = resourceItem;
        const requestResource = resourceItem.request_resource;
        
        // Update available resource quantity
        await Resource.increment(
          { quantity_available: requestResource.quantity_used },
          { where: { resource_id: resource.resource_id }, transaction: t }
        );
      }
      
      // Delete resource allocations
      await RequestResource.destroy({
        where: { request_id: id },
        transaction: t
      });
    }
    
    // Update request status to Cancelled
    await request.update({ status: 'Cancelled' }, { transaction: t });
    
    // Create notification
    await Notification.create({
      user_id: request.user_id,
      message: `Your network request #${id} has been cancelled.`,
      seen: false
    }, { transaction: t });
    
    await t.commit();
    
    res.status(200).send({
      message: "Request cancelled successfully!"
    });
  } catch (err) {
    await t.rollback();
    res.status(500).send({
      message: `Error cancelling Request with id=${req.params.id}: ${err.message}`
    });
  }
};

// Generate reports on requests
exports.generateReport = async (req, res) => {
  try {
    const { period, status } = req.query;
    
    // Only admin can generate reports
    if (req.userRole !== 'admin') {
      return res.status(403).send({
        message: "You are not authorized to generate reports!"
      });
    }
    
    let startDate, endDate;
    const currentDate = new Date();
    
    // Set date range based on period
    if (period === 'daily') {
      startDate = new Date(currentDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(currentDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
      const day = currentDate.getDay();
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      return res.status(400).send({
        message: "Invalid period. Use 'daily', 'weekly', or 'monthly'."
      });
    }
    
    // Build query conditions
    let condition = {
      created_at: {
        [Op.between]: [startDate, endDate]
      }
    };
    
    if (status) {
      condition.status = status;
    }
    
    // Get request data
    const requests = await Request.findAll({
      where: condition,
      include: [
        {
          model: Location,
          attributes: ['area_name']
        },
        {
          model: User,
          attributes: ['full_name']
        }
      ]
    });
    
    // Generate report data
    const report = {
      period,
      startDate,
      endDate,
      totalRequests: requests.length,
      statusCounts: {},
      locationCounts: {},
      connectionTypeCounts: {}
    };
    
    // Calculate counts by status, location, and connection type
    requests.forEach(request => {
      // Status counts
      if (report.statusCounts[request.status]) {
        report.statusCounts[request.status]++;
      } else {
        report.statusCounts[request.status] = 1;
      }
      
      // Location counts
      const locationName = request.location ? request.location.area_name : 'Unknown';
      if (report.locationCounts[locationName]) {
        report.locationCounts[locationName]++;
      } else {
        report.locationCounts[locationName] = 1;
      }
      
      // Connection type counts
      if (report.connectionTypeCounts[request.connection_type]) {
        report.connectionTypeCounts[request.connection_type]++;
      } else {
        report.connectionTypeCounts[request.connection_type] = 1;
      }
    });
    
    res.status(200).send(report);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Some error occurred while generating report."
    });
  }
}; 
