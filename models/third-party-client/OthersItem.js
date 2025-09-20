module.exports = (sequelize, Sequelize) => {
    const OthersItem = sequelize.define("OthersItem", {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        product_id: { type: Sequelize.UUID, allowNull: false },
        client_id: { type: Sequelize.UUID, allowNull: false },
        stored_quantity: { type: Sequelize.DECIMAL, allowNull: false },
        rent: { type: Sequelize.DECIMAL, allowNull: false },
        stored_date: { type: Sequelize.DATE, allowNull: false },
        dispatched_date: { type: Sequelize.DATE, allowNull: true },
        est_dispatch_date: { type: Sequelize.DATE, allowNull: true },
        sample_image: { type: Sequelize.UUID, allowNull: true },
        history: { type: Sequelize.ARRAY(Sequelize.UUID) },
    }, { timestamps: true });

    return OthersItem;
}

