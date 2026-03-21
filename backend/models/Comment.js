const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    // Foreign keys to be handled via associations
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    postId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    testimonyId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'approved'
    }
});

module.exports = Comment;
