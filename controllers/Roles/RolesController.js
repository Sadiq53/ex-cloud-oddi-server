const router = require("express").Router();
const { Role, Permission, RolePermissions } = require("../../models/RolePermission")
const sequelize = require("../../config/database");

router.post("/create", async (req, res) => {
    const { role_name, permissions } = req.body;

    if (!role_name || !Array.isArray(permissions)) {
        return res.status(400).json({ error: "Expect a valid role name and permissions array." });
    }

    try {
        const createdRole = await Role.create({ role_name });
        
        const validPermissions = await Permission.findAll({
            where: { permission_name: permissions },
        });

        if (validPermissions.length !== permissions.length) {
            const missingPermissions = permissions.filter(
                (perm) => !validPermissions.some((vp) => vp.permission_name === perm)
            );
            console.error("Missing permissions:", missingPermissions);
            throw new Error("Some permissions do not exist in the database.");
        }
        await createdRole.addPermissions(validPermissions);

        return res.status(201).json({
            message: `Role '${role_name}' created and permissions added successfully.`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to create role." });
    }
});
router.get("/find", async (req, res) => {
    const response_find_roles = await Role.findAll();
    if(response_find_roles.length > 0) {
        return res.status(200).json(response_find_roles)
    } else {
        return res.status(204).json({ message: "No roles found." });
    }

})

router.delete('/delete', async (req, res) => {
    const { role_name } = req.body;

    if (!role_name) {
        return res.status(400).json({ error: 'Role name is required.' });
    }

    const transaction = await sequelize.transaction(); 
    try {
        await RolePermissions.destroy({
            where: { role_name },
            transaction,
        });

        const deleted = await Role.destroy({
            where: { role_name },
            transaction,
        });

        if (deleted) {
            await transaction.commit();
            return res.status(200).json({
                message: `Role '${role_name}' and its permissions were successfully deleted.`,
            });
        } else {
            await transaction.rollback(); 
            return res.status(404).json({
                error: `Role '${role_name}' not found.`,
            });
        }
    } catch (error) {
        await transaction.rollback();
        console.error(error);
        return res.status(500).json({ error: 'Failed to delete role.' });
    }
});


module.exports = router