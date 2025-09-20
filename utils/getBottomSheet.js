const { getFillerSchema } =  require("../schemas/fillerSchema");
const { fillRawMaterialSchema, fillRawMaterialAddSchema, fillWorkerMultipleSchema, fillWorkerSingleSchema, fillPackageComesToEndSchema, fillOrderReadySchema, fillVendorSchema, fillChamberListSchema, fillCountrySchema, fillStateSchema, fillCitySchema, fillProductAddSchema, fillMultipleChamberListSchema, fillLaneOccupiedSchema, fillProductionStartedSchema, fillProductionCompletedSchema, fillOrderShippedSchema, fillOrderReachedSchema } = require("../utils/fillers");
const { schemaMap } = require('../constants/constants');

function getBottomSheet({type, RawMaterials, Vendors, RawMaterialOrderById, Chambers, countries, states, cities, DispatchOrder, Products, ProductionById, LaneById, Contractors, VendorById}) {
    
    const fillerSchema = getFillerSchema({RawMaterials, Vendors, Chambers, RawMaterialOrderById, countries, states, cities, DispatchOrder, Products, ProductionById, LaneById, Contractors, VendorById});
    
    if (type === "order-ready") {
        return fillOrderReadySchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "order-shipped") {
        return fillOrderShippedSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "order-reached") {
        return fillOrderReachedSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "raw-material-reached") {
        return fillRawMaterialSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "raw-material-ordered") {
        return fillRawMaterialSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "package-comes-to-end") {
        return fillPackageComesToEndSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "worker-multiple") {
        return fillWorkerMultipleSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "worker-single") {
        return fillWorkerSingleSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "add-raw-material") {
        return fillRawMaterialAddSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "add-product") {
        return fillProductAddSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "choose-product") {
        return fillRawMaterialAddSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "add-vendor") {
        return fillVendorSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "chamber-list") {
        return fillChamberListSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "multiple-chamber-list") {
        return fillMultipleChamberListSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "country") {
        return fillCountrySchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "state") {
        return fillStateSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "city") {
        return fillCitySchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "lane-occupied") {
        return fillLaneOccupiedSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "production-start") {
        return fillProductionStartedSchema(schemaMap[type], fillerSchema[type]);
    } else if (type === "production-completed") {
        return fillProductionCompletedSchema(schemaMap[type], fillerSchema[type]);
    } else {
        return [{ error: "Invalid type" }];
    }
}

module.exports = { getBottomSheet }