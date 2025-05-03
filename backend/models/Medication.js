// In your backend models/Medication.js
const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
    Nom: String,
    Dosage: String,
    Forme: String,
    Présentation: String,
    DCI: String,
    Classe: String,
    Sous_Classe: String,
    Laboratoire: String,
    AMM: String,
    Date_AMM: Date,
    Conditionnement_primaire: String,
    Spécifocation_Conditionnement_primaire: String,
    tableau: String,
    Durée_de_conservation: Number,
    Indications: String,
    G_P_B: String,
    VEIC: String
});

module.exports = mongoose.model('Medication', MedicationSchema);