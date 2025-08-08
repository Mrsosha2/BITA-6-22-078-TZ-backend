module.exports = (sequelize, Sequelize) => {
    const RequestResource = sequelize.define("request_resource", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'network_requests',
          key: 'request_id'
        }
      },
      resource_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'resources',
          key: 'resource_id'
        }
      },
      quantity_used: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    }, {
      timestamps: false,
      tableName: 'request_resources',
      indexes: [
        {
          name: 'idx_request_resources_req_res',
          fields: ['request_id', 'resource_id']
        }
      ]
    });
  
    return RequestResource;
  }; 
