import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';

const API_BASE_URL = __DEV__
    ? Platform.OS === 'ios'
        ? 'http://localhost:5000'
        : 'http://10.0.2.2:5000'
    : 'https://your-production-api.com';

// Define the assessment data types
export interface AssessmentData {
    healthGoal: {
        id: string;
        text: string;
    };
    gender: string;
    age: number;
    weight: {
        value: number;
        unit: 'kg' | 'lbs';
        valueInKg?: number;
    };
    height: {
        value: number;
        unit: 'cm' | 'ft';
        valueInCm?: number;
    };
    mood: {
        id: string;
        label: string;
    };
    sleepQuality: {
        label: string;
        hours: string;
    };
    professionalHelp: 'yes' | 'no' | null;
    medication: 'prescribed' | 'otc' | 'none' | 'no_answer' | null;
    prescribedMedications: Array<{
        id: string;
        name: string;
    }> | null;
    completedAt: string | null;
    isSubmitted: boolean;
}

interface AssessmentStore {
    assessmentData: AssessmentData;
    isLoading: boolean;
    error: string | null;

    // Actions
    setHealthGoal: (id: string, text: string) => void;
    setGender: (gender: string) => void;
    setAge: (age: number) => void;
    setWeight: (value: number, unit: 'kg' | 'lbs', valueInKg?: number) => void;
    setHeight: (value: number, unit: 'cm' | 'ft', valueInCm?: number) => void;
    setMood: (id: string, label: string) => void;
    setSleepQuality: (label: string, hours: string) => void;
    setProfessionalHelp: (value: 'yes' | 'no') => void;
    setMedication: (value: 'prescribed' | 'otc' | 'none' | 'no_answer') => void;
    savePrescribedMedications: (medications: Array<{ id: string, name: string }>) => void;
    submitAssessment: () => Promise<any>;
    resetAssessment: () => void;
}

// Create the Zustand store
export const useAssessmentStore = create<AssessmentStore>()(
    persist(
        (set, get) => ({
            assessmentData: {
                healthGoal: { id: '', text: '' },
                gender: '',
                age: 0,
                weight: { value: 0, unit: 'kg' },
                height: { value: 0, unit: 'cm' },
                mood: { id: '', label: '' },
                sleepQuality: { label: '', hours: '' },
                professionalHelp: null,
                medication: null,
                prescribedMedications: null,
                completedAt: null,
                isSubmitted: false,
            },
            isLoading: false,
            error: null,

            // Actions
            setHealthGoal: (id, text) => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    healthGoal: { id, text }
                }
            })),

            setGender: (gender) => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    gender
                }
            })),

            setAge: (age) => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    age
                }
            })),

            setWeight: (value, unit, valueInKg) => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    weight: { value, unit, valueInKg }
                }
            })),

            setHeight: (value, unit, valueInCm) => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    height: { value, unit, valueInCm }
                }
            })),

            setMood: (id, label) => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    mood: { id, label }
                }
            })),

            setSleepQuality: (label, hours) => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    sleepQuality: { label, hours }
                }
            })),

            setProfessionalHelp: (value) => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    professionalHelp: value
                }
            })),

            setMedication: (value) => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    medication: value
                }
            })),

            savePrescribedMedications: (medications) => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    prescribedMedications: medications,
                    completedAt: new Date().toISOString()
                }
            })),

            resetAssessment: () => set({
                assessmentData: {
                    healthGoal: { id: '', text: '' },
                    gender: '',
                    age: 0,
                    weight: { value: 0, unit: 'kg' },
                    height: { value: 0, unit: 'cm' },
                    mood: { id: '', label: '' },
                    sleepQuality: { label: '', hours: '' },
                    professionalHelp: null,
                    medication: null,
                    prescribedMedications: null,
                    completedAt: null,
                    isSubmitted: false,
                },
                error: null
            }),

            submitAssessment: async () => {
                set({ isLoading: true, error: null });

                try {
                    const state = get();

                    // Get the auth token from AsyncStorage
                    const token = await AsyncStorage.getItem('userToken');

                    if (!token) {
                        throw new Error('No authentication token found. Please login again.');
                    }

                    // Convert prescribedMedications array to string format expected by backend
                    let prescribedMedicationsString = '';
                    if (state.assessmentData.prescribedMedications && state.assessmentData.prescribedMedications.length > 0) {
                        // Create a comma-separated string of medication names
                        prescribedMedicationsString = state.assessmentData.prescribedMedications
                            .map(med => med.name)
                            .join(', ');
                    }

                    // Prepare assessment data with converted medications
                    const assessmentData = {
                        healthGoal: state.assessmentData.healthGoal,
                        gender: state.assessmentData.gender,
                        age: state.assessmentData.age,
                        weight: state.assessmentData.weight,
                        height: state.assessmentData.height,
                        mood: state.assessmentData.mood,
                        sleepQuality: state.assessmentData.sleepQuality,
                        professionalHelp: state.assessmentData.professionalHelp,
                        medication: state.assessmentData.medication,
                        // Convert array to string for backend compatibility
                        prescribedMedications: prescribedMedicationsString,
                        // Also send the raw array for future use (optional)
                        prescribedMedicationsArray: state.assessmentData.prescribedMedications,
                        completedAt: new Date().toISOString(),
                        isSubmitted: true
                    };

                    console.log('Submitting assessment to:', `${API_BASE_URL}/api/assessments`);
                    console.log('Assessment data:', assessmentData);
                    console.log('Prescribed medications string:', prescribedMedicationsString);
                    console.log('Using token:', token.substring(0, 20) + '...');

                    // Make the API request with proper headers
                    const response = await axios.post(
                        `${API_BASE_URL}/api/assessments`,
                        assessmentData,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    console.log('Assessment submitted successfully:', response.data);

                    // Mark as submitted in state
                    set(state => ({
                        assessmentData: {
                            ...state.assessmentData,
                            isSubmitted: true,
                            completedAt: assessmentData.completedAt
                        },
                        isLoading: false
                    }));

                    return response.data;
                } catch (error) {
                    console.error('Error submitting assessment:', error);

                    if (axios.isAxiosError(error)) {
                        console.error('API error:', error);
                        console.error('Error data:', error.response?.data);
                        console.error('Error status:', error.response?.status);

                        // Handle specific error cases
                        if (error.response?.status === 401) {
                            set({ isLoading: false, error: 'Authentication failed. Please login again.' });
                            throw new Error('Authentication failed. Please login again.');
                        } else if (error.response?.status === 400) {
                            const errorMsg = error.response?.data?.error || 'Invalid assessment data. Please check your inputs.';
                            set({ isLoading: false, error: errorMsg });
                            throw new Error(errorMsg);
                        } else if (error.response?.status === 500) {
                            const errorMsg = error.response?.data?.error || 'Server error. Please try again later.';
                            set({ isLoading: false, error: errorMsg });
                            throw new Error(errorMsg);
                        } else if (error.response && error.response.status >= 500) {
                            set({ isLoading: false, error: 'Server error. Please try again later.' });
                            throw new Error('Server error. Please try again later.');
                        }
                    }

                    set({ isLoading: false, error: 'Failed to submit assessment' });
                    throw error;
                }
            }
        }),
        {
            name: 'assessment-store',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);