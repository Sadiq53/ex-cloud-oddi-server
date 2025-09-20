module.exports = (sequelize, Sequelize) => {
    const SampleImages = sequelize.define("SampleImages", {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        url: { type: Sequelize.STRING, allowNull: false },
        key: { type: Sequelize.STRING, allowNull: false }
    }, { timestamps: true });

    return SampleImages;
}

