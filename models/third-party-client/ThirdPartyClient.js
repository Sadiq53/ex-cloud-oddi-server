module.exports = (sequelize, Sequelize) => {
    const ThirdPartyClient = sequelize.define("ThirdPartyClients", {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        name: { type: Sequelize.STRING, allowNull: false, unique: true },
        company: { type: Sequelize.STRING, allowNull: true },
        address: { type: Sequelize.STRING, allowNull: true },
        phone: { type: Sequelize.STRING, allowNull: false },
        products: { type: Sequelize.ARRAY(Sequelize.UUID) }, // Others Item ID's
    }, { timestamps: true });

    return ThirdPartyClient;
}

