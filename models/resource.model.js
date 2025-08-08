module.exports = (sequelize, Sequelize) => {
    const Resource = sequelize.define("resource", {
      resource_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      resource_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      quantity_total: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      quantity_available: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    }, {
      timestamps: false,
      tableName: 'resources',
      indexes: [
        {
          name: 'idx_resources_name',
          fields: ['resource_name']
        }
      ]
    });
  
    return Resource;
  }; 
