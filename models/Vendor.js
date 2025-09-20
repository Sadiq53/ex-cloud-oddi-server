module.exports = (sequelize, Sequelize) => {
    const Vendor = sequelize.define("Vendors", {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        name: { type: Sequelize.STRING, allowNull: false, unique: true },
        alias: { type: Sequelize.STRING, allowNull: true },
        phone: { type: Sequelize.STRING, allowNull: false },
        zipcode: { type: Sequelize.INTEGER, allowNull: false },
        state: { type: Sequelize.STRING, allowNull: false },
        city: { type: Sequelize.STRING, allowNull: false },
        address: { type: Sequelize.STRING, allowNull: true },
        materials: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false, defaultValue: [] },
        orders: { type: Sequelize.ARRAY(Sequelize.UUID), allowNull: false, defaultValue: [] },
    }, { timestamps: true });

    return Vendor;
}