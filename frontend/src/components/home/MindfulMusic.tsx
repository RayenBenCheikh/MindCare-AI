import React, { useState, useContext, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    Linking,
    Alert
} from 'react-native';
import { AuthContext } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LocalMusicAPI, { MusicTrack } from '@/src/service/MusicApi';
import { API_BASE_URL } from '@/src/api/config';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
const { width } = Dimensions.get('window');

interface MindfulMusicProps { }

const MindfulMusic = ({ }: MindfulMusicProps) => {
    const [activeMusicIndex, setActiveMusicIndex] = useState(0);
    const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NavigationProp>();
    const { userToken, userData } = useContext(AuthContext);
    const [refreshing, setRefreshing] = useState(false);
    // Helper function to format duration
    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m`;
        }
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Helper function to get category color
    const getCategoryColor = (category: string): string => {
        const colors = {
            meditation: '#8DAA6D',
            sleep: '#6A8D73',
            focus: '#F6BD60',
            nature: '#5D8A66',
            anxiety: '#9E88B0',
            stress: '#BD8C61'
        };
        return colors[category as keyof typeof colors] || '#8DAA6D';
    };

    // Helper function to get category icon
    const getCategoryIcon = (category: string): string => {
        const icons = {
            meditation: 'flower-outline',
            sleep: 'bed-outline',
            focus: 'radio-button-on-outline',
            nature: 'leaf-outline',
            anxiety: 'heart-outline',
            stress: 'pulse-outline'
        };
        return icons[category as keyof typeof icons] || 'musical-notes-outline'; // changed from 'music'
    };

    // Fetch music tracks function
    const fetchMusic = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🎵 MindfulMusic: Starting fetch process...');
            console.log('🎵 API Base URL:', API_BASE_URL);

            // First test if backend is reachable
            console.log('🎵 Testing backend connection...');
            const isConnected = await LocalMusicAPI.testConnection();

            if (!isConnected) {
                console.error('🎵 Backend connection failed');
                Alert.alert(
                    'Connection Error',
                    'Cannot connect to the music service. Please check your network connection and try again.'
                );
                setMusicTracks([]);
                return;
            }

            console.log('🎵 Backend connection successful, fetching music...');

            // Fetch from your local database
            const tracks = await LocalMusicAPI.fetchWellnessMusic();
            console.log('🎵 MindfulMusic: Raw response:', tracks);
            console.log('🎵 MindfulMusic: Response type:', typeof tracks);
            console.log('🎵 MindfulMusic: Is array:', Array.isArray(tracks));

            if (!tracks || !Array.isArray(tracks)) {
                console.error('🎵 Invalid response format');
                setMusicTracks([]);
                return;
            }

            setMusicTracks(tracks);
            console.log(`🎵 MindfulMusic: Successfully set ${tracks.length} tracks in state`);

            if (tracks.length === 0) {
                console.warn('🎵 No tracks returned from API');
            }

        } catch (error) {
            console.error('❌ MindfulMusic: Error fetching music:', error);
            console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
            setMusicTracks([]);

            Alert.alert(
                'Error',
                'Failed to load music. Please try again later.'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userToken]);

    // Add useEffect to fetch music when component mounts
    useEffect(() => {
        fetchMusic();
    }, [fetchMusic]);

    const handleSeeAllPress = () => {
        if (userToken) {
            navigation.navigate('MusicSelection' as any);
        } else {
            console.log('User not authenticated, redirect to sign in');
        }
    };

    const handleMusicPress = (track: MusicTrack) => {
        if (userToken) {
            console.log('🎵 Playing track:', track.title);

            // Pass the current music tracks to avoid re-fetching
            navigation.navigate('MusicSelection' as any, {
                selectedTrack: track,
                autoPlay: true,
                existingTracks: musicTracks // Pass existing tracks
            });
        } else {
            console.log('User not authenticated, redirect to sign in');
            Alert.alert('Authentication Required', 'Please sign in to play music.');
        }
    };

    // Show loading state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#8DAA6D" />
                <Text style={styles.loadingText}>Loading music...</Text>
            </View>
        );
    }

    // Show message if no music tracks
    if (!userToken || musicTracks.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.sectionTitle}>Mindful Music</Text>
                <Text style={styles.emptyText}>
                    {!userToken ? 'Sign in to view music' : 'No music available'}
                </Text>
            </View>
        );
    }

    return (
        <>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mindful Music</Text>
                <TouchableOpacity onPress={handleSeeAllPress}>
                    <Text style={styles.seeAllLink}>See All ({musicTracks.length}+)</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                onScroll={(event) => {
                    const contentOffsetX = event.nativeEvent.contentOffset.x;
                    const newIndex = Math.round(contentOffsetX / width);
                    setActiveMusicIndex(newIndex);
                }}
                scrollEventThrottle={16}
            >
                {musicTracks.map((track, index) => (
                    <TouchableOpacity
                        key={track.id}
                        style={styles.musicCard}
                        onPress={() => handleMusicPress(track)}
                    >
                        <Image
                            source={{ uri: track.coverImage }}
                            style={styles.musicImage}
                            resizeMode="cover"
                        />
                        <View style={styles.musicContent}>
                            {/* Category badge */}
                            <View style={[
                                styles.categoryBadge,
                                { backgroundColor: getCategoryColor(track.category) }
                            ]}>
                                <Ionicons
                                    name={getCategoryIcon(track.category) as any}
                                    size={12}
                                    color="#FFF"
                                />
                                <Text style={styles.categoryText}>
                                    {track.category.charAt(0).toUpperCase() + track.category.slice(1)}
                                </Text>
                            </View>

                            <Text style={styles.musicTitle} numberOfLines={2}>
                                {track.title}
                            </Text>

                            <Text style={styles.musicArtist} numberOfLines={1}>
                                {track.artist}
                            </Text>

                            <View style={styles.musicStats}>
                                <View style={styles.statItem}>
                                    <Ionicons name="time-outline" size={14} color="#8B7B73" />
                                    <Text style={styles.statText}>{formatDuration(track.duration)}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="musical-notes-outline" size={14} color="#8B7B73" />
                                    <Text style={styles.statText}>{track.type}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="trending-up-outline" size={14} color="#8B7B73" />
                                    <Text style={styles.statText}>{track.popularity}%</Text>
                                </View>
                            </View>

                            {/* Spotify logo */}
                            <View style={styles.spotifyBadge}>
                                <Text style={styles.spotifyText}>🎵 Jamendo</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.musicPaginationContainer}>
                {musicTracks.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            activeMusicIndex === index && styles.activeDot
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
        marginTop: 20,
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
    musicCard: {
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
    musicImage: {
        width: '100%',
        height: 120,
        backgroundColor: '#F0F0F0',
    },
    musicContent: {
        padding: 15,
        position: 'relative',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFF',
        marginLeft: 4,
    },
    musicTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 4,
        lineHeight: 20,
    },
    musicArtist: {
        fontSize: 14,
        color: '#8B7B73',
        marginBottom: 10,
    },
    musicStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
        marginBottom: 4,
    },
    statText: {
        fontSize: 12,
        color: '#8B7B73',
        marginLeft: 3,
    },
    spotifyBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#1DB954',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    spotifyText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFF',
    },
    musicPaginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
        marginBottom: 20,
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
});

export default MindfulMusic;