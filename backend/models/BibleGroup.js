const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BibleGroup = sequelize.define('BibleGroup', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    topic: {
        type: DataTypes.STRING,
        allowNull: true
    },
    meetingTime: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pinnedVerse: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isPrivate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    memberCount: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
});

module.exports = BibleGroup;
