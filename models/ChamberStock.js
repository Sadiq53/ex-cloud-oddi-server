module.exports = (sequelize, Sequelize) => {
    const FrozenWarehouse = sequelize.define("ChamberStock", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        product_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        category: {
            type: Sequelize.STRING,
            allowNull: false
        },
        unit: {
            type: Sequelize.STRING,
            allowNull: false
        },
        chamber: {
            type: Sequelize.JSON,
            allowNull: true,
            validate: {
                isValidChamberArray(value) {
                    if (!Array.isArray(value)) {
                        throw new Error("Chamber must be an array.");
                    }

                    value.forEach((item, index) => {
                        const allowedKeys = ['id', 'quantity', 'rating'];
                        const itemKeys = Object.keys(item);

                        const extraKeys = itemKeys.filter(k => !allowedKeys.includes(k));
                        if (extraKeys.length > 0) {
                            throw new Error(`Chamber[${index}] has invalid fields: ${extraKeys.join(', ')}`);
                        }

                        const missingKeys = allowedKeys.filter(k => !(k in item));
                        if (missingKeys.length > 0) {
                            throw new Error(`Chamber[${index}] is missing required fields: ${missingKeys.join(', ')}`);
                        }

                        if (typeof item.id !== 'string' || typeof item.quantity !== 'string' || typeof item.rating !== 'string') {
                            throw new Error(`Chamber[${index}] fields must all be strings.`);
                        }
                    });
                }
            }
        }
    }, {
        timestamps: true
    });

    return FrozenWarehouse;
};
