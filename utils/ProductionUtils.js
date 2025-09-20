const { Production: productionClient, ChamberStock: chamberStockClient, Lanes: lanesClient, Chambers: chamberClient, RawMaterialOrder: rawMaterialOrderClient } = require("../models");
const { v4: uuidv4 } = require('uuid');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('./s3Client');
const dispatchAndSendNotification = require("./dispatchAndSendNotification");
const notificationTypes = require("../types/notification-types");
require('dotenv').config()

const uploadToS3 = async (file) => {
    const id = uuidv4();
    const fileKey = `production/${id}-${file.originalname}`;
    const bucketName = process.env.AWS_BUCKET_NAME;

    await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
    }));

    const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

    return { url, key: fileKey };
};

function parseExistingImages(rawImages) {
    if (!rawImages) return [];
    try {
        return JSON.parse(rawImages);
    } catch {
        throw { status: 400, error: "Invalid existing_sample_images format" };
    }
}

async function uploadNewImages(files) {
    return Promise.all(files.map(file => uploadToS3(file))); // expected to return { url, key }
}

async function fetchProductionOrFail(id) {
    const prod = await productionClient.findOne({ where: { id } });
    if (!prod) throw { status: 404, error: "Production not found" };
    return prod;
}

async function validateLaneAssignment(laneId, productionId) {
    const laneRecord = await lanesClient.findOne({ where: { id: laneId } });
    if (!laneRecord) throw { status: 404, error: "Lane not found" };

    if (laneRecord.production_id && laneRecord.production_id !== productionId) {
        throw { status: 400, error: "Lane already assigned to another production" };
    }

    return laneRecord;
}

function buildUpdatedFields({ otherFields, allImages, lane, start_time, currentProductionStatus }) {
    const fields = {
        ...otherFields,
        sample_images: allImages,
        updatedAt: new Date(),
    };
    if(!start_time || start_time === null) fields.start_time = new Date();
    if (lane) fields.lane = lane;
    if (currentProductionStatus !== "in-progress") {
        fields.status = "in-progress";
    }
    return fields;
}

async function updateProductionRecord(id, updatedFields) {
    const [updatedCount, updatedRows] = await productionClient.update(updatedFields, {
        where: { id },
        returning: true,
    });
    return updatedCount > 0 ? updatedRows[0] : null;
}

async function createAndSendProductionStartNotification (productionData, lane) {
    const { id, product_name, quantity, unit } = productionData
    const description = [`${quantity}${unit}`, lane]
    dispatchAndSendNotification({type: notificationTypes['production-start'], description, title: product_name, id})

}

async function createAndSendProductionCompleteNotification (productionData, chambers) {
    const { id, product_name, recovery, unit } = productionData
    const description = [`${recovery}${unit}`, chambers?.map(ch => ch?.chamber_name).join(', ')]?.filter(Boolean);
    dispatchAndSendNotification({type: notificationTypes['production-completed'], description, title: product_name, id})
}

async function validateAndFetchProduction(id) {
    const production = await productionClient.findByPk(id);
    if (!production) throw { status: 404, message: "Production not found" };
    if (production.status === "completed") throw { status: 400, message: "Production already completed" };
    return production;
}

async function validateAndFetchChambers(chambers) {
    if (!Array.isArray(chambers) || chambers.length === 0) {
        throw { status: 400, message: "Chambers array is required and must not be empty" };
    }

    const validChambers = await chamberClient.findAll({
        where: {
            id: chambers.map(c => c.id)
        }
    });

    if (validChambers.length !== chambers.length) {
        throw { status: 404, message: "One or more chambers not found" };
    }

    return validChambers;
}

async function updateProductionCompletion(production, endTime, wastage_quantity, recovery) {
    production.end_time = endTime || new Date();
    production.status = "completed";
    production.wastage_quantity = wastage_quantity
    production.recovery = recovery
    await production.save();
}

async function updateChamberStocks(production, chambers, chamberInstances) {
    const { product_name, unit, quantity } = production;

    let stock = await chamberStockClient.findOne({
        where: { product_name, category: "material" },
    });

    const newChamberData = chambers.map(c => ({
        id: c.id,
        quantity: String(c.quantity),
        rating: String(c.rating),
    }));

    const chamberMap = new Map(chamberInstances.map(c => [c.id, c]));

    if (!stock) {
        stock = await chamberStockClient.create({
            product_name,
            category: "material",
            unit,
            chamber: newChamberData,
        });

        for (const { id } of chambers) {
            const chamber = chamberMap.get(id);
            if (chamber && !chamber.items?.includes(stock.id)) {
                chamber.items = [...(chamber.items || []), stock.id];
                await chamber.save();
            }
        }
    } else {
        let chambersList = stock.chamber || [];

        for (const c of chambers) {
            const index = chambersList.findIndex(
                item => item.id === c.id && item.rating === String(c.rating)
            );

            if (index >= 0) {
                chambersList[index].quantity = String(Number(chambersList[index].quantity) + Number(c.quantity));
            } else {
                chambersList.push({
                    id: c.id,
                    quantity: String(c.quantity),
                    rating: String(c.rating),
                });
            }

            const chamber = chamberMap.get(c.id);
            if (chamber && !chamber.items?.includes(stock.id)) {
                chamber.items = [...(chamber.items || []), stock.id];
                await chamber.save();
            }
        }

        // Fallback: force update
        await chamberStockClient.update(
            { chamber: chambersList },
            { where: { id: stock.id } }
        );
    }

    return stock;
}

async function updateRawMaterialStoreDate(production) {
    if (production.raw_material_order_id) {
        const order = await rawMaterialOrderClient.findByPk(production.raw_material_order_id);
        if (order) {
            order.store_date = production.end_time || new Date();
            await order.save();
        }
    }
}

async function clearLaneAssignment(production) {
    if (production.lane) {
        const lane = await lanesClient.findByPk(production.lane);
        if (lane) {
            lane.production_id = null;
            await lane.save();
        }
    }
}

module.exports = {
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
};