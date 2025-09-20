const router = require("express").Router();
const { Production: productionClient, Lanes: lanesClient, RawMaterialOrder: rawMaterialOrderClient } = require("../models");
const multer = require('multer');
const { sendProductionStartNotification } = require("../utils/notification");
const dispatchAndSendNotification = require("../utils/dispatchAndSendNotification");
const notificationTypes = require("../types/notification-types");

const {
    parseExistingImages,
    uploadNewImages,
    fetchProductionOrFail,
    validateLaneAssignment,
    buildUpdatedFields,
    updateProductionRecord,
    validateAndFetchProduction,
    validateAndFetchChambers,
    updateProductionCompletion,
    updateChamberStocks,
    updateRawMaterialStoreDate,
    clearLaneAssignment,
    uploadToS3,
    createAndSendProductionStartNotification,
    createAndSendProductionCompleteNotification
} = require('../utils/ProductionUtils')
require('dotenv').config()

const upload = multer();

router.post("/", upload.single('sample_image'), async (req, res) => {
    try {
        const { product_name, quantity, raw_material_id, start_time, end_time, status, batch_code, notes, supervisor } = req.body;

        if (!product_name || typeof product_name !== 'string' || product_name.trim().length === 0) {
            return res.status(400).json({ error: "Product name is required and must be a non-empty string." });
        }
        if (quantity === undefined || isNaN(Number(quantity)) || Number(quantity) <= 0) {
            return res.status(400).json({ error: "Quantity (kg) is required and must be a positive number." });
        }
        if (!raw_material_id) {
            return res.status(400).json({ error: "Raw material ID is required." });
        }
        if (!start_time) {
            return res.status(400).json({ error: "Start time is required." });
        }
        if (!batch_code || typeof batch_code !== 'string' || batch_code.trim().length === 0) {
            return res.status(400).json({ error: "Batch code is required and must be a non-empty string." });
        }
        if (!supervisor || typeof supervisor !== 'string' || supervisor.trim().length === 0) {
            return res.status(400).json({ error: "supervisor is required and must be a non-empty string." });
        }

        let startTime = null;
        if (start_time) {
            startTime = new Date(start_time);
            if (isNaN(startTime)) {
                return res.status(400).json({ error: "start_time must be a valid date." });
            }
        }

        let endTime = null;
        if (end_time) {
            endTime = new Date(end_time);
            if (isNaN(endTime)) {
                return res.status(400).json({ error: "end_time must be a valid date." });
            }
        }

        let sampleImage = null;
        if (req.file) {
            const uploaded = await uploadToS3(req.file);
            if (!uploaded?.url || !uploaded?.key) {
                return res.status(500).json({ error: "Failed to upload sample image." });
            }
            sampleImage = {
                url: uploaded.url,
                key: uploaded.key,
            };
        }

        const newProduction = await productionClient.create({
            product_name: product_name.trim(),
            quantity: Number(quantity_kg),
            raw_material_order_id: raw_material_id,
            start_time: startTime,
            end_time: endTime,
            status: status || "in-progress",
            batch_code: batch_code.trim(),
            notes: notes || null,
            sample_image: sampleImage,
            supervisor,
        });

        
        const productionDetails = {
            title: "START PRODUCTION",
            timestamp: new Date().toISOString(),
            product_name,
            quantity: newProduction.quantity,
            raw_material_order_id: newProduction.raw_material_id,
            start_time: newProduction.startTime,
            end_time: newProduction.endTime,
            status: newProduction.status || "in-progress",
            batch_code: newProduction.batch_code,
            notes: newProduction.notes || null,
            sample_image: newProduction.sampleImage,
            date: new Date().toDateString(),
        };
        
        sendProductionStartNotification(newProduction.id, productionDetails);

        return res.status(201).json(newProduction);

    } catch (error) {
        console.error("Error during adding Material to production:", error?.message || error);
        return res.status(500).json({ error: "Internal  server error, please try again later." });
    }
})

router.get("/", async (req, res) => {
    try {
        const productions = await productionClient.findAll();

        res.status(200).json(productions)
    } catch (error) {
        console.error("Error during fetching Productions:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
})

router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const production = await productionClient.findOne({ where: { id } });

        if (!production) {
            return res.status(404).json({ error: "Production not found" });
        }

        return res.status(200).json(production);
    } catch (error) {
        console.error("Error during fetching Production:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
});

router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const production = await productionClient.findOne({ where: { id } });

        if (!production) {
            return res.status(404).json({ error: "Production not found" });
        }
        await productionClient.destroy({ where: { id } });

        return res.status(200).json({ message: "Deleted successfully", data: production });
    } catch (error) {
        console.error("Error during deleting Production:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
});

router.patch("/:id", upload.array("sample_images"), async (req, res) => {
    const { id } = req.params;
    const { lane, existing_sample_images, ...otherFields } = req.body;
    const files = req.files;

    try {
        const existingImages = parseExistingImages(existing_sample_images);
        const newImages = files?.length ? await uploadNewImages(files) : [];
        const allImages = [...existingImages, ...newImages];

        const currentProduction = await fetchProductionOrFail(id);
        const oldLaneId = currentProduction.lane;
        const laneRecord = lane ? await validateLaneAssignment(lane, id) : null;

        
        const updatedFields = buildUpdatedFields({
            otherFields,
            allImages,
            lane,
            start_time: currentProduction?.start_time,
            currentProductionStatus: currentProduction.status,
        });

        if(updatedFields?.startTime !== null) {
            await createAndSendProductionStartNotification(currentProduction, laneRecord?.name)
        }
        
        const updatedProduction = await updateProductionRecord(id, updatedFields);
        if (!updatedProduction) {
            return res.status(404).json({ error: "Production not found" });
        }
        
        // Set production_id on new lane if not already set
        if (lane && !laneRecord.production_id) {
            const [laneCount, updatedLane] = await lanesClient.update({ production_id: id }, { where: { id: lane }, returning: true });
            const productionData = updatedProduction?.dataValues
            const laneData = updatedLane[0]?.dataValues
            
            const description = [productionData?.product_name, `${productionData?.quantity}${productionData?.unit}`]
            
            dispatchAndSendNotification({type: notificationTypes['lane-occupied'], description, title: laneData?.name, id: productionData?.id})

            // Remove production_id from old lane if lane is being changed
            if (oldLaneId && oldLaneId !== lane) {
                const [_, updatedOldLane] = await lanesClient.update(
                    { production_id: null },
                    { where: { id: oldLaneId }, returning: true }
                );
                dispatchAndSendNotification({type: notificationTypes['lane-empty'], title: updatedOldLane[0]?.dataValues?.name, id: productionData?.id})
            }
        }
        

        return res.status(200).json(updatedProduction?.dataValues);
    } catch (error) {
        console.error("Error during updating Production:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
});

router.patch("/start/:id", upload.single('sample_image'), async (req, res) => {
    const { id } = req.params;
    const { status, start_time, rating, sample_quantity, ...otherFields } = req.body;

    try {
        const rawData = await productionClient.findByPk(id);
        if (!rawData) {
            return res.status(404).json({ error: "Production not found" });
        }

        if (!status || !["in-queue", "in-progress"].includes(status)) {
            return res.status(400).json({ error: "Invalid or missing status value." });
        }

        const { lane } = rawData
        const laneRecord = lane ? await validateLaneAssignment(lane, id) : null;

        const updatedFields = {
            status,
            rating,
            updatedAt: new Date(),
            ...otherFields,
        };

        if (status === "in-progress") {
            updatedFields.start_time = start_time || new Date(); 
            await createAndSendProductionStartNotification(rawData, laneRecord?.name)
        }

        let sample_image = null;
        if (req.file) {
            try {
                const uploaded = await uploadToS3(req.file);
                if (!uploaded?.url || !uploaded?.key) {
                    return res.status(500).json({ error: "Failed to upload sample image." });
                }
                sample_image = {
                    url: uploaded.url,
                    key: uploaded.key,
                };
            } catch (err) {
                console.error("S3 upload failed:", err);
                return res.status(500).json({ error: "Image upload failed." });
            }
        }

        if(sample_quantity) {
            updatedFields.quantity = (Number(rawData.quantity) - Number(sample_quantity));
        }

        await rawMaterialOrderClient.update(
            { 
                sample_quantity: Number(sample_quantity), 
                sample_image, 
                rating: Number(rating) 
            }, 
            { where: { id: rawData?.raw_material_order_id }}
        );

        const [updatedCount, updatedRows] = await productionClient.update(updatedFields, {
            where: { id },
            returning: true,
        });

        if (updatedCount === 0) {
            return res.status(404).json({ error: "Failed to update production entry." });
        }

        return res.status(200).json(updatedRows[0]?.dataValues);

    } catch (error) {
        console.error("Error during production update:", error);
        return res.status(500).json({ error: "Internal server error. Please try again later." });
    }
});

router.patch("/complete/:id", async (req, res) => {
    const productionId = req.params.id;
    
    const { end_time, chambers = [], wastage_quantity = 0 } = req.body;
    // chambers = [
    //     {
    //         id: chamber id,
    //         quantity: ---,
    //         rating
    //     }
    // ]

    try {
        const production = await validateAndFetchProduction(productionId);
        const chamberInstances = await validateAndFetchChambers(chambers);

        const recovery = chambers?.reduce((sum, c) => sum + Number(c.quantity), 0);

        await updateProductionCompletion(production, end_time, wastage_quantity, recovery);
        const updatedStock = await updateChamberStocks(production, chambers, chamberInstances);


        await updateRawMaterialStoreDate(production);
        await clearLaneAssignment(production);

        await createAndSendProductionCompleteNotification(production, chamberInstances)

        return res.json({
            message: "Production completed, stock updated, lane cleared.",
            production,
            updatedStock,
        });
    } catch (err) {
        console.error("Completion error:", err);
        return res.status(err.status || 500).json({ message: err.message || "Server error" });
    }
});


module.exports = router;
