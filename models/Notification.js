const NotificationIdentifier = require("../utils/getNotificationtype");

const enumTypeValues =  Object.keys(NotificationIdentifier);

module.exports = (sequelize, Sequelize) => {
    const Notifications = sequelize.define("Notifications", {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        itemId: { type: Sequelize.STRING },
        type: {
            type: Sequelize.ENUM(...enumTypeValues),
            allowNull: false
        },
        title: Sequelize.STRING,
        description: {type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true},
        category: Sequelize.ENUM('actionable', 'informative', 'today'),
        read: { type: Sequelize.BOOLEAN, defaultValue: false },
    }, { timestamps: true });

    return Notifications;
};
