const router = require("express").Router();
const { Chambers: chamberClient, ChamberStock: chamberStockClient, History: historyClient } = require("../models");

const { sumBy } = require("../sbc/utils/sumBy/sumBy")
const { zipAndFit } = require("../sbc/utils/zipAndFit/zipAndFit")

router.get("/", async (req, res) => {
    try {
        const chamberStock = await chamberStockClient.findAll();

        res.status(200).json(chamberStock)
    } catch (error) {
        console.error("Error during fetching chamberStock:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
})

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const chamberStock = await chamberStockClient.findByPk(id);

        if (!chamberStock) {
            return res.status(404).json({ error: "Chamber stock not found" });
        }

        res.status(200).json(chamberStock);
    } catch (error) {
        console.error("Error during fetching chamberStock by id:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
});

router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let { chambers, add_quantity, sub_quantity } = req.body;

        const chamberStock = await chamberStockClient.findByPk(id, { raw: true });

        if (!chamberStock) {
            return res.status(404).json({ error: "Chamber stock not found" });
        }

        add_quantity = Number(add_quantity);
        sub_quantity = Number(sub_quantity);

        const updatedChambers = chamberStock.chamber.map((stockChamber) => {
            if (chambers.includes(stockChamber.id)) {
                let quantity = Number(stockChamber.quantity);

                if (add_quantity !== 0) {
                    quantity = quantity + add_quantity;
                }
                if (sub_quantity !== 0) {
                    quantity = quantity - sub_quantity;
                }

                return { ...stockChamber, quantity: quantity.toString() };
            }
            return stockChamber;
        });

        const updatedStock = await chamberStockClient.update(
            { chamber: updatedChambers },
            {
                where: { id },
                returning: true
            }
        );

        await historyClient.create({
            product_id: item.id,
            deduct_quantity: 0,
            stored_quantity: newQuantity
        });

        res.status(200).json(updatedStock);
    } catch (error) {
        console.error("Error during update chamberStock by id:", error?.message || error);
        return res.status(500).json({ error: "Internal server error, please try again later." });
    }
})


// fetch chamberstock + chamber name from chamber id
router.get("/stock/:product_name", async (req, res) => {
    const { product_name } = req.params;

    try {
        const chamberStockByPN = await chamberStockClient.findOne({
            where: { product_name }
        });

        if (!chamberStockByPN) {
            return res.status(200).json({
                status: "new",
                message: "Product not found in chamber stock, treat as new"
            });
        }


        const chamberIds = chamberStockByPN.dataValues.chamber
            .map(c => c.id)
            .filter(id => /^[0-9a-fA-F-]{36}$/.test(id));

        const chamberQuantities = chamberStockByPN.dataValues.chamber.map(c => c.quantity);

        const chambers = await chamberClient.findAll({
            where: { id: chamberIds }
        });

        // 1)
        const chamberNames = chambers.map(chamber => chamber.chamber_name);

        // 2)
        // console.log("chamberQuantities", chamberQuantities);

        // 3)
        const totalQty = sumBy({ array: chamberQuantities, transform: 'number' })

        const config = ["chamberName", "quantity"];

        const responseChambers = zipAndFit(chamberNames, chamberQuantities, config)

        res.json({ chambers: responseChambers, total: totalQty, status: "old" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;