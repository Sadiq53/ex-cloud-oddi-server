module.exports = (sequelize, Sequelize) => {
    const Chamber = sequelize.define("Chambers", {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        chamber_name: { type: Sequelize.STRING, allowNull: false },
        capacity: { type: Sequelize.INTEGER, allowNull: false },
        items: { type: Sequelize.ARRAY(Sequelize.UUID)  },
        tag: {
            type: Sequelize.ENUM("frozen", "dry"),
            defaultValue: "frozen"
        },
    }, { timestamps: true });

    return Chamber;
}