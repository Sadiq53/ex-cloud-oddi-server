module.exports = (sequelize, Sequelize) => {
    const RawMaterialOrder = sequelize.define("raw_material_orders", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        production_id: { type: Sequelize.STRING, allowNull: true },
        rating: Sequelize.INTEGER,
        raw_material_name: {
            type: Sequelize.STRING,
            allowNull: false,
            references: {
                model: 'raw_materials',
                key: 'name'
            }
        },
        vendor: {
            type: Sequelize.STRING,
            references: {
                model: "Vendors",
                key: "name",
            },
        },
        status: {
            type: Sequelize.STRING,
            default: 'pending'
        },
        truck_details: {
            type: Sequelize.JSON,
            allowNull: true,
            validate: {
                isValidTruckDetails(value) {
                    if (value == null) return; // allow null

                    const requiredFields = ['truck_weight', 'tare_weight', 'challan', 'truck_number', 'driver_name'];

                    for (const field of requiredFields) {
                        if (!(field in value)) {
                            throw new Error(`Truck detail missing required field: ${field}`);
                        }
                    }

                    if (typeof value.truck_weight !== 'string') throw new Error("truck_weight must be a string");
                    if (typeof value.tare_weight !== 'string') throw new Error("tare_weight must be a string");
                    if (typeof value.truck_number !== 'string') throw new Error("truck_number must be a string");
                    if (typeof value.driver_name !== 'string') throw new Error("driver_name must be a string");
                    
                    if (
                        typeof value.challan !== 'object' ||
                        value.challan === null 
                    ) {
                        throw new Error("challan must be an object with 'url' and 'key' as strings");
                    }
                }
            }
        },
        sample_image: Sequelize.JSON,
        sample_quantity: Sequelize.DECIMAL,
        quantity_ordered: Sequelize.DECIMAL,
        quantity_received: Sequelize.DECIMAL,
        warehoused_date: { type: Sequelize.DATE, allowNull: true },
        unit: Sequelize.STRING,
        price: Sequelize.DECIMAL,
        order_date: Sequelize.DATE,
        store_date: Sequelize.DATE,
        est_arrival_date: { type: Sequelize.DATE, allowNull: true },
        arrival_date: Sequelize.DATE,
    }, {
        timestamps: true
    });

    RawMaterialOrder.associate = (models) => {
        RawMaterialOrder.belongsTo(models.RawMaterial, {
            foreignKey: 'raw_material_name',
            targetKey: 'name',
            as: 'rawMaterial'
        });
    };
    

    return RawMaterialOrder;
};
