import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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
    };
    height: {
        value: number;
        unit: 'cm' | 'ft';
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
    completedAt: string | null;
    isSubmitted: boolean;
    prescribedMedications: Array<{
        id: string;
        name: string;
    }> | null;
}

// Define the store interface
interface AssessmentStore {
    // State
    assessmentData: AssessmentData;
    isLoading: boolean;
    error: string | null;

    // Actions
    setHealthGoal: (id: string, text: string) => void;
    setGender: (gender: string) => void;
    setAge: (age: number) => void;
    setWeight: (value: number, unit: 'kg' | 'lbs') => void;
    setHeight: (value: number, unit: 'cm' | 'ft') => void;
    setMood: (id: string, label: string) => void;
    setSleepQuality: (label: string, hours: string) => void;
    setProfessionalHelp: (answer: 'yes' | 'no') => void;
    completeAssessment: () => void;
    submitAssessment: () => Promise<void>;
    saveProgress: () => Promise<void>;
    resetAssessment: () => void;
    setMedication: (option: 'prescribed' | 'otc' | 'none' | 'no_answer') => void;
    savePrescribedMedications: (medications: Array<{
        id: string;
        name: string;
    }>) => void;

}

// Create the Zustand store with persist middleware
export const useAssessmentStore = create<AssessmentStore>()(
    persist(
        (set, get) => ({
            // Initial state
            assessmentData: {
                healthGoal: { id: '', text: '' },
                gender: '',
                age: 0,
                weight: { value: 0, unit: 'kg' },
                height: { value: 0, unit: 'cm' },
                mood: { id: '', label: '' },
                sleepQuality: { label: '', hours: '' },
                professionalHelp: null,
                completedAt: null,
                isSubmitted: false,
                medication: null,
                prescribedMedications: null,
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

            setWeight: (value, unit) => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    weight: { value, unit }
                }
            })),

            setHeight: (value, unit) => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    height: { value, unit }
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

            setProfessionalHelp: (answer) => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    professionalHelp: answer
                }
            })),

            completeAssessment: () => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    completedAt: new Date().toISOString()
                }
            })),
            setMedication: (option) => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    medication: option
                }
            })),
            savePrescribedMedications: (medications) => set(state => ({
                assessmentData: {
                    ...state.assessmentData,
                    prescribedMedications: medications
                }
            })),

            submitAssessment: async () => {
                set({ isLoading: true, error: null });

                try {
                    const { assessmentData } = get();

                    // Get token for authenticated requests
                    const token = await AsyncStorage.getItem('userToken');

                    if (!token) {
                        throw new Error('User not authenticated');
                    }
                    console.log('Submitting assessment data:', JSON.stringify(assessmentData));
                    // Submit data to your API - updated URL to your actual backend endpoint
                    const response = await axios.post(
                        'http://10.0.2.2:5000/api/assessment/submit',
                        assessmentData,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );
                    console.log('Server response:', response.data);
                    // Mark as submitted if successful
                    set(state => ({
                        isLoading: false,
                        assessmentData: {
                            ...state.assessmentData,
                            isSubmitted: true
                        }
                    }));

                    return response.data;
                } catch (error) {
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to submit assessment'
                    });
                    throw error;
                }
            },

            saveProgress: async () => {
                try {
                    const { assessmentData } = get();
                    const token = await AsyncStorage.getItem('userToken');

                    if (!token) {
                        console.log('User not authenticated, saving locally only');
                        return;
                    }

                    await axios.post(
                        'http://10.0.2.2:5000/api/assessment/save-progress',
                        assessmentData,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );

                    console.log('Assessment progress saved to server');
                } catch (error) {
                    console.error('Error saving progress to server:', error);
                }
            },

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
                    completedAt: null,
                    isSubmitted: false,
                    medication: null,
                    prescribedMedications: null,
                },
                error: null
            })
        }),
        {
            name: 'assessment-storage',
            storage: createJSONStorage(() => AsyncStorage)
        }
    )
);