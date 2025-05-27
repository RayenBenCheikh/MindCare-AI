import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { AuthContext } from '@/src/context/AuthContext';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'ArticleDetail'>;

// Types for API responses
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
    duration?: number; // in minutes
    author: Author;
    isPremium: boolean;
    likes: number;
    views: number;
    rating: number;
    url?: string; // For external articles
}

// Categories
const CATEGORIES = [
    { id: 'stress', name: 'Stress', color: '#BD8C61', icon: 'brain' },
    { id: 'anxiety', name: 'Anxiety', color: '#9E88B0', icon: 'virus' },
    { id: 'sleep', name: 'Sleep', color: '#6A8D73', icon: 'bed' },
    { id: 'focus', name: 'Focus', color: '#F6BD60', icon: 'target' },
    { id: 'meditation', name: 'Meditation', color: '#F28482', icon: 'meditation' },
];

const ArticleSelection: React.FC = () => {
    const { userToken, userData } = useContext(AuthContext);
    const [resources, setResources] = useState<Resource[]>([]);
    const [articles, setArticles] = useState<Resource[]>([]);
    const [courses, setCourses] = useState<Resource[]>([]);
    const [featuredResource, setFeaturedResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'resources' | 'articles' | 'courses'>('resources');

    const navigation = useNavigation<NavigationProp>();
    const windowWidth = Dimensions.get('window').width;

    // Helper function to shuffle array
    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Helper function to categorize articles based on content
    const getCategoryFromContent = (content: string): string => {
        const lowerContent = content.toLowerCase();

        if (lowerContent.includes('stress') || lowerContent.includes('pressure') || lowerContent.includes('overwhelm')) {
            return 'stress';
        } else if (lowerContent.includes('anxiety') || lowerContent.includes('worry') || lowerContent.includes('panic')) {
            return 'anxiety';
        } else if (lowerContent.includes('sleep') || lowerContent.includes('insomnia') || lowerContent.includes('rest')) {
            return 'sleep';
        } else if (lowerContent.includes('focus') || lowerContent.includes('concentration') || lowerContent.includes('attention')) {
            return 'focus';
        } else if (lowerContent.includes('meditation') || lowerContent.includes('mindful') || lowerContent.includes('zen')) {
            return 'meditation';
        }

        return 'general';
    };

    // Helper function to generate wellness content
    const generateWellnessContent = (): Resource[] => {
        const wellnessArticles = [
            // STRESS CATEGORY
            {
                id: 'wellness_stress_1',
                title: '10-Minute Daily Stress Relief Routine',
                description: 'A simple, science-backed routine you can do anywhere to reduce stress and increase calm in your daily life.',
                type: 'article' as const,
                category: 'stress',
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
                id: 'wellness_stress_2',
                title: 'Understanding Chronic Stress: Signs and Solutions',
                description: 'Learn to identify chronic stress patterns and discover effective, long-term strategies for stress management.',
                type: 'article' as const,
                category: 'stress',
                coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
                author: {
                    name: 'Dr. Michael Chen',
                    image: 'https://randomuser.me/api/portraits/men/55.jpg'
                },
                isPremium: true,
                likes: 289,
                views: 1543,
                rating: 4.7
            },
            // ANXIETY CATEGORY
            {
                id: 'wellness_anxiety_1',
                title: 'Breathing Techniques for Instant Anxiety Relief',
                description: 'Master these powerful breathing exercises to calm anxiety attacks and reduce overall anxiousness.',
                type: 'article' as const,
                category: 'anxiety',
                coverImage: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88',
                author: {
                    name: 'Dr. Lisa Thompson',
                    image: 'https://randomuser.me/api/portraits/women/33.jpg'
                },
                isPremium: false,
                likes: 456,
                views: 2234,
                rating: 4.9
            },
            {
                id: 'wellness_anxiety_2',
                title: 'Cognitive Behavioral Techniques for Anxiety',
                description: 'Evidence-based CBT strategies to challenge anxious thoughts and build emotional resilience.',
                type: 'article' as const,
                category: 'anxiety',
                coverImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
                author: {
                    name: 'Dr. Robert Kim',
                    image: 'https://randomuser.me/api/portraits/men/41.jpg'
                },
                isPremium: true,
                likes: 378,
                views: 1987,
                rating: 4.8
            },
            // SLEEP CATEGORY
            {
                id: 'wellness_sleep_1',
                title: 'The Perfect Sleep Environment: A Complete Guide',
                description: 'Transform your bedroom into a sleep sanctuary with these evidence-based optimization techniques.',
                type: 'article' as const,
                category: 'sleep',
                coverImage: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55',
                author: {
                    name: 'Dr. Emily Rodriguez',
                    image: 'https://randomuser.me/api/portraits/women/67.jpg'
                },
                isPremium: false,
                likes: 523,
                views: 2876,
                rating: 4.9
            },
            {
                id: 'wellness_sleep_2',
                title: 'Natural Sleep Aids: What Actually Works',
                description: 'Science-backed natural remedies for better sleep, from herbs to lifestyle changes.',
                type: 'article' as const,
                category: 'sleep',
                coverImage: 'https://images.unsplash.com/photo-1520052205864-92d242b3a76b',
                author: {
                    name: 'Dr. James Wilson',
                    image: 'https://randomuser.me/api/portraits/men/28.jpg'
                },
                isPremium: true,
                likes: 412,
                views: 2145,
                rating: 4.6
            },
            // MEDITATION CATEGORY
            {
                id: 'wellness_meditation_1',
                title: 'Mindfulness Meditation: A Beginner\'s Complete Guide',
                description: 'Start your meditation journey with this comprehensive guide to mindfulness practice and techniques.',
                type: 'article' as const,
                category: 'meditation',
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
                id: 'wellness_meditation_2',
                title: 'Advanced Meditation: Loving-Kindness Practice',
                description: 'Deepen your practice with loving-kindness meditation to cultivate compassion and emotional well-being.',
                type: 'article' as const,
                category: 'meditation',
                coverImage: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5',
                author: {
                    name: 'Dr. Thomas Lee',
                    image: 'https://randomuser.me/api/portraits/men/35.jpg'
                },
                isPremium: true,
                likes: 445,
                views: 2134,
                rating: 4.8
            }
        ];

        return wellnessArticles;
    };

    // Load mock data function
    const loadMockData = () => {
        console.log('Loading mock data...');
        const mockResources: Resource[] = [
            {
                id: '1',
                title: '5 Proven Techniques to Reduce Daily Stress',
                description: 'Learn evidence-based methods to manage stress effectively in your daily life, from breathing exercises to time management strategies.',
                type: 'article',
                category: 'stress',
                coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
                author: {
                    name: 'Dr. Sarah Johnson',
                    image: 'https://randomuser.me/api/portraits/women/44.jpg'
                },
                isPremium: false,
                likes: 256,
                views: 1204,
                rating: 4.8
            },
            {
                id: '2',
                title: 'Managing Anxiety: A Comprehensive Guide',
                description: 'Discover effective strategies to cope with anxiety, including mindfulness techniques and cognitive behavioral approaches.',
                type: 'article',
                category: 'anxiety',
                coverImage: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88',
                author: {
                    name: 'Dr. Michael Roberts',
                    image: 'https://randomuser.me/api/portraits/men/32.jpg'
                },
                isPremium: false,
                likes: 342,
                views: 2048,
                rating: 4.9
            },
            {
                id: '3',
                title: 'The Science of Better Sleep',
                description: 'Understand sleep cycles and learn how to optimize your sleep environment for better rest and recovery.',
                type: 'article',
                category: 'sleep',
                coverImage: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55',
                author: {
                    name: 'Dr. Emily Rodriguez',
                    image: 'https://randomuser.me/api/portraits/women/67.jpg'
                },
                isPremium: true,
                likes: 189,
                views: 964,
                rating: 4.7
            },
            {
                id: '4',
                title: 'Improving Focus in a Distracted World',
                description: 'Learn techniques to enhance concentration and maintain focus despite constant digital distractions.',
                type: 'article',
                category: 'focus',
                coverImage: 'https://images.unsplash.com/photo-1493836512294-502baa1986e2',
                author: {
                    name: 'Dr. David Kim',
                    image: 'https://randomuser.me/api/portraits/men/45.jpg'
                },
                isPremium: false,
                likes: 298,
                views: 1567,
                rating: 4.6
            },
            {
                id: '5',
                title: 'Meditation for Beginners: Getting Started',
                description: 'A complete guide to starting your meditation practice, with simple techniques and common misconceptions addressed.',
                type: 'article',
                category: 'meditation',
                coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
                author: {
                    name: 'Dr. Lisa Thompson',
                    image: 'https://randomuser.me/api/portraits/women/55.jpg'
                },
                isPremium: false,
                likes: 445,
                views: 2234,
                rating: 4.9
            }
        ];

        setResources(mockResources);
        setArticles(mockResources.filter(item => item.type === 'article'));
        setCourses([]);
        setFeaturedResource(mockResources[0]);
        console.log('Mock data loaded:', mockResources.length, 'articles');
    };

    // Updated fetchResources function
    const fetchResources = useCallback(async () => {
        console.log('fetchResources called, userToken:', !!userToken);

        if (!userToken) {
            console.log('No user token available, loading mock data');
            loadMockData();
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            setLoading(true);
            console.log('Starting to fetch resources...');

            const allResources: Resource[] = [];

            // 1. FETCH FROM NEWS API (Real articles)
            try {
                const NEWS_API_KEY = 'd8f42abb753441b5a5627315c2d11f2b';
                const NEWS_API_BASE = 'https://newsapi.org/v2';

                console.log('Fetching real articles from News API...');

                const response = await axios.get(`${NEWS_API_BASE}/everything`, {
                    params: {
                        q: 'mental health OR meditation OR stress relief OR anxiety help OR mindfulness OR wellness',
                        language: 'en',
                        sortBy: 'publishedAt',
                        pageSize: 15, // Reduced to make room for wellness content
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
                            url: article.url // External URL for browsing
                        }));

                    allResources.push(...newsArticles);
                    console.log(`Loaded ${newsArticles.length} articles from News API`);
                }
            } catch (newsError) {
                console.error('News API failed:', newsError);
            }

            // 2. ADD CURATED WELLNESS CONTENT (Local content)
            const wellnessContent = generateWellnessContent();
            allResources.push(...wellnessContent);
            console.log(`Added ${wellnessContent.length} curated wellness articles`);

            // 3. COMBINE AND SORT ALL CONTENT
            if (allResources.length > 0) {
                // Shuffle content to mix news and wellness articles
                const shuffledResources = shuffleArray(allResources);

                const articlesData = shuffledResources.filter(item => item.type === 'article');
                const featured = shuffledResources.find(item => item.category === 'meditation') || shuffledResources[0];

                setResources(shuffledResources);
                setArticles(articlesData);
                setCourses([]); // You can add meditation courses later
                setFeaturedResource(featured);

                console.log(`Successfully loaded ${allResources.length} total articles (News + Wellness)`);
            } else {
                console.log('No articles loaded, using mock data');
                loadMockData();
            }

        } catch (error) {
            console.error('Error fetching combined content:', error);
            loadMockData();
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userToken, userData]);

    // Handle resource press
    const handleResourcePress = (resource: Resource) => {
        if (resource.url && resource.id.startsWith('news_')) {
            // External news article - open in browser
            console.log('Opening external article:', resource.url);
            Linking.openURL(resource.url);
        } else {
            // Local wellness content - navigate to detail page with articleId
            navigation.navigate('ArticleDetail', { articleId: resource.id });
        }
    };

    // Filter resources based on search query and category
    const filterResources = (items: Resource[]) => {
        return items.filter(item => {
            const matchesSearch = searchQuery === '' ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = selectedCategory === null ||
                item.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    };

    // Get content based on active tab
    const getActiveContent = () => {
        switch (activeTab) {
            case 'articles':
                return filterResources(articles);
            case 'courses':
                return filterResources(courses);
            default:
                return filterResources(resources);
        }
    };

    // Handle refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchResources();
    }, [fetchResources]);

    // Render category item
    const renderCategory = ({ item }: { item: typeof CATEGORIES[0] }) => (
        <TouchableOpacity
            style={[
                styles.categoryButton,
                { backgroundColor: item.color },
                selectedCategory === item.id && styles.categorySelected
            ]}
            onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
        >
            <Icon name={item.icon} size={18} color="#FFF" />
            <Text style={styles.categoryText}>{item.name}</Text>
        </TouchableOpacity>
    );

    // Render resource item
    const renderResourceItem = ({ item }: { item: Resource }) => (
        <TouchableOpacity
            style={styles.resourceCard}
            onPress={() => handleResourcePress(item)}
        >
            <Image
                source={{ uri: item.coverImage }}
                style={styles.resourceImage}
                resizeMode="cover"
            />

            <View style={styles.resourceInfo}>
                <Text style={styles.resourceTitle} numberOfLines={2}>
                    {item.title}
                </Text>

                <View style={styles.authorRow}>
                    <Image
                        source={{ uri: item.author.image }}
                        style={styles.authorImage}
                    />
                    <Text style={styles.authorName}>By {item.author.name}</Text>
                </View>

                <View style={styles.statsRow}>
                    <Text style={styles.statText}>⭐ {item.rating.toFixed(1)}</Text>
                    <Text style={styles.statText}>👁️ {item.views}</Text>
                    <Text style={styles.statText}>❤️ {item.likes}</Text>
                    {item.duration && <Text style={styles.statText}>⏱️ {item.duration}m</Text>}
                </View>

                {item.isPremium && (
                    <View style={styles.premiumBadge}>
                        <Text style={styles.premiumText}>PRO</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    // Featured resource component
    const FeaturedResourceComponent = () => (
        featuredResource ? (
            <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => handleResourcePress(featuredResource)}
            >
                <Image
                    source={{ uri: featuredResource.coverImage }}
                    style={styles.featuredImage}
                    resizeMode="cover"
                />

                <View style={styles.featuredGradient}>
                    <Text style={styles.featuredLabel}>Featured Resource</Text>
                    <Text style={styles.featuredTitle}>{featuredResource.title}</Text>
                    <View style={styles.featuredAuthor}>
                        <Image
                            source={{ uri: featuredResource.author.image }}
                            style={styles.featuredAuthorImage}
                        />
                        <Text style={styles.featuredAuthorName}>By {featuredResource.author.name}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        ) : null
    );

    // Tab navigation component
    const TabNavigation = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'resources' && styles.activeTab]}
                onPress={() => setActiveTab('resources')}
            >
                <Text style={[styles.tabText, activeTab === 'resources' && styles.activeTabText]}>All</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tab, activeTab === 'articles' && styles.activeTab]}
                onPress={() => setActiveTab('articles')}
            >
                <Text style={[styles.tabText, activeTab === 'articles' && styles.activeTabText]}>Articles</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tab, activeTab === 'courses' && styles.activeTab]}
                onPress={() => setActiveTab('courses')}
            >
                <Text style={[styles.tabText, activeTab === 'courses' && styles.activeTabText]}>Courses</Text>
            </TouchableOpacity>
        </View>
    );

    // Initial data fetch when component mounts or token changes
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

    // Check authentication
    if (!userToken) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.authRequiredContainer}>
                    <Icon name="account-alert" size={64} color="#888" />
                    <Text style={styles.authRequiredTitle}>Authentication Required</Text>
                    <Text style={styles.authRequiredText}>
                        Please sign in to access mindful resources
                    </Text>
                    <TouchableOpacity
                        style={styles.signInButton}
                        onPress={() => navigation.navigate('SignIn' as any)}
                    >
                        <Text style={styles.signInButtonText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6A8D73" />
                <Text style={styles.loadingText}>Loading resources...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Mindful Resources</Text>

                <View style={styles.searchContainer}>
                    <Icon name="magnify" size={20} color="#888" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for resources..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Icon name="close" size={18} color="#888" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={getActiveContent()}
                renderItem={renderResourceItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                numColumns={1}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#6A8D73']}
                    />
                }
                ListHeaderComponent={
                    <>
                        <FeaturedResourceComponent />

                        <View style={styles.categoryContainer}>
                            <FlatList
                                data={CATEGORIES}
                                renderItem={renderCategory}
                                keyExtractor={item => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                            />
                        </View>

                        <TabNavigation />
                    </>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="book-open-variant" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No resources found</Text>
                        <Text style={styles.emptySubtext}>
                            Try changing your search or filter
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        padding: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    categoryContainer: {
        marginVertical: 16,
        paddingHorizontal: 16,
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
    },
    categorySelected: {
        borderWidth: 2,
        borderColor: '#000',
    },
    categoryText: {
        color: '#FFF',
        fontWeight: '600',
        marginLeft: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        marginVertical: 8,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    tab: {
        paddingVertical: 12,
        marginRight: 24,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#6A8D73',
    },
    tabText: {
        fontSize: 16,
        color: '#888',
    },
    activeTabText: {
        color: '#6A8D73',
        fontWeight: '600',
    },
    listContainer: {
        paddingBottom: 20,
    },
    resourceCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    resourceImage: {
        width: 100,
        height: 120,
    },
    resourceInfo: {
        flex: 1,
        padding: 12,
    },
    resourceTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    authorImage: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 8,
    },
    authorName: {
        fontSize: 14,
        color: '#666',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    statText: {
        fontSize: 12,
        color: '#888',
        marginRight: 12,
    },
    premiumBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
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
    featuredCard: {
        height: 200,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    featuredImage: {
        width: '100%',
        height: '100%',
    },
    featuredGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    featuredLabel: {
        color: '#FFF',
        fontSize: 12,
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    featuredTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 4,
    },
    featuredAuthor: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featuredAuthorImage: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 8,
    },
    featuredAuthorName: {
        color: '#FFF',
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#888',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 8,
        textAlign: 'center',
    },
    authRequiredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    authRequiredTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    authRequiredText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    signInButton: {
        backgroundColor: '#6A8D73',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    signInButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ArticleSelection;