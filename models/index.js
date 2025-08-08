const dbConfig = require('../config/db.config.js');
const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  dbConfig.DB,
  dbConfig.USER,
  dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.user = require('./user.model.js')(sequelize, Sequelize);
db.location = require('./location.model.js')(sequelize, Sequelize);  // Keep this one
db.resource = require('./resource.model.js')(sequelize, Sequelize);
db.request = require('./request.model.js')(sequelize, Sequelize);
db.requestResource = require('./requestResource.model.js')(sequelize, Sequelize);
db.notification = require('./notification.model.js')(sequelize, Sequelize);

// Define associations
// User has many requests
db.user.hasMany(db.request, { foreignKey: 'user_id' });
db.request.belongsTo(db.user, { foreignKey: 'user_id' });

// User has many notifications
db.user.hasMany(db.notification, { foreignKey: 'user_id' });
db.notification.belongsTo(db.user, { foreignKey: 'user_id' });

// Location has many requests
db.location.hasMany(db.request, { foreignKey: 'location_id' });
db.request.belongsTo(db.location, { foreignKey: 'location_id' });
// REMOVE THIS LINE: db.location = require("./location.js")(sequelize, Sequelize);

// Request-Resource association (many-to-many)
db.request.belongsToMany(db.resource, { through: db.requestResource, foreignKey: 'request_id' });
db.resource.belongsToMany(db.request, { through: db.requestResource, foreignKey: 'resource_id' });

module.exports = db;