module.exports = (sequelize, Sequelize) => {
    const Notification = sequelize.define("notification", {
      notification_id: {
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
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      seen: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    }, {
      timestamps: false,
      tableName: 'notifications',
      indexes: [
        {
          name: 'idx_notifications_user_seen',
          fields: ['user_id', 'seen']
        }
      ]
    });
  
    return Notification;
  }; 
