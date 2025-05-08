import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Image,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { AuthContext } from '@/src/context/AuthContext';
import axios from 'axios';
import { useAssessmentStore } from '@/src/store/Store';

// Country interface
interface Country {
    name: {
        common: string;
    };
    flags: {
        png: string;
    };
}


const Profile: React.FC = () => {
    // Get user data from auth context
    const { userData, userToken } = useContext(AuthContext);
    const assessmentData = useAssessmentStore(state => state.assessmentData);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    // State for loading backend data
    const [isLoading, setIsLoading] = useState(false);

    // State for form fields
    const [fullName, setFullName] = useState(userData?.name || 'Shinomiya Kagi');
    const [email, setEmail] = useState(userData?.email || 'elementary221b@gmail.com');
    const [password, setPassword] = useState('**************');
    const [showPassword, setShowPassword] = useState(false);
    const [weight, setWeight] = useState(65);
    const [gender, setGender] = useState(assessmentData?.gender || 'Female');
    const [location, setLocation] = useState('Select a Country');
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [countries, setCountries] = useState<Country[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const saveProfileChanges = async () => {
        setIsSaving(true);
        setSaveError('');
        setSaveSuccess(false);

        try {
            // Combine all data into one assessment object
            const combinedData = {
                // User profile data
                name: fullName,
                email: email,
                ...(password !== '**************' && { password }),

                // Assessment data
                weight: {
                    value: Math.round(weight),
                    unit: 'kg'
                },
                gender: gender,
                location: location,

                // Add a flag to indicate this is a profile update
                isProfileUpdate: true
            };

            // Send all data to the assessments endpoint
            const response = await axios.post(
                'http://10.0.2.2:5000/api/assessments/save-progress',
                combinedData,
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Check if successful
            if (response.data.success) {
                setSaveSuccess(true);
                setTimeout(() => {
                    setSaveSuccess(false);
                }, 2000);
            } else {
                setSaveError(response.data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error saving profile:', error);

            if (axios.isAxiosError(error) && error.response) {
                setSaveError(error.response.data?.message || 'Network error occurred');
            } else {
                setSaveError('An unexpected error occurred');
            }
        } finally {
            setIsSaving(false);
        }
    };
    // Fetch user assessment data from backend
    useEffect(() => {
        const fetchCountries = async () => {
            setLoadingCountries(true);
            try {
                const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,flags');
                const sortedCountries = response.data.sort((a: Country, b: Country) =>
                    a.name.common.localeCompare(b.name.common)
                );
                setCountries(sortedCountries);
            } catch (error) {
                console.error('Error fetching countries:', error);
            } finally {
                setLoadingCountries(false);
            }
        };

        fetchCountries();
    }, []);

    useEffect(() => {
        if (!userToken) return;

        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get('http://10.0.2.2:5000/api/assessments/latest', {
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                });

                if (response.data.success && response.data.assessment) {
                    const assessment = response.data.assessment;

                    // Update gender and weight from backend
                    if (assessment.gender) {
                        setGender(assessment.gender);
                    }

                    if (assessment.weight && assessment.weight.value) {
                        setWeight(assessment.weight.value);
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [userToken]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile Setup</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Profile Image */}
                <View style={styles.profileImageContainer}>
                    <Image
                        source={{ uri: userData?.profileImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2' }}
                        style={styles.profileImage}
                    />
                    <TouchableOpacity style={styles.editImageButton}>
                        <MaterialCommunityIcons name="pencil" size={18} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#8DAA6D" />
                            <Text style={styles.loadingText}>Loading your profile...</Text>
                        </View>
                    ) : (
                        <>
                            {/* Full Name */}
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="person-outline" size={20} color="#7D6E83" />
                                <TextInput
                                    style={styles.input}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Enter your full name"
                                />
                            </View>

                            {/* Email */}
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="email-outline" size={20} color="#7D6E83" />
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="Enter your email address"
                                    keyboardType="email-address"
                                />
                            </View>

                            {/* Password */}
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="lock-outline" size={20} color="#7D6E83" />
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Enter your password"
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#7D6E83"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Weight */}
                            <Text style={styles.label}>Weight</Text>
                            <View style={styles.sliderContainer}>
                                <Text style={styles.sliderValue}>50kg</Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={50}
                                    maximumValue={100}
                                    value={weight}
                                    onValueChange={setWeight}
                                    step={1}
                                    minimumTrackTintColor="#8DAA6D"
                                    maximumTrackTintColor="#E0E0E0"
                                    thumbTintColor="#8DAA6D"
                                />
                                <Text style={styles.sliderValue}>100kg</Text>
                            </View>
                            <Text style={styles.currentWeight}>{Math.round(weight)}kg</Text>

                            {/* Gender */}
                            <Text style={styles.label}>Gender</Text>
                            <TouchableOpacity style={styles.dropdownContainer}>
                                <MaterialCommunityIcons name="gender-transgender" size={20} color="#7D6E83" />
                                <Text style={styles.dropdownText}>{gender}</Text>
                                <MaterialIcons name="keyboard-arrow-down" size={20} color="#7D6E83" />
                            </TouchableOpacity>

                            <>
                                {/* Location */}
                                <Text style={styles.label}>Location</Text>
                                <TouchableOpacity
                                    style={styles.dropdownContainer}
                                    onPress={() => setShowLocationPicker(true)}
                                >
                                    <MaterialIcons name="location-on" size={20} color="#7D6E83" />
                                    <Text style={styles.dropdownText}>{location}</Text>
                                    <MaterialIcons name="keyboard-arrow-down" size={20} color="#7D6E83" />
                                </TouchableOpacity>

                                {/* Country Selection Modal */}
                                <Modal
                                    visible={showLocationPicker}
                                    animationType="slide"
                                    transparent={true}
                                >
                                    <View style={styles.modalContainer}>
                                        <View style={styles.modalContent}>
                                            <View style={styles.modalHeader}>
                                                <Text style={styles.modalTitle}>Select Your Country</Text>
                                                <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                                                    <Ionicons name="close" size={24} color="#5D4037" />
                                                </TouchableOpacity>
                                            </View>

                                            <View style={styles.searchContainer}>
                                                <Ionicons name="search" size={20} color="#7D6E83" />
                                                <TextInput
                                                    style={styles.searchInput}
                                                    value={searchQuery}
                                                    onChangeText={setSearchQuery}
                                                    placeholder="Search countries..."
                                                    autoCapitalize="none"
                                                />
                                                {searchQuery ? (
                                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                                        <Ionicons name="close-circle" size={20} color="#7D6E83" />
                                                    </TouchableOpacity>
                                                ) : null}
                                            </View>

                                            {loadingCountries ? (
                                                <ActivityIndicator size="large" color="#8DAA6D" style={{ marginTop: 20 }} />
                                            ) : (
                                                <FlatList
                                                    data={countries.filter(country =>
                                                        country.name.common.toLowerCase().includes(searchQuery.toLowerCase())
                                                    )}
                                                    keyExtractor={(item) => item.name.common}
                                                    renderItem={({ item }) => (
                                                        <TouchableOpacity
                                                            style={styles.countryItem}
                                                            onPress={() => {
                                                                setLocation(item.name.common);
                                                                setShowLocationPicker(false);
                                                                setSearchQuery('');
                                                            }}
                                                        >
                                                            <View style={styles.countryItemContent}>
                                                                <Image
                                                                    source={{ uri: item.flags.png }}
                                                                    style={styles.countryFlag}
                                                                />
                                                                <Text style={[
                                                                    styles.countryItemText,
                                                                    location === item.name.common && styles.selectedCountryText
                                                                ]}>
                                                                    {item.name.common}
                                                                </Text>
                                                            </View>
                                                            {location === item.name.common && (
                                                                <Ionicons name="checkmark" size={20} color="#8DAA6D" />
                                                            )}
                                                        </TouchableOpacity>
                                                    )}
                                                    style={styles.countryList}
                                                />
                                            )}
                                        </View>
                                    </View>
                                </Modal>
                            </>

                            {/* Save Changes Button */}
                            <TouchableOpacity
                                style={[
                                    styles.continueButton,
                                    isSaving && styles.disabledButton
                                ]}
                                onPress={saveProfileChanges}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text style={styles.continueButtonText}>Save Changes</Text>
                                        <MaterialIcons name="check" size={20} color="white" />
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Error Message */}
                            {saveError ? (
                                <Text style={styles.errorText}>{saveError}</Text>
                            ) : null}

                            {/* Success Message */}
                            {saveSuccess ? (
                                <View style={styles.successContainer}>
                                    <Ionicons name="checkmark-circle" size={24} color="#8DAA6D" />
                                    <Text style={styles.successText}>Profile updated successfully!</Text>
                                </View>
                            ) : null}
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#B5C99A', // Light green/olive background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
    },
    profileImageContainer: {
        alignItems: 'center',
        marginVertical: 20,
        position: 'relative',
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: 'white',
    },
    editImageButton: {
        position: 'absolute',
        bottom: 0,
        right: '35%',
        backgroundColor: '#5D4037',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    formContainer: {
        backgroundColor: '#F5F5F5',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 30,
        paddingBottom: 60,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6D4C41',
    },
    label: {
        fontSize: 14,
        color: '#6D4C41',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#333',
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    slider: {
        flex: 1,
        height: 40,
        marginHorizontal: 8,
    },
    sliderValue: {
        fontSize: 14,
        color: '#7D6E83',
    },
    currentWeight: {
        alignSelf: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: '#8DAA6D',
        marginBottom: 16,
    },
    dropdownContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    dropdownText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#333',
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#5D4037',
        borderRadius: 25,
        paddingVertical: 16,
        marginTop: 20,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginRight: 8,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 15,
        maxHeight: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#5D4037',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 15,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    countryList: {
        maxHeight: 400,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    countryItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countryFlag: {
        width: 28,
        height: 20,
        marginRight: 12,
        borderRadius: 2,
    },
    countryItemText: {
        fontSize: 16,
        color: '#333',
    },
    selectedCountryText: {
        fontWeight: '600',
        color: '#8DAA6D',
    },
    disabledButton: {
        opacity: 0.7,
    },
    errorText: {
        color: '#E74C3C',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
    },
    successContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
        backgroundColor: 'rgba(141, 170, 109, 0.1)',
        padding: 10,
        borderRadius: 10,
    },
    successText: {
        color: '#8DAA6D',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },

});

export default Profile;