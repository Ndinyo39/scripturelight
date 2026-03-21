const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true // Allow guest donations too
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    provider: {
        type: DataTypes.ENUM('mpesa', 'paypal'),
        defaultValue: 'mpesa'
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending'
    },
    reference: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    merchantRequestId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    checkoutRequestId: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Transaction;
