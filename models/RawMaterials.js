module.exports = (sequelize, Sequelize) => {
    const RawMaterial = sequelize.define("raw_materials", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
        },
        sample_image: {
            type: Sequelize.JSON, // Expects { url, key }
            allowNull: true
        },
    });

    // RawMaterial.associate = (models) => {
    //     RawMaterial.hasMany(models.RawMaterialOrder, {
    //         foreignKey: 'raw_material_id',
    //         onDelete: 'CASCADE',
    //         as: 'orders'
    //     });

    //     RawMaterial.hasMany(models.Production, {
    //         foreignKey: 'raw_material_id',
    //         onDelete: 'SET NULL',
    //         as: 'productions'
    //     });
    // };

    return RawMaterial;
};