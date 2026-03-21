const User = require('./User');
const CommunityPost = require('./CommunityPost');
const StudyPlan = require('./StudyPlan');
const Testimony = require('./Testimony');
const Comment = require('./Comment');
const BibleActivity = require('./BibleActivity');
const BibleGroup = require('./BibleGroup');
const GroupMember = require('./GroupMember');
const Book = require('./Book');
const Transaction = require('./Transaction');

// User <-> Transaction
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> CommunityPost
User.hasMany(CommunityPost, { foreignKey: 'userId', as: 'posts' });
CommunityPost.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Group <-> CommunityPost
BibleGroup.hasMany(CommunityPost, { foreignKey: 'groupId', as: 'posts' });
CommunityPost.belongsTo(BibleGroup, { foreignKey: 'groupId', as: 'group' });

// User <-> BibleGroup (Founder)
User.hasMany(BibleGroup, { foreignKey: 'founderId', as: 'foundedGroups' });
BibleGroup.belongsTo(User, { foreignKey: 'founderId', as: 'founder' });

// User <-> BibleGroup (Membership)
User.belongsToMany(BibleGroup, { through: GroupMember, foreignKey: 'userId', as: 'groups' });
BibleGroup.belongsToMany(User, { through: GroupMember, foreignKey: 'groupId', as: 'members' });

// User <-> Testimony
User.hasMany(Testimony, { foreignKey: 'userId', as: 'testimonies' });
Testimony.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> StudyPlan
User.belongsTo(StudyPlan, { foreignKey: 'activePlanId', as: 'activePlan' });
StudyPlan.hasMany(User, { foreignKey: 'activePlanId' });

// User <-> BibleActivity (Track progress)
User.hasMany(BibleActivity, { foreignKey: 'userId', as: 'activities' });
BibleActivity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Comment associations
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

CommunityPost.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(CommunityPost, { foreignKey: 'postId', as: 'post' });

Testimony.hasMany(Comment, { foreignKey: 'testimonyId', as: 'comments' });
Comment.belongsTo(Testimony, { foreignKey: 'testimonyId', as: 'testimony' });

// User <-> Book (Library)
User.hasMany(Book, { foreignKey: 'uploaderId', as: 'uploadedBooks' });
Book.belongsTo(User, { foreignKey: 'uploaderId', as: 'uploader' });

module.exports = {
    User,
    CommunityPost,
    StudyPlan,
    Testimony,
    Comment,
    BibleActivity,
    BibleGroup,
    GroupMember,
    Book,
    Transaction
};
