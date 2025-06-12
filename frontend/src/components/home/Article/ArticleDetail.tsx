import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Linking,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
type ArticleDetailRouteProp = RouteProp<HomeStackParamList, 'ArticleDetail'>;

interface Article {
    id: string;
    title: string;
    content: string;
    author: string;
    publishedDate: string;
    category: string;
    imageUrl?: string;
    readTime?: number;
}

const ArticleDetail = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<ArticleDetailRouteProp>();
    const { articleId, articleUrl } = route.params;

    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchArticleDetail();
    }, [articleId]);

    const fetchArticleDetail = async () => {
        try {
            setLoading(true);
            setError(null);

            // If it's an external article, handle differently
            if (articleUrl) {
                // For external articles, you might want to open in browser
                // or fetch content if you have a service to parse external URLs
                setArticle({
                    id: articleId,
                    title: 'External Article',
                    content: 'This article will open in your browser.',
                    author: 'External Source',
                    publishedDate: new Date().toISOString(),
                    category: 'External'
                });
            } else {
                // Fetch internal article from your API
                // Replace this with your actual API call
                const mockArticle: Article = {
                    id: articleId,
                    title: 'Mental Health and Wellness',
                    content: `Mental health is a crucial aspect of overall well-being that affects how we think, feel, and act. It influences how we handle stress, relate to others, and make choices in our daily lives.

Good mental health is more than just the absence of mental health problems. It's about having a sense of purpose, strong relationships, and the ability to cope with life's challenges.

Here are some key strategies for maintaining good mental health:

1. **Stay Connected**: Maintain relationships with family and friends. Social connections are vital for mental wellness.

2. **Stay Active**: Regular physical activity can boost mood and reduce anxiety and depression.

3. **Get Enough Sleep**: Quality sleep is essential for mental health and cognitive function.

4. **Practice Mindfulness**: Meditation and mindfulness practices can help reduce stress and improve emotional regulation.

5. **Seek Help When Needed**: Don't hesitate to reach out to mental health professionals when you need support.

Remember, taking care of your mental health is just as important as taking care of your physical health. Small daily practices can make a significant difference in your overall well-being.`,
                    author: 'Dr. Sarah Johnson',
                    publishedDate: '2024-01-15',
                    category: 'Mental Health',
                    imageUrl: 'https://via.placeholder.com/400x200',
                    readTime: 5
                };
                setArticle(mockArticle);
            }
        } catch (err) {
            setError('Failed to load article');
            console.error('Error fetching article:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExternalLink = () => {
        if (articleUrl) {
            Linking.openURL(articleUrl).catch(() => {
                Alert.alert('Error', 'Unable to open the article link');
            });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#5D4037" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Article</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8DAA6D" />
                    <Text style={styles.loadingText}>Loading article...</Text>
                </View>
            </View>
        );
    }

    if (error || !article) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#5D4037" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Article</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="warning" size={48} color="#E74C3C" />
                    <Text style={styles.errorText}>{error || 'Article not found'}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchArticleDetail}>
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Article</Text>
                {articleUrl && (
                    <TouchableOpacity onPress={handleExternalLink}>
                        <Ionicons name="open-outline" size={24} color="#5D4037" />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Article Image */}
                {article.imageUrl && (
                    <Image source={{ uri: article.imageUrl }} style={styles.articleImage} />
                )}

                {/* Article Header */}
                <View style={styles.articleHeader}>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{article.category}</Text>
                    </View>
                    <Text style={styles.articleTitle}>{article.title}</Text>

                    <View style={styles.articleMeta}>
                        <View style={styles.authorInfo}>
                            <Ionicons name="person-circle" size={16} color="#8B7B73" />
                            <Text style={styles.authorText}>{article.author}</Text>
                        </View>
                        <View style={styles.dateInfo}>
                            <Ionicons name="calendar" size={16} color="#8B7B73" />
                            <Text style={styles.dateText}>{formatDate(article.publishedDate)}</Text>
                        </View>
                        {article.readTime && (
                            <View style={styles.readTimeInfo}>
                                <Ionicons name="time" size={16} color="#8B7B73" />
                                <Text style={styles.readTimeText}>{article.readTime} min read</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Article Content */}
                <View style={styles.articleContent}>
                    <Text style={styles.contentText}>{article.content}</Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    {articleUrl && (
                        <TouchableOpacity style={styles.externalButton} onPress={handleExternalLink}>
                            <Ionicons name="open-outline" size={20} color="#8DAA6D" />
                            <Text style={styles.externalButtonText}>Open in Browser</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.shareButton}>
                        <Ionicons name="share-social" size={20} color="#8DAA6D" />
                        <Text style={styles.shareButtonText}>Share Article</Text>
                    </TouchableOpacity>
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
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorText: {
        fontSize: 16,
        color: '#E74C3C',
        textAlign: 'center',
        marginVertical: 20,
    },
    retryButton: {
        backgroundColor: '#8DAA6D',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    articleImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    articleHeader: {
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0F8E6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 12,
    },
    categoryText: {
        fontSize: 12,
        color: '#8DAA6D',
        fontWeight: '600',
    },
    articleTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#5D4037',
        lineHeight: 32,
        marginBottom: 16,
    },
    articleMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorText: {
        fontSize: 14,
        color: '#8B7B73',
        marginLeft: 4,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 14,
        color: '#8B7B73',
        marginLeft: 4,
    },
    readTimeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    readTimeText: {
        fontSize: 14,
        color: '#8B7B73',
        marginLeft: 4,
    },
    articleContent: {
        backgroundColor: '#FFFFFF',
        marginTop: 10,
        padding: 20,
    },
    contentText: {
        fontSize: 16,
        color: '#5D4037',
        lineHeight: 24,
        textAlign: 'justify',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: '#FFFFFF',
        marginTop: 10,
        gap: 10,
    },
    externalButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F8E6',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#8DAA6D',
    },
    externalButtonText: {
        fontSize: 14,
        color: '#8DAA6D',
        fontWeight: '600',
        marginLeft: 8,
    },
    shareButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#8DAA6D',
    },
    shareButtonText: {
        fontSize: 14,
        color: '#8DAA6D',
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default ArticleDetail;