import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';

// Define API base URL based on platform - fixed the syntax error (removed slash)
const API_BASE_URL = __DEV__
    ? Platform.OS === 'ios'
        ? 'http://localhost:5000' // Removed /api
        : 'http://10.0.2.2:5000'  // Removed /api
    : 'https://your-production-api.com';

// Define the assessment data types
interface AssessmentData {
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
                    const { assessmentData } = get();

                    // Mark as submitted
                    set(state => ({
                        assessmentData: {
                            ...state.assessmentData,
                            isSubmitted: true,
                            completedAt: assessmentData.completedAt || new Date().toISOString()
                        }
                    }));

                    // Get token
                    let token = null;
                    try {
                        token = await AsyncStorage.getItem('@auth_token');
                        if (!token) {
                            return { success: false, message: "Please sign in to submit your assessment" };
                        }
                    } catch (e) {
                        console.log('Error retrieving auth token:', e);
                        return { success: false, message: "Authentication required" };
                    }

                    // Set up request config with authorization
                    const config = {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    };

                    console.log('Submitting assessment with auth token');

                    try {
                        const response = await axios.post(
                            `${API_BASE_URL}/api/assessments`,
                            assessmentData,
                            config
                        );
                        console.log('Submission response:', response.data);
                        set({ isLoading: false });
                        return response.data;
                    } catch (error) {
                        console.error('API error:', error);

                        if (axios.isAxiosError(error) && error.response?.status === 401) {
                            set({ isLoading: false, error: 'Authentication required' });
                            return { success: false, message: "Please sign in again" };
                        }

                        set({ isLoading: false, error: 'Failed to submit assessment' });
                        return { success: false, message: "Failed to save assessment" };
                    }
                } catch (error) {
                    console.error('Error in submitAssessment:', error);
                    set({ isLoading: false, error: 'Failed to submit assessment' });
                    return { success: false };
                }
            }
        }),  // <-- Added missing parenthesis and comma here
        {
            name: 'assessment-store',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);