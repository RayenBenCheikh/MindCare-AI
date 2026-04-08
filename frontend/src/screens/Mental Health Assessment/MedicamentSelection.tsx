import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    FlatList,
    ScrollView,
    ActivityIndicator,
    TextInput,
    Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/MentalNavigator';
import BackButton from '@/src/components/BackButton';
import { useAssessmentStore } from '@/src/store/Store';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import ContinueButton from '@/src/components/Continue';
import { AuthContext } from '@/src/context/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Medication = {
    id: string;
    name: string;
};

// Generate the alphabet array for filtering
const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
ALPHABET.push("🔍");

const MedicamentSelection: React.FC = () => {
    const [selectedLetter, setSelectedLetter] = useState<string>('A');
    const [medications, setMedications] = useState<Medication[]>([]);
    const [selectedMeds, setSelectedMeds] = useState<Medication[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchMode, setSearchMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigation = useNavigation<NavigationProp>();
    const { userToken } = useContext(AuthContext);
    const savePrescribedMedications = useAssessmentStore(state => state.savePrescribedMedications);
    const submitAssessment = useAssessmentStore(state => state.submitAssessment);
    const storeIsLoading = useAssessmentStore(state => state.isLoading);

    // Fetch medications by selected letter
    useEffect(() => {
        const fetchMedications = async () => {
            // Don't fetch if we're in search mode but haven't entered a query yet
            if (searchMode && !searchQuery.trim()) {
                setMedications([]);
                return;
            }

            // Don't fetch if no token
            if (!userToken) {
                console.log("No user token available");
                setError("Authentication required");
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                let url = '';

                if (searchMode) {
                    // Fetch by search query
                    url = `http://10.0.2.2:5000/api/medications/search?term=${encodeURIComponent(searchQuery)}`;
                    console.log(`Searching for medications containing: "${searchQuery}"`);
                } else {
                    // Fetch by letter
                    url = `http://10.0.2.2:5000/api/medications/byLetter?letter=${selectedLetter}`;
                    console.log(`Fetching medications for letter: ${selectedLetter}`);
                }

                console.log("Making request with token:", userToken.substring(0, 20) + "...");

                const response = await axios.get(url, {
                    headers: {
                        'Authorization': `Bearer ${userToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data && Array.isArray(response.data)) {
                    const mappedMedications = response.data.map((med: any) => ({
                        id: med._id || String(Math.random()),
                        name: med.Nom || 'Unknown'
                    }));

                    // Remove duplicates by medication name
                    const uniqueMedications = mappedMedications.filter((med, index, self) =>
                        index === self.findIndex((m) => m.name === med.name)
                    );

                    setMedications(uniqueMedications);
                } else {
                    setMedications([]);
                }
            } catch (err: any) {
                console.error('Error fetching medications:', err);
                console.error('Error response:', err.response?.data);
                console.error('Error status:', err.response?.status);

                if (err.response?.status === 401) {
                    setError("Authentication failed. Please log in again.");
                } else {
                    setError(`Failed to load medications: ${err.message}`);
                }
                setMedications([]);
            } finally {
                setIsLoading(false);
            }
        };

        const debounceTimeout = setTimeout(() => {
            fetchMedications();
        }, searchMode ? 500 : 0); // Add debounce for search typing

        return () => clearTimeout(debounceTimeout);
    }, [selectedLetter, searchMode, searchQuery, userToken]);

    const handleSelectLetter = (letter: string) => {
        if (letter === "🔍") {
            setSearchMode(true);
        } else {
            setSearchMode(false);
            setSelectedLetter(letter);
        }
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

    const handleContinue = async () => {
        try {
            // Check if user is authenticated
            if (!userToken) {
                Alert.alert(
                    'Authentication Required',
                    'Please login to save your assessment.',
                    [{ text: 'OK' }]
                );
                return;
            }

            setIsSubmitting(true);

            // Save selected medications to store
            savePrescribedMedications(selectedMeds);

            console.log('Starting assessment submission...');
            console.log('User token available:', !!userToken);
            console.log('Selected medications count:', selectedMeds.length);

            try {
                // Submit the assessment
                const response = await submitAssessment();
                console.log('Assessment submitted successfully:', response);

                // Show success message
                Alert.alert(
                    'Assessment Completed! 🎉',
                    'Your mental health assessment has been saved successfully. You can now view your personalized dashboard.',
                    [
                        {
                            text: 'View Dashboard',
                            onPress: () => navigation.navigate('TabNavigator')
                        }
                    ]
                );
            } catch (error: any) {
                console.error('Error submitting assessment:', error);

                // Improved error message
                let errorMessage = 'There was a problem saving your assessment.';

                if (error.message) {
                    errorMessage = error.message;
                }

                setError(errorMessage);

                Alert.alert(
                    'Submission Error',
                    errorMessage,
                    [
                        {
                            text: 'Try Again',
                            onPress: () => setError(null)
                        },
                        {
                            text: 'Skip for Now',
                            onPress: () => navigation.navigate('TabNavigator')
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Error saving medications:', error);
            setError('Error saving medications. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderMedicationItem = ({ item }: { item: Medication }) => {
        const isSelected = selectedMeds.some(med => med.id === item.id);

        return (
            <TouchableOpacity
                style={[styles.medicationItem, isSelected && styles.selectedMedicationItem]}
                onPress={() => handleSelectMedication(item)}
                disabled={isSubmitting || storeIsLoading}
            >
                <Text style={[styles.medicationName, isSelected && styles.selectedMedicationName]}>
                    {item.name}
                </Text>
                <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                    {isSelected && <View style={styles.radioButtonInner} />}
                </View>
            </TouchableOpacity>
        );
    };

    // Show auth error if no token
    if (!userToken) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Authentication required. Please log in.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const isButtonDisabled = isSubmitting || storeIsLoading;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F5F0" />

            {/* Header */}
            <View style={styles.headerContainer}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerText}>Assessment</Text>
                <View style={styles.progressPill}>
                    <Text style={styles.progressText}>10 of 10</Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.titleText}>
                Please specify your medications!
            </Text>

            {/* Search Input or Alphabet Filter */}
            {searchMode ? (
                <View style={styles.searchContainer}>
                    <Icon name="magnify" size={24} color="#5D4037" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Type medication name..."
                        placeholderTextColor="#9E9E9E"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                        editable={!isSubmitting && !storeIsLoading}
                    />
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                            setSearchQuery('');
                            setSearchMode(false);
                            setSelectedLetter('A');
                        }}
                        disabled={isSubmitting || storeIsLoading}
                    >
                        <Icon name="close-circle" size={20} color="#9E9E9E" />
                    </TouchableOpacity>
                </View>
            ) : (
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
                                selectedLetter === letter && !searchMode && styles.selectedLetterButton
                            ]}
                            onPress={() => handleSelectLetter(letter)}
                            disabled={isSubmitting || storeIsLoading}
                        >
                            <Text
                                style={[
                                    styles.letterText,
                                    selectedLetter === letter && !searchMode && styles.selectedLetterText
                                ]}
                            >
                                {letter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Error message if API call fails */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Loading or submitting indicator */}
            {(isSubmitting || storeIsLoading) && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#5D4037" />
                    <Text style={styles.loadingText}>
                        {isSubmitting ? 'Submitting assessment...' : 'Loading...'}
                    </Text>
                </View>
            )}

            {/* Medications List */}
            {!isSubmitting && !storeIsLoading && (
                <>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#5D4037" />
                        </View>
                    ) : (
                        <FlatList
                            data={medications}
                            renderItem={renderMedicationItem}
                            keyExtractor={item => item.id}
                            // ↓ Start items immediately under the alphabet
                            style={styles.medicationsList}
                            contentContainerStyle={styles.medicationsListContent}
                            showsVerticalScrollIndicator={true}
                            keyboardShouldPersistTaps="handled"
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No medications found</Text>
                                    <Text style={styles.emptySubText}>
                                        {searchMode
                                            ? "Try a different search term"
                                            : "Try a different letter"}
                                    </Text>
                                </View>
                            }
                        />
                    )}

                </>
            )}

            {/* Selected Medications */}
            {selectedMeds.length > 0 && !isSubmitting && !storeIsLoading && (
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

            <ContinueButton
                onPress={handleContinue}
                disabled={isButtonDisabled}
                style={isButtonDisabled ? styles.disabledButton : undefined}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F5F0',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
    },
    headerText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#5D4037',
    },
    progressPill: {
        backgroundColor: '#E8DDD9',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    progressText: {
        fontSize: 14,
        color: '#926247',
    },
    titleText: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
        color: '#5D4037',
        lineHeight: 40,
        paddingHorizontal: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 12,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#5D4037',
        paddingVertical: 15,
    },
    clearButton: {
        padding: 5,
    },
    alphabetContainer: {
        marginBottom: 8,
        maxHeight: 50,
    },
    alphabetContent: {
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    letterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    selectedLetterButton: {
        backgroundColor: '#5D4037',
    },
    letterText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
    },
    selectedLetterText: {
        color: '#FFFFFF',
    },
    medicationsList: {
        flex: 1,
    },
    medicationsListContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 120,
    },
    medicationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 15,
        marginBottom: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    selectedMedicationItem: {
        backgroundColor: '#E8F5E8',
        borderWidth: 2,
        borderColor: '#5D4037',
    },
    medicationName: {
        flex: 1,
        fontSize: 16,
        color: '#5D4037',
        fontWeight: '500',
    },
    selectedMedicationName: {
        fontWeight: '600',
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#BDBDBD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        borderColor: '#5D4037',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#5D4037',
    },
    selectedContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#F8F5F0',
        borderTopWidth: 1,
        borderTopColor: '#E8DDD9',
    },
    selectedLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 10,
    },
    selectedScrollContent: {
        flexDirection: 'row',
    },
    selectedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5D4037',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
    },
    selectedPillText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    removeButton: {
        marginLeft: 6,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#5D4037',
        textAlign: 'center',
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#E74C3C',
        textAlign: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#5D4037',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
});

export default MedicamentSelection;