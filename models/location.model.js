module.exports = (sequelize, Sequelize) => {
  const Location = sequelize.define("location", {
    location_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    area_name: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    is_network_available: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: false,
    tableName: 'locations'
  });

  return Location;
};