const router = require("express").Router();
const { WorkLocation } = require("../models");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../utils/s3Client");

const upload = multer();

const uploadToS3 = async (file) => {
    const id = uuidv4();
    const fileKey = `work-location/${id}-${file.originalname}`;
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
        const { location_name, description } = req.body;

        if (!location_name) {
            return res.status(400).json({ error: "Missing required field: location_name." });
        }

        // Validate: Check if a work location with the same name already exists
        const existingLocation = await WorkLocation.findOne({ where: { location_name: location_name.trim() } });
        if (existingLocation) {
            return res.status(409).json({ error: "Work location with this name already exists." });
        }

        let sample_image = null;
        if (req.file) {
            const uploaded = await uploadToS3(req.file);
            sample_image = {
                url: uploaded.url,
                key: uploaded.key,
            };
        }

        const newWorkLocation = await WorkLocation.create({
            location_name: location_name.trim(),
            description,
            sample_image,
        });

        res.status(201).json(newWorkLocation);
    } catch (error) {
        console.error("Create Work Location Error:", error.message);
        res.status(500).json({ error: "Internal server error." });
    }
});

// READ ALL
router.get("/", async (req, res) => {
    try {
        const workLocations = await WorkLocation.findAll();

        res.status(200).json(workLocations);
    } catch (error) {
        console.error("Get All Work Locations Error:", error.message);
        res.status(500).json({ error: "Internal server error." });
    }
});

// READ BY ID
router.get("/:id", async (req, res) => {
    try {
        const workLocation = await WorkLocation.findByPk(req.params.id);
        if (!workLocation) return res.status(404).json({ error: "Work location not found." });

        res.status(200).json(workLocation);
    } catch (error) {
        console.error("Get Work Location By ID Error:", error.message);
        res.status(500).json({ error: "Internal server error." });
    }
});

// UPDATE
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { location_name } = req.body;

        if (location_name) {
            const existingLocation = await WorkLocation.findOne({
                where: { location_name: location_name.trim() },
            });
            if (existingLocation && existingLocation.id !== id) {
                return res.status(409).json({ error: "Another work location with this name already exists." });
            }
        }

        const [count, [updatedWorkLocation]] = await WorkLocation.update(req.body, {
            where: { id },
            returning: true,
        });

        if (count === 0) return res.status(404).json({ error: "Work location not found." });

        res.status(200).json({ message: "Updated successfully", data: updatedWorkLocation });
    } catch (error) {
        console.error("Update Work Location Error:", error.message);
        res.status(500).json({ error: "Internal server error." });
    }
});

// DELETE
router.delete("/:id", async (req, res) => {
    try {
        const workLocation = await WorkLocation.findByPk(req.params.id);
        if (!workLocation) return res.status(404).json({ error: "Work location not found." });

        await workLocation.destroy();
        res.status(200).json({ message: "Deleted successfully", data: workLocation });
    } catch (error) {
        console.error("Delete Work Location Error:", error.message);
        res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;
