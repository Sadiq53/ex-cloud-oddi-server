const { Sequelize } = require('sequelize');
const sequelize = require("../../oddiville-server/config/database");

const Role = sequelize.define('roles', {
    role_name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
    },
});

const Permission = sequelize.define('permissions', {
    permission_name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
    },
});

const RolePermissions = sequelize.define(
    'rolePermissions',
    {
        role_name: {
            type: Sequelize.STRING,
            references: {
                model: 'roles',
                key: 'role_name',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        permission_name: {
            type: Sequelize.STRING,
            references: {
                model: 'permissions',
                key: 'permission_name',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
    },
    { timestamps: true }
);

Role.belongsToMany(Permission, {
    through: RolePermissions,
    foreignKey: 'role_name',
    otherKey: 'permission_name',
});

Permission.belongsToMany(Role, {
    through: RolePermissions,
    foreignKey: 'permission_name',
    otherKey: 'role_name',
});
module.exports = {
    Role,
    Permission,
    RolePermissions,
};
