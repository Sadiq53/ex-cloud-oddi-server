const router = require("express").Router();
const { RawMaterial: RawMaterialClient, Vendors: VendorClient, Chambers: ChamberClient, RawMaterialOrder: RawMaterialOrderClient, DispatchOrder: DispatchOrderClient, Packages: PackageClient, Production: ProductionClient, Lanes: LaneClient, Contractor: ContractorClient } = require('../models');
const { getBottomSheet } = require("../utils/getBottomSheet");
const { isValidUUID } = require("../utils/auth")

let Country = require('country-state-city').Country;
let State = require('country-state-city').State;
let City = require('country-state-city').City;

router.get("/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    let RawMaterials = [];
    let Products = [];
    let Vendors = [];
    let Chambers = [];
    let RawMaterialOrderById = {};
    let countries = [];
    let states = [];
    let cities = [];
    let DispatchOrder = {};
    let LaneById = {};
    let ProductionById = {};
    let VendorById = {};
    let Contractors = [];
    
    try {
        
        if (type === "add-raw-material" || type === "choose-product") {
            RawMaterials = await RawMaterialClient.findAll();
        }

        if (type === "add-product") {
            const data = await PackageClient.findAll()
            Products = data?.map(val => val.dataValues.product_name)
        }

        if (type === "add-vendor" || type === "raw-material-reached" || type === "raw-material-ordered") {
            Vendors = await VendorClient.findAll();
        }

        if (type === "chamber-list" || type === "multiple-chamber-list") {
            Chambers = await ChamberClient.findAll();
        }

        if (type === "country") {
            countries = Country.getAllCountries();
        }

        if (type === "state") {
            states = State.getStatesOfCountry(id).map(state => ({ name: state.name, isoCode: state.isoCode }))
        }

        if (type === "city") {
            const [state, country] = id?.split(':')
            cities = City.getCitiesOfState(country, state).map(city => city.name)
        }

        if (type === "raw-material-ordered" || type === "raw-material-reached") {
            if (isValidUUID(id)) {
                const RawMaterialOrder = await RawMaterialOrderClient.findOne({ where: { id } });
                RawMaterialOrderById = RawMaterialOrder ? RawMaterialOrder : {};
            } else {
                RawMaterialOrderById = {};
            }
        }

        if (type === "order-ready" || type === "order-shipped"|| type === "order-reached") {
            if (isValidUUID(id)) {
                const DispatchOrderRawDB = await DispatchOrderClient.findOne({ where: { id } });
                const DispatchOrderDB = DispatchOrderRawDB?.dataValues;
                DispatchOrder = DispatchOrderDB ? DispatchOrderDB : {};
            } else {
                DispatchOrder = {};
            }
        }

        if (type === 'lane-occupied' || type === 'production-start' || type === "production-completed") {
            let productionValues = {};
            if (isValidUUID(id)) {
                const productionData = await ProductionClient.findOne({ where: { id } });
                productionValues = productionData?.dataValues;
            }
            ProductionById = productionValues || {};

            if ((type === 'lane-occupied' || type === "production-start") && isValidUUID(productionValues?.raw_material_order_id)) {
                const rmOrderData = await RawMaterialOrderClient.findOne({ where: { id: productionValues?.raw_material_order_id } });
                const rmOrderValues = rmOrderData?.dataValues;
                RawMaterialOrderById = rmOrderValues || {};
            }

            if ((type === 'lane-occupied' || type === "production-completed") && isValidUUID(productionValues?.lane)) {
                const laneData = await LaneClient.findOne({ where: { id: productionValues?.lane } });
                LaneById = laneData?.dataValues || {};
            }

            if (type === 'production-start' && productionValues?.vendor) {
                const vendorData = await VendorClient.findOne({ where: { name: productionValues.vendor } });
                VendorById = vendorData || {};
            }
        }

        if (type === "worker-multiple") {
            const dataIds = id?.split(',').map(i => i.trim()).filter(Boolean).filter(isValidUUID);
            if (Array.isArray(dataIds) && dataIds.length > 0) {
                const contractors = await ContractorClient.findAll({ where: { id: dataIds } });
                Contractors.push(...contractors.map(c => c.dataValues));
            }
        }
    } catch (error) {
        console.error("Error during fetch:", error.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }

    const bottomSheet = getBottomSheet({
        type,
        RawMaterials,
        Vendors,
        RawMaterialOrderById,
        Chambers,
        countries,
        states,
        DispatchOrder,
        Products,
        ProductionById,
        LaneById,
        Contractors,
        VendorById,
        cities,
    });
// console.log('bottomSheet', JSON.stringify(bottomSheet));

    res.status(200).json(bottomSheet);
});


module.exports = router;
