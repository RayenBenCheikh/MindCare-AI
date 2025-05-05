import mongoose from 'mongoose';

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

const Medication = mongoose.model('Medication', MedicationSchema, 'Medicament_list');
export default Medication;