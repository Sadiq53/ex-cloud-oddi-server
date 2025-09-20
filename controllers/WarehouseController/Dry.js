const router = require("express").Router();
const { DryWarehouse, Chambers: chamberClient } = require("../../models");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../../utils/s3Client");

const upload = multer();

const uploadToS3 = async (file) => {
  const id = uuidv4();
  const fileKey = `warehouses/dry/${id}-${file.originalname}`;
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


// CREATE
router.post("/", upload.single("sample_image"), async (req, res) => {
  try {
    const { item_name, warehoused_date, description, quantity_unit, chamber_id } = req.body;

    if (!item_name || !warehoused_date || !chamber_id) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    let sample_image = null;
    if (req.file) {
      const uploaded = await uploadToS3(req.file);
      sample_image = {
        url: uploaded.url,
        key: uploaded.key,
      };
    }

    const newItem = await DryWarehouse.create({
      item_name: item_name.trim(),
      warehoused_date: new Date(warehoused_date),
      description,
      quantity_unit,
      sample_image, 
      chamber_id,
    });

    if (chamber_id) {
      const chamber = await chamberClient.findOne({ where: { chamber_name: chamber_id } });

      if (chamber) {
        const currentItems = chamber.items || [];
        currentItems.push(newItem.id);
        chamber.items = currentItems;
        await chamber.save();
      } else {
        console.warn(`Chamber with ID ${chamber_id} not found.`);
      }
    }

    res.status(201).json(newItem);
  } catch (error) {
    console.error("Create Dry Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// READ ALL
router.get("/", async (req, res) => {
  try {
    const items = await DryWarehouse.findAll();
    console.log(items);
    
    
    res.status(200).json(items);
  } catch (error) {
    console.error("Get All Dry Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// READ BY ID
router.get("/:id", async (req, res) => {
  try {
    const item = await DryWarehouse.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found." });

    res.status(200).json(item);
  } catch (error) {
    console.error("Get Dry By ID Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { chamber_id: newChamberId } = req.body;

    const existingItem = await DryWarehouse.findByPk(id);
    if (!existingItem) {
      return res.status(404).json({ error: "Item not found." });
    }

    const oldChamberId = existingItem.chamber_id;

    const [count, [updatedItem]] = await DryWarehouse.update(req.body, {
      where: { id },
      returning: true,
    });

    if (count === 0) return res.status(404).json({ error: "Item not found." });

    // If chamber_id is being changed or added
    if (newChamberId !== undefined && newChamberId !== oldChamberId) {
      // Remove item from the old chamber if it existed
      if (oldChamberId) {
        const oldChamber = await chamberClient.findOne({ where: { chamber_name: oldChamberId } });
        if (oldChamber) {
          oldChamber.items = (oldChamber.items || []).filter(itemId => itemId !== existingItem.id);
          await oldChamber.save();
        } else {
          console.warn(`Old Chamber with ID ${oldChamberId} not found.`);
        }
      }

      // Add item to the new chamber if newChamberId is provided
      if (newChamberId) {
        const newChamber = await chamberClient.findOne({ where: { chamber_name: newChamberId } });
        if (newChamber) {
          const currentItems = newChamber.items || [];
          if (!currentItems.includes(updatedItem.id)) {
            currentItems.push(updatedItem.id);
          }
          newChamber.items = currentItems;
          await newChamber.save();
        } else {
          console.warn(`New Chamber with ID ${newChamberId} not found.`);
        }
      }
    }


    res.status(200).json({ message: "Updated successfully", data: updatedItem });
  } catch (error) {
    console.error("Update Dry Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const item = await DryWarehouse.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found." });

    // Use item.chamber_id to find the associated chamber
    if (item?.chamber_id) {
      const chamber = await chamberClient.findOne({ where: { chamber_name: item?.chamber_id } });

      if (chamber) {
        const currentItems = chamber.items || [];
        // Filter out the deleted item's ID from the chamber's items array
        chamber.items = currentItems.filter(id => id !== item.id);
        await chamber.save();
      } else {
        // Log the correct chamber ID if not found
        console.warn(`Chamber with ID ${item.chamber_id} not found.`);
      }
    }

    await item.destroy();
    res.status(200).json({ message: "Deleted successfully", data: item });
  } catch (error) {
    console.error("Delete Dry Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
