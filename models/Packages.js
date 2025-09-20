module.exports = (sequelize, Sequelize) => {
    const Packages = sequelize.define("Packages", {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        product_name: { type: Sequelize.STRING, allowNull: false },
        types: {
            type: Sequelize.JSON,
            allowNull: true,
            validate: {
                isValidTypeDetails(value) {
                    if (value == null) return;
                    const items = Array.isArray(value) ? value : [value];
                    for (const item of items) {
                        const requiredFields = ['size', 'quantity', 'unit'];
                        for (const field of requiredFields) {
                            if (!(field in item)) {
                                throw new Error(`Types is missing required field: ${field}`);
                            }
                        }
                        if (typeof item.size !== 'string') throw new Error("size must be a string");
                        if (typeof item.quantity !== 'string') throw new Error("quantity must be a string");
                        if (
                            !(
                                item.unit === null ||
                                (typeof item.unit === 'string' && ['kg', 'gm'].includes(item.unit))
                            )
                        ) {
                            throw new Error("unit must be either 'kg', 'gm', or null");
                        }
                    }
                }
            }
            
        },
        raw_materials: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            allowNull: false,
        }
    }, { timestamps: true });

    return Packages;
}