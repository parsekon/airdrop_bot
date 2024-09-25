const {Sequelize} = require('sequelize');

module.exports = new Sequelize(
    process.env.USER,
    process.env.USER,
    process.env.PASSWORD,
    {
        host: process.env.HOST,
        port: '5432',
        dialect: 'postgres'
    }
)