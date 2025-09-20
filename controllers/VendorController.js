const router = require("express").Router();
const { Vendors } = require("../models");
const { Op } = require('sequelize');
const { sendVendorCreatedNotification, sendVendorUpdatedNotification } = require("../utils/notification");


router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;
        const search = req.query.search || '';

        const whereClause = {};

        if (search) {
            whereClause.name = {
                [Op.iLike]: `%${search}%`
            };
        }

        const vendors = await Vendors.findAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            raw: true,
        });

        return res.status(200).json(vendors);
    } catch (error) {
        console.error("Error fetching Vendors:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
});

router.get('/name/:name', async (req, res) => {
    try {
        const { name } = req.params;
        // Adjust this line if your ORM or DB is different
        const vendor = await Vendors.findOne({ where: { name } });
        if (!vendor) {
            return res.status(404).json({ error: "Vendor not found." });
        }
        return res.status(200).json(vendor);
    } catch (error) {
        console.error("Error fetching vendor by name:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
});

router.get('/all', async (req, res) => {
    try {
        const vendors = await Vendors.findAll();
        if (!vendors) {
            return res.status(404).json({ error: "Vendors not found." });
        }
        return res.status(200).json(vendors);
    } catch (error) {
        console.error("Error fetching vendors:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const vendor = await Vendors.findByPk(id);
        if (!vendor) {
            return res.status(404).json({ error: "Vendor not found." });
        }
        return res.status(200).json(vendor);
    } catch (error) {
        console.error("Error fetching vendor:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
});

router.post('/create', async (req, res) => {
    const { name, phone, zipcode } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: "Name is required and must be a non-empty string." });
    }
    if (!phone || isNaN(phone)) {
        return res.status(400).json({ error: "Phone is required and must be a number." });
    }

    const existingVendor = await Vendors.findOne({ where: { name: name.trim() } });
    if (existingVendor) {
        return res.status(400).json({ error: "Vendor with this name already exists." });
    }

    const vendor = await Vendors.create({ ...req.body, name: name.trim(), zipcode: zipcode === "" ? 0 : zipcode, phone });

    sendVendorCreatedNotification(vendor.id, vendor)

    return res.status(201).json(vendor);
    // try {
    //     const { name, phone } = req.body;
    //     if (!name || typeof name !== 'string' || name.trim().length === 0) {
    //         return res.status(400).json({ error: "Name is required and must be a non-empty string." });
    //     }
    //     if (!phone || isNaN(phone)) {
    //         return res.status(400).json({ error: "Phone is required and must be a number." });
    //     }

    //     // Check for duplicate vendor name
    //     const existingVendor = await Vendors.findOne({ where: { name: name.trim() } });
    //     if (existingVendor) {
    //         return res.status(400).json({ error: "Vendor with this name already exists." });
    //     }

    //     // You can add more fields as needed
    //     const vendor = await Vendors.create({ ...req.body, name: name.trim(), phone });
    //     return res.status(201).json(vendor);
    // } catch (error) {
    //     console.error("Error creating vendor:", error?.message || error);
    //     return res.status(500).json({ error: "Internal server error, please try again later." });
    // }
});

router.patch('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, materials } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ error: "Name is required and must be a non-empty string." });
        }

        if (!phone || isNaN(phone)) {
            return res.status(400).json({ error: "Phone is required and must be a number." });
        }

        const vendor = await Vendors.findByPk(id);
        if (!vendor) {
            return res.status(404).json({ error: "Vendor not found." });
        }

        const updateData = {
            name: name.trim(),
            phone,
        };

        if (Array.isArray(materials) && materials.length > 0) {
            updateData.materials = materials.filter(m => typeof m === 'string' && m.trim());
        }

        const updatedVendor = await vendor.update(updateData);

        if (!updatedVendor) {
            return res.status(500).json({ error: "Failed to update vendor." });
        }

        sendVendorUpdatedNotification(updatedVendor.id, updatedVendor);

        return res.status(200).json(updatedVendor);
    } catch (error) {
        console.error("Error updating vendor:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
});

router.patch('/add-orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { orders } = req.body; // expects: { orders: [orderId1, orderId2, ...] }

        if (!Array.isArray(orders) || orders.length === 0) {
            return res.status(400).json({ error: "Orders must be a non-empty array." });
        }

        const vendor = await Vendors.findByPk(id);
        if (!vendor) {
            return res.status(404).json({ error: "Vendor not found." });
        }

        // Ensure vendor.orders is an array
        const currentOrders = Array.isArray(vendor.orders) ? vendor.orders : [];
        // Add only unique new order IDs
        const newOrders = orders.filter(orderId => !currentOrders.includes(orderId));
        vendor.orders = [...currentOrders, ...newOrders];

        await vendor.save();

        return res.status(200).json({ message: "Orders added successfully.", orders: vendor.orders });
    } catch (error) {
        console.error("Error adding orders to vendor:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const vendor = await Vendors.findByPk(id);
        if (!vendor) {
            return res.status(404).json({ error: "Vendor not found." });
        }
        await vendor.destroy();
        return res.status(200).json({ message: "Vendor deleted successfully." });
    } catch (error) {
        console.error("Error deleting vendor:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
});

module.exports = router;
