const router = require("express").Router();
const { Packages } = require("../models");

// GET all packages
router.get('/', async (req, res) => {
    try {
        const packages = await Packages.findAll();
        return res.status(200).json(packages);
    } catch (error) {
        console.error("Error fetching packages:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// GET packages by product_name
router.get('/product/:productName', async (req, res) => {
    try {
        const { productName } = req.params;

        let packages = await Packages.findOne({
            where: { product_name: productName }
        });
        packages = packages.dataValues;

        if (!packages) return res.status(404).json({ error: "No packages found for this product." });
        return res.status(200).json(packages);
    } catch (error) {
        console.error("Error fetching packages by product_name:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// GET package by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pkg = await Packages.findByPk(id);
        if (!pkg) return res.status(404).json({ error: "Package not found." });
        return res.status(200).json(pkg);
    } catch (error) {
        console.error("Error fetching package:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

router.post('/create', async (req, res) => {
    try {
        let { product_name, raw_materials, types } = req.body;

        if (!product_name || typeof product_name !== 'string') {
            return res.status(400).json({ error: "product_name is required and must be a string." });
        }

        if (!Array.isArray(raw_materials) || raw_materials.length === 0) {
            return res.status(400).json({ error: "raw_materials must be a non-empty array of strings." });
        }

        if (!Array.isArray(types) || types.length === 0) {
            return res.status(400).json({ error: "types must be a non-empty array." });
        }

        for (const item of types) {
            if (typeof item.size !== 'string' || typeof item.quantity !== 'string') {
                return res.status(400).json({ error: "Each type must have 'size' and 'quantity' as strings." });
            }
            if (
                !(item.unit === null || (typeof item.unit === 'string' && ['kg', 'gm', 'null'].includes(item.unit)))
            ) {
                return res.status(400).json({ error: "Unit must be 'kg', 'gm', 'null' as a string, or actual null." });
            }
        }

        types = types.map(item => ({
            size: typeof item.size === 'string' ? item.size.trim() : item.size,
            quantity: typeof item.quantity === 'string' ? item.quantity.trim() : item.quantity,
            unit: item.unit === null ? null : (typeof item.unit === 'string' ? item.unit.trim() : item.unit)
        }));

        product_name = product_name.trim();
        raw_materials = raw_materials.map(val => typeof val === 'string' ? val.trim() : val);

        const pkg = await Packages.create({ product_name, raw_materials, types });
        console.log("pkg", pkg);

        return res.status(201).json(pkg);
    } catch (error) {
        console.error("Error creating package:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});


router.patch('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { product_name, raw_materials, size, unit, quantity } = req.body;

        const pkg = await Packages.findByPk(id);
        if (!pkg) return res.status(404).json({ error: "Package not found." });

        const updates = {};

        if (product_name !== undefined) {
            if (typeof product_name !== 'string') {
                return res.status(400).json({ error: "product_name must be a string." });
            }
            updates.product_name = product_name.trim();
        }

        if (raw_materials !== undefined) {
            if (!Array.isArray(raw_materials)) {
                return res.status(400).json({ error: "raw_materials must be an array of strings." });
            }
            updates.raw_materials = raw_materials.map(val => typeof val === 'string' ? val.trim() : val);
        }

        if (size !== undefined && unit !== undefined && quantity !== undefined) {
            if (typeof size !== 'string') {
                return res.status(400).json({ error: "'size' must be a string." });
            }
            if (typeof quantity !== 'string' && typeof quantity !== 'number') {
                return res.status(400).json({ error: "'quantity' must be a string or number." });
            }
            if (
                !(unit === null || (typeof unit === 'string' && ['kg', 'gm', 'null'].includes(unit.trim())))
            ) {
                return res.status(400).json({ error: "Unit must be 'kg', 'gm', 'null' (as string), or actual null." });
            }

            const normalizedSize = size.trim();
            const normalizedUnit = unit === null ? null : unit.trim();
            const numericQuantity = typeof quantity === 'string' ? parseFloat(quantity) : quantity;

            if (isNaN(numericQuantity)) {
                return res.status(400).json({ error: "quantity must be a valid number." });
            }

            let existingTypes = Array.isArray(pkg.types) ? [...pkg.types] : [];
            if (!Array.isArray(pkg.types) && pkg.types) {
                existingTypes = [pkg.types];
            }

            const index = existingTypes.findIndex(t =>
                (typeof t.size === 'string' ? t.size.trim() : String(t.size)) === normalizedSize &&
                ((t.unit === null && normalizedUnit === null) ||
                    (typeof t.unit === 'string' ? t.unit.trim() : t.unit) === normalizedUnit)
            );

            if (index !== -1) {
                const existingQty = parseFloat(existingTypes[index].quantity || '0');
                existingTypes[index].quantity = (existingQty + numericQuantity).toString();
            } else {
                existingTypes.push({
                    size: normalizedSize,
                    unit: normalizedUnit,
                    quantity: numericQuantity.toString(),
                });
            }

            updates.types = existingTypes.map(item => ({
                size: typeof item.size === 'string' ? item.size.trim() : item.size,
                quantity: typeof item.quantity === 'string' ? item.quantity.trim() : item.quantity,
                unit: item.unit === null ? null : (typeof item.unit === 'string' ? item.unit.trim() : item.unit)
            }));
        }

        const [affectedRows] = await Packages.update(updates, { where: { id } });

        if (affectedRows === 0) {
            return res.status(404).json({ error: "Package not found or no changes made." });
        }

        const updatedPkg = await pkg.reload();
        return res.status(200).json(updatedPkg);
    } catch (error) {
        console.error("Error updating package:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});


// DELETE package
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pkg = await Packages.findByPk(id);
        if (!pkg) return res.status(404).json({ error: "Package not found." });

        await pkg.destroy();
        return res.status(200).json({ message: "Package deleted successfully." });
    } catch (error) {
        console.error("Error deleting package:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

router.patch('/replace/type/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { size, unit, quantity } = req.body;

        const pkg = await Packages.findByPk(id);
        if (!pkg) return res.status(404).json({ error: "Package not found." });

        const numericQuantity = parseFloat(quantity);
        if (isNaN(numericQuantity)) {
            return res.status(400).json({ error: "quantity must be a valid number." });
        }

        let existingTypes = Array.isArray(pkg.types) ? [...pkg.types] : [];
        const index = existingTypes.findIndex(t => t.size === size && t.unit === unit);

        if (index !== -1) {
            existingTypes[index].quantity = numericQuantity.toString(); // ✅ Replace quantity
        } else {
            existingTypes.push({ size, unit, quantity: numericQuantity.toString() });
        }

        pkg.types = existingTypes;
        await pkg.save();

        return res.status(200).json(pkg);
    } catch (error) {
        console.error("Dangerous replace error:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});

router.patch('/delete/type/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { size, unit } = req.body;

        const pkg = await Packages.findByPk(id);
        if (!pkg) return res.status(404).json({ error: "Package not found." });

        let existingTypes = Array.isArray(pkg.types) ? [...pkg.types] : [];
        const filteredTypes = existingTypes.filter(t => !(t.size === size && t.unit === unit));

        if (filteredTypes.length === existingTypes.length) {
            return res.status(404).json({ error: "Type with matching size and unit not found." });
        }

        pkg.types = filteredTypes;
        await pkg.save();

        return res.status(200).json(pkg);
    } catch (error) {
        console.error("Dangerous delete error:", error.message);
        return res.status(500).json({ error: "Internal server error." });
    }
});


module.exports = router;
