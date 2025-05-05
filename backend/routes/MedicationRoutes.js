import express from 'express';
import mongoose from 'mongoose';
const router = express.Router();

router.get('/byLetter', async (req, res) => {
    try {
        const { letter } = req.query;

        if (!letter) {
            return res.status(400).json({ message: 'Letter parameter is required' });
        }

        // Get direct access to the collection
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }

        // Use the exact collection name
        const collection = db.collection('Medicament_list');

        // Build the query
        let query = {};
        if (letter !== '...') {
            query = { Nom: { $regex: `^${letter}`, $options: 'i' } };
        }

        console.log(`Searching for medications starting with '${letter}'`);
        console.log('Query:', JSON.stringify(query));

        // Execute the query with proper error handling
        const medications = await collection.find(query)
            .limit(100)
            .toArray();

        console.log(`Found ${medications.length} medications`);

        // Map results to expected format
        const result = medications.map(med => ({
            _id: med._id.toString(),
            Nom: med.Nom || med.name || 'Unknown'
        }));

        // Send the response
        return res.json(result);
    } catch (error) {
        console.error('Error in /byLetter route:', error);
        return res.status(500).json({
            message: 'Server error processing medication request',
            error: error.message
        });
    }
});

// Add a diagnostic endpoint
router.get('/test', async (req, res) => {
    try {
        // Database connection check
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({
                status: 'error',
                message: 'Database not connected',
                readyState: mongoose.connection.readyState
            });
        }

        const db = mongoose.connection.db;

        // List all collections
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        // Check if our collection exists
        const hasMedicationCollection = collectionNames.includes('Medicament_list');

        // Additional info
        let medicationCount = 0;
        let sampleDoc = null;

        if (hasMedicationCollection) {
            medicationCount = await db.collection('Medicament_list').countDocuments();
            if (medicationCount > 0) {
                sampleDoc = await db.collection('Medicament_list').findOne({});
            }
        }

        return res.json({
            status: 'ok',
            databaseName: mongoose.connection.name,
            collections: collectionNames,
            hasMedicationCollection,
            medicationCount,
            sampleDoc
        });
    } catch (error) {
        console.error('Diagnostic error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
});
router.get('/search', async (req, res) => {
    try {
        const { term } = req.query;

        if (!term || term.trim() === '') {
            return res.status(400).json({ message: 'Search term is required' });
        }

        // Get direct access to the collection
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }

        const collection = db.collection('Medicament_list');

        // Case-insensitive search that matches anywhere in the name
        const query = { Nom: { $regex: term, $options: 'i' } };

        console.log(`Searching for medications containing: "${term}"`);

        const medications = await collection.find(query)
            .limit(50)
            .toArray();

        console.log(`Found ${medications.length} medications matching "${term}"`);

        // Map results to expected format
        const result = medications.map(med => ({
            _id: med._id.toString(),
            Nom: med.Nom || med.name || 'Unknown'
        }));

        return res.json(result);
    } catch (error) {
        console.error('Error in /search route:', error);
        return res.status(500).json({
            message: 'Server error processing medication search',
            error: error.message
        });
    }
});

export default router;