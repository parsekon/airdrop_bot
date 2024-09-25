const {Sequelize} = require('sequelize');

module.exports = new Sequelize(
    'lunarsphinx',
    'lunarsphinx',
    '1jYcnme789!ye_k',
    {
        host: '138.180.154.107',
        port: '5432',
        dialect: 'postgres'
    }
)