import axios from 'axios';

export interface Resource {
    id: string;
    title: string;
    description: string;
    type: 'article';
    category: string;
    coverImage: string;
    author: { name: string; image: string };
    isPremium: boolean;
    likes: number;
    views: number;
    rating: number;
    url?: string;
}

export const getCategoryFromContent = (content: string): string => {
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('stress') || lowerContent.includes('pressure')) {
        return 'Stress Relief';
    } else if (lowerContent.includes('anxiety') || lowerContent.includes('worry')) {
        return 'Anxiety Help';
    } else if (lowerContent.includes('sleep') || lowerContent.includes('insomnia')) {
        return 'Sleep';
    } else if (lowerContent.includes('focus') || lowerContent.includes('concentration')) {
        return 'Focus';
    } else if (lowerContent.includes('meditation') || lowerContent.includes('mindful')) {
        return 'Meditation';
    }

    return 'Mental Health';
};

export const generateWellnessContent = (): Resource[] => {
    return [
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
};

export const fetchNewsArticles = async (): Promise<Resource[]> => {
    try {
        const NEWS_API_KEY = 'd8f42abb753441b5a5627315c2d11f2b';
        const NEWS_API_BASE = 'https://newsapi.org/v2';

        const response = await axios.get(`${NEWS_API_BASE}/everything`, {
            params: {
                q: 'mental health OR meditation OR stress relief OR anxiety help OR mindfulness OR wellness',
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: 10,
                apiKey: NEWS_API_KEY
            }
        });

        if (response.data && response.data.articles && Array.isArray(response.data.articles)) {
            return response.data.articles
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
        }
    } catch (error) {
        console.error('News API failed:', error);
    }

    return [];
};