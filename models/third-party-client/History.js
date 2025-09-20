module.exports = (sequelize, Sequelize) => {
    const OtherClientHistory = sequelize.define("OtherClientHistory", {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        product_id: { type: Sequelize.UUID, allowNull: false }, // Others Item ID 
        chamber_id: { type: Sequelize.UUID, allowNull: false }, // chamber ID 
        deduct_quantity: { type: Sequelize.DECIMAL, allowNull: false },
        remaining_quantity: { type: Sequelize.DECIMAL, allowNull: false }
    }, { timestamps: true });

    return OtherClientHistory;
}

