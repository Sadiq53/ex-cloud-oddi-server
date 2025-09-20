const router = require("express").Router();
const { Notifications: NotificationsClient } = require("../models");

router.get('/actionable', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;
        const search = req.query.search || '';

        const whereClause = {
            category: 'actionable',
        };

        if (search) {
            whereClause.title = {
                [Op.iLike]: `%${search}%`,
            };
        }

        const { count, rows } = await NotificationsClient.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        return res.status(200).json(rows);
        // return res.status(200).json({ data: rows, total: count });
    } catch (error) {
        console.error('Error fetching actionable notifications:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/informative', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;
        const search = req.query.search || '';

        const whereClause = {
            category: 'informative',
        };

        if (search) {
            whereClause.title = {
                [Op.iLike]: `%${search}%`,
            };
        }

        const { count, rows } = await NotificationsClient.findAndCountAll({
            where: whereClause,
            limit,
            offset,
            order: [['createdAt', 'DESC']],
        });

        // return res.status(200).json({ data: rows, total: count });
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching informative notifications:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete("/actionable/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const order = await NotificationsClient.findOne({ where: { id } });

        if (!order) {
            return res.status(404).json({ error: "Notification not found" });
        }

        await Notifications.destroy({ where: { id } });

        return res.status(200).json({ message: "Deleted successfully", data: order });
    } catch (error) {
        console.error("Error deleting Notification:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
});

router.delete("/informative/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const order = await NotificationsClient.findOne({ where: { id } });

        if (!order) {
            return res.status(404).json({ error: "Notification not found" });
        }

        await Notifications.destroy({ where: { id } });

        return res.status(200).json({ message: "Deleted successfully", data: order });
    } catch (error) {
        console.error("Error deleting Notification:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
});

router.patch("/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const notificationData = await NotificationsClient.findByPk(id);
        
        if (!notificationData) {
            return res.status(404).json({ error: "notification not found" });
        }

        const allowedFields = ['read'];
        const updatedFields = {};

        allowedFields.forEach(field => {
            if (field in req.body) updatedFields[field] = req.body[field];
        });

        updatedFields.updatedAt = new Date();

        const [updatedCount, updatedRows] = await NotificationsClient.update(updatedFields, {
            where: { id },
            returning: true,
        });

        if (updatedCount === 0) {
            return res.status(404).json({ error: "Notification not found" });
        }
        
        return res.status(200).json({ message: "Updated successfully", data: updatedRows[0]?.dataValues });

    } catch (error) {
        console.error("Error updating Notification:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
})

module.exports = router;
