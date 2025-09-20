module.exports = (sequelize, Sequelize) => {
    const DispatchOrder = sequelize.define("DispatchOrders", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true
        },
        customer_name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        address: {
            type: Sequelize.STRING,
            allowNull: true
        },
        postal_code: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        state: {
            type: Sequelize.STRING,
            allowNull: true
        },
        country: {
            type: Sequelize.STRING,
            allowNull: true
        },
        city: {
            type: Sequelize.STRING,
            allowNull: true
        },
        status: {
            type: Sequelize.STRING,
            allowNull: false
        },
        dispatch_date: {
            type: Sequelize.DATE,
            allowNull: true
        },
        est_delivered_date: {
            type: Sequelize.DATE,
            allowNull: false
        },
        delivered_date: {
            type: Sequelize.DATE,
            allowNull: true
        },
        products: {
            type: Sequelize.JSON,
            allowNull: false,
        },
        packages: {
            type: Sequelize.JSON,
            allowNull: false,
        },
        sample_images: {
            type: Sequelize.ARRAY(Sequelize.STRING),
            allowNull: true,
        },
        product_name: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        amount: {
            type: Sequelize.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        truck_details: {
            type: Sequelize.JSON,
            allowNull: true,
            validate: {
                isValidTruckDetails(value) {
                    if (value == null) return; 

                    const requiredFields = ['agency_name', 'driver_name', 'phone', 'type', 'number'];

                    for (const field of requiredFields) {
                        if (!(field in value)) {
                            throw new Error(`Truck detail missing required field: ${field}`);
                        }
                    }

                    if (typeof value.agency_name !== 'string') throw new Error("agency_name must be a string");
                    if (typeof value.driver_name !== 'string') throw new Error("driver_name must be a string");
                    if (typeof value.phone !== 'string') throw new Error("phone must be a string");
                    if (typeof value.type !== 'string') throw new Error("type must be a string");
                    if (typeof value.number !== 'string') throw new Error("number must be a string");
                }
            }
        }
    }, {
        timestamps: true
    });

    return DispatchOrder;
};
