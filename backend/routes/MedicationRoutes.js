const express = require('express');
const router = express.Router();
const Medication = require('../models/Medication'); // Your MongoDB model


// Get medications by letter
router.get('/byLetter', async (req, res) => {
    try {
        const { letter } = req.query;

        if (!letter) {
            return res.status(400).json({ message: 'Letter parameter is required' });
        }

        let query = {};

        if (letter !== '...') {
            // For specific letter, find medications starting with that letter
            query = { Nom: { $regex: `^${letter}`, $options: 'i' } };
        } else {
            // For "..." option, return most commonly prescribed medications
            // You can adjust this logic based on your needs
            query = {};
        }

        const medications = await Medication.find(query)
            .select('_id Nom')  // Only return _id and Nom fields as requested
            .limit(50)
            .sort({ Nom: 1 })
            .lean();

        res.json(medications);
    } catch (error) {
        console.error('Error fetching medications by letter:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;