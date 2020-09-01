'use strict';

const {Model} = require('sequelize');

module.exports = class City extends Model {
  static init(sequelize, DataTypes) {
    return super.init({
      countryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      localizedName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    }, {
      sequelize,
      timestamps: false,
    });
  }

  static associate(models) {
    this.hasMany(models.Location, {foreignKey: 'cityId'});
    this.belongsTo(models.Country, {foreignKey: 'countryId'});
    this.hasMany(models.Customer, {foreignKey: 'cityId'});
  }

  static async getCityAndCountryByCityId(cityId) {
    const result = await this.sequelize.models.City.findByPk(cityId, {
      include: [this.sequelize.models.Country]
    });
    return {
      city: result.name,
      country: result.Country.code
    };
  }
};

