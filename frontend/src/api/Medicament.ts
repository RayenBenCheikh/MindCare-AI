interface MedicationData {
  _id: string;
  Nom: string;
  Classe: string;
  Sous_Classe: string;
  Indications?: string;
  Dosage: string;
  Forme: string;
  Laboratoire: string;
}

export const fetchMedications = async (searchTerm = '') => {
  try {
      // Connect to your API endpoint - adjust the URL to your backend address
      const response = await fetch(
          `http://10.0.2.2:5000/api/medications/search?term=${encodeURIComponent(searchTerm)}`
      );
      
      if (!response.ok) {
          throw new Error('Failed to fetch medications');
      }
      
      const data = await response.json();
      
      // Map the response to your medication structure
      return data.map((item: MedicationData) => ({
          id: item._id,
          name: item.Nom,
          category: `${item.Classe} - ${item.Sous_Classe}`,
          primaryUse: item.Indications ? item.Indications.substring(0, 100) + (item.Indications.length > 100 ? '...' : '') : '',
          dosage: item.Dosage,
          forme: item.Forme,
          laboratoire: item.Laboratoire
      }));
  } catch (error) {
      console.error("Error fetching medications:", error);
      throw error;
  }
};