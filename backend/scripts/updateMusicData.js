import mongoose from 'mongoose';
import Music from '../models/Music.js';
import dotenv from 'dotenv';

dotenv.config();

async function updateMusicData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Update existing documents to match schema
        const updates = await Music.updateMany(
            {},
            {
                $set: {
                    artist: { $ifNull: ["$artist", "Unknown Artist"] },
                    album: { $ifNull: ["$album", "Unknown Album"] },
                    popularity: { $ifNull: ["$popularity", 50] },
                    isActive: { $ifNull: ["$isActive", true] },
                    playCount: { $ifNull: ["$playCount", 0] },
                    createdAt: { $ifNull: ["$createdAt", new Date()] }
                }
            }
        );

        // Fix category case (Meditation -> meditation)
        const categoryUpdates = await Music.updateMany(
            { category: "Meditation" },
            { $set: { category: "meditation" } }
        );

        console.log(`Updated ${updates.modifiedCount} documents with missing fields`);
        console.log(`Updated ${categoryUpdates.modifiedCount} documents with category case`);

        process.exit(0);
    } catch (error) {
        console.error('Error updating music data:', error);
        process.exit(1);
    }
}

updateMusicData();