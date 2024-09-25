const sequelize = require('./db');
const { DataTypes } = require('sequelize');

const User = sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true
    },
    chatId: {
      type: DataTypes.STRING,
      unique: true
    },
    telegram: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    twitter: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    retweet: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    youtube: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    wallet: {
      type: DataTypes.STRING,
      defaultValue: ''
    }
  });
  
  

module.exports = User;
