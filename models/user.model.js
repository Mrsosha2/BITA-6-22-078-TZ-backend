module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("user", {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      role: {
        type: Sequelize.STRING(20),
        defaultValue: 'user'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    }, {
      timestamps: false,
      tableName: 'users',
      indexes: [
        {
          name: 'idx_users_email',
          fields: ['email']
        }
      ]
    });
  
    return User;
  };