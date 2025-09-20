const routes = require("express").Router();

routes.use("/api/admin", require("../controllers/AdminController"))
routes.use("/api/bottomsheet", require("../controllers/BottomSheetController"))

routes.use("/api/raw-material", require("../controllers/RawMaterialController"))
routes.use("/api/production", require("../controllers/ProductionController"))
routes.use("/api/order", require("../controllers/DispatchOrderController"))
routes.use("/api/package", require("../controllers/PackagesController"))
routes.use("/api/truck", require("../controllers/TruckDetailsController"))

routes.use("/api/location", require("../controllers/WorkLocationController"))
routes.use("/api/contractor", require("../controllers/ContractorController"))
routes.use("/api/lane", require("../controllers/LaneController"))

routes.use("/api/vendor", require("../controllers/VendorController"))
routes.use("/api/other-product", require("../controllers/OtherProductController"))

routes.use("/api/chamber-stock/", require("../controllers/ChamberStockController"))
routes.use("/api/chamber/", require("../controllers/WarehouseController/Chamber"))
routes.use("/api/chamber/type/frozen", require("../controllers/WarehouseController/Frozen"))
routes.use("/api/chamber/type/dry", require("../controllers/WarehouseController/Dry"))

routes.use("/api/roles", require("../controllers/Roles/RolesController"))
routes.use("/api/roles/permissions", require("../controllers/Roles/PermissionController"))
routes.use("/api/notifications", require("../controllers/notificationController"))

module.exports = routes