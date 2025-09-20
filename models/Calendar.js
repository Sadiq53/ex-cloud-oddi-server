module.exports = (sequelize, Sequelize) => {
    const Calendar = sequelize.define("Calendar", {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        client: { type: Sequelize.STRING, allowNull: false },
        product_name: { type: Sequelize.STRING, allowNull: false },
        work_area: { type: Sequelize.STRING, allowNull: false },
        scheduled_date: { type: Sequelize.DATE, allowNull: false },
    }, { timestamps: true });

    return Calendar;
}