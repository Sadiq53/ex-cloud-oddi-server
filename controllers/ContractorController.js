const router = require("express").Router();
const { Contractor } = require("../models");
const notificationTypes = require("../types/notification-types");
const dispatchAndSendNotification = require("../utils/dispatchAndSendNotification");

// CREATE: Add multiple contractors at once
router.post("/create", async (req, res) => {
    try {
        // Expect contractors in { contractors: [...] }
        const contractors = req.body;

        // Validate main array existence
        if (!Array.isArray(contractors) || contractors.length === 0) {
            return res.status(400).json({ error: "Contractors array is required and cannot be empty." });
        }

        // Array to collect validation errors
        const errors = [];
        contractors.forEach((contractor, idx) => {
            if (!contractor || typeof contractor !== "object") {
                errors.push(`Contractor at index ${idx} is invalid.`);
                return;
            }
            if (typeof contractor.name !== "string" || contractor.name.trim().length === 0) {
                errors.push(`Contractor at index ${idx} must have a non-empty 'name'.`);
            }
            if (!Array.isArray(contractor.work_location)) {
                errors.push(`Contractor at index ${idx} must have a 'work_location' array.`);
            }
            // Ensure counts are numbers (default zero if missing or invalid)
            ["male_count", "female_count"].forEach(countKey => {
                if (
                    contractor[countKey] !== undefined &&
                    (typeof contractor[countKey] !== "number" || contractor[countKey] < 0)
                ) {
                    errors.push(`Contractor at index ${idx}: '${countKey}' must be a non-negative number.`);
                }
            });
        });

        if (errors.length > 0) {
            return res.status(400).json({ error: "Validation failed", details: errors });
        }

        // Prepare the sanitized contractors array
        const sanitizedContractors = contractors.map(c => ({
            name: c.name.trim(),
            male_count: typeof c.male_count === "number" && c.male_count >= 0 ? c.male_count : 0,
            female_count: typeof c.female_count === "number" && c.female_count >= 0 ? c.female_count : 0,
            work_location: Array.isArray(c.work_location) ? c.work_location : []
        }));

        // Bulk create
        const created = await Contractor.bulkCreate(sanitizedContractors, { returning: true });

        // Handle possible failure or partial success in .bulkCreate
        if (!Array.isArray(created) || created.length === 0) {
            return res.status(500).json({ error: "Failed to create contractors." });
        }

        // Generate notification description/title efficiently
        const totalMale = sanitizedContractors.reduce((acc, val) => acc + val.male_count, 0);
        const totalFemale = sanitizedContractors.reduce((acc, val) => acc + val.female_count, 0);
        const createdIds = created.map(c => c.id).join(',');

        const description = [`Male count: ${totalMale}`, `Female count: ${totalFemale}`];
        const title = `Total workers: ${totalMale + totalFemale}`;


        // Dispatch notification (consider await if asynchronous)
        await dispatchAndSendNotification({
            type: notificationTypes['worker-multiple'],
            description,
            title,
            id: createdIds
        });

        return res.status(201).json({
            success: true,
            message: "Contractors created successfully.",
            data: created
        });
    } catch (error) {
        // Log stack trace for debugging
        console.error("Error creating contractors:", error);
        // Handle known Sequelize validation errors
        if (error.name && error.name === "SequelizeValidationError") {
            return res.status(400).json({ error: "Database validation failed.", details: error.errors?.map(e => e.message) });
        }
        // Fallback for unknown errors
        return res.status(500).json({ error: "Internal server error." });
    }
});

// GET ALL contractors
router.get("/", async (req, res) => {
    try {
        const contractors = await Contractor.findAll();
        return res.status(200).json(contractors);
    } catch (error) {
        console.error("Error fetching contractors:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// GET contractor by ID
router.get("/:id", async (req, res) => {
    try {
        const contractor = await Contractor.findByPk(req.params.id);
        if (!contractor) return res.status(404).json({ error: "Contractor not found." });
        return res.status(200).json(contractor);
    } catch (error) {
        console.error("Error fetching contractor:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// UPDATE contractor by ID
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const contractor = await Contractor.findByPk(id);
        if (!contractor) return res.status(404).json({ error: "Contractor not found." });

        // Only update provided fields
        const { name, male_count, female_count, work_location } = req.body;
        if (name !== undefined) contractor.name = name.trim();
        if (male_count !== undefined) contractor.male_count = male_count;
        if (female_count !== undefined) contractor.female_count = female_count;
        if (work_location !== undefined) contractor.work_location = work_location;

        await contractor.save();
        return res.status(200).json({ message: "Contractor updated successfully.", data: contractor });
    } catch (error) {
        console.error("Error updating contractor:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// DELETE contractor by ID
router.delete("/:id", async (req, res) => {
    try {
        const contractor = await Contractor.findByPk(req.params.id);
        if (!contractor) return res.status(404).json({ error: "Contractor not found." });

        await contractor.destroy();
        return res.status(200).json({ message: "Contractor deleted successfully." });
    } catch (error) {
        console.error("Error deleting contractor:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;
