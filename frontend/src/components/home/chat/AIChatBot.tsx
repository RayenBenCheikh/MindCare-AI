import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface AIChatbotProps {
    onChatPress: () => void;
    onSettingsPress: () => void;
}
type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
const AIChatbot = ({ }: AIChatbotProps) => {
    const navigation = useNavigation<NavigationProp>();
    const handleSettingsPress = () => {
        navigation.navigate('settings');
    };
    return (
        <>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>AI Therapy Chatbot</Text>
                <TouchableOpacity onPress={handleSettingsPress}>
                    <Ionicons name="settings-outline" size={24} color="#5D4037" />
                </TouchableOpacity>
            </View>

            <View style={styles.chatbotCard}>
                <View style={styles.chatbotContent}>
                    <View>
                        <Text style={styles.chatbotNumber}>2,541</Text>
                        <Text style={styles.chatbotLabel}>Conversations</Text>
                        <Text style={styles.chatbotSubtext}>83 left this month</Text>
                        <View style={styles.chatbotPromo}>
                            <Ionicons name="star" size={14} color="#FFFFFF" />
                            <Text style={styles.promoText}>Go Pro. Now!</Text>
                        </View>
                    </View>
                    <View style={styles.chatbotImageContainer}>
                        <MaterialCommunityIcons name="robot" size={60} color="#CCCCCC" />
                        <View style={styles.chatbotBubble}>
                            <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
                        </View>
                    </View>
                </View>
                <View style={styles.chatbotActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#8DAA6D' }]}
                        onPress={() => navigation.navigate('Chatbot' as never)}
                    >
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#E18942' }]}
                        onPress={() => navigation.navigate('conversation')}
                    >
                        <Ionicons name="settings-sharp" size={22} color="#FFFFFF" />

                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#5D4037',
    },
    chatbotCard: {
        marginHorizontal: 20,
        borderRadius: 15,
        backgroundColor: '#808080',
        overflow: 'hidden',
        marginBottom: 20,
    },
    chatbotContent: {
        flexDirection: 'row',
        padding: 15,
        justifyContent: 'space-between',
    },
    chatbotNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    chatbotLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    chatbotSubtext: {
        fontSize: 13,
        color: '#E8E8E8',
        marginBottom: 8,
    },
    chatbotPromo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    promoText: {
        color: '#FFFFFF',
        fontSize: 12,
        marginLeft: 4,
    },
    chatbotImageContainer: {
        position: 'relative',
    },
    chatbotBubble: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#8DAA6D',
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatbotActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 10,
    },
});

export default AIChatbot;