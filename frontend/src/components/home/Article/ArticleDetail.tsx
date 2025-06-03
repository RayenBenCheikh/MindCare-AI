import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Share,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HTML from 'react-native-render-html';
import { AuthContext } from '@/src/context/AuthContext';

interface ArticleDetailProps {
    route: {
        params: {
            articleId: string;
            articleUrl?: string;
        }
    }
}

interface ArticleDetail {
    _id: string;
    title: string;
    content: string;
    coverImage?: string;
    category: string;
    author: {
        name: string;
        image?: string;
    };
    isPremium?: boolean;
    previewContent?: string;
    rating?: number;
    views?: number;
    publishDate: string;
    readTime?: number; // minutes
    isBookmarked: boolean;
    isLiked: boolean;
    createdAt: string;
    updatedAt: string;
    url?: string; // For external articles
}

const ArticleDetail: React.FC = () => {
    const route = useRoute();
    const { articleId, articleUrl } = route.params as {
        articleId: string;
        articleUrl?: string;
    };
    const navigation = useNavigation();


    // Get authenticated user data
    const { userToken, userData } = useContext(AuthContext);

    const [article, setArticle] = useState<ArticleDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const windowWidth = Dimensions.get('window').width;

    // Base URL for your local API
    const API_BASE_URL = 'http://127.0.0.1:5002/api';

    // Helper function to generate article content based on ID
    const getArticleContent = (id: string): ArticleDetail => {
        // Check if it's a wellness article (local content)
        if (id.startsWith('wellness_')) {
            return getWellnessArticleContent(id);
        }

        // Default mock article
        return {
            _id: id,
            title: 'Understanding Mental Wellness: A Complete Guide',
            content: `
                <h2>Introduction to Mental Wellness</h2>
                <p>Mental wellness is a fundamental aspect of our overall health that encompasses our emotional, psychological, and social well-being. It affects how we think, feel, and act, and it plays a crucial role in how we handle stress, relate to others, and make healthy choices.</p>
                
                <h2>Key Components of Mental Wellness</h2>
                <p>Mental wellness involves several interconnected components:</p>
                <ul>
                    <li><strong>Emotional regulation:</strong> The ability to manage and express emotions in healthy ways</li>
                    <li><strong>Stress management:</strong> Developing coping strategies for life's challenges</li>
                    <li><strong>Social connections:</strong> Building and maintaining meaningful relationships</li>
                    <li><strong>Self-awareness:</strong> Understanding your thoughts, emotions, and behaviors</li>
                </ul>
                
                <h2>Practical Strategies for Better Mental Health</h2>
                <p>Here are some evidence-based approaches to improve your mental wellness:</p>
                
                <h3>1. Mindfulness and Meditation</h3>
                <p>Regular mindfulness practice can help reduce anxiety, improve focus, and increase emotional resilience. Start with just 5-10 minutes of daily meditation.</p>
                
                <h3>2. Physical Exercise</h3>
                <p>Physical activity releases endorphins, which are natural mood boosters. Aim for at least 30 minutes of moderate exercise most days of the week.</p>
                
                <h3>3. Quality Sleep</h3>
                <p>Good sleep hygiene is essential for mental health. Establish a consistent sleep schedule and create a relaxing bedtime routine.</p>
                
                <h3>4. Healthy Nutrition</h3>
                <p>A balanced diet rich in omega-3 fatty acids, whole grains, and fresh fruits and vegetables can support brain health and mood stability.</p>
                
                <h2>When to Seek Professional Help</h2>
                <p>It's important to recognize when professional support might be beneficial. Consider reaching out to a mental health professional if you experience:</p>
                <ul>
                    <li>Persistent feelings of sadness or hopelessness</li>
                    <li>Difficulty managing daily responsibilities</li>
                    <li>Changes in sleep or appetite patterns</li>
                    <li>Withdrawal from social activities</li>
                    <li>Substance use as a coping mechanism</li>
                </ul>
                
                <h2>Conclusion</h2>
                <p>Mental wellness is a journey, not a destination. By incorporating these strategies into your daily life and being mindful of your mental health needs, you can build resilience and improve your overall quality of life. Remember, seeking help is a sign of strength, not weakness.</p>
            `,
            coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
            category: 'mental-health',
            author: {
                name: 'Dr. Sarah Johnson',
                image: 'https://randomuser.me/api/portraits/women/44.jpg'
            },
            isPremium: false,
            rating: 4.8,
            views: 1204,
            publishDate: new Date().toISOString().split('T')[0],
            readTime: 8,
            isBookmarked: false,
            isLiked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    };

    // Generate wellness article content
    const getWellnessArticleContent = (id: string): ArticleDetail => {
        const wellnessArticles: { [key: string]: ArticleDetail } = {
            'wellness_stress_1': {
                _id: id,
                title: '10-Minute Daily Stress Relief Routine',
                content: `
                    <h2>Quick and Effective Stress Relief</h2>
                    <p>In today's fast-paced world, stress has become an inevitable part of our daily lives. However, with the right techniques, you can manage stress effectively in just 10 minutes a day.</p>
                    
                    <h2>The 10-Minute Routine</h2>
                    
                    <h3>Minutes 1-3: Deep Breathing Exercise</h3>
                    <p>Start with the 4-7-8 breathing technique:</p>
                    <ul>
                        <li>Inhale through your nose for 4 counts</li>
                        <li>Hold your breath for 7 counts</li>
                        <li>Exhale through your mouth for 8 counts</li>
                        <li>Repeat this cycle 4 times</li>
                    </ul>
                    
                    <h3>Minutes 4-6: Progressive Muscle Relaxation</h3>
                    <p>Systematically tense and release different muscle groups:</p>
                    <ul>
                        <li>Start with your toes and work your way up</li>
                        <li>Tense each muscle group for 5 seconds</li>
                        <li>Release and notice the difference</li>
                        <li>Focus on the sensation of relaxation</li>
                    </ul>
                    
                    <h3>Minutes 7-10: Mindful Visualization</h3>
                    <p>Close your eyes and imagine a peaceful, safe place:</p>
                    <ul>
                        <li>Engage all your senses in this visualization</li>
                        <li>Notice colors, sounds, smells, and textures</li>
                        <li>Allow yourself to feel completely relaxed</li>
                        <li>Stay in this peaceful state for the remaining time</li>
                    </ul>
                    
                    <h2>Science Behind the Routine</h2>
                    <p>This routine combines three evidence-based stress reduction techniques:</p>
                    <ul>
                        <li><strong>Controlled breathing:</strong> Activates the parasympathetic nervous system</li>
                        <li><strong>Progressive muscle relaxation:</strong> Reduces physical tension</li>
                        <li><strong>Visualization:</strong> Calms the mind and reduces cortisol levels</li>
                    </ul>
                    
                    <h2>Tips for Success</h2>
                    <p>To get the most out of this routine:</p>
                    <ul>
                        <li>Practice at the same time each day</li>
                        <li>Find a quiet, comfortable space</li>
                        <li>Turn off distractions like phones or TV</li>
                        <li>Be patient with yourself as you learn</li>
                        <li>Consistency is more important than perfection</li>
                    </ul>
                `,
                coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
                category: 'stress',
                author: {
                    name: 'Dr. Sarah Johnson',
                    image: 'https://randomuser.me/api/portraits/women/44.jpg'
                },
                isPremium: false,
                rating: 4.8,
                views: 1876,
                publishDate: '2024-01-15',
                readTime: 6,
                isBookmarked: false,
                isLiked: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            'wellness_anxiety_1': {
                _id: id,
                title: 'Breathing Techniques for Instant Anxiety Relief',
                content: `
                    <h2>Understanding Anxiety and Breathing</h2>
                    <p>When we're anxious, our breathing becomes shallow and rapid, which can actually increase feelings of panic. Learning proper breathing techniques can help break this cycle and provide immediate relief.</p>
                    
                    <h2>The Box Breathing Technique</h2>
                    <p>Also known as "square breathing," this technique is used by Navy SEALs to stay calm under pressure:</p>
                    <ol>
                        <li>Breathe in through your nose for 4 counts</li>
                        <li>Hold your breath for 4 counts</li>
                        <li>Exhale through your mouth for 4 counts</li>
                        <li>Hold empty for 4 counts</li>
                        <li>Repeat for 5-10 cycles</li>
                    </ol>
                    
                    <h2>The 5-5-5 Breathing Method</h2>
                    <p>Perfect for beginners or when you need quick relief:</p>
                    <ul>
                        <li>Inhale slowly for 5 seconds</li>
                        <li>Hold for 5 seconds</li>
                        <li>Exhale slowly for 5 seconds</li>
                        <li>Repeat until you feel calmer</li>
                    </ul>
                    
                    <h2>Diaphragmatic Breathing</h2>
                    <p>This technique helps you breathe more efficiently:</p>
                    <ol>
                        <li>Place one hand on your chest, one on your belly</li>
                        <li>Breathe in slowly through your nose</li>
                        <li>Feel your belly expand while your chest stays relatively still</li>
                        <li>Exhale slowly through pursed lips</li>
                        <li>Practice for 5-10 minutes daily</li>
                    </ol>
                    
                    <h2>Emergency Breathing for Panic Attacks</h2>
                    <p>When experiencing a panic attack, try this technique:</p>
                    <ul>
                        <li>Breathe in through your nose for 3 counts</li>
                        <li>Hold for 3 counts</li>
                        <li>Breathe out through your mouth for 6 counts</li>
                        <li>Focus only on counting and breathing</li>
                        <li>Continue until the panic subsides</li>
                    </ul>
                    
                    <h2>Why These Techniques Work</h2>
                    <p>Controlled breathing:</p>
                    <ul>
                        <li>Activates the vagus nerve</li>
                        <li>Reduces heart rate and blood pressure</li>
                        <li>Increases oxygen flow to the brain</li>
                        <li>Signals the body to relax</li>
                        <li>Interrupts the fight-or-flight response</li>
                    </ul>
                `,
                coverImage: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88',
                category: 'anxiety',
                author: {
                    name: 'Dr. Lisa Thompson',
                    image: 'https://randomuser.me/api/portraits/women/33.jpg'
                },
                isPremium: false,
                rating: 4.9,
                views: 2234,
                publishDate: '2024-01-20',
                readTime: 7,
                isBookmarked: false,
                isLiked: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            'wellness_meditation_1': {
                _id: id,
                title: 'Mindfulness Meditation: A Beginner\'s Complete Guide',
                content: `
                    <h2>What is Mindfulness Meditation?</h2>
                    <p>Mindfulness meditation is the practice of paying attention to the present moment without judgment. It's about observing your thoughts, feelings, and sensations as they arise, without getting caught up in them.</p>
                    
                    <h2>Getting Started: Your First Session</h2>
                    <p>For your first meditation session:</p>
                    <ol>
                        <li><strong>Find a quiet space:</strong> Choose a place where you won't be disturbed</li>
                        <li><strong>Sit comfortably:</strong> Use a chair or cushion, keep your back straight</li>
                        <li><strong>Set a timer:</strong> Start with just 5-10 minutes</li>
                        <li><strong>Close your eyes:</strong> Or soften your gaze downward</li>
                        <li><strong>Focus on your breath:</strong> Notice the sensation of breathing</li>
                    </ol>
                    
                    <h2>Basic Mindfulness Techniques</h2>
                    
                    <h3>Breath Awareness</h3>
                    <p>The foundation of mindfulness meditation:</p>
                    <ul>
                        <li>Focus on the sensation of breath entering and leaving your nostrils</li>
                        <li>When your mind wanders, gently return to the breath</li>
                        <li>Don't judge yourself for getting distracted</li>
                        <li>Each return to the breath is a moment of mindfulness</li>
                    </ul>
                    
                    <h3>Body Scan</h3>
                    <p>A technique to develop body awareness:</p>
                    <ol>
                        <li>Start at the top of your head</li>
                        <li>Slowly move your attention down through your body</li>
                        <li>Notice any sensations without trying to change them</li>
                        <li>Spend 30 seconds to 1 minute on each body part</li>
                        <li>End at your toes</li>
                    </ol>
                    
                    <h3>Loving-Kindness Meditation</h3>
                    <p>Cultivate compassion for yourself and others:</p>
                    <ul>
                        <li>Start by sending kind wishes to yourself</li>
                        <li>Extend these wishes to loved ones</li>
                        <li>Include neutral people in your life</li>
                        <li>Finally, include difficult people</li>
                        <li>Use phrases like "May you be happy, may you be peaceful"</li>
                    </ul>
                    
                    <h2>Common Challenges and Solutions</h2>
                    
                    <h3>Mind Wandering</h3>
                    <p><strong>Challenge:</strong> "My mind won't stop thinking!"</p>
                    <p><strong>Solution:</strong> This is normal! The goal isn't to stop thinking, but to notice when you're thinking and gently return to your focus point.</p>
                    
                    <h3>Physical Discomfort</h3>
                    <p><strong>Challenge:</strong> "I can't sit still!"</p>
                    <p><strong>Solution:</strong> Adjust your position as needed. You can meditate in a chair, lying down, or even walking.</p>
                    
                    <h3>Feeling Restless</h3>
                    <p><strong>Challenge:</strong> "I feel anxious when I try to meditate."</p>
                    <p><strong>Solution:</strong> Start with shorter sessions (2-3 minutes) and gradually increase. Try guided meditations first.</p>
                    
                    <h2>Building a Regular Practice</h2>
                    <p>Tips for consistency:</p>
                    <ul>
                        <li><strong>Same time, same place:</strong> Create a routine</li>
                        <li><strong>Start small:</strong> 5 minutes is better than 0 minutes</li>
                        <li><strong>Use apps or guides:</strong> Guided meditations can help beginners</li>
                        <li><strong>Be patient:</strong> Benefits develop over time</li>
                        <li><strong>Track your practice:</strong> Keep a meditation journal</li>
                    </ul>
                    
                    <h2>Benefits You Can Expect</h2>
                    <p>Regular mindfulness meditation can lead to:</p>
                    <ul>
                        <li>Reduced stress and anxiety</li>
                        <li>Improved focus and concentration</li>
                        <li>Better emotional regulation</li>
                        <li>Enhanced self-awareness</li>
                        <li>Improved sleep quality</li>
                        <li>Greater compassion and empathy</li>
                        <li>Lower blood pressure</li>
                        <li>Strengthened immune system</li>
                    </ul>
                `,
                coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
                category: 'meditation',
                author: {
                    name: 'Dr. Anna Patel',
                    image: 'https://randomuser.me/api/portraits/women/29.jpg'
                },
                isPremium: false,
                rating: 4.9,
                views: 3245,
                publishDate: '2024-01-10',
                readTime: 12,
                isBookmarked: false,
                isLiked: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        };

        return wellnessArticles[id] || getArticleContent('default');
    };

    // Fetch article details function
    const fetchArticleDetail = useCallback(async () => {
        if (!userToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Check if it's an external news article with URL
            if (articleId.startsWith('news_') && articleUrl) {
                // For external articles, we might not have full content
                // Show an error or redirect to external URL
                setError('This article is available on an external website');
                setLoading(false);
                return;
            }

            // For local wellness content, get the article content
            const articleContent = getArticleContent(articleId);
            setArticle(articleContent);

            // Check if user has premium access
            setIsPremium(userData?.isPremium || false);

        } catch (error) {
            console.error('Error fetching article:', error);
            setError('Failed to load article. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [articleId, articleUrl, userToken, userData]);

    // Share the article
    const handleShare = async () => {
        if (!article) return;

        try {
            await Share.share({
                message: `Check out this great article: ${article.title}`,
                title: article.title,
            });
        } catch (error) {
            console.error('Error sharing article:', error);
        }
    };

    // Toggle bookmark status
    const toggleBookmark = () => {
        if (!article) return;
        setArticle(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
        // TODO: Call API to save bookmark status
    };

    // Toggle like status
    const toggleLike = () => {
        if (!article) return;
        setArticle(prev => prev ? { ...prev, isLiked: !prev.isLiked } : null);
        // TODO: Call API to save like status
    };

    // Initial data fetch
    useEffect(() => {
        fetchArticleDetail();
    }, [fetchArticleDetail]);

    if (error || !article) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="alert-circle-outline" size={64} color="#F28482" />
                <Text style={styles.errorText}>{error || 'Article not found'}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchArticleDetail}
                >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
                {articleId.startsWith('news_') && articleUrl && (
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: '#007AFF', marginTop: 12 }]}
                        onPress={() => {
                            Linking.openURL(articleUrl);
                        }}
                    >
                        <Text style={styles.retryButtonText}>Read on Original Site</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6A8D73" />
                <Text style={styles.loadingText}>Loading article...</Text>
            </View>
        );
    }

    if (error || !article) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="alert-circle-outline" size={64} color="#F28482" />
                <Text style={styles.errorText}>{error || 'Article not found'}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchArticleDetail}
                >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
                {articleId.startsWith('news_') && (
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: '#007AFF', marginTop: 12 }]}
                        onPress={() => {
                            // In a real app, you'd store the external URL and open it here
                            Linking.openURL('https://news.google.com');
                        }}
                    >
                        <Text style={styles.retryButtonText}>Read on Original Site</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                {/* Header with navigation and badges */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={24} color="#333" />
                    </TouchableOpacity>

                    <View style={styles.badgeContainer}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{article.category}</Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Article</Text>
                        </View>
                    </View>
                </View>

                {/* Cover Image */}
                {article.coverImage && (
                    <Image
                        source={{ uri: article.coverImage }}
                        style={styles.coverImage}
                        resizeMode="cover"
                    />
                )}

                {/* Article title */}
                <Text style={styles.title}>{article.title}</Text>

                {/* Author info and stats */}
                <View style={styles.authorContainer}>
                    <View style={styles.authorInfo}>
                        <Image
                            source={{ uri: article.author.image }}
                            style={styles.authorImage}
                        />
                        <Text style={styles.authorText}>By {article.author.name}</Text>
                    </View>

                    <View style={styles.stats}>
                        <Text style={styles.statsText}>⭐ {article.rating?.toFixed(1) || '4.0'}</Text>
                        <Text style={styles.statsText}>👁️ {article.views || 0}</Text>
                        <Text style={styles.statsText}>⏱️ {article.readTime || 5}min</Text>
                    </View>
                </View>

                {/* Article content */}
                <View style={styles.contentContainer}>
                    <Text style={styles.sectionTitle}>Content</Text>

                    {isPremium || !article.isPremium ? (
                        <HTML
                            source={{ html: article.content }}
                            contentWidth={windowWidth - 32}
                            tagsStyles={{
                                p: styles.paragraph,
                                h2: styles.heading,
                                h3: styles.subheading,
                                ul: styles.list,
                                ol: styles.list,
                                li: styles.listItem,
                                strong: styles.bold,
                            }}
                        />
                    ) : (
                        <>
                            <HTML
                                source={{ html: article.previewContent || article.content.substring(0, 500) + '...' }}
                                contentWidth={windowWidth - 32}
                                tagsStyles={{
                                    p: styles.paragraph,
                                    h2: styles.heading,
                                    h3: styles.subheading,
                                }}
                            />

                            {/* Premium content lock banner */}
                            <View style={styles.premiumBanner}>
                                <Icon name="lock" size={32} color="#F6BD60" style={styles.lockIcon} />
                                <Text style={styles.premiumTitle}>Unlock the Full Article</Text>
                                <Text style={styles.premiumDescription}>
                                    Get access to the complete article and thousands more with a premium subscription.
                                </Text>
                                <TouchableOpacity style={styles.premiumButton}>
                                    <Text style={styles.premiumButtonText}>Go Pro</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Action buttons at bottom */}
            <View style={styles.actionBar}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={toggleLike}
                >
                    <Icon
                        name={article.isLiked ? "heart" : "heart-outline"}
                        size={24}
                        color={article.isLiked ? "#F28482" : "#888"}
                    />
                    <Text style={styles.actionText}>Like</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={toggleBookmark}
                >
                    <Icon
                        name={article.isBookmarked ? "bookmark" : "bookmark-outline"}
                        size={24}
                        color={article.isBookmarked ? "#6A8D73" : "#888"}
                    />
                    <Text style={styles.actionText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleShare}
                >
                    <Icon name="share-variant" size={24} color="#888" />
                    <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    badgeContainer: {
        flexDirection: 'row',
    },
    badge: {
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginLeft: 8,
    },
    badgeText: {
        fontSize: 12,
        color: '#666',
        textTransform: 'capitalize',
    },
    coverImage: {
        width: '100%',
        height: 200,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 16,
        marginBottom: 16,
        lineHeight: 32,
    },
    authorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorImage: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    authorText: {
        fontSize: 14,
        color: '#666',
    },
    stats: {
        flexDirection: 'row',
    },
    statsText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 12,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    paragraph: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        marginBottom: 16,
    },
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 24,
        marginBottom: 12,
    },
    subheading: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
    },
    list: {
        marginBottom: 16,
    },
    listItem: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        marginBottom: 8,
    },
    bold: {
        fontWeight: 'bold',
    },
    premiumBanner: {
        backgroundColor: '#FFF9EE',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginVertical: 24,
        borderWidth: 1,
        borderColor: '#F6BD60',
    },
    lockIcon: {
        marginBottom: 12,
    },
    premiumTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    premiumDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
    },
    premiumButton: {
        backgroundColor: '#F6BD60',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    premiumButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    actionBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#EFEFEF',
        paddingVertical: 16,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    actionButton: {
        alignItems: 'center',
        padding: 8,
    },
    actionText: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#6A8D73',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});

export default ArticleDetail;