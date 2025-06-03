import mongoose from 'mongoose';
import Music from '../models/Music.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend directory (parent of scripts)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function fixMusicData() {
    try {
        // Check if MONGO_URI is loaded
        if (!process.env.MONGO_URI) {
            console.error('❌ MONGO_URI not found in environment variables');
            console.log('📁 Make sure you have a .env file in the backend folder with MONGO_URI');
            process.exit(1);
        }

        console.log('🔗 Connecting to MongoDB with URI:', process.env.MONGO_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in log

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get all existing documents
        const existingTracks = await Music.find({});
        console.log(`📁 Found ${existingTracks.length} existing tracks`);

        if (existingTracks.length === 0) {
            console.log('⚠️  No tracks found in database. Make sure you have music data in your MongoDB collection.');
            process.exit(0);
        }

        for (const track of existingTracks) {
            const updates = {};

            // Fix category case
            if (track.category === 'Meditation') {
                updates.category = 'meditation';
            }

            // Add missing fields with defaults
            if (!track.artist) {
                updates.artist = 'Unknown Artist';
            }
            if (!track.album) {
                updates.album = 'Unknown Album';
            }
            if (track.popularity === undefined) {
                updates.popularity = 50;
            }
            if (track.isActive === undefined) {
                updates.isActive = true;
            }
            if (track.playCount === undefined) {
                updates.playCount = 0;
            }
            if (!track.createdAt) {
                updates.createdAt = new Date();
            }
            if (!track.tags || track.tags.length === 0) {
                updates.tags = [track.category || 'music'];
            }

            // Update the document if there are changes
            if (Object.keys(updates).length > 0) {
                await Music.findByIdAndUpdate(track._id, { $set: updates });
                console.log(`✅ Updated track: ${track.title} (${Object.keys(updates).join(', ')})`);
            } else {
                console.log(`ℹ️  No updates needed for: ${track.title}`);
            }
        }

        // Verify the updates
        const updatedCount = await Music.countDocuments();
        console.log(`✅ Total tracks after update: ${updatedCount}`);

        // Show a sample updated document
        const sampleTrack = await Music.findOne({});
        console.log('📄 Sample updated document:', JSON.stringify(sampleTrack, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing music data:', error);
        process.exit(1);
    }
}

fixMusicData();