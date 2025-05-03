import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    FlatList,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/MentalNavigator';
import BackButton from '@/src/components/BackButton';
import { useAssessmentStore } from '@/src/store/Store';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Medication = {
    id: string;
    name: string;
};

// Generate the alphabet array for filtering
const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
ALPHABET.push("...");

const MedicamentSelection: React.FC = () => {
    const [selectedLetter, setSelectedLetter] = useState<string>('A');
    const [medications, setMedications] = useState<Medication[]>([]);
    const [selectedMeds, setSelectedMeds] = useState<Medication[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigation = useNavigation<NavigationProp>();
    const savePrescribedMedications = useAssessmentStore(state => state.savePrescribedMedications);

    // Fetch medications by selected letter from your MongoDB database
    useEffect(() => {
        const fetchMedicationsByLetter = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // This URL should point to your backend API that queries your MongoDB
                const response = await axios.get(
                    `http://10.0.2.2:5000/api/medications/byLetter?letter=${selectedLetter}`
                );

                // Map the response to just include id and name as specified
                const mappedMedications = response.data.map((med: any) => ({
                    id: med._id,
                    name: med.Nom
                }));

                setMedications(mappedMedications);
            } catch (err) {
                console.error('Error fetching medications:', err);
                setError('Failed to load medications. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMedicationsByLetter();
    }, [selectedLetter]);

    const handleSelectLetter = (letter: string) => {
        setSelectedLetter(letter);
    };

    const handleSelectMedication = (med: Medication) => {
        const isSelected = selectedMeds.some(m => m.id === med.id);

        if (isSelected) {
            // Remove if already selected
            setSelectedMeds(selectedMeds.filter(m => m.id !== med.id));
        } else {
            // Add if not selected
            setSelectedMeds([...selectedMeds, med]);
        }
    };

    const handleRemoveMedication = (medId: string) => {
        setSelectedMeds(selectedMeds.filter(med => med.id !== medId));
    };

    const handleContinue = () => {
        // Save selected medications to store (only id and name as specified)
        savePrescribedMedications(selectedMeds);

        // Navigate to the next screen in your assessment flow
        navigation.navigate('AssessmentCompleted');
    };

    const renderMedicationItem = ({ item }: { item: Medication }) => {
        const isSelected = selectedMeds.some(med => med.id === item.id);

        return (
            <TouchableOpacity
                style={[styles.medicationItem, isSelected && styles.selectedMedicationItem]}
                onPress={() => handleSelectMedication(item)}
            >
                <Text style={styles.medicationName}>{item.name}</Text>
                <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                    {isSelected && <View style={styles.radioButtonInner} />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F5F0" />

            {/* Header */}
            <View style={styles.headerContainer}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerText}>Assessment</Text>
                <View style={styles.progressPill}>
                    <Text style={styles.progressText}>10 of 14</Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.titleText}>
                Please specify your medications!
            </Text>

            {/* Alphabet Filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.alphabetContainer}
                contentContainerStyle={styles.alphabetContent}
            >
                {ALPHABET.map(letter => (
                    <TouchableOpacity
                        key={letter}
                        style={[
                            styles.letterButton,
                            selectedLetter === letter && styles.selectedLetterButton
                        ]}
                        onPress={() => handleSelectLetter(letter)}
                    >
                        <Text
                            style={[
                                styles.letterText,
                                selectedLetter === letter && styles.selectedLetterText
                            ]}
                        >
                            {letter}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Error message if API call fails */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Medications List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#5D4037" />
                </View>
            ) : (
                <FlatList
                    data={medications}
                    renderItem={renderMedicationItem}
                    keyExtractor={item => item.id}
                    style={styles.medicationsList}
                    contentContainerStyle={styles.medicationsListContent}
                    showsVerticalScrollIndicator={true}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No medications found</Text>
                            <Text style={styles.emptySubText}>Try a different letter</Text>
                        </View>
                    }
                />
            )}

            {/* Selected Medications */}
            {selectedMeds.length > 0 && (
                <View style={styles.selectedContainer}>
                    <Text style={styles.selectedLabel}>Selected:</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.selectedScrollContent}
                    >
                        {selectedMeds.map(med => (
                            <View key={med.id} style={styles.selectedPill}>
                                <Text style={styles.selectedPillText}>{med.name}</Text>
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => handleRemoveMedication(med.id)}
                                >
                                    <Text style={styles.removeButtonText}>×</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
            >
                <Text style={styles.continueButtonText}>
                    Continue
                </Text>
                <Text style={styles.continueArrow}>→</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F5F0',
        paddingHorizontal: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 20,
    },
    headerText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#5D4037',
    },
    progressPill: {
        backgroundColor: '#E6DED5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    progressText: {
        fontSize: 14,
        color: '#5D4037',
    },
    titleText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#5D4037',
        textAlign: 'center',
        marginBottom: 40,
    },
    alphabetContainer: {
        maxHeight: 60,
        marginBottom: 15,
    },
    alphabetContent: {
        paddingHorizontal: 5,
    },
    letterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E6DED5',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    selectedLetterButton: {
        backgroundColor: '#E67E22',
    },
    letterText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#5D4037',
    },
    selectedLetterText: {
        color: 'white',
    },
    medicationsList: {
        flex: 1,
    },
    medicationsListContent: {
        paddingBottom: 20,
    },
    medicationItem: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 25,
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectedMedicationItem: {
        backgroundColor: '#A3B18A',
    },
    medicationName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#5D4037',
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#5D4037',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        borderColor: 'white',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#5D4037',
    },
    emptySubText: {
        fontSize: 14,
        color: '#9E9E9E',
        marginTop: 5,
    },
    selectedContainer: {
        marginTop: 10,
        marginBottom: 15,
    },
    selectedLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 8,
    },
    selectedScrollContent: {
        flexDirection: 'row',
        paddingRight: 20,
    },
    selectedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E6DED5',
        borderRadius: 20,
        paddingVertical: 8,
        paddingLeft: 15,
        paddingRight: 10,
        marginRight: 8,
    },
    selectedPillText: {
        color: '#5D4037',
        fontSize: 14,
        marginRight: 5,
    },
    removeButton: {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: '#5D4037',
        fontSize: 20,
        fontWeight: 'bold',
    },
    errorContainer: {
        backgroundColor: '#FFEBEE',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 14,
    },
    continueButton: {
        backgroundColor: '#5D4037',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 30,
        marginBottom: 30,
    },
    continueButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginRight: 5,
    },
    continueArrow: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
    },
});

export default MedicamentSelection;