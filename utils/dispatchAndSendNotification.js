const buttonsByType = require("../utils/buttonByType");
const { sendNotificationByType, getNotificationCategory } = require("../utils/notificationUtils");
const { Notifications } = require('../models');

/**
 * Dispatches and sends notifications with duplicate prevention and error handling
 * @param {Object} params - Notification parameters
 * @param {Array<string>} params.type - Array of notification types
 * @param {string} params.description - Notification description
 * @param {string} params.title - Notification title
 * @param {string|number} params.id - Item ID associated with notification
 * @returns {Promise<Object>} - Created notification or existing notification info
 */
module.exports = async function dispatchAndSendNotification({ type, description, title, id }) {
    try {
        // Input validation
        // if (!type || !Array.isArray(type) || type.length === 0) {
        //     throw new Error('Notification type is required and must be a non-empty array');
        // }

        if (!description || !Array.isArray(description) || description.length === 0) {
            throw new Error('Description is required and must be a non-empty array');
        }

        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            throw new Error('Notification title is required and must be a non-empty string');
        }

        if (!id) {
            throw new Error('Item ID is required for notification');
        }

        const notificationType = type[0];
        if (!notificationType || typeof notificationType !== 'string') {
            throw new Error('First notification type must be a valid string');
        }

        console.log("id--------------id", id);
        

        // Sanitize inputs
        const sanitizedTitle = title.trim();
        const sanitizedDescription = description || [];
        const sanitizedId = String(id).trim();

        // Check for existing notification to prevent duplicates
        const existingNotification = await Notifications.findOne({
            where: {
                type: notificationType,
                itemId: sanitizedId,
                // Optional: Only check unread notifications or within a time range
                read: false,
            }
        });

        if (existingNotification) {
            console.log(`Duplicate notification prevented for type: ${notificationType}, itemId: ${sanitizedId}`);
            return {
                success: true,
                notification: existingNotification,
                isDuplicate: true,
                message: 'Notification already exists'
            };
        }

        // Get notification category
        const category = getNotificationCategory(notificationType);
        if (!category) {
            throw new Error(`Invalid notification category for type: ${notificationType}`);
        }

        // Create notification in database
        const notification = await Notifications.create({
            type: notificationType,
            title: sanitizedTitle,
            description: sanitizedDescription,
            category,
            read: false,
            itemId: sanitizedId
        });

        if (!notification) {
            throw new Error('Failed to create notification in database');
        }

        // Prepare notification payload
        const baseNotificationData = {
            id: notification.id,
            details: {
                id: notification.itemId,
                identifier: notification.type,
                type: notificationType,
                title: notification.title,
                badgeText: "New",
                createdAt: notification.createdAt || new Date(),
                description: notification.description,
                category: notification.category,
                read: notification.read,
            }
        };

        // Add buttons only for actionable and informative notifications
        if (category === "actionable" || category === "informative") {
            const buttons = buttonsByType[notification.type];
            if (buttons && Array.isArray(buttons)) {
                baseNotificationData.details.buttons = buttons;
            } else {
                console.warn(`No buttons found for notification type: ${notification.type}`);
            }
        }

        // Send notification
        try {
            sendNotificationByType(notificationType, baseNotificationData);
            console.log(`Notification sent successfully: ${notificationType} for item ${sanitizedId}`);
        } catch (sendError) {
            console.error('Failed to send notification:', sendError);
            // Don't throw here - notification is created, just sending failed
            // You might want to mark it for retry or handle differently
        }

        return {
            success: true,
            notification,
            isDuplicate: false,
            message: 'Notification created and sent successfully'
        };

    } catch (error) {
        console.error('Error in dispatchAndSendNotification:', error);
        
        // Return error response instead of throwing
        return {
            success: false,
            error: error.message,
            notification: null,
            isDuplicate: false
        };
    }
};

/**
 * Alternative version with transaction support for better data consistency
 */
async function dispatchAndSendNotificationWithTransaction({ type, description, title, id }, transaction = null) {
    const { sequelize } = require('../models');
    
    try {
        // Use provided transaction or create new one
        const t = transaction || await sequelize.transaction();
        
        const result = await module.exports({ type, description, title, id });
        
        if (!transaction) {
            if (result.success) {
                await t.commit();
            } else {
                await t.rollback();
            }
        }
        
        return result;
    } catch (error) {
        if (!transaction) {
            await transaction?.rollback();
        }
        throw error;
    }
}

// Export both functions
module.exports.withTransaction = dispatchAndSendNotificationWithTransaction;