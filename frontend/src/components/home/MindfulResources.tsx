import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface MindfulResourcesProps {
    onSeeAllPress: () => void;
}

const MindfulResources = ({ onSeeAllPress }: MindfulResourcesProps) => {
    const [activeResourceIndex, setActiveResourceIndex] = useState(0);

    return (
        <>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mindful Resources</Text>
                <TouchableOpacity onPress={onSeeAllPress}>
                    <Text style={styles.seeAllLink}>See All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                onScroll={(event) => {
                    const contentOffsetX = event.nativeEvent.contentOffset.x;
                    const newIndex = Math.round(contentOffsetX / width);
                    setActiveResourceIndex(newIndex);
                }}
                scrollEventThrottle={16}
            >
                {[1, 2].map((num) => (
                    <View key={num} style={styles.resourceCard}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1454944338482-a69bb95894af' }}
                            style={styles.resourceImage}
                        />
                        <View style={styles.resourceContent}>
                            <Text style={styles.resourceCategory}>Mental Health</Text>
                            <Text style={styles.resourceTitle}>
                                Will meditation help you get out from the rat race?
                            </Text>
                            <View style={styles.resourceStats}>
                                <View style={styles.statItem}>
                                    <Ionicons name="eye-outline" size={14} color="#8B7B73" />
                                    <Text style={styles.statText}>5,241</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="heart-outline" size={14} color="#8B7B73" />
                                    <Text style={styles.statText}>987</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="chatbubble-outline" size={14} color="#8B7B73" />
                                    <Text style={styles.statText}>22</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.resourcePaginationContainer}>
                {[0, 1, 2, 3].map((index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            activeResourceIndex === index && styles.activeDot
                        ]}
                    />
                ))}
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
    seeAllLink: {
        fontSize: 14,
        color: '#8DAA6D',
    },
    resourceCard: {
        width: width - 40,
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    resourceImage: {
        width: '100%',
        height: 120,
        backgroundColor: '#F0F0F0',
    },
    resourceContent: {
        padding: 15,
    },
    resourceCategory: {
        fontSize: 13,
        color: '#8B7B73',
        marginBottom: 4,
    },
    resourceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 10,
    },
    resourceStats: {
        flexDirection: 'row',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    statText: {
        fontSize: 12,
        color: '#8B7B73',
        marginLeft: 3,
    },
    resourcePaginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#8DAA6D',
    },
});

export default MindfulResources;