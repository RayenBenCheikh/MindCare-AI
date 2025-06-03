import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Alert,

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '@/src/context/AuthContext';
import LocalMusicAPI, { MusicTrack } from '@/src/service/MusicApi';
import MusicPlayer from './CustomAudio';
import Modal from 'react-native-modal'; // You may need to install this: npm install react-native-modal
import { API_BASE_URL } from '@/src/api/config';
interface MusicSelectionProps {
    route?: {
        params?: {
            selectedTrack?: MusicTrack;
            autoPlay?: boolean;
            existingTracks?: MusicTrack[];
        };
    };
}
const MUSIC_CATEGORIES = [
    { id: 'all', name: 'All', color: '#8DAA6D', icon: 'musical-notes-outline' },
    { id: 'meditation', name: 'Meditation', color: '#8DAA6D', icon: 'flower-outline' },
    { id: 'sleep', name: 'Sleep', color: '#6A8D73', icon: 'bed-outline' },
    { id: 'focus', name: 'Focus', color: '#F6BD60', icon: 'radio-button-on-outline' },
    { id: 'nature', name: 'Nature', color: '#5D8A66', icon: 'leaf-outline' },
    { id: 'anxiety', name: 'Anxiety', color: '#9E88B0', icon: 'heart-outline' },
    { id: 'stress', name: 'Stress', color: '#BD8C61', icon: 'pulse-outline' },
];

const MusicSelection: React.FC<MusicSelectionProps> = ({ route }) => {
    const { userToken } = useContext(AuthContext);
    const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
    const [filteredTracks, setFilteredTracks] = useState<MusicTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
    const [isPlayerVisible, setIsPlayerVisible] = useState(false);
    const [showMusicPlayer, setShowMusicPlayer] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'all' | 'tracks'>('all');
    const navigation = useNavigation();

    // Check for passed data
    const passedTracks = route?.params?.existingTracks;
    const passedSelectedTrack = route?.params?.selectedTrack;
    const shouldAutoPlay = route?.params?.autoPlay;


    // Helper functions
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

    const getCategoryColor = (category: string): string => {
        const categoryObj = MUSIC_CATEGORIES.find(cat => cat.id === category);
        return categoryObj?.color || '#8DAA6D';
    };

    // Fetch music function
    const fetchMusic = useCallback(async () => {
        try {
            setLoading(true);
            console.log('MusicSelection: Fetching music from local database...');

            // If we have passed tracks, use them instead of fetching
            if (passedTracks && passedTracks.length > 0) {
                console.log(`MusicSelection: Using passed tracks (${passedTracks.length} tracks)`);
                setMusicTracks(passedTracks);
                return;
            }

            // Otherwise fetch from API
            const tracks = await LocalMusicAPI.fetchWellnessMusic();
            setMusicTracks(tracks);
            console.log(`MusicSelection: Loaded ${tracks.length} total tracks`);

        } catch (error) {
            console.error('MusicSelection: Error fetching music:', error);
            setMusicTracks([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userToken, passedTracks]);

    // Handle auto-play when component mounts
    useEffect(() => {
        if (passedSelectedTrack && shouldAutoPlay) {
            console.log('MusicSelection: Auto-playing passed track:', passedSelectedTrack.title);
            setSelectedTrack(passedSelectedTrack);
            setIsPlayerVisible(true);
        }
    }, [passedSelectedTrack, shouldAutoPlay]);

    useEffect(() => {
        let filtered = musicTracks;

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(track => track.category === selectedCategory);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(track =>
                track.title.toLowerCase().includes(query) ||
                track.artist.toLowerCase().includes(query) ||
                track.album.toLowerCase().includes(query)
            );
        }

        console.log(`🎵 MusicSelection: Filtered ${filtered.length} tracks from ${musicTracks.length} total`);
        console.log('🎵 Selected category:', selectedCategory);
        console.log('🎵 Search query:', searchQuery);

        setFilteredTracks(filtered);
    }, [musicTracks, selectedCategory, searchQuery]);

    // Refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (userToken) {
                fetchMusic();
            }
        }, [fetchMusic, userToken])
    );

    // Handle music press
    const handleMusicPress = (track: MusicTrack) => {
        if (userToken) {
            console.log('🎵 Playing track:', track.title);

            // Create the track with streaming URL
            const trackWithStreamUrl = {
                ...track,
                previewUrl: `${API_BASE_URL}/api/music/stream/${track.id}`
            };

            setSelectedTrack(trackWithStreamUrl);
            setShowMusicPlayer(true);
        } else {
            console.log('User not authenticated, redirect to sign in');
            Alert.alert('Authentication Required', 'Please sign in to play music.');
        }
    };


    // Add this function to close the player
    const handleClosePlayer = () => {
        setShowMusicPlayer(false);
        setSelectedTrack(null);
    };

    // Handle refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMusic();
    }, [fetchMusic]);

    // Render category item
    const renderCategory = ({ item }: { item: typeof MUSIC_CATEGORIES[0] }) => (
        <TouchableOpacity
            style={[
                styles.categoryButton,
                { backgroundColor: item.color },
                selectedCategory === item.id && styles.categorySelected
            ]}
            onPress={() => setSelectedCategory(item.id)}
        >
            <Ionicons name={item.icon as any} size={16} color="#FFF" />
            <Text style={styles.categoryText}>{item.name}</Text>
        </TouchableOpacity>
    );

    // Render music item
    const renderMusicItem = ({ item }: { item: MusicTrack }) => (
        <TouchableOpacity
            style={styles.musicCard}
            onPress={() => handleMusicPress(item)}
        >
            <Image source={{ uri: item.coverImage }} style={styles.musicImage} />

            <View style={styles.musicInfo}>
                <View style={styles.musicHeader}>
                    <Text style={styles.musicTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: '#FF6B6B' }]}>
                        <Text style={styles.typeText}>TRACK</Text>
                    </View>
                </View>

                <Text style={styles.musicArtist} numberOfLines={1}>{item.artist}</Text>
                <Text style={styles.musicAlbum} numberOfLines={1}>{item.album}</Text>

                <View style={styles.musicStats}>
                    <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={14} color="#8B7B73" />
                        <Text style={styles.statText}>{formatDuration(item.duration)}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="trending-up-outline" size={14} color="#8B7B73" />
                        <Text style={styles.statText}>{item.popularity}%</Text>
                    </View>
                    <View style={[
                        styles.categoryTag,
                        { backgroundColor: getCategoryColor(item.category) }
                    ]}>
                        <Text style={styles.categoryTagText}>
                            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </Text>
                    </View>
                </View>
                {item.previewUrl ? (
                    <View style={styles.previewAvailableBadge}>
                        <Ionicons name="play-circle-outline" size={12} color="#fff" />
                        <Text style={styles.previewText}>Preview Ready</Text>
                    </View>
                ) : (
                    <View style={[styles.previewAvailableBadge, styles.noPreviewBadge]}>
                        <Ionicons name="information-circle-outline" size={12} color="#fff" />
                        <Text style={styles.previewText}>Details Only</Text>
                    </View>
                )}
            </View>

            <TouchableOpacity
                style={styles.playButton}
                onPress={() => handleMusicPress(item)}
            >
                <Ionicons
                    name="play"
                    size={20}
                    color="#FFF"
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    // Tab navigation component
    const TabNavigation = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                onPress={() => setActiveTab('all')}
            >
                <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                    All ({musicTracks.length})
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'tracks' && styles.activeTab]}
                onPress={() => setActiveTab('tracks')}
            >
                <Text style={[styles.tabText, activeTab === 'tracks' && styles.activeTabText]}>
                    Tracks ({musicTracks.length})
                </Text>
            </TouchableOpacity>
        </View>
    );

    // Loading state
    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Mindful Music</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8DAA6D" />
                    <Text style={styles.loadingText}>Loading music...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // No authentication
    if (!userToken) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Mindful Music</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="musical-notes-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>Sign in to access music</Text>
                    <Text style={styles.emptySubtext}>Please log in to explore our music library</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Mindful Music</Text>
                <TouchableOpacity onPress={onRefresh}>
                    <Icon name="refresh" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Icon name="magnify" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search music, artists, playlists..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#888"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Icon name="close" size={18} color="#888" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Categories */}
            <View style={styles.categoryContainer}>
                <FlatList
                    data={MUSIC_CATEGORIES}
                    renderItem={renderCategory}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryList}
                />
            </View>

            {/* Tab Navigation */}
            <TabNavigation />

            {/* Music List */}
            <FlatList
                data={filteredTracks}
                renderItem={renderMusicItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#8DAA6D']}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="musical-notes-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No music found</Text>
                        <Text style={styles.emptySubtext}>
                            Try adjusting your search or filters
                        </Text>
                    </View>
                }
            />

            {/* Results count */}
            {filteredTracks.length > 0 && (
                <View style={styles.resultsCount}>
                    <Text style={styles.resultsText}>
                        {filteredTracks.length} result{filteredTracks.length !== 1 ? 's' : ''} found
                    </Text>
                </View>
            )}
            <Modal
                isVisible={showMusicPlayer}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                onBackdropPress={handleClosePlayer}
                onSwipeComplete={handleClosePlayer}
                swipeDirection="down"
            >
                {selectedTrack && (
                    <MusicPlayer
                        track={selectedTrack}
                        onClose={handleClosePlayer}
                    />
                )}
            </Modal>
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
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginHorizontal: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 16,
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
    },
    categoryList: {
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
        marginLeft: 6,
        fontSize: 14,
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
    },
    tab: {
        paddingVertical: 12,
        marginRight: 24,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#8DAA6D',
    },
    tabText: {
        fontSize: 16,
        color: '#888',
    },
    activeTabText: {
        color: '#8DAA6D',
        fontWeight: '600',
    },
    listContainer: {
        paddingBottom: 20,
    },
    musicCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 6,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        alignItems: 'center',
    },
    musicImage: {
        width: 80,
        height: 80,
        backgroundColor: '#F0F0F0',
    },
    musicInfo: {
        flex: 1,
        padding: 12,
    },
    musicHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    musicTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    typeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    typeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFF',
    },
    musicArtist: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    musicAlbum: {
        fontSize: 12,
        color: '#888',
        marginBottom: 8,
    },
    musicStats: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 4,
    },
    statText: {
        fontSize: 12,
        color: '#8B7B73',
        marginLeft: 4,
    },
    categoryTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    categoryTagText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFF',
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1DB954',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
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
        marginTop: 60,
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
    resultsCount: {
        padding: 12,
        backgroundColor: '#F8F8F8',
        borderTopWidth: 1,
        borderTopColor: '#EFEFEF',
    },
    resultsText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    playerModal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    previewAvailableBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 3,
        paddingHorizontal: 6,
        backgroundColor: '#1DB954',
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    previewText: {
        fontSize: 10,
        color: '#FFF',
        marginLeft: 4,
        fontWeight: '500',
    },
    playButtonSpotify: {
        backgroundColor: '#1DB954',
    }, noPreviewBadge: {
        backgroundColor: '#888',
    },
});

export default MusicSelection;