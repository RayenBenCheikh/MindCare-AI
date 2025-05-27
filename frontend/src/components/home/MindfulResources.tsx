import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions
} from 'react-native';
import { AuthContext } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { useNavigation } from '@react-navigation/native';
type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
const { width } = Dimensions.get('window');
interface MindfulResourcesProps {

}

const MindfulResources = ({ }: MindfulResourcesProps) => {
    const [activeResourceIndex, setActiveResourceIndex] = useState(0);
    const navigation = useNavigation<NavigationProp>();
    const { userToken, userData } = useContext(AuthContext);
    const resources = [
        {
            id: '1',
            title: 'Will meditation help you get out from the rat race?',
            category: 'Mental Health',
            coverImage: 'https://images.unsplash.com/photo-1454944338482-a69bb95894af',
            views: 5241,
            likes: 987,
            comments: 22,
            author: userData?.name || 'Unknown Author' // Use connected user info
        },
        {
            id: '2',
            title: 'Finding peace in the chaos of modern life',
            category: 'Mindfulness',
            coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
            views: 3450,
            likes: 762,
            comments: 18,
            author: userData?.name || 'Unknown Author'
        }
    ];

    const handleSeeAllPress = () => {
        if (userToken) {
            navigation.navigate('ArticleSelection');
        } else {
            // Handle case where user is not authenticated
            console.log('User not authenticated, redirect to sign in');
        }
    };

    const handleResourcePress = (resourceId: string) => {
        if (userToken) {
            navigation.navigate('ArticleDetail'); // Add articleId parameter
        } else {
            console.log('User not authenticated, redirect to sign in');
        }
    };



    return (
        <>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mindful Resources</Text>
                <TouchableOpacity onPress={handleSeeAllPress}>
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
                {resources.map((resource, index) => (
                    <TouchableOpacity
                        key={resource.id}
                        style={styles.resourceCard}
                        onPress={() => handleResourcePress(resource.id)}
                    >
                        <Image
                            source={{ uri: resource.coverImage }}
                            style={styles.resourceImage}
                        />
                        <View style={styles.resourceContent}>
                            <Text style={styles.resourceCategory}>{resource.category}</Text>
                            <Text style={styles.resourceTitle}>
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
                                    <Ionicons name="chatbubble-outline" size={14} color="#8B7B73" />
                                    <Text style={styles.statText}>{resource.comments}</Text>
                                </View>
                            </View>
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