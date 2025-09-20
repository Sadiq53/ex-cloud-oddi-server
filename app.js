const express = require("express");
const routes = require("./config/routes");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const sequelize = require("./config/database"); 
const { Notifications, Production, RawMaterialOrder, History, OthersItem, ThirdPartyClient, ChamberStock } = require("./models");
const { initializeSocket } = require("./config/socket");
require("./models/Admin"); 

const app = express();

// dotenv.config({
//   path: `.env.${process.env.NODE_ENV || "development"}`,
// });
dotenv.config()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/profilepic", express.static(path.join(__dirname, "assets/profilepic")));
app.use("/products", express.static(path.join(__dirname, "assets/products")));
app.use("/warehouses", express.static(path.join(__dirname, "assets/warehouses")));
app.use("/sample-images", express.static(path.join(__dirname, "assets/sample-images")));
app.use("/driver-image", express.static(path.join(__dirname, "assets/driver-image")));
app.use("/flags", express.static(path.join(__dirname, "assets/flags")));
app.use("/challan-pdf", express.static(path.join(__dirname, "assets/challan-pdf")));

app.use(routes);

const port = 8022 || process.env.PORT;

const server = app.listen(port, async () => {
  try {
    await sequelize.authenticate(); 
    console.log("✅ Connected to Aiven PostgreSQL");
    const shouldSync = process.env.SHOULD_SYNC === "true";

    if (shouldSync) {
      // await sequelize.sync({ alter: true }); 
      // await RawMaterialOrder.sync({ force: true }); 
      // await ChamberStock.sync({ force: true }); 
      // await Production.sync({ force: true }); 
      // await Notifications.sync({ force: true }); 
 
      console.log("✅ Synced DB with models");
    }

    console.log(`🚀 Server running at http://localhost:${port}`);
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
  }
});

// Initialize Socket.IO
initializeSocket(server);

