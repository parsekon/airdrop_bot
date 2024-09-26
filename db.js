const {Sequelize} = require('sequelize');

module.exports = new Sequelize({
    dialect: 'postgres',
    database: process.env.DB,
    user: process.env.USER,
    password: process.env.PASSWORD,
    host: process.env.HOST,
    port: 5432,
  });