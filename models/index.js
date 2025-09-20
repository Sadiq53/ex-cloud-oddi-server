const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.RawMaterial = require("./RawMaterials")(sequelize, Sequelize);
db.RawMaterialOrder = require("./RawMaterialOrder")(sequelize, Sequelize);
db.Production = require("./Production")(sequelize, Sequelize);
db.ChamberStock = require("./ChamberStock")(sequelize, Sequelize);
db.DryWarehouse = require("./DryWarehouse")(sequelize, Sequelize);
db.Chambers = require("./Chambers")(sequelize, Sequelize);
db.Lanes = require("./Lanes")(sequelize, Sequelize);
db.WorkLocation = require("./WorkLocation")(sequelize, Sequelize);
db.Contractor = require("./Contractor")(sequelize, Sequelize);
db.Vendors = require("./Vendor")(sequelize, Sequelize);
db.DispatchOrder = require("./DispatchOrder")(sequelize, Sequelize);
db.Packages = require("./Packages")(sequelize, Sequelize);
db.Notifications = require("./Notification")(sequelize, Sequelize);
db.SampleImages = require("./SampleImages")(sequelize, Sequelize);
db.ThirdPartyClient = require("./third-party-client/ThirdPartyClient")(sequelize, Sequelize);
db.History = require("./third-party-client/History")(sequelize, Sequelize);
db.OthersItem = require("./third-party-client/OthersItem")(sequelize, Sequelize);
db.TruckDetails = require("./TruckDetails")(sequelize, Sequelize);
db.Calendar = require("./Calendar")(sequelize, Sequelize);


Object.values(db).forEach(model => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db;
