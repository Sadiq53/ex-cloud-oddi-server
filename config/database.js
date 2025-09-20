const fs = require("fs");

// const { Sequelize } = require('sequelize');

// const sequelize = new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USERNAME, process.env.DATABASE_PASSWORD, {
//     host: 'localhost',
//     dialect: 'postgres',
//     pool: {
//         max: 5,
//         min: 0,
//         acquire: 30000,
//         idle: 10000,
//     }
//   });

//   sequelize.authenticate().then(() => console.log("Database connected successfully")).catch(err => console.log(err))

// module.exports = sequelize

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_NAME, 
  process.env.DATABASE_USERNAME, 
  process.env.DATABASE_PASSWORD, 
  {
    host: process.env.AIVEN_HOST,        
    port: process.env.AIVEN_PORT,         
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        ca: process.env.AIVEN_CA_PATH,
      }
      // ssl: {
      //   ca: fs.readFileSync(process.env.AIVEN_CA_PATH).toString(),
      // }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    }
  }
);

sequelize.authenticate()
  .then(() => console.log("Database connected successfully"))
  .catch(err => console.log("Error connecting to database", err));

module.exports = sequelize;
