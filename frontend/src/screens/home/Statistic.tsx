import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import {
    LineChart,
    BarChart,
    PieChart,
} from 'react-native-chart-kit';
import { AuthContext } from '../../context/AuthContext';
import { api, API_BASE_URL, VITAL_SIGNS_URLS } from '../../api/config';
import { VITAL_SIGNS_URL } from '../../api/config';
import { API_ENDPOINTS } from '@/src/constants/const';
const screenWidth = Dimensions.get('window').width;

interface VitalSign {
    timestamp: number;
    date: string;
    heartRate: number;
    systolicBP: number;
    diastolicBP: number;
    confidence: number;
    _id?: string;
}

interface StatisticProps {
    userId?: string;
}

interface StatsSummary {
    avgHeartRate: number;
    avgSystolic: number;
    avgDiastolic: number;
    avgConfidence: number;
    totalReadings: number;
    lastReading: VitalSign | null;
}

const Statistic: React.FC<StatisticProps> = ({ userId }) => {
    const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
    const [statsSummary, setStatsSummary] = useState<StatsSummary | null>(null);
    const [chartViewMode, setChartViewMode] = useState<'latest' | 'all'>('latest'); // New state for chart view

    // Get auth data from context
    const { userToken, userData } = useContext(AuthContext);
    const isAuthenticated = !!userToken;

    useEffect(() => {
        if (isAuthenticated) {
            fetchVitalSigns();
        } else {
            setError('User not authenticated');
            setLoading(false);
        }
    }, [userId, timeRange, isAuthenticated]);

    const fetchVitalSigns = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = userToken;
            const currentUserId = userId || userData?.id;

            if (!currentUserId || !token) {
                setError('User not authenticated');
                return;
            }

            // First, get the latest assessment for the user
            const latestAssessmentResponse = await fetch(`${API_BASE_URL}/api/assessments/latest`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!latestAssessmentResponse.ok) {
                throw new Error('Failed to get latest assessment');
            }

            const latestAssessmentData = await latestAssessmentResponse.json();

            if (!latestAssessmentData.success || !latestAssessmentData.assessment) {
                setError('No assessment found');
                return;
            }

            const assessmentId = latestAssessmentData.assessment._id;
            console.log('Using assessment ID:', assessmentId);

            // Now get vital signs for this assessment
            const response = await fetch(`${API_BASE_URL}/api/assessments/vitalSigns?assessmentId=${assessmentId}&timeRange=${timeRange}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (data.success) {
                // ✅ Sort by timestamp DESC (latest first) - IMPORTANT!
                const sortedData = [...data.vitalSigns].sort((a: VitalSign, b: VitalSign) =>
                    b.timestamp - a.timestamp
                );

                console.log('📊 Sorted vital signs (latest first):', {
                    total: sortedData.length,
                    latest: sortedData[0] ? {
                        hr: sortedData[0].heartRate,
                        time: new Date(sortedData[0].timestamp * 1000).toLocaleString()
                    } : 'none'
                });

                setVitalSigns(sortedData);
                calculateStatsSummary(sortedData);
            } else {
                throw new Error(data.message || 'Failed to fetch vital signs');
            }
        } catch (err) {
            console.error('Error fetching vital signs:', err);
            setError(err instanceof Error ? err.message : 'Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    const calculateStatsSummary = (data: VitalSign[]) => {
        if (data.length === 0) {
            setStatsSummary(null);
            return;
        }

        // ✅ Data is already sorted DESC, so data[0] is the latest
        const latestReading = data[0];

        const summary: StatsSummary = {
            avgHeartRate: Math.round(data.reduce((sum, item) => sum + item.heartRate, 0) / data.length),
            avgSystolic: Math.round(data.reduce((sum, item) => sum + item.systolicBP, 0) / data.length),
            avgDiastolic: Math.round(data.reduce((sum, item) => sum + item.diastolicBP, 0) / data.length),
            avgConfidence: Math.round(data.reduce((sum, item) => sum + item.confidence, 0) / data.length),
            totalReadings: data.length,
            lastReading: latestReading  // ✅ This is now guaranteed to be the latest
        };

        console.log('📊 Stats Summary:', {
            latest: {
                hr: latestReading.heartRate,
                bp: `${latestReading.systolicBP}/${latestReading.diastolicBP}`,
                time: new Date(latestReading.timestamp * 1000).toLocaleString()
            },
            averages: {
                hr: summary.avgHeartRate,
                systolic: summary.avgSystolic,
                diastolic: summary.avgDiastolic
            }
        });

        setStatsSummary(summary);
    };

    const getLineChartData = () => {
        if (!vitalSigns.length) return { labels: [], datasets: [] };

        let dataToUse = vitalSigns;
        let chartWidth = screenWidth - 40;

        if (chartViewMode === 'latest') {
            // ✅ Get latest 7 readings (already sorted DESC, so take first 7 and reverse for chart)
            dataToUse = vitalSigns.slice(0, 7).reverse();
        } else {
            // ✅ Reverse the entire sorted array for chronological chart display
            dataToUse = [...vitalSigns].reverse();
            const pointsPerScreen = 7;
            const minWidth = screenWidth - 40;
            const calculatedWidth = Math.max(minWidth, (dataToUse.length / pointsPerScreen) * minWidth);
            chartWidth = calculatedWidth;
        }

        const labels = dataToUse.map((item, index) => {
            if (chartViewMode === 'all' && dataToUse.length > 10) {
                const date = new Date(item.timestamp * 1000);
                return `${date.getMonth() + 1}/${date.getDate()}`;
            } else {
                return `R${index + 1}`;
            }
        });

        const heartRateData = dataToUse.map(item => Math.round(item.heartRate));
        const systolicData = dataToUse.map(item => Math.round(item.systolicBP));
        const diastolicData = dataToUse.map(item => Math.round(item.diastolicBP));

        return {
            labels,
            datasets: [
                {
                    data: heartRateData,
                    color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                    strokeWidth: 3
                },
                {
                    data: systolicData,
                    color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                    strokeWidth: 3
                },
                {
                    data: diastolicData,
                    color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`,
                    strokeWidth: 3
                }
            ],
            legend: ["Heart Rate (BPM)", "Systolic BP", "Diastolic BP"],
            chartWidth
        };
    };

    const getBarChartData = () => {
        if (!vitalSigns.length) return { labels: [], datasets: [{ data: [] }] };

        return {
            labels: vitalSigns.slice(-5).map((_, index) => `R${index + 1}`),
            datasets: [{
                data: vitalSigns.slice(-5).map(item => item.confidence)
            }]
        };
    };

    const getPieChartData = () => {
        if (!statsSummary) return [];

        return [
            {
                name: 'Heart Rate',
                population: statsSummary.avgHeartRate,
                color: '#8884d8',
                legendFontColor: '#7F7F7F',
                legendFontSize: 15,
            },
            {
                name: 'Systolic BP',
                population: statsSummary.avgSystolic,
                color: '#82ca9d',
                legendFontColor: '#7F7F7F',
                legendFontSize: 15,
            },
            {
                name: 'Diastolic BP',
                population: statsSummary.avgDiastolic,
                color: '#ffc658',
                legendFontColor: '#7F7F7F',
                legendFontSize: 15,
            }
        ];
    };

    const getHealthStatus = (heartRate: number, systolic: number, diastolic: number) => {
        if (systolic > 140 || diastolic > 90) return { status: 'High BP', color: '#ff4444' };
        if (systolic < 90 || diastolic < 60) return { status: 'Low BP', color: '#ff8800' };
        if (heartRate > 100) return { status: 'High HR', color: '#ff6600' };
        if (heartRate < 60) return { status: 'Low HR', color: '#ffaa00' };
        return { status: 'Normal', color: '#00cc66' };
    };

    const chartConfig = {
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
        propsForLabels: {
            fontSize: 10,
        },
        propsForVerticalLabels: {
            fontSize: 10,
        },
    };

    // Show authentication error if not authenticated
    if (!isAuthenticated) {
        return (
            <View style={styles.container}>
                <View style={styles.errorMessage}>
                    <Text style={styles.errorTitle}>Authentication Required</Text>
                    <Text style={styles.errorText}>Please log in to view your health statistics.</Text>
                </View>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingSpinner}>
                    <ActivityIndicator size="large" color="#2196f3" />
                    <Text style={styles.loadingText}>Loading statistics...</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.errorMessage}>
                    <Text style={styles.errorTitle}>Error Loading Statistics</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={fetchVitalSigns} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const lineChartData = getLineChartData();

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.statisticsHeader}>
                <Text style={styles.headerTitle}>Health Statistics Dashboard</Text>
                <View style={styles.timeRangeSelector}>
                    <TouchableOpacity
                        style={[styles.timeButton, timeRange === '7d' && styles.activeTimeButton]}
                        onPress={() => setTimeRange('7d')}
                    >
                        <Text style={[styles.timeButtonText, timeRange === '7d' && styles.activeTimeButtonText]}>
                            7 Days
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.timeButton, timeRange === '30d' && styles.activeTimeButton]}
                        onPress={() => setTimeRange('30d')}
                    >
                        <Text style={[styles.timeButtonText, timeRange === '30d' && styles.activeTimeButtonText]}>
                            30 Days
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.timeButton, timeRange === '90d' && styles.activeTimeButton]}
                        onPress={() => setTimeRange('90d')}
                    >
                        <Text style={[styles.timeButtonText, timeRange === '90d' && styles.activeTimeButtonText]}>
                            90 Days
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.timeButton, timeRange === 'all' && styles.activeTimeButton]}
                        onPress={() => setTimeRange('all')}
                    >
                        <Text style={[styles.timeButtonText, timeRange === 'all' && styles.activeTimeButtonText]}>
                            All Time
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats Summary */}
            {statsSummary && (
                <View style={styles.statsSummary}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Average Heart Rate</Text>
                        <Text style={styles.statValue}>{statsSummary.avgHeartRate} BPM</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Average Blood Pressure</Text>
                        <Text style={styles.statValue}>{statsSummary.avgSystolic}/{statsSummary.avgDiastolic}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Measurement Confidence</Text>
                        <Text style={styles.statValue}>{statsSummary.avgConfidence}%</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Readings</Text>
                        <Text style={styles.statValue}>{statsSummary.totalReadings}</Text>
                    </View>
                </View>
            )}

            {/* Latest Reading */}
            {statsSummary?.lastReading && (
                <View style={styles.currentStatus}>
                    <Text style={styles.sectionTitle}>Latest Reading</Text>
                    <View style={styles.statusCard}>
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusDate}>
                                {new Date(statsSummary.lastReading.timestamp * 1000).toLocaleString()}
                            </Text>
                            <View style={styles.vitalSigns}>
                                <Text style={styles.vitalSignText}>❤️ {statsSummary.lastReading.heartRate} BPM</Text>
                                <Text style={styles.vitalSignText}>🩺 {statsSummary.lastReading.systolicBP}/{statsSummary.lastReading.diastolicBP}</Text>
                                <Text style={styles.vitalSignText}>📊 {statsSummary.lastReading.confidence}% confidence</Text>
                            </View>
                        </View>
                        <Text
                            style={[
                                styles.healthStatus,
                                {
                                    color: getHealthStatus(
                                        statsSummary.lastReading.heartRate,
                                        statsSummary.lastReading.systolicBP,
                                        statsSummary.lastReading.diastolicBP
                                    ).color
                                }
                            ]}
                        >
                            {getHealthStatus(
                                statsSummary.lastReading.heartRate,
                                statsSummary.lastReading.systolicBP,
                                statsSummary.lastReading.diastolicBP
                            ).status}
                        </Text>
                    </View>
                </View>
            )}

            {/* Charts */}
            {vitalSigns.length > 0 ? (
                <View style={styles.chartsContainer}>
                    {/* Line Chart with Horizontal Scroll */}
                    <View style={styles.chartSection}>
                        <View style={styles.chartHeader}>
                            <Text style={styles.chartTitle}>Vital Signs Trends</Text>
                            <View style={styles.chartViewSelector}>
                                <TouchableOpacity
                                    style={[styles.viewButton, chartViewMode === 'latest' && styles.activeViewButton]}
                                    onPress={() => setChartViewMode('latest')}
                                >
                                    <Text style={[styles.viewButtonText, chartViewMode === 'latest' && styles.activeViewButtonText]}>
                                        Latest 7
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.viewButton, chartViewMode === 'all' && styles.activeViewButton]}
                                    onPress={() => setChartViewMode('all')}
                                >
                                    <Text style={[styles.viewButtonText, chartViewMode === 'all' && styles.activeViewButtonText]}>
                                        All Data
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Chart Info */}
                        <View style={styles.chartInfo}>
                            <Text style={styles.chartInfoText}>
                                Showing {chartViewMode === 'latest' ? 'latest 7' : 'all'} readings
                                {chartViewMode === 'all' && vitalSigns.length > 7 && ' (scroll horizontally)'}
                            </Text>
                        </View>

                        {/* Scrollable Chart Container */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={true}
                            contentContainerStyle={styles.chartScrollContainer}
                            style={styles.chartScrollView}
                        >
                            <LineChart
                                data={lineChartData}
                                width={lineChartData.chartWidth || screenWidth - 40}
                                height={250}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chart}
                                withVerticalLabels={true}
                                withHorizontalLabels={true}
                                withDots={true}
                                withInnerLines={true}
                                withOuterLines={true}
                                withShadow={false}
                                segments={4}
                            />
                        </ScrollView>

                        {/* Chart Legend */}
                        <View style={styles.chartLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: 'rgba(134, 65, 244, 1)' }]} />
                                <Text style={styles.legendText}>Heart Rate</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: 'rgba(255, 99, 132, 1)' }]} />
                                <Text style={styles.legendText}>Systolic BP</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendColor, { backgroundColor: 'rgba(75, 192, 192, 1)' }]} />
                                <Text style={styles.legendText}>Diastolic BP</Text>
                            </View>
                        </View>
                    </View>

                    {/* Bar Chart */}
                    <View style={styles.chartSection}>
                        <Text style={styles.chartTitle}>Confidence Levels (Latest 5)</Text>
                        <BarChart
                            data={getBarChartData()}
                            width={screenWidth - 40}
                            height={220}
                            chartConfig={chartConfig}
                            yAxisLabel=""
                            yAxisSuffix="%"
                            style={styles.chart}
                        />
                    </View>

                    {/* Pie Chart */}
                    {statsSummary && (
                        <View style={styles.chartSection}>
                            <Text style={styles.chartTitle}>Average Values Distribution</Text>
                            <PieChart
                                data={getPieChartData()}
                                width={screenWidth - 40}
                                height={220}
                                chartConfig={chartConfig}
                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                style={styles.chart}
                            />
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.noData}>
                    <Text style={styles.noDataTitle}>No Data Available</Text>
                    <Text style={styles.noDataText}>No vital signs data found for the selected time range.</Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    loadingSpinner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorMessage: {
        backgroundColor: '#ffebee',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        margin: 16,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#d32f2f',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#2196f3',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    statisticsHeader: {
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    timeRangeSelector: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    timeButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 4,
        alignItems: 'center',
    },
    activeTimeButton: {
        backgroundColor: '#2196f3',
    },
    timeButtonText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    activeTimeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    statsSummary: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
        justifyContent: 'space-between',
    },
    statCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        width: '48%',
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2196f3',
    },
    currentStatus: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    statusCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusInfo: {
        flex: 1,
    },
    statusDate: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    vitalSigns: {
        flexDirection: 'column',
    },
    vitalSignText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    healthStatus: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    chartsContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    chartSection: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    chartViewSelector: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
        padding: 2,
    },
    viewButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
    },
    activeViewButton: {
        backgroundColor: '#2196f3',
    },
    viewButtonText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    activeViewButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    chartInfo: {
        marginBottom: 12,
    },
    chartInfoText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    chartScrollView: {
        marginBottom: 12,
    },
    chartScrollContainer: {
        paddingRight: 20,
    },
    chart: {
        borderRadius: 8,
    },
    chartLegend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        color: '#666',
    },
    noData: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    noDataTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    noDataText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});

export default Statistic;