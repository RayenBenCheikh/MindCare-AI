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
    Linking
} from 'react-native';
import { AuthContext } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import SpotifyAPI, { MusicTrack } from '@/src/service/SpotifyApi';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
const { width } = Dimensions.get('window');

interface MindfulMusicProps { }

const MindfulMusic = ({ }: MindfulMusicProps) => {
    const [activeMusicIndex, setActiveMusicIndex] = useState(0);
    const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NavigationProp>();
    const { userToken, userData } = useContext(AuthContext);

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
            meditation: 'flower-outline',  // or 'leaf-outline'
            sleep: 'bed-outline',
            focus: 'radio-button-on-outline',  // or 'disc-outline'
            nature: 'leaf-outline',
            anxiety: 'heart-outline',  // changed from 'heart-pulse'
            stress: 'pulse-outline'    // changed from 'brain'
        };
        return icons[category as keyof typeof icons] || 'musical-notes-outline'; // changed from 'music'
    };

    // Fetch music tracks function
    const fetchMusicTracks = useCallback(async () => {
        if (!userToken) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('MindfulMusic: Starting to fetch music tracks...');

            // Fetch wellness music from Spotify API
            const tracks = await SpotifyAPI.fetchWellnessMusic();

            // Limit to 6 tracks for home page display
            const limitedTracks = tracks.slice(0, 6);

            setMusicTracks(limitedTracks);
            console.log(`MindfulMusic: Successfully loaded ${limitedTracks.length} music tracks`);

        } catch (error) {
            console.error('MindfulMusic: Error fetching music tracks:', error);
            // Fallback to curated music only
            try {
                const curatedTracks = SpotifyAPI.generateCuratedMusic();
                setMusicTracks(curatedTracks.slice(0, 6));
                console.log('MindfulMusic: Loaded curated music as fallback');
            } catch (fallbackError) {
                console.error('MindfulMusic: Even curated music failed:', fallbackError);
                setMusicTracks([]);
            }
        } finally {
            setLoading(false);
        }
    }, [userToken]);

    // Load music tracks when component mounts
    useEffect(() => {
        fetchMusicTracks();
    }, [fetchMusicTracks]);

    // Refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (userToken) {
                fetchMusicTracks();
            }
        }, [fetchMusicTracks, userToken])
    );

    const handleSeeAllPress = () => {
        if (userToken) {
            navigation.navigate('MusicSelection' as any);
        } else {
            console.log('User not authenticated, redirect to sign in');
        }
    };

    const handleMusicPress = (track: MusicTrack) => {
        if (userToken) {
            // Open Spotify URL
            Linking.openURL(track.spotifyUrl).catch(err => {
                console.error('Error opening Spotify URL:', err);
                // Fallback to web URL if app is not installed
                Linking.openURL(`https://open.spotify.com/track/${track.id}`);
            });
        } else {
            console.log('User not authenticated, redirect to sign in');
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
                                <Text style={styles.spotifyText}>🎵 Spotify</Text>
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