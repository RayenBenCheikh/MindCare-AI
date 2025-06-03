import express from 'express';
import mongoose from 'mongoose'; // ← ADD THIS MISSING IMPORT
import Music from '../models/Music.js';
import fs from 'fs';

const router = express.Router();

// Get all music tracks
router.get('/tracks', async (req, res) => {
    try {
        console.log('🎵 MusicRoutes: /tracks endpoint called');
        console.log('🎵 Query params:', req.query);

        const { category, limit = 50 } = req.query;

        // Start with a simpler query - just get all documents first
        let query = {};

        // Add isActive filter only if the field exists
        const hasActiveField = await Music.findOne({ isActive: { $exists: true } });
        if (hasActiveField) {
            query.isActive = true;
        }

        if (category) {
            query.category = category.toLowerCase();
            console.log(`🎵 Filtering by category: ${category}`);
        }

        console.log('🎵 MongoDB query:', JSON.stringify(query));

        // First check total count with this exact query
        const totalCount = await Music.countDocuments(query);
        console.log(`🎵 Total documents matching query: ${totalCount}`);

        // If no results, try without isActive filter
        if (totalCount === 0) {
            console.log('⚠️ No documents match the query. Trying without isActive filter...');
            const queryWithoutActive = category ? { category: category.toLowerCase() } : {};
            const countWithoutActive = await Music.countDocuments(queryWithoutActive);
            console.log(`⚠️ Documents without isActive filter: ${countWithoutActive}`);

            if (countWithoutActive > 0) {
                // Use the query without isActive
                query = queryWithoutActive;
                console.log('🎵 Using query without isActive filter');
            }
        }

        const tracks = await Music.find(query)
            .select('-audioFile')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        console.log(`🎵 Found ${tracks.length} tracks in database`);

        if (tracks.length === 0) {
            console.log('⚠️ Still no tracks found. Getting all documents...');
            const allTracks = await Music.find({}).limit(3);
            console.log('⚠️ All documents in collection:', allTracks);
        }

        const formattedTracks = tracks.map(track => {
            console.log(`🎵 Processing track: ${track.title} (ID: ${track._id})`);
            return {
                id: track._id.toString(),
                title: track.title,
                artist: track.artist || 'Unknown Artist',
                album: track.album || 'Unknown Album',
                duration: track.duration,
                coverImage: track.coverImage,
                previewUrl: `/api/music/stream/${track._id}`,
                jamendoUrl: track.audioUrl || track.fileUrl || '',
                category: track.category,
                popularity: track.popularity || 50,
                type: 'track',
                description: track.tags?.join(', ') || ''
            };
        });

        console.log(`🎵 Returning ${formattedTracks.length} formatted tracks`);
        res.json(formattedTracks);
    } catch (error) {
        console.error('❌ Error fetching music tracks:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching music tracks',
            error: error.message
        });
    }
});
// Debug route - moved to top for easier access
router.get('/debug', async (req, res) => {
    try {
        console.log('🔍 DEBUG: Testing database connection...');

        // Check database connection
        const dbState = mongoose.connection.readyState;
        console.log('🔍 Database connection state:', dbState); // 1 = connected

        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log('🔍 Available collections:', collectionNames);

        // Check if Music collection exists and has documents
        const musicCount = await Music.countDocuments();
        console.log('🔍 Total documents in Music collection:', musicCount);

        // Get sample documents
        const sampleDocs = await Music.find({}).limit(3);
        console.log('🔍 Sample documents:', sampleDocs);

        // Test the exact query used in /tracks
        const testQuery = { isActive: true };
        const testTracks = await Music.find(testQuery).select('-audioFile').limit(5);
        console.log('🔍 Test query results:', testTracks);

        res.json({
            success: true,
            databaseState: dbState,
            collections: collectionNames,
            musicCount,
            sampleDocs,
            testTracks
        });
    } catch (error) {
        console.error('🔍 DEBUG error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Stream audio file (handles both database stored files and local file paths)
router.get('/stream/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const track = await Music.findById(id);
        if (!track) {
            return res.status(404).json({ message: 'Track not found' });
        }

        // If audio is stored as binary data in database
        if (track.audioFile && track.audioFile.data) {
            // Increment play count
            await Music.findByIdAndUpdate(id, { $inc: { playCount: 1 } });

            res.set({
                'Content-Type': track.audioFile.contentType || 'audio/mpeg',
                'Content-Length': track.audioFile.data.length,
                'Accept-Ranges': 'bytes'
            });

            return res.send(track.audioFile.data);
        }

        // If audio is stored as local file path
        if (track.fileUrl) {
            const filePath = track.fileUrl;

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ message: 'Audio file not found on disk' });
            }

            // Increment play count
            await Music.findByIdAndUpdate(id, { $inc: { playCount: 1 } });

            // Get file stats
            const stat = fs.statSync(filePath);
            const fileSize = stat.size;
            const range = req.headers.range;

            // Support range requests for audio streaming
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(filePath, { start, end });
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'audio/mpeg',
                };
                res.writeHead(206, head);
                file.pipe(res);
            } else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'audio/mpeg',
                };
                res.writeHead(200, head);
                fs.createReadStream(filePath).pipe(res);
            }
            return;
        }

        // If no audio file found
        return res.status(404).json({ message: 'No audio file available for this track' });

    } catch (error) {
        console.error('Error streaming audio:', error);
        res.status(500).json({
            success: false,
            message: 'Error streaming audio',
            error: error.message
        });
    }
});

// Get tracks by category
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const { limit = 20 } = req.query;

        const tracks = await Music.find({
            category: category.toLowerCase(), // Ensure lowercase
            isActive: true
        })
            .select('-audioFile')
            .limit(parseInt(limit))
            .sort({ popularity: -1, createdAt: -1 });

        const formattedTracks = tracks.map(track => ({
            id: track._id.toString(),
            title: track.title,
            artist: track.artist || 'Unknown Artist',
            album: track.album || 'Unknown Album',
            duration: track.duration,
            coverImage: track.coverImage,
            previewUrl: `/api/music/stream/${track._id}`,
            jamendoUrl: track.audioUrl || track.fileUrl || '',
            category: track.category,
            popularity: track.popularity || 50,
            type: 'track',
            description: track.tags?.join(', ') || ''
        }));

        res.json(formattedTracks);
    } catch (error) {
        console.error('Error fetching music by category:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching music by category',
            error: error.message
        });
    }
});

export default router;