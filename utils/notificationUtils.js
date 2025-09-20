const NOTIFICATION_CATEGORIES = require("../types/notification-types");
const { getIO } = require("../config/socket")

//1 raw material detail notification - reached
const sendRawMaterialReachedNotification = (id, details) => {
    const io = getIO();
    io.emit('notification-informative:new', {
        id,
        details,
        timestamp: new Date(),
        type: 'raw-material-reached'
    });
};

//2 order detail notification - edited
const sendEditOrderNotification = (id, details) => {
    const io = getIO();
    io.emit('notification-informative:new', {
        id,
        details,
        timestamp: new Date(),
        type: 'edit-order'
    });
};

//3 worker detail notification - arrived
const sendWorkerArrivedNotification = (id, details) => {
    const io = getIO();
    io.emit('notification-informative:new', {
        id,
        details,
        timestamp: new Date(),
        type: 'worker-multiple'
    });
};

//4 order detail notification - shipped
const sendOrderShippedNotification = (id, details) => {
    const io = getIO();
    io.emit('notification-informative:new', {
        id,
        details,
        timestamp: new Date(),
        type: 'order-shipped'
    });
};

//5 order detail notification - reached
const sendOrderReachedNotification = (id, details) => {
    const io = getIO();
    io.emit('notification-informative:new', {
        id,
        details,
        timestamp: new Date(),
        type: 'order-reached'
    });
};

//6 product detail notification - updated
const sendProductUpdatedNotification = (id, details) => {
    const io = getIO();
    io.emit('notification-informative:new', {
        id,
        details,
        timestamp: new Date(),
        type: 'production-completed'
    });
};

//7 lane detail notification - occupied
const sendLaneOccupiedNotification = (id, details) => {
    const io = getIO();
    io.emit('notification-informative:new', {
        id,
        details,
        timestamp: new Date(),
        type: 'lane-occupied'
    });
};

//8 order detail notification - canceled
const sendOrderCanceledNotification = (id, details) => {
    const io = getIO();
    io.emit('notification-informative:new', {
        id,
        details,
        timestamp: new Date(),
        type: 'cancel-order'
    });
};

//9 order detail notification - ready
const sendOrderReadyNotification = (id, details) => {
    const io = getIO();
    io.emit('notification-informative:new', {
        id,
        details,
        timestamp: new Date(),
        type: 'order-ready'
    });
};

//10 lane detail notification - empty
const sendLaneEmptyNotification = (id, details) => {
    const io = getIO();
    io.emit('notification-informative:new', {
        id,
        details,
        timestamp: new Date(),
        type: 'lane-empty'
    });
};

//11 package detail notification - end
const sendPackageComesToEndNotification = (id, details) => {
    const io = getIO();
    io.emit('notification-informative:new', {
        id,
        details,
        timestamp: new Date(),
        type: 'package-comes-to-end'
    });
};

//12 material detail notification - verify
const sendVerifyMaterialNotification = (id, details) => {
    const io = getIO();
    io.emit('notification-informative:new', {
        id,
        details,
        timestamp: new Date(),
        type: 'verify-material'
    });
};

//13 product detail notification - alert
const sendProductAlertNotification = (id, details) => {
    const io = getIO();
    io.emit('notification-informative:new', {
        id,
        details,
        timestamp: new Date(),
        type: 'product-alert'
    });
};

//14 raw material detail notification - ordered
const sendRawMaterialOrderedNotification = (id, details) => {
    const io = getIO();
    io.emit('notification-informative:new', {
        id,
        details,
        timestamp: new Date(),
        type: 'raw-material-ordered'
    });
};

const sendNotificationByType = (type, payload) => {
    console.log("by type", type);
    
    switch (type) {
        case 'raw-material-reached':
            return sendRawMaterialReachedNotification(payload.id, payload.details);

        case 'raw-material-ordered':
            return sendRawMaterialOrderedNotification(payload.id, payload.details);

        case 'edit-order':
            return sendEditOrderNotification(payload.id, payload.details);

        case 'worker-single':
            return sendWorkerArrivedNotification(payload.id, payload.details);

        case 'worker-multiple':
            return sendWorkerArrivedNotification(payload.id, payload.details);

        case 'order-shipped':
            return sendOrderShippedNotification(payload.id, payload.details);

        case 'order-reached':
            return sendOrderReachedNotification(payload.id, payload.details);

        case 'production-completed':
            return sendProductUpdatedNotification(payload.id, payload.details);

        case 'lane-occupied':
            return sendLaneOccupiedNotification(payload.id, payload.details);

        case 'cancel-order':
            return sendOrderCanceledNotification(payload.id, payload.details);

        case 'order-ready':
            return sendOrderReadyNotification(payload.id, payload.details);

        case 'lane-empty':
            return sendLaneEmptyNotification(payload.id, payload.details);

        case 'package-comes-to-end':
            return sendPackageComesToEndNotification(payload.id, payload.details);

        case 'verify-material':
            return sendVerifyMaterialNotification(payload.id, payload.details);

        case 'product-alert':
            return sendProductAlertNotification(payload.id, payload.details);

        default:
            console.warn(`[Socket Notification] Unknown type: ${type}`);
    }
};

const getNotificationCategory = (type) => {
    
    const entry = NOTIFICATION_CATEGORIES[type];
    if (!entry) {
        console.warn(`[Notification] Unknown type '${type}', using default 'informative'`);
    }
    return Array.isArray(entry) ? entry[1] : "informative";
};

module.exports = { sendNotificationByType, getNotificationCategory }
