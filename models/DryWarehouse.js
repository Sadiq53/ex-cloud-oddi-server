module.exports = (sequelize, Sequelize) => {
const DryWarehouse = sequelize.define("DryWarehouses", {
    id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
    item_name: { type: Sequelize.STRING, allowNull: false },
    warehoused_date: { type: Sequelize.DATE, allowNull: false },
    description: { type: Sequelize.TEXT },
    sample_image: {
        type: Sequelize.JSON, 
        allowNull: true
    },
    chamber_id: { type: Sequelize.STRING },
    quantity_unit: { type: Sequelize.STRING } // e.g., "10 rolls", "5 boxes"3
}, { timestamps: true });

return DryWarehouse;
}