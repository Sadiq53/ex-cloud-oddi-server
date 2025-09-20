const router = require("express").Router();
const { Chambers: chamberClient } = require("../../models");


// CREATE
router.post("/", async (req, res) => {
  try {
    const { chamber_name, tag, capacity } = req.body;

    if (!chamber_name) {
      return res.status(400).json({ error: "Missing required fields: chamber_name." });
    }

    // Validate: Check if a chamber with the same name already exists
    const existingChamber = await chamberClient.findOne({ where: { chamber_name: chamber_name.trim() } });
    if (existingChamber) {
      return res.status(409).json({ error: "Chamber with this name already exists." });
    }

    const newChamber = await chamberClient.create({
      chamber_name: chamber_name.trim(),
      tag,
      capacity: Number(capacity)
    });


    res.status(201).json(newChamber);
  } catch (error) {
    console.error("Create Chamber Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/chamber/ids", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Missing or invalid required field: ids must be a non-empty array." });
    }

    const foundChambers = await chamberClient.findAll({
      where: {
        id: ids
      }
    });

    if (foundChambers.length !== ids.length) {
      const foundIds = foundChambers.map(chamber => chamber.id);
      const missingIds = ids.filter(id => !foundIds.includes(id));
      return res.status(404).json({ error: "Some chamber IDs not found", missingIds });
    }

    res.status(200).json(foundChambers);
  } catch (error) {
    console.error("Find chambers by IDs error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});


// READ ALL
router.get("/", async (req, res) => {

  try {
    const chambers = await chamberClient.findAll();

    res.status(200).json(chambers);
  } catch (error) {
    console.error("Get All Chambers Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/name/:name", async (req, res) => {
  try {
    const chamber = await chamberClient.findOne({ where: { chamber_name: req.params.name } });
    if (!chamber) return res.status(404).json({ error: "Chamber not found." });

    res.status(200).json(chamber);
  } catch (error) {
    console.error("Get Chamber By Name Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// READ BY TAG
router.get("/tag/:tag", async (req, res) => {
  try {
    const { tag } = req.params;
    const validTags = ["frozen", "dry"]; // Or dynamically get from Sequelize.ENUM values
    if (!validTags.includes(tag.toLowerCase())) {
      return res.status(400).json({ error: "Invalid tag provided. Must be 'frozen' or 'dry'." });
    }

    const chambers = await chamberClient.findAll({ where: { tag: tag.toLowerCase() } });
    res.status(200).json(chambers);
  } catch (error) {
    console.error("Get Chambers By Tag Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// READ BY ID
router.get("/:id", async (req, res) => {
  try {
    const chamber = await chamberClient.findByPk(req.params.id);
    if (!chamber) return res.status(404).json({ error: "Chamber not found." });

    res.status(200).json(chamber);
  } catch (error) {
    console.error("Get Chamber By ID Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { chamber_name } = req.body;

    if (chamber_name) {
      const existingChamber = await chamberClient.findOne({
        where: { chamber_name: chamber_name.trim() },
      });
      if (existingChamber && existingChamber.id !== id) {
        return res.status(409).json({ error: "Another chamber with this name already exists." });
      }
    }


    const [count, [updatedChamber]] = await chamberClient.update(req.body, {
      where: { id },
      returning: true,
    });

    if (count === 0) return res.status(404).json({ error: "Chamber not found." });

    res.status(200).json({ message: "Updated successfully", data: updatedChamber });
  } catch (error) {
    console.error("Update Chamber Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const chamber = await chamberClient.findByPk(req.params.id);
    if (!chamber) return res.status(404).json({ error: "Chamber not found." });

    await chamber.destroy();
    res.status(200).json({ message: "Deleted successfully", data: chamber });
  } catch (error) {
    console.error("Delete Chamber Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
