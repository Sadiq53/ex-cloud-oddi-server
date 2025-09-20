const router = require("express").Router();
const { FrozenWarehouse, Production } = require("../../models");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../../utils/s3Client");
const redisClient = require("../../devops/redis")

const upload = multer();

const uploadToS3 = async (file) => {
  const id = uuidv4();
  const fileKey = `warehouses/frozen/${id}-${file.originalname}`;
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
    const { production_id, product_name, quantity_kg, warehoused_date, rating, chamber } = req.body;

    if (!production_id || !product_name || !quantity_kg || !warehoused_date || !rating || !chamber) {
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

    const newItem = await FrozenWarehouse.create({
      production_id,
      product_name: product_name.trim(),
      quantity_kg: Number(quantity_kg),
      warehoused_date: new Date(warehoused_date),
      chamber: Number(chamber),
      rating: Number(rating),
      sample_image,
    });

    await redisClient.del(`frozen:chamber:${chamber}`);
    await redisClient.set(`frozen:product:${newItem.id}`, JSON.stringify(newItem));
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Create Frozen Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});


// READ ALL
router.get("/", async (req, res) => {
  const chambers = Array.from({ length: 18 }, (_, i) => `${i + 1}`);
  const results = [];

  try {
    for (const chamber of chambers) {
      const cacheKey = `frozen:chamber:${chamber}`;
      let data = await redisClient.get(cacheKey);

      if (!data) {
        const freshData = await FrozenWarehouse.findAll({
          where: { chamber },
          include: [{ model: Production, as: "production" }],
        });

        data = JSON.stringify(freshData);
        await redisClient.set(cacheKey, data); 
      }

      results.push(...JSON.parse(data));
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("Get All Frozen Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// READ BY ID
router.get("/:id", async (req, res) => {
  const productId = req.params.id;
  const cacheKey = `frozen:product:${productId}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    const item = await FrozenWarehouse.findOne({
      where: { id: productId },
      include: [{ model: Production, as: "production" }],
    });

    if (!item) return res.status(404).json({ error: "Item not found." });

    await redisClient.set(cacheKey, JSON.stringify(item)); 

    res.status(200).json(item);
  } catch (error) {
    console.error("Get Frozen By ID Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// READ BY CHAMBER
router.get("/:chamber", async (req, res) => {
  const chamber = req.params.chamber;
  const cacheKey = `frozen:chamber:${chamber}`;

  try {
    // Check Redis
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    // Fetch from DB
    const item = await FrozenWarehouse.find({
      where: { chamber },
      include: [{ model: Production, as: "production" }],
    });

    if (!item) return res.status(404).json({ error: "chamber not found." });

    await redisClient.set(cacheKey, JSON.stringify(item));
    res.status(200).json(item);
  } catch (error) {
    console.error("Get Frozen By chamber Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existingItem = await FrozenWarehouse.findByPk(id);
    if (!existingItem) return res.status(404).json({ error: "Item not found." });

    const [count, [updatedItem]] = await FrozenWarehouse.update(req.body, {
      where: { id },
      returning: true,
    });

    if (count === 0) return res.status(404).json({ error: "Item not found." });

    await redisClient.del(`frozen:product:${id}`);

    if (req.body.chamber && req.body.chamber !== existingItem.chamber) {
      await redisClient.del(`frozen:chamber:${existingItem.chamber}`);
      await redisClient.del(`frozen:chamber:${req.body.chamber}`);
    } else {
      await redisClient.del(`frozen:chamber:${existingItem.chamber}`);
    }

    res.status(200).json({ message: "Updated successfully", data: updatedItem });
  } catch (error) {
    console.error("Update Frozen Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const item = await FrozenWarehouse.findByPk(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found." });

    await redisClient.del(`frozen:product:${item.id}`);
    await redisClient.del(`frozen:chamber:${item.chamber}`);

    await item.destroy();

    res.status(200).json({ message: "Deleted successfully", data: item });
  } catch (error) {
    console.error("Delete Frozen Error:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
