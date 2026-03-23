const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Testimony = sequelize.define('Testimony', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: 'faith'
    },
    scripture: {
        type: DataTypes.STRING,
        allowNull: true
    },
    amenCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    praiseCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    prayCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
    }
});

module.exports = Testimony;
