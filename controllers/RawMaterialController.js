const router = require("express").Router();
const { Op } = require("sequelize");
const { format } = require('date-fns');

const { RawMaterialOrder: RawMaterialOrderClient, RawMaterial: RawMaterialClient, Vendors: VendorClient, Production: ProductionClient } = require('../models');
const { sendRawMaterialCreatedNotification, sendRawMaterialStatus } = require("../utils/notification");

const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../utils/s3Client');
const dispatchAndSendNotification = require("../utils/dispatchAndSendNotification");
const notificationTypes = require("../types/notification-types");
require('dotenv').config()

const upload = multer();

const uploadToS3 = async (file) => {
  const id = uuidv4();
  const fileKey = `raw-materials/${id}-${file.originalname}`;
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

router.get("/all", async (req, res) => {
  try {
    const RawMaterials = await RawMaterialClient.findAll();

    res.status(200).json(RawMaterials)
  } catch (error) {
    console.error("Error during fetching Raw Material:", error?.message || error);
    return res.status(500).json({ error: "Internal server error, please try again later." });
  }
})

router.post('/', upload.single('sample_image'), async (req, res) => {
  try {
    const { name } = req.body;


    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required and must be a non-empty string." });
    }

    const rawMaterials = await RawMaterialClient.findOne({ where: { name } })

    if (rawMaterials) {
      return res.status(400).json({ error: "Raw material already exist " });
    }

    let sample_image = null;
    if (req.file) {
      const uploaded = await uploadToS3(req.file);
      sample_image = {
        url: uploaded.url,
        key: uploaded.key,
      };
    }

    // Save to DB
    const newRawMaterial = await RawMaterialClient.create({
      name: name.trim(),
      sample_image,
    });

    return res.status(201).json(newRawMaterial);

  } catch (error) {
    console.error("Error during adding Raw Material:", error?.message || error);
    return res.status(500).json({ error: "Internal server error, please try again later." });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const rawMaterial = await RawMaterialClient.findOne({ where: { id } });

    if (!rawMaterial) {
      return res.status(404).json({ error: "Raw Material not found" });
    }
    await RawMaterialClient.destroy({ where: { id } });

    return res.status(200).json({ message: "Deleted successfully", data: rawMaterial });
  } catch (error) {
    console.error("Error during deleting Raw Material:", error?.message || error);
    return res.status(500).json({ error: "Internal server error, please try again later." });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updatedFields = {
    ...req.body,
    updatedAt: new Date()
  };

  try {
    const [updatedCount, updatedRows] = await RawMaterialClient.update(updatedFields, {
      where: { id },
      returning: true,
    });

    if (updatedCount === 0) {
      return res.status(404).json({ error: "Raw Material not found" });
    }

    return res.status(200).json({ message: "Updated successfully", data: updatedRows[0] });
  } catch (error) {
    console.error("Error during updating Raw Material:", error.message || error);
    return res.status(500).json({ error: "Internal server error, please try again later." });
  }
});

router.post('/order', async (req, res) => {
  try {
    const {
      rawMaterial,
      quantity,
      order_date,
      est_arrival_date,
      vendorQuantities
    } = req.body;

    const raw_material_name = rawMaterial[0]?.name;
    const unit = 'kg';

    if (!raw_material_name) {
      return res.status(400).json({ error: "Valid raw_material_name is required." });
    }

    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive number." });
    }

    if (!unit || typeof unit !== 'string') {
      return res.status(400).json({ error: "Unit is required and must be a non-empty string." });
    }

    let arrivalDate = null;
    if (est_arrival_date) {
      arrivalDate = new Date(est_arrival_date);
      if (isNaN(arrivalDate.getTime())) {
        return res.status(400).json({ error: "est_arrival_date must be a valid date." });
      }
    }

    const newOrders = await Promise.all(
      vendorQuantities?.map(async (vend) => {
        const createdOrder = await RawMaterialOrderClient.create({
          raw_material_name,
          vendor: vend.name,
          quantity_ordered: Number(vend.quantity),
          unit: unit.trim(),
          price: vend.price,
          est_arrival_date: arrivalDate,
          order_date: new Date(order_date),
        });
        return createdOrder.get({ plain: true });
      }) || []
    );

    for (const order of newOrders) {
      const vendorInstance = await VendorClient.findOne({
        where: { name: order.vendor },
        raw: true,
      });

      if (vendorInstance) {
        const currentOrders = Array.isArray(vendorInstance.orders) ? vendorInstance.orders : [];

        if (!currentOrders.includes(order.id)) {
          currentOrders.push(order.id);

          await VendorClient.update(
            { orders: currentOrders },
            { where: { name: order.vendor } }
          );
        }

        const formattedDate = order.est_arrival_date
          ? format(new Date(order.est_arrival_date), 'MMM d, yyyy')
          : '--';

        const notificationDetails = {
          title: "RAW MATERIAL ORDERED",
          timestamp: new Date().toISOString(),
          material_name: raw_material_name || "Material",
          date: formattedDate,
          vendor: order.vendor,
          quantity: `${order.quantity_ordered}${order.unit}`,
          action_label: "Create product",
          action_url: `/create-product/${order.id}`,
        };

        sendRawMaterialCreatedNotification(order.id, notificationDetails);

        dispatchAndSendNotification({
          type: notificationTypes['raw-material-ordered'],
          description: [order.quantity_ordered, formattedDate, order.vendor],
          title: order.raw_material_name,
          id: order.id,
        });
      } else {
        console.warn(`Vendor with name '${order.vendor}' not found.`);
      }
    }

    return res.status(201).json(newOrders);

  } catch (error) {
    console.error("Error during adding Raw Material Order:", error?.message || error);
    return res.status(500).json({ error: "Internal server error, please try again later." });
  }
});

router.get("/order", async (req, res) => {
  try {
    const { limit = 10, offset = 0, status } = req.query;

    const whereClause = {};

    if (status === "pending") {
      whereClause.arrival_date = null;
    } else if (status === "completed") {
      whereClause.arrival_date = { [Op.ne]: null };
    }

    const rawMaterialOrders = await RawMaterialOrderClient.findAll({
      where: whereClause,
      limit: Number(limit),
      offset: Number(offset),
      order: [['createdAt', 'DESC']],
      raw: true,
    });

    return res.status(200).json(rawMaterialOrders);
  } catch (error) {
    console.error("Error fetching Raw Material Orders:", error?.message || error);
    return res.status(500).json({ error: "Internal server error, please try again later." });
  }
});

router.get("/order/all", async (req, res) => {
  try {

    const rawMaterialOrders = await RawMaterialOrderClient.findAll();

    return res.status(200).json(rawMaterialOrders);
  } catch (error) {
    console.error("Error fetching Raw Material Orders:", error?.message || error);
    return res.status(500).json({ error: "Internal server error, please try again later." });
  }
});

router.get("/order/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const order = await RawMaterialOrderClient.findOne({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: "Raw Material Order not found" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching Raw Material Order:", error?.message || error);
    return res.status(500).json({ error: "Internal server error, please try again later." });
  }
});

router.delete("/order/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const order = await RawMaterialOrderClient.findOne({ where: { id } });

    if (!order) {
      return res.status(404).json({ error: "Raw Material Order not found" });
    }

    await RawMaterialOrderClient.destroy({ where: { id } });

    return res.status(200).json({ message: "Deleted successfully", data: order });
  } catch (error) {
    console.error("Error deleting Raw Material Order:", error?.message || error);
    return res.status(500).json({ error: "Internal server error, please try again later." });
  }
});

router.patch("/order/:id", upload.single('challan'), async (req, res) => {
  const { id } = req.params;

  try {
    const rawData = await RawMaterialOrderClient.findByPk(id);
    if (!rawData) {
      return res.status(404).json({ error: "Raw Material Order not found" });
    }

    const {
      truck_weight,
      tare_weight,
      arrival_date,
      quantity_received,
      truck_number,
      driver_name,
      ...otherFields
    } = req.body;

    const updatedFields = {
      ...otherFields,
      updatedAt: new Date(),
      quantity_received: Number(quantity_received)
    };

    const truckDetails = {};

    if (truck_weight) truckDetails.truck_weight = truck_weight;
    if (tare_weight) truckDetails.tare_weight = tare_weight;
    if (truck_number) truckDetails.truck_number = truck_number;
    if (driver_name) truckDetails.driver_name = driver_name;

    if (req.file) {
      const uploaded = await uploadToS3(req.file);
      if (!uploaded?.url || !uploaded?.key) {
        return res.status(500).json({ error: "Failed to upload challan file." });
      }

      truckDetails.challan = {
        url: uploaded.url,
        key: uploaded.key,
      };
    } else {
      truckDetails.challan = updatedFields?.truck_details ? updatedFields?.truck_details?.challan : {}
    }

    if (Object.keys(truckDetails).length > 0) {
      updatedFields.truck_details = truckDetails;
    }

    if (!rawData?.arrival_date && arrival_date) {
      updatedFields.arrival_date = new Date(arrival_date);
      updatedFields.status = 'completed'; 

      await ProductionClient.create({
        product_name: rawData.raw_material_name,
        quantity: Number(quantity_received),
        unit: rawData.unit,
        raw_material_order_id: rawData.id,
        status: 'pending',
      });
    }

    const [updatedCount] = await RawMaterialOrderClient.update(updatedFields, {
      where: { id },
      returning: true,
    });

    if (updatedCount === 0) {
      return res.status(404).json({ error: "Failed to update Raw Material Order" });
    }

    const updatedOrder = await RawMaterialOrderClient.findByPk(id);
    if (!updatedOrder) {
      return res.status(404).json({ error: "Cannot retrieve updated order." });
    }

    if (!rawData?.arrival_date && arrival_date) {
      const formattedDate = updatedOrder.est_arrival_date
        ? format(new Date(updatedOrder.est_arrival_date), 'MMM d, yyyy')
        : "--";

      const description = [
        updatedOrder.quantity_ordered,
        updatedOrder.est_arrival_date ? formattedDate : "--",
        updatedOrder.vendor,
      ];

      const vendorInfo = await VendorClient.findOne({
        where: { name: updatedOrder.vendor },
        raw: true,
      });

      if (!vendorInfo) console.warn('Vendor not found for', updatedOrder.vendor);

    if (!rawData?.arrival_date && arrival_date) {
      dispatchAndSendNotification({
        type: notificationTypes['raw-material-reached'],
        description,
        title: updatedOrder.raw_material_name,
        id: updatedOrder.id,
      });
    }
      
      const status =
        updatedOrder.status ??
        (updatedOrder.arrival_date ? 'completed' : 'pending');
  
      sendRawMaterialStatus(updatedOrder.id, {
        id: updatedOrder.id,
        raw_material_name: updatedOrder.raw_material_name,
        vendor: updatedOrder.vendor,
        order_date: updatedOrder.order_date,
        est_arrival_date: updatedOrder.est_arrival_date,
        arrival_date: updatedOrder.arrival_date,
        address: vendorInfo?.address ?? null,
        quantity_ordered: updatedOrder.quantity_ordered,
        unit: updatedOrder.unit,
        status,
      })
    }

    return res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating Raw Material Order:", error?.message || error);
    return res.status(500).json({
      error: "Internal server error. Please try again later.",
      details: error?.message || error,
    });
  }
});

module.exports = router