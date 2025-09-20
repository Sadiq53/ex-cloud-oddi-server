const router = require("express").Router();
const { ChamberStock: stockClient, Chambers: chamberClient, SampleImages: sampleImageClient, History: historyClient, OthersItem: otherItemClient, ThirdPartyClient: thirdPartyClient } = require("../models");
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../utils/s3Client');
const { sendProductionStartNotification } = require("./notificationController");
const dispatchAndSendNotification = require("../utils/dispatchAndSendNotification");
const notificationTypes = require("../types/notification-types");
const { Op } = require('sequelize');
const sequelize = require("../config/database");

require('dotenv').config()

const upload = multer();

const uploadToS3 = async (file) => {
    const id = uuidv4();
    const fileKey = `third-party-products/${id}-${file.originalname}`;
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

router.get('/', async (req, res) => {
    try {
        const clients = await thirdPartyClient.findAll();
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/products', async (req, res) => {
    try {
        const products = await otherItemClient.findAll();
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products', details: err.message });
    }
});

router.get('/history/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const products = await historyClient.findOne({ where: { id } }); 
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products', details: err.message });
    }
});

// GET by ID
router.get('/item/:id', async (req, res) => {
    try {
        const item = await otherItemClient.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const client = await thirdPartyClient.findByPk(req.params.id);
        if (!client) return res.status(404).json({ error: 'Not found' });
        res.json(client);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET by name
router.get('/name/:name', async (req, res) => {
    try {
        const client = await thirdPartyClient.findOne({ where: { name: req.params.name } });
        if (!client) return res.status(404).json({ error: 'Not found' });
        res.json(client);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', upload.single('sample_image'), async (req, res) => {
    const {
        name,
        company,
        address,
        phone,
    } = req.body;
    
    let sampleImageId = null;
    const products = JSON.parse(req.body.products);
    const product_name = products[0]?.product_name;
    const chambers = products[0]?.selectedChambers;
    const rent = products[0]?.rent;
    const est_dispatch_date = products[0]?.est_dispatch_date;
    const stored_date = Date.now();

    try {
        await sequelize.transaction(async (t) => {
            if (req.file) {
                const uploaded = await uploadToS3(req.file);
                sampleImageId = uploaded.url;
            }

            let stock = await stockClient.findOne({
                where: { product_name: product_name?.trim(), category: 'other' }
            });
            
            const newChamberData = chambers?.map(c => ({
                id: c.id,
                quantity: String(c.quantity),
                rating: company
            }));

            const chamberIds = chambers?.map(c => c.id);
            const chamberInstances = await chamberClient.findAll({
                where: { id: chamberIds },
                transaction: t,
            });
            const chamberMap = new Map(chamberInstances?.map(c => [c.id, c]));

            if (!stock) {
                stock = await stockClient.create({
                    product_name,
                    category: 'other',
                    unit: 'kg',
                    chamber: newChamberData
                }, { transaction: t });

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
                        item => item.id === c.id && item.rating === company
                    );

                    if (index >= 0) {
                        chambersList[index].quantity = String(
                            Number(chambersList[index].quantity) + Number(c.quantity)
                        );
                    } else {
                        chambersList.push({
                            id: c.id,
                            quantity: String(c.quantity),
                            rating: company
                        });
                    }

                    const chamber = chamberMap.get(c.id);
                    if (chamber && !chamber.items?.includes(stock.id)) {
                        chamber.items = [...(chamber.items || []), stock.id];
                        await chamber.save({ transaction: t });
                    }
                }

                await stockClient.update(
                    { chamber: chambersList },
                    { where: { id: stock.id }, transaction: t }
                );
            }

            const client = await thirdPartyClient.create({
                name,
                address,
                company,
                phone,
                products: []
            }, { transaction: t });

            const othersItem = await otherItemClient.create({
                product_id: stock.id,
                stored_quantity: chambers.reduce((sum, c) => sum + Number(c.quantity), 0),
                stored_date: stored_date || new Date(),
                dispatched_date: null,
                est_dispatch_date: est_dispatch_date,
                sample_image: sampleImageId,
                history: [],
                client_id: client?.id,
                rent
            }, { transaction: t });

            await client.update({ products: [othersItem.id] }, { transaction: t })

            res.status(201).json(client);
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.patch('/add-quantity/:othersItemId', async (req, res) => {
    const { quantity } = req.body;
    const { othersItemId } = req.params;

    try {
        const item = await otherItemClient.findByPk(othersItemId);
        if (!item) return res.status(404).json({ error: 'OthersItem not found' });

        const newQuantity = Number(item.stored_quantity) + Number(quantity);
        await item.update({ stored_quantity: newQuantity });
        console.log(newQuantity);

        return
        await historyClient.create({
            product_id: item.id,
            deduct_quantity: 0,
            stored_quantity: newQuantity
        });

        res.json({ message: 'Quantity added', item });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/deduct-quantity/:othersItemId', async (req, res) => {
    const { quantity } = req.body;
    const { othersItemId } = req.params;

    try {
        const item = await otherItemClient.findByPk(othersItemId);
        if (!item) return res.status(404).json({ error: 'OthersItem not found' });

        const deductQty = Number(quantity);
        if (Number(item.stored_quantity) < deductQty) {
            return res.status(400).json({ error: 'Not enough quantity to deduct' });
        }

        // Fetch chamber stock for this item
        const stock = await stockClient.findByPk(item?.product_id);
        if (!stock || !Array.isArray(stock.chamber)) {
            return res.status(400).json({ error: 'No chamber stock data available for this product' });
        }

        // Sort chamber entries by highest quantity first
        const chambersSorted = [...stock.chamber]
            .filter(entry => Number(entry.quantity) > 0)
            .sort((a, b) => Number(b.quantity) - Number(a.quantity));

        let remainingQty = deductQty;
        const chamberUpdates = [];
        const historyEntries = [];

        for (const chamber of chambersSorted) {
            if (remainingQty <= 0) break;

            const available = Number(chamber.quantity);
            const take = Math.min(available, remainingQty);
            remainingQty -= take;

            // Deduct from current chamber
            chamberUpdates.push({
                id: chamber.id,
                newQuantity: available - take,
            });

            // Log chamber-level deduction history
            historyEntries.push({
                product_id: item.id,
                deduct_quantity: take,
                remaining_quantity: available - take,
                chamber_id: chamber.id,
            });
        }

        if (remainingQty > 0) {
            return res.status(400).json({ error: `Insufficient chamber stock. Missing ${remainingQty} units.` });
        }

        // Update stored_quantity on main product
        const newStoredQty = Number(item.stored_quantity) - deductQty;

        // Update chamber quantities in DB
        const updatedChambers = stock.chamber.map(chamber => {
            const update = chamberUpdates.find(u => u.id === chamber.id);
            return update ? { ...chamber, quantity: update.newQuantity } : chamber;
        });

        console.log(updatedChambers);
        console.log(historyEntries);
        console.log(newStoredQty);

        return

        await stock.update({ chamber: updatedChambers });

        // Log history
        const createdEntries = await historyClient.bulkCreate(historyEntries);

        await item.update({
            stored_quantity: newStoredQty,
            history: [
                ...(item.history || []),
                ...createdEntries.map(val => val.id).filter(Boolean)
            ]
        });


        res.json({
            message: 'Quantity deducted successfully',
            item,
            deducted: deductQty,
            chamberUpdates,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const client = await thirdPartyClient.findByPk(req.params.id);
        if (!client) return res.status(404).json({ error: 'Not found' });
        await client.update(req.body);
        res.json(client);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const client = await thirdPartyClient.findByPk(req.params.id);
        if (!client) return res.status(404).json({ error: 'Not found' });
        await client.destroy();
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
