module.exports = (sequelize, Sequelize) => {
    const TruckDetails = sequelize.define("TruckDetails", {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        agency_name: { type: Sequelize.STRING, allowNull: false, unique: true },
        driver_name: { type: Sequelize.STRING, allowNull: false },
        phone: { type: Sequelize.STRING, allowNull: false },
        size: { type: Sequelize.STRING, allowNull: false },
        type: { type: Sequelize.STRING, allowNull: false },
        number: { type: Sequelize.STRING, allowNull: false },
        arrival_date: { type: Sequelize.DATE, allowNull: false },
        challan: { type: Sequelize.STRING, allowNull: false },
        status: { type: Sequelize.STRING, allowNull: true },
    }, { timestamps: true });
    
    return TruckDetails;
    }