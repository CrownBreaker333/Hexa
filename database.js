// DATABASE CONFIG
// MongoDB connection setup for scalability

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hexa', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

// User Schema
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    personality: { type: String, default: 'friendly' },
    dailyUsage: { type: Number, default: 0 },
    totalQueries: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

// Guild Schema
const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    dailyLimit: { type: Number, default: 10 },
    defaultPersonality: { type: String, default: 'friendly' },
    moderationEnabled: { type: Boolean, default: true },
    analyticsEnabled: { type: Boolean, default: true },
    allowImageGeneration: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
});

// Query Log Schema
const queryLogSchema = new mongoose.Schema({
    userId: String,
    guildId: String,
    personality: String,
    prompt: String,
    response: String,
    responseTime: Number,
    rating: { type: String, enum: ['up', 'down', null], default: null },
    createdAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', userSchema);
const Guild = mongoose.model('Guild', guildSchema);
const QueryLog = mongoose.model('QueryLog', queryLogSchema);

module.exports = {
    connectDB,
    User,
    Guild,
    QueryLog
};
