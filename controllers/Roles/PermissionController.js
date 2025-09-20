const router = require("express").Router();
const { Permission } = require("../../models/RolePermission");

router.post("/create", async (req, res) => {
    const permission = req.body;

    if (
        !permission
    )
        return res.status(400).json({ error: "Expect a valid permission object." });
    try {
        await Permission.create(permission);
        return res.status(200).json({ 
            message: `Permission ${ permission.permission_name } is successfully created` 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to create permission." });
    }
});
router.get("/find", async (req, res) => {
    const response_find_permissions = await Permission.findAll();
    if(response_find_permissions.length > 0) {
        return res.status(200).json(response_find_permissions)
    } else {
        return res.status(204).json({ message: "No permissions found." });
    }

})
router.delete("/delete", async (req, res) => {
    const { permission_name } = req.body;

    if (!permission_name) {
        return res.status(400).json({ error: "Permission name is required." });
    }

    try {
        const deleted = await Permission.destroy({
            where: { permission_name },
        });

        if (deleted) {
            return res
                .status(200)
                .json({ message: `Permission ${permission_name} was successfully deleted.` });
        } else {
            return res
                .status(404)
                .json({ error: `Permission ${permission_name} not found.` });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to delete permission." });
    }
});

module.exports = router;
