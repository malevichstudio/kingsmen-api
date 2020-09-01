'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => (
    queryInterface.createTable('Currencies', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      localizedName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    }, {
      charset: 'utf8',
      collate: 'utf8_unicode_ci'
    })
  ),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('Currencies'),
};
