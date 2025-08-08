module.exports = (sequelize, Sequelize) => {
    const Request = sequelize.define("request", {
      request_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        }
      },
      location_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'locations',
          key: 'location_id'
        }
      },
      connection_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'Pending'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    }, {
      timestamps: false,
      tableName: 'network_requests',
      indexes: [
        {
          name: 'idx_network_requests_user_id',
          fields: ['user_id']
        },
        {
          name: 'idx_network_requests_status',
          fields: ['status']
        },
        {
          name: 'idx_network_requests_created_at',
          fields: ['created_at']
        }
      ]
    });
  
    return Request;
  }; 
