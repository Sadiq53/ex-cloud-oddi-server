const { getIO } = require("../config/socket")

const sendRawMaterialStatus = (materialId, materialDetails) => {
    const io = getIO();
    io.emit('raw-material-order:status-changed', {
        materialId,
        materialDetails,
        timestamp: new Date(),
        type: 'RAW_MATERIAL_ORDER_STATUS_CHANGED'
    });
};

// raw material detail notification - create
const sendRawMaterialCreatedNotification = (materialId, materialDetails) => {
    const io = getIO();
    io.emit('raw-material-order:created', {
        materialId,
        materialDetails,
        timestamp: new Date(),
        type: 'RAW_MATERIAL_ORDER_CREATED'
    });
};

// raw material detail notification - update
const sendRawMaterialUpdatedNotification = (materialId, materialDetails) => {
    const io = getIO();
    io.emit('raw-material-order:updated', {
        materialId,
        materialDetails,
        timestamp: new Date(),
        type: 'RAW_MATERIAL_ORDER_UPDATED'
    });
};

// vendor detail notification - create
const sendVendorCreatedNotification = (vendorId, vendorDetails) => {
    const io = getIO();
    io.emit('vendor:created', {
        vendorId,
        vendorDetails,
        timestamp: new Date(),
        type: 'VENDOR_CREATED'
    });
};

// vendor detail notification - update
const sendVendorUpdatedNotification = (vendorId, vendorDetails) => {
    const io = getIO();
    io.emit('vendor:updated', {
        vendorId,
        vendorDetails,
        timestamp: new Date(),
        type: 'VENDOR_UPDATED'
    });
};
// start production detail notification
const sendProductionStartNotification = (productionId, productionDetails) => {
    const io = getIO();
    io.emit('production:status-changed', {
        productionId,
        productionDetails,
        timestamp: new Date(),
        type: 'PRODUCTION:STATUS_CHANGED'
    });
};

module.exports = {
    sendRawMaterialCreatedNotification,
    sendRawMaterialUpdatedNotification,
    sendVendorCreatedNotification,
    sendVendorUpdatedNotification,
    sendRawMaterialStatus,
    sendProductionStartNotification,
}; 