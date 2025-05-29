import React, { useState, useContext, useEffect, useCallback } from 'react';
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
import axios from 'axios';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
const { width } = Dimensions.get('window');

interface MindfulResourcesProps { }

interface Author {
    name: string;
    image: string;
}

interface Resource {
    id: string;
    title: string;
    description: string;
    type: 'meditation' | 'sleep' | 'music' | 'article';
    category: string;
    coverImage: string;
    duration?: number;
    author: Author;
    isPremium: boolean;
    likes: number;
    views: number;
    rating: number;
    url?: string;
}

const MindfulResources = ({ }: MindfulResourcesProps) => {
    const [activeResourceIndex, setActiveResourceIndex] = useState(0);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NavigationProp>();
    const { userToken, userData } = useContext(AuthContext);

    // Helper function to categorize articles based on content
    const getCategoryFromContent = (content: string): string => {
        const lowerContent = content.toLowerCase();

        if (lowerContent.includes('stress') || lowerContent.includes('pressure') || lowerContent.includes('overwhelm')) {
            return 'Stress Relief';
        } else if (lowerContent.includes('anxiety') || lowerContent.includes('worry') || lowerContent.includes('panic')) {
            return 'Anxiety Help';
        } else if (lowerContent.includes('sleep') || lowerContent.includes('insomnia') || lowerContent.includes('rest')) {
            return 'Sleep';
        } else if (lowerContent.includes('focus') || lowerContent.includes('concentration') || lowerContent.includes('attention')) {
            return 'Focus';
        } else if (lowerContent.includes('meditation') || lowerContent.includes('mindful') || lowerContent.includes('zen')) {
            return 'Meditation';
        }

        return 'Mental Health';
    };

    // Helper function to generate wellness content
    const generateWellnessContent = (): Resource[] => {
        const wellnessArticles = [
            {
                id: 'wellness_stress_1',
                title: '10-Minute Daily Stress Relief Routine',
                description: 'A simple, science-backed routine you can do anywhere to reduce stress and increase calm in your daily life.',
                type: 'article' as const,
                category: 'Stress Relief',
                coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
                author: {
                    name: 'Dr. Sarah Johnson',
                    image: 'https://randomuser.me/api/portraits/women/44.jpg'
                },
                isPremium: false,
                likes: 342,
                views: 1876,
                rating: 4.8
            },
            {
                id: 'wellness_meditation_1',
                title: 'Mindfulness Meditation: A Beginner\'s Complete Guide',
                description: 'Start your meditation journey with this comprehensive guide to mindfulness practice and techniques.',
                type: 'article' as const,
                category: 'Meditation',
                coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
                author: {
                    name: 'Dr. Anna Patel',
                    image: 'https://randomuser.me/api/portraits/women/29.jpg'
                },
                isPremium: false,
                likes: 678,
                views: 3245,
                rating: 4.9
            },
            {
                id: 'wellness_sleep_1',
                title: 'The Perfect Sleep Environment: A Complete Guide',
                description: 'Transform your bedroom into a sleep sanctuary with these evidence-based optimization techniques.',
                type: 'article' as const,
                category: 'Sleep',
                coverImage: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55',
                author: {
                    name: 'Dr. Emily Rodriguez',
                    image: 'https://randomuser.me/api/portraits/women/67.jpg'
                },
                isPremium: false,
                likes: 523,
                views: 2876,
                rating: 4.9
            }
        ];

        return wellnessArticles;
    };

    // Fetch resources function
    const fetchResources = useCallback(async () => {
        if (!userToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('MindfulResources: Starting to fetch resources...');

            const allResources: Resource[] = [];

            // 1. FETCH FROM NEWS API (Real articles)
            try {
                const NEWS_API_KEY = 'd8f42abb753441b5a5627315c2d11f2b';
                const NEWS_API_BASE = 'https://newsapi.org/v2';

                console.log('MindfulResources: Fetching real articles from News API...');

                const response = await axios.get(`${NEWS_API_BASE}/everything`, {
                    params: {
                        q: 'mental health OR meditation OR stress relief OR anxiety help OR mindfulness OR wellness',
                        language: 'en',
                        sortBy: 'publishedAt',
                        pageSize: 10, // Limit for home page
                        apiKey: NEWS_API_KEY
                    }
                });

                if (response.data && response.data.articles && Array.isArray(response.data.articles)) {
                    const newsArticles: Resource[] = response.data.articles
                        .filter((article: any) => article.title && article.description && article.urlToImage)
                        .map((article: any, index: number) => ({
                            id: `news_${index}_${Date.now()}`,
                            title: article.title,
                            description: article.description || 'No description available',
                            type: 'article' as const,
                            category: getCategoryFromContent(article.title + ' ' + article.description),
                            coverImage: article.urlToImage || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
                            author: {
                                name: article.author || article.source?.name || 'Unknown Author',
                                image: 'https://randomuser.me/api/portraits/men/32.jpg'
                            },
                            isPremium: false,
                            likes: Math.floor(Math.random() * 500),
                            views: Math.floor(Math.random() * 2000),
                            rating: Math.random() * 2 + 3,
                            url: article.url
                        }));

                    allResources.push(...newsArticles);
                    console.log(`MindfulResources: Loaded ${newsArticles.length} articles from News API`);
                }
            } catch (newsError) {
                console.error('MindfulResources: News API failed:', newsError);
            }

            // 2. ADD CURATED WELLNESS CONTENT
            const wellnessContent = generateWellnessContent();
            allResources.push(...wellnessContent);
            console.log(`MindfulResources: Added ${wellnessContent.length} curated wellness articles`);

            // 3. SHUFFLE AND LIMIT FOR HOME PAGE
            const shuffledResources = allResources
                .sort(() => Math.random() - 0.5)
                .slice(0, 6); // Show only 6 articles on home page

            setResources(shuffledResources);
            console.log(`MindfulResources: Successfully loaded ${shuffledResources.length} articles for home page`);

        } catch (error) {
            console.error('MindfulResources: Error fetching resources:', error);
            // Fallback to wellness content only
            setResources(generateWellnessContent());
        } finally {
            setLoading(false);
        }
    }, [userToken]);

    // Load resources when component mounts
    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    // Refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (userToken) {
                fetchResources();
            }
        }, [fetchResources, userToken])
    );

    const handleSeeAllPress = () => {
        if (userToken) {
            navigation.navigate('ArticleSelection');
        } else {
            console.log('User not authenticated, redirect to sign in');
        }
    };

    const handleResourcePress = (resource: Resource) => {
        if (userToken) {
            if (resource.url && resource.id.startsWith('news_')) {
                // External news article - navigate to ArticleDetail with URL
                navigation.navigate('ArticleDetail', {
                    articleId: resource.id,
                    articleUrl: resource.url
                });
            } else {
                // Local wellness content
                navigation.navigate('ArticleDetail', {
                    articleId: resource.id
                });
            }
        } else {
            console.log('User not authenticated, redirect to sign in');
        }
    };

    // Show loading state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#8DAA6D" />
                <Text style={styles.loadingText}>Loading resources...</Text>
            </View>
        );
    }

    // Show message if no resources
    if (!userToken || resources.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.sectionTitle}>Mindful Resources</Text>
                <Text style={styles.emptyText}>
                    {!userToken ? 'Sign in to view resources' : 'No resources available'}
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
                {resources.map((resource, index) => (
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