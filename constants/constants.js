const { RAW_MATERIAL_REACHED, WORKER_ARRIVED_MULTIPLE, ADD_PRODUCT, WORKER_ARRIVED_SINGLE, PACKAGE_COMES_TO_END, ORDER_READY, VERIFY_MATERIAL, ADD_RAW_MATERIAL, ADD_VENDOR, CHAMBER_LIST, COUNTRY, STATES, MULTIPLE_CHAMBER_LIST, LANE_OCCUPIED, PRODUCTION_STARTED, PRODUCTION_COMPLETED, ORDER_SHIPPED, RAW_MATERIAL_ORDERED, CITIES, ORDER_REACHED } = require("../config/schemas");

const schemaMap = {
    "order-ready": ORDER_READY,
    "order-shipped": ORDER_SHIPPED,
    "order-reached": ORDER_REACHED,
    "package-comes-to-end": PACKAGE_COMES_TO_END,
    "verify-material": VERIFY_MATERIAL,
    "raw-material-reached": RAW_MATERIAL_REACHED,
    "raw-material-ordered": RAW_MATERIAL_ORDERED,
    "add-raw-material": ADD_RAW_MATERIAL,
    "add-product": ADD_PRODUCT,
    "choose-product": ADD_RAW_MATERIAL,
    "worker-multiple": WORKER_ARRIVED_MULTIPLE,
    "worker-single": WORKER_ARRIVED_SINGLE,
    "add-vendor": ADD_VENDOR,
    "chamber-list": CHAMBER_LIST,
    "multiple-chamber-list": MULTIPLE_CHAMBER_LIST,
    "country": COUNTRY,
    "state": STATES,
    "city": CITIES,
    "lane-occupied": LANE_OCCUPIED,
    "production-start": PRODUCTION_STARTED,
    "production-completed": PRODUCTION_COMPLETED,
};

module.exports = {schemaMap};