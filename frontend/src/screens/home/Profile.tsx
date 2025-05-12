import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { AuthContext } from '@/src/context/AuthContext';
import { useAssessmentStore } from '@/src/store/Store';
import { api, API_BASE_URL } from '@/src/api/config';
import { API_ENDPOINTS } from '@/src/constants/const';
import FormField from '@/src/components/profile/FormField';
import LocationPicker from '@/src/components/profile/LocationPicker';
import ProfileImage from '@/src/components/profile/ProfileImage';
import Header from '@/src/components/profile/Header';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

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
    const navigation = useNavigation();

    // Get user data from auth context
    const { userData, userToken } = useContext(AuthContext);
    const assessmentData = useAssessmentStore(state => state.assessmentData);

    // States
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fullName, setFullName] = useState(userData?.name || '');
    const [email, setEmail] = useState(userData?.email || '');
    const [password, setPassword] = useState('**************');
    const [showPassword, setShowPassword] = useState(false);
    const [weight, setWeight] = useState(65);
    const [gender, setGender] = useState(assessmentData?.gender || 'Female');
    const [location, setLocation] = useState('Select a Country');
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [countries, setCountries] = useState<Country[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [profileImage, setProfileImage] = useState(
        typeof userData?.profileImage === 'string' && userData?.profileImage
            ? userData.profileImage
            : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'
    );

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
                profileImage: profileImage,
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
            const response = await api.post(
                API_ENDPOINTS.assessments.saveProgress,
                combinedData
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

    // Fetch countries from API
    useEffect(() => {
        const fetchCountries = async () => {
            setLoadingCountries(true);
            try {
                // Use direct axios for external API calls, not our configured instance
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

    // Fetch user data from backend
    useEffect(() => {
        if (!userToken) return;

        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                // Don't add the authorization header manually here
                // The api instance should already be configured with it
                const response = await api.get(API_ENDPOINTS.assessments.latest);

                console.log('User data response:', response.data);

                if (response.data.success && response.data.assessment) {
                    const assessment = response.data.assessment;

                    // Update gender and weight from backend
                    if (assessment.gender) {
                        setGender(assessment.gender);
                    }

                    if (assessment.weight && assessment.weight.value) {
                        setWeight(assessment.weight.value);
                    }

                    // Update location if available
                    if (assessment.location) {
                        setLocation(assessment.location);
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                // Add more detailed error logging
                if (axios.isAxiosError(error)) {
                    console.error('Status:', error.response?.status);
                    console.error('Response data:', error.response?.data);
                }
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
                <Header
                    title="Profile Setup"
                    onBackPress={() => navigation.goBack()}
                    backgroundColor="#B5C99A"
                />

                {/* Profile Image */}
                <ProfileImage
                    imageUri={profileImage}
                    onImageChange={setProfileImage}
                    size={120}
                    borderColor="white"
                    borderWidth={4}
                    editButtonColor="#5D4037"
                />

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
                            <FormField
                                label="Full Name"
                                icon={<MaterialIcons name="person-outline" size={20} color="#7D6E83" />}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter your full name"
                            />

                            {/* Email */}
                            <FormField
                                label="Email Address"
                                icon={<MaterialCommunityIcons name="email-outline" size={20} color="#7D6E83" />}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter your email address"
                                keyboardType="email-address"
                            />

                            {/* Password */}
                            <FormField
                                label="Password"
                                icon={<MaterialIcons name="lock-outline" size={20} color="#7D6E83" />}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter your password"
                                secureTextEntry={!showPassword}
                                rightIcon={
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <Ionicons
                                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={20}
                                            color="#7D6E83"
                                        />
                                    </TouchableOpacity>
                                }
                            />

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
                            <FormField
                                label="Gender"
                                icon={<MaterialCommunityIcons name="gender-transgender" size={20} color="#7D6E83" />}
                                value={gender}
                                isDropdown
                                onPress={() => {
                                    Alert.alert(
                                        'Select Gender',
                                        'Choose your gender',
                                        [
                                            { text: 'Male', onPress: () => setGender('Male') },
                                            { text: 'Female', onPress: () => setGender('Female') },
                                            { text: 'Other', onPress: () => setGender('Other') },
                                            { text: 'Cancel', style: 'cancel' }
                                        ]
                                    );
                                }}
                                rightIcon={<MaterialIcons name="keyboard-arrow-down" size={20} color="#7D6E83" />}
                            />

                            {/* Location */}
                            <FormField
                                label="Location"
                                icon={<MaterialIcons name="location-on" size={20} color="#7D6E83" />}
                                value={location}
                                isDropdown
                                onPress={() => setShowLocationPicker(true)}
                                rightIcon={<MaterialIcons name="keyboard-arrow-down" size={20} color="#7D6E83" />}
                            />

                            {/* Location Picker Component */}
                            <LocationPicker
                                visible={showLocationPicker}
                                countries={countries}
                                selectedLocation={location}
                                isLoading={loadingCountries}
                                onClose={() => setShowLocationPicker(false)}
                                onSelect={(selectedCountry) => {
                                    setLocation(selectedCountry);
                                    setShowLocationPicker(false);
                                }}
                            />

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

                            {/* Error and Success messages */}
                            {saveError ? (
                                <Text style={styles.errorText}>{saveError}</Text>
                            ) : null}

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