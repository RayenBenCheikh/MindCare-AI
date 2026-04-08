import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { AuthContext } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fetchNewsArticles, generateWellnessContent, Resource } from '@/src/constants/ResourceHelPers';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
const { width } = Dimensions.get('window');

const MindfulResources = () => {
    const [activeResourceIndex, setActiveResourceIndex] = useState(0);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NavigationProp>();
    const { userToken } = useContext(AuthContext);

    const fetchResources = useCallback(async () => {
        if (!userToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const allResources: Resource[] = [];

            // ✅ Fetch health-filtered news articles
            console.log('🔍 Fetching health-related news articles...');
            const newsArticles = await fetchNewsArticles();
            console.log(`✅ Found ${newsArticles.length} health articles`);
            allResources.push(...newsArticles);

            // Add wellness content
            const wellnessContent = generateWellnessContent();
            console.log(`✅ Added ${wellnessContent.length} wellness articles`);
            allResources.push(...wellnessContent);

            // Shuffle and limit for home page
            const shuffledResources = allResources
                .sort(() => Math.random() - 0.5)
                .slice(0, 6);

            console.log(`📱 Displaying ${shuffledResources.length} total resources on home`);
            setResources(shuffledResources);
        } catch (error) {
            console.error('❌ Error fetching resources:', error);
            // Fallback to wellness content only
            setResources(generateWellnessContent());
        } finally {
            setLoading(false);
        }
    }, [userToken]);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    useFocusEffect(
        useCallback(() => {
            if (userToken) fetchResources();
        }, [fetchResources, userToken])
    );

    const handleSeeAllPress = () => {
        if (userToken) navigation.navigate('ArticleSelection');
    };

    const handleResourcePress = (resource: Resource) => {
        if (!userToken) return;

        navigation.navigate('ArticleDetail', {
            articleId: resource.id,
            articleUrl: resource.url
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#8DAA6D" />
                <Text style={styles.loadingText}>Loading health resources...</Text>
            </View>
        );
    }

    if (!userToken || resources.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.sectionTitle}>Mindful Resources</Text>
                <Text style={styles.emptyText}>
                    {!userToken ? 'Sign in to view resources' : 'No health resources available'}
                </Text>
            </View>
        );
    }

    return (
        <>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mindful Resources</Text>
                <TouchableOpacity onPress={handleSeeAllPress}>
                    <Text style={styles.seeAllLink}>See All ({resources.length}+)</Text>
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
                {resources.map((resource) => (
                    <TouchableOpacity
                        key={resource.id}
                        style={styles.resourceCard}
                        onPress={() => handleResourcePress(resource)}
                    >
                        <Image
                            source={{ uri: resource.coverImage }}
                            style={styles.resourceImage}
                            resizeMode="cover"
                        />
                        <View style={styles.resourceContent}>
                            <Text style={styles.resourceCategory}>{resource.category}</Text>
                            <Text style={styles.resourceTitle} numberOfLines={2}>
                                {resource.title}
                            </Text>
                            <View style={styles.resourceStats}>
                                <View style={styles.statItem}>
                                    <Ionicons name="eye-outline" size={14} color="#8B7B73" />
                                    <Text style={styles.statText}>{resource.views.toLocaleString()}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="heart-outline" size={14} color="#8B7B73" />
                                    <Text style={styles.statText}>{resource.likes.toLocaleString()}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="star-outline" size={14} color="#8B7B73" />
                                    <Text style={styles.statText}>{resource.rating.toFixed(1)}</Text>
                                </View>
                            </View>
                            {resource.isPremium && (
                                <View style={styles.premiumBadge}>
                                    <Text style={styles.premiumText}>PRO</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.resourcePaginationContainer}>
                {resources.map((_, index) => (
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
        position: 'relative',
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
        lineHeight: 20,
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
    loadingContainer: {
        paddingHorizontal: 20,
        paddingVertical: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 8,
        color: '#8B7B73',
        fontSize: 14,
    },
    emptyContainer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    emptyText: {
        color: '#8B7B73',
        fontSize: 14,
        marginTop: 8,
    },
    premiumBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#F6BD60',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    premiumText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFF',
    },
});

export default MindfulResources;