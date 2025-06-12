import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    FlatList,
    Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '@/src/context/AuthContext';
import { api } from '@/src/api/config';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

interface StressData {
    date: string;
    level: number;
    mood: string;
    analysis?: string;
}

const StressLevel = () => {
    const navigation = useNavigation<NavigationProp>();
    const { userToken } = useContext(AuthContext);
    const [stressData, setStressData] = useState<StressData[]>([]);
    const [loading, setLoading] = useState(true);
    const [averageStress, setAverageStress] = useState(0);

    useEffect(() => {
        fetchStressData();
    }, []);

    const fetchStressData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/chatbot/assessment-results', {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                const assessments = response.data.assessments || [];
                const processedStress = processStressData(assessments);
                setStressData(processedStress);

                if (processedStress.length > 0) {
                    const avg = processedStress.reduce((sum, data) => sum + data.level, 0) / processedStress.length;
                    setAverageStress(avg);
                }
            }
        } catch (error) {
            console.error('Error fetching stress data:', error);
        } finally {
            setLoading(false);
        }
    };

    const processStressData = (assessments: any[]): StressData[] => {
        return assessments
            .filter(assessment => assessment.stressLevel !== undefined)
            .map(assessment => ({
                date: assessment.completedAt,
                level: assessment.stressLevel,
                mood: assessment.mood,
                analysis: assessment.analysis
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const getStressLevelColor = (level: number): string => {
        if (level <= 2) return '#8DAA6D';
        if (level <= 3) return '#F0CA00';
        if (level <= 4) return '#E18942';
        return '#E74C3C';
    };

    const getStressLevelLabel = (level: number): string => {
        if (level <= 1) return 'Very Low';
        if (level <= 2) return 'Low';
        if (level <= 3) return 'Normal';
        if (level <= 4) return 'High';
        return 'Very High';
    };

    const getStressIcon = (level: number): string => {
        if (level <= 2) return '😌';
        if (level <= 3) return '😐';
        if (level <= 4) return '😰';
        return '😵';
    };

    const renderStressItem = ({ item }: { item: StressData }) => (
        <View style={styles.stressItem}>
            <View style={styles.stressHeader}>
                <View style={styles.stressInfo}>
                    <Text style={styles.stressDate}>
                        {new Date(item.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </Text>
                    <View style={styles.stressDetails}>
                        <View style={[
                            styles.levelBadge,
                            { backgroundColor: getStressLevelColor(item.level) }
                        ]}>
                            <Text style={styles.levelText}>Level {item.level}</Text>
                        </View>
                        <Text style={styles.levelLabel}>
                            {getStressLevelLabel(item.level)}
                        </Text>
                    </View>
                </View>
                <Text style={styles.stressEmoji}>{getStressIcon(item.level)}</Text>
            </View>
            <View style={styles.progressBar}>
                <View style={[
                    styles.progressFill,
                    {
                        width: `${(item.level / 5) * 100}%`,
                        backgroundColor: getStressLevelColor(item.level)
                    }
                ]} />
            </View>
            {item.analysis && (
                <Text style={styles.stressAnalysis} numberOfLines={2}>
                    {item.analysis}
                </Text>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#5D4037" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Stress Level</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F0CA00" />
                    <Text style={styles.loadingText}>Loading your stress data...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#5D4037" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Stress Level</Text>
                <TouchableOpacity onPress={fetchStressData}>
                    <Ionicons name="refresh" size={24} color="#5D4037" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Average Overview */}
                <View style={styles.overviewCard}>
                    <View style={styles.overviewHeader}>
                        <Ionicons name="flash" size={32} color="#F0CA00" />
                        <View style={styles.overviewText}>
                            <Text style={styles.overviewTitle}>Average Stress Level</Text>
                            <Text style={[
                                styles.overviewValue,
                                { color: getStressLevelColor(averageStress) }
                            ]}>
                                {averageStress.toFixed(1)}/5
                            </Text>
                        </View>
                        <Text style={styles.overviewEmoji}>{getStressIcon(averageStress)}</Text>
                    </View>
                    <Text style={styles.overviewSubtext}>
                        {getStressLevelLabel(averageStress)} • Based on {stressData.length} assessments
                    </Text>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {stressData.filter(d => d.level <= 2).length}
                        </Text>
                        <Text style={styles.statLabel}>Low Stress Days</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {stressData.filter(d => d.level >= 4).length}
                        </Text>
                        <Text style={styles.statLabel}>High Stress Days</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stressData.length}</Text>
                        <Text style={styles.statLabel}>Total Records</Text>
                    </View>
                </View>

                {/* Stress History */}
                <View style={styles.historyContainer}>
                    <Text style={styles.sectionTitle}>Stress History</Text>
                    {stressData.length > 0 ? (
                        <FlatList
                            data={stressData}
                            renderItem={renderStressItem}
                            keyExtractor={(item) => item.date}
                            scrollEnabled={false}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="flash-outline" size={48} color="#CCC" />
                            <Text style={styles.emptyTitle}>No stress data yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Complete chatbot assessments to track your stress levels
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#5D4037',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#8B7B73',
    },
    content: {
        flex: 1,
    },

    // Overview Card
    overviewCard: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 15,
        padding: 20,
        borderRadius: 15,
        backgroundColor: '#FFFBE6',
        borderLeftWidth: 4,
        borderLeftColor: '#F0CA00',
    },
    overviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    overviewText: {
        marginLeft: 12,
        flex: 1,
    },
    overviewTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
    },
    overviewValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    overviewEmoji: {
        fontSize: 32,
    },
    overviewSubtext: {
        fontSize: 12,
        color: '#8B7B73',
        fontStyle: 'italic',
    },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 15,
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#F0CA00',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#8B7B73',
        textAlign: 'center',
    },

    // History
    historyContainer: {
        backgroundColor: '#FFFFFF',
        margin: 20,
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 15,
    },
    stressItem: {
        backgroundColor: '#F8F9FA',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#F0CA00',
    },
    stressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    stressInfo: {
        flex: 1,
    },
    stressDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 4,
    },
    stressDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    levelBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    levelText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFF',
    },
    levelLabel: {
        fontSize: 12,
        color: '#8B7B73',
        fontWeight: '500',
    },
    stressEmoji: {
        fontSize: 24,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#F0F0F0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    stressAnalysis: {
        fontSize: 12,
        color: '#5D4037',
        lineHeight: 16,
        fontStyle: 'italic',
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8B7B73',
        marginTop: 10,
        marginBottom: 5,
    },
    emptySubtitle: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});

export default StressLevel;