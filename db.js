const sequelize = new Sequelize({
    dialect: 'postgres',
    database: process.env.USER,
    user: process.env.USER,
    password: process.env.PASSWORD,
    host: process.env.HOST,
    port: 5432,
  });