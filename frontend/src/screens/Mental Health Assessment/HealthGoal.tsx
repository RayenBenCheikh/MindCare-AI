import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/MentalNavigator';
import BackButton from '@/src/components/BackButton';
import { SvgXml } from 'react-native-svg';
import { useAssessmentStore } from '@/src/store/Store';
import ContinueButton from '@/src/components/Continue';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface GoalOption {
    id: string;
    title: string;
    icon: string;
}

const { width } = Dimensions.get('window');

const HealthGoal: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [selectedGoal, setSelectedGoal] = useState<string>('goal2');
    // Get the setHealthGoal action from our Zustand store
    const setHealthGoal = useAssessmentStore(state => state.setHealthGoal);
    const goalOptions: GoalOption[] = [
        {
            id: 'goal1',
            title: 'I wanna reduce stress',
            icon: `<svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.79293 1.79293C4.04863 -0.462758 7.66491 -0.528607 10 1.59539C12.3352 -0.528607 15.9515 -0.462758 18.2071 1.79293C20.5307 4.11646 20.5307 7.88363 18.2071 10.2072L10.7071 17.7071C10.5196 17.8947 10.2653 18 10 18C9.73482 18 9.48047 17.8947 9.29293 17.7071L1.79293 10.2071C-0.530587 7.88363 -0.530588 4.11646 1.79293 1.79293Z" fill="#C9C7C5"/>
</svg>
`
        },
        {
            id: 'goal2',
            title: 'I wanna try AI Therapy',
            icon: `<svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7 8C7.55228 8 8 7.55228 8 7C8 6.44772 7.55228 6 7 6C6.44772 6 6 6.44772 6 7C6 7.55228 6.44772 8 7 8Z" fill="white"/>
<path d="M14 7C14 7.55228 13.5523 8 13 8C12.4477 8 12 7.55228 12 7C12 6.44772 12.4477 6 13 6C13.5523 6 14 6.44772 14 7Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M0 8H1.07089C1.55612 11.3923 4.47353 14 8 14H12C15.5265 14 18.4439 11.3923 18.9291 8H20V6H18.9291C18.4439 2.60771 15.5265 0 12 0H8C4.47353 0 1.55612 2.60771 1.07089 6H0V8ZM6.22549 2.32404C4.34004 3.03995 3 4.86348 3 7C3 9.76142 5.23858 12 8 12H12C14.7614 12 17 9.76142 17 7C17 4.86348 15.66 3.03995 13.7745 2.32404C13.5778 2.88484 13.2567 3.40019 12.8284 3.82843C12.0783 4.57857 11.0609 5 10 5C8.93913 5 7.92172 4.57857 7.17157 3.82843C6.74333 3.40019 6.42222 2.88484 6.22549 2.32404Z" fill="white"/>
</svg>
`
        },
        {
            id: 'goal3',
            title: 'I want to cope with trauma',
            icon: `<svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5 0C2.23858 0 0 2.23858 0 5V17H2V10H6.58579L8.58579 12H10C12.7614 12 15 9.76142 15 7C15 4.23858 12.7614 2 10 2H9.41421L7.41421 0H5Z" fill="#C9C7C5"/>
</svg>`
        },
        {
            id: 'goal4',
            title: 'I want to be a better person',
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#A0A0A0" stroke-width="2"/>
        <path d="M8 15s1.5 2 4 2 4-2 4-2" stroke="#A0A0A0" stroke-width="2" stroke-linecap="round"/>
        <circle cx="9" cy="9" r="1.5" fill="#A0A0A0"/>
        <circle cx="15" cy="9" r="1.5" fill="#A0A0A0"/>
      </svg>`
        },
        {
            id: 'goal5',
            title: 'Just trying out the app, mate!',
            icon: `<svg width="14" height="20" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M0 5C0 2.94968 1.2341 1.1876 3 0.416044V1C3 1.52529 3.10346 2.04543 3.30448 2.53073C3.5055 3.01604 3.80014 3.45699 4.17157 3.82843C4.54301 4.19986 4.98396 4.4945 5.46927 4.69552C5.95457 4.89654 6.47471 5 7 5C7.52529 5 8.04543 4.89654 8.53073 4.69552C9.01604 4.4945 9.45699 4.19986 9.82843 3.82843C10.1999 3.45699 10.4945 3.01604 10.6955 2.53073C10.8965 2.04543 11 1.52529 11 1V0.416044C12.7659 1.1876 14 2.94968 14 5V15C14 17.7614 11.7614 20 9 20H5C2.23858 20 0 17.7614 0 15V5ZM7 18C7.55228 18 8 17.5523 8 17C8 16.4477 7.55228 16 7 16C6.44772 16 6 16.4477 6 17C6 17.5523 6.44772 18 7 18Z" fill="#C9C7C5"/>
<path d="M5 0H9V1C9 1.26264 8.94827 1.52272 8.84776 1.76537C8.74725 2.00802 8.59993 2.2285 8.41421 2.41421C8.2285 2.59993 8.00802 2.74725 7.76537 2.84776C7.52272 2.94827 7.26264 3 7 3C6.73736 3 6.47728 2.94827 6.23463 2.84776C5.99198 2.74725 5.7715 2.59993 5.58579 2.41421C5.40007 2.2285 5.25275 2.00802 5.15224 1.76537C5.05173 1.52272 5 1.26264 5 1V0Z" fill="#C9C7C5"/>
</svg>
`
        },
    ];

    const handleContinue = async () => {
        const selectedOption = goalOptions.find(option => option.id === selectedGoal);

        if (selectedOption) {
            // Save to Zustand store instead of AsyncStorage
            setHealthGoal(selectedGoal, selectedOption.title);

            navigation.navigate('GenderSelection');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerText}>Assessment</Text>
                <View style={styles.progressPill}>
                    <Text style={styles.progressText}>1 of 10</Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.titleText}>
                What's your health goal for today?
            </Text>

            {/* Goal Options */}
            <View style={styles.optionsContainer}>
                {goalOptions.map((option) => (
                    <TouchableOpacity
                        key={option.id}
                        style={[
                            styles.optionCard,
                            selectedGoal === option.id && styles.selectedCard,
                            selectedGoal === option.id && { backgroundColor: option.id === 'goal2' ? '#9CCC65' : '#FFFFFF' }
                        ]}
                        onPress={() => setSelectedGoal(option.id)}
                    >
                        <View style={styles.optionContent}>
                            <View style={[
                                styles.iconContainer,
                                selectedGoal === option.id && option.id === 'goal2' && { backgroundColor: 'transparent' }
                            ]}>
                                <SvgXml
                                    xml={option.icon}
                                    width={24}
                                    height={24}
                                />
                            </View>
                            <Text style={[
                                styles.optionText,
                                selectedGoal === option.id && option.id === 'goal2' && styles.selectedOptionText
                            ]}>
                                {option.title}
                            </Text>
                        </View>
                        <View style={[
                            styles.selectionIndicator,
                            selectedGoal === option.id && styles.selectedIndicator
                        ]}>
                            {selectedGoal === option.id && (
                                <View style={styles.indicatorInner} />
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <ContinueButton onPress={handleContinue} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F4F2',
        paddingHorizontal: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        marginBottom: 40,
        color: '#5D4037',
        lineHeight: 40,
    },
    optionsContainer: {
        flex: 1,
        marginBottom: 20,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedCard: {
        borderColor: '#9CCC65',
        borderWidth: 1,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    optionText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#5D4037',
    },
    selectedOptionText: {
        color: '#FFFFFF',
    },
    selectionIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#5D4037',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedIndicator: {
        borderColor: '#5D4037',
    },
    indicatorInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#5D4037',
    },
    continueButton: {
        backgroundColor: '#5D4037',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    continueButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    continueArrow: {
        color: 'white',
        fontSize: 18,
        marginLeft: 8,
    },
});

export default HealthGoal;