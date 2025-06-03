import mongoose from 'mongoose';

const musicSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    artist: {
        type: String,
        default: 'Unknown Artist',
        trim: true
    },
    album: {
        type: String,
        default: 'Unknown Album'
    },
    duration: {
        type: Number, // in seconds
        required: true
    },
    coverImage: {
        type: String,
        default: 'https://via.placeholder.com/300x300?text=Music'
    },
    audioFile: {
        data: Buffer,
        contentType: String
    },
    audioUrl: {
        type: String
    },
    fileUrl: {
        type: String
    },
    category: {
        type: String,
        enum: ['meditation', 'sleep', 'focus', 'nature', 'anxiety', 'stress'],
        required: true
    },
    tags: [{
        type: String
    }],
    popularity: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
    },
    isActive: {
        type: Boolean,
        default: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    playCount: {
        type: Number,
        default: 0
    }
});

// Explicitly specify the collection name 'Music' to match your database
const Music = mongoose.model('Music', musicSchema, 'Music');
export default Music;