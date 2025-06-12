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
    Alert
} from 'react-native';
import { AuthContext } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { useNavigation } from '@react-navigation/native';
import LocalMusicAPI, { MusicTrack } from '@/src/service/MusicApi';
import { formatDuration, getCategoryColor, getCategoryIcon } from '@/src/constants/MusicHelpers';
type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
const { width } = Dimensions.get('window');

const MindfulMusic = () => {
    const [activeMusicIndex, setActiveMusicIndex] = useState(0);
    const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NavigationProp>();
    const { userToken } = useContext(AuthContext);

    const fetchMusic = useCallback(async () => {
        try {
            setLoading(true);

            const isConnected = await LocalMusicAPI.testConnection();
            if (!isConnected) {
                Alert.alert('Connection Error', 'Cannot connect to the music service.');
                setMusicTracks([]);
                return;
            }

            const tracks = await LocalMusicAPI.fetchWellnessMusic();
            if (Array.isArray(tracks)) {
                setMusicTracks(tracks);
            } else {
                setMusicTracks([]);
            }
        } catch (error) {
            console.error('Error fetching music:', error);
            setMusicTracks([]);
            Alert.alert('Error', 'Failed to load music. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMusic();
    }, [fetchMusic]);

    const handleSeeAllPress = () => {
        if (userToken) {
            navigation.navigate('MusicSelection' as any);
        }
    };

    const handleMusicPress = (track: MusicTrack) => {
        if (userToken) {
            navigation.navigate('MusicSelection' as any, {
                selectedTrack: track,
                autoPlay: true,
                existingTracks: musicTracks
            });
        } else {
            Alert.alert('Authentication Required', 'Please sign in to play music.');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#8DAA6D" />
                <Text style={styles.loadingText}>Loading music...</Text>
            </View>
        );
    }

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
                {musicTracks.map((track) => (
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

                            <View style={styles.spotifyBadge}>
                                <Text style={styles.spotifyText}>🎵 Local</Text>
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

// Simplified styles - removed duplicate/unused ones
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