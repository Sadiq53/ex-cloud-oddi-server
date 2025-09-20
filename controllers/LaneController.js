const router = require("express").Router();
const { Lanes } = require("../models");


// CREATE
router.post("/", async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Missing required field: name." });
        }

        // Validate: Check if a lane with the same name already exists
        const existingLane = await Lanes.findOne({ where: { name: name.trim() } });
        if (existingLane) {
            return res.status(409).json({ error: "Lane with this name already exists." });
        }

        const newLane = await Lanes.create({
            name: name.trim(),
            description,
        });

        res.status(201).json(newLane);
    } catch (error) {
        console.error("Create Lane Error:", error.message);
        res.status(500).json({ error: "Internal server error." });
    }
});

// READ ALL
router.get("/", async (req, res) => {
    try {
        const lanes = await Lanes.findAll();

        res.status(200).json(lanes);
    } catch (error) {
        console.error("Get All Lanes Error:", error.message);
        res.status(500).json({ error: "Internal server error." });
    }
});

// READ BY ID
router.get("/:id", async (req, res) => {
    try {
        const lane = await Lanes.findByPk(req.params.id);
        if (!lane) return res.status(404).json({ error: "Lane not found." });

        res.status(200).json(lane);
    } catch (error) {
        console.error("Get Lane By ID Error:", error.message);
        res.status(500).json({ error: "Internal server error." });
    }
});

// UPDATE
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (name) {
            const existingLane = await Lanes.findOne({
                where: { name: name.trim() },
            });
            if (existingLane && existingLane.id !== id) {
                return res.status(409).json({ error: "Another lane with this name already exists." });
            }
        }

        const [count, [updatedLane]] = await Lanes.update(req.body, {
            where: { id },
            returning: true,
        });

        if (count === 0) return res.status(404).json({ error: "Lane not found." });

        res.status(200).json({ message: "Updated successfully", data: updatedLane });
    } catch (error) {
        console.error("Update Lane Error:", error.message);
        res.status(500).json({ error: "Internal server error." });
    }
});

// DELETE
router.delete("/:id", async (req, res) => {
    try {
        const lane = await Lanes.findByPk(req.params.id);
        if (!lane) return res.status(404).json({ error: "Lane not found." });

        await lane.destroy();
        res.status(200).json({ message: "Deleted successfully", data: lane });
    } catch (error) {
        console.error("Delete Lane Error:", error.message);
        res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;
