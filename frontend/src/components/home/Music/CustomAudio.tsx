
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { MusicTrack } from '@/src/service/SpotifyApi';

interface MusicPlayerProps {
    track: MusicTrack;
    onClose: () => void;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ track, onClose }) => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioLoadError, setAudioLoadError] = useState<string | null>(null);

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

    useEffect(() => {
        const setupAudio = async () => {
            try {
                setAudioLoadError(null);
                if (sound) {
                    await sound.unloadAsync();
                    setSound(null);
                }
                setIsPlaying(false);
                setPosition(0);
                setDuration(0);

                if (!track.previewUrl) {
                    console.log(`MusicPlayer: No previewUrl for track "${track.title}"`);
                    return;
                }

                console.log(`MusicPlayer: Attempting to load audio from ${track.previewUrl}`);

                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: true,
                    playsInSilentModeIOS: true,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                });

                // Try to load the audio with timeout
                const audioPromise = Audio.Sound.createAsync(
                    { uri: track.previewUrl },
                    { shouldPlay: false },
                    onPlaybackStatusUpdate
                );

                // Add timeout to prevent hanging
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Audio loading timeout')), 15000)
                );

                const { sound: newSound, status } = await Promise.race([audioPromise, timeoutPromise]) as any;

                console.log('MusicPlayer: Audio creation status:', status);

                if (status.isLoaded) {
                    setSound(newSound);
                    console.log('MusicPlayer: ✅ Audio loaded successfully!');
                } else {
                    console.error('MusicPlayer: ❌ Audio status indicates not loaded');
                    console.log('MusicPlayer: Status details:', JSON.stringify(status, null, 2));
                    setAudioLoadError('Audio file could not be loaded - file may not exist or be corrupted');
                }
            } catch (error: any) {
                console.error('MusicPlayer: ❌ Error setting up audio:', error);
                console.error('MusicPlayer: Error details:', error.message);

                // Provide more specific error messages
                let errorMessage = 'Failed to load audio';
                if (error.message.includes('404')) {
                    errorMessage = 'Audio file not found (404 error)';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Audio loading timed out - check your connection';
                } else if (error.message.includes('Network')) {
                    errorMessage = 'Network error - check your internet connection';
                } else {
                    errorMessage = `Audio error: ${error.message}`;
                }

                setAudioLoadError(errorMessage);
                setSound(null);
            }
        };

        if (track.previewUrl) {
            setupAudio();
        }

        return () => {
            if (sound) {
                console.log('MusicPlayer: 🧹 Cleaning up sound for:', track.title);
                sound.unloadAsync();
            }
        };
    }, [track]);

    // Update the onPlaybackStatusUpdate function to log status changes
    const onPlaybackStatusUpdate = (status: any) => {
        console.log('MusicPlayer: Playback status update:', {
            isLoaded: status.isLoaded,
            isPlaying: status.isPlaying,
            didJustFinish: status.didJustFinish,
            error: status.error
        });

        if (status.isLoaded) {
            setPosition(status.positionMillis / 1000);
            setDuration(status.durationMillis / 1000);
            setIsPlaying(status.isPlaying);

            if (status.didJustFinish) {
                console.log('MusicPlayer: ✅ Track finished playing');
            }
        }

        if (status.error) {
            console.error('MusicPlayer: ❌ Playback error:', status.error);
            setAudioLoadError(`Playback error: ${status.error}`);
        }
    };

    // Update togglePlayback with more logging
    const togglePlayback = async () => {
        if (!sound) {
            console.log('MusicPlayer: ❌ No sound object available for playback');
            return;
        }

        try {
            if (isPlaying) {
                console.log('MusicPlayer: ⏸️ Pausing audio');
                await sound.pauseAsync();
            } else {
                console.log('MusicPlayer: ▶️ Playing audio');
                await sound.playAsync();
            }
        } catch (error: any) {
            console.error('MusicPlayer: ❌ Error toggling playback:', error);
            setAudioLoadError(`Playback error: ${error.message}`);
        }
    };

    const seekAudio = async (value: number) => {
        if (sound) {
            await sound.setPositionAsync(value * 1000);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            <Image source={{ uri: track.coverImage }} style={styles.artwork} />

            <View style={styles.infoContainer}>
                <Text style={styles.title}>{track.title}</Text>
                <Text style={styles.artist}>{track.artist}</Text>

                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(track.category) }]}>
                    <Text style={styles.categoryBadgeText}>
                        {track.category.charAt(0).toUpperCase() + track.category.slice(1)}
                    </Text>
                </View>
            </View>

            {track.previewUrl ? (
                audioLoadError ? (
                    <View style={styles.noPreviewContainer}>
                        <Ionicons name="warning-outline" size={36} color="#FF6B6B" style={styles.noPreviewIcon} />
                        <Text style={styles.noPreviewTitle}>Audio Playback Error</Text>
                        <Text style={styles.noPreviewText}>{audioLoadError}</Text>
                        <TouchableOpacity style={styles.similarButton} onPress={onClose}>
                            <Text style={styles.similarButtonText}>Close Player</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={styles.sliderContainer}>
                            <Text style={styles.timeText}>{formatTime(position)}</Text>
                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={duration || 1}
                                value={position}
                                onSlidingComplete={seekAudio}
                                minimumTrackTintColor="#8DAA6D"
                                maximumTrackTintColor="#D8D8D8"
                                thumbTintColor="#8DAA6D"
                                disabled={!sound || duration === 0}
                            />
                            <Text style={styles.timeText}>{formatTime(duration)}</Text>
                        </View>

                        <View style={styles.controlsContainer}>
                            <TouchableOpacity style={styles.controlButton} disabled={!sound}>
                                <Ionicons name="play-skip-back" size={24} color={!sound ? "#ccc" : "#333"} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.playButton} onPress={togglePlayback} disabled={!sound}>
                                <Ionicons
                                    name={isPlaying ? "pause" : "play"}
                                    size={32}
                                    color="#FFF"
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.controlButton} disabled={!sound}>
                                <Ionicons name="play-skip-forward" size={24} color={!sound ? "#ccc" : "#333"} />
                            </TouchableOpacity>
                        </View>
                    </>
                )
            ) : (
                <View style={styles.noPreviewContainer}>
                    <Ionicons name="alert-circle-outline" size={36} color="#888" style={styles.noPreviewIcon} />
                    <Text style={styles.noPreviewTitle}>Preview Not Available</Text>
                    <Text style={styles.noPreviewText}>
                        This track doesn't have a preview available in our app.
                    </Text>

                    <View style={styles.trackDetailsContainer}>
                        <View style={styles.detailItem}>
                            <Ionicons name="time-outline" size={16} color="#888" />
                            <Text style={styles.detailText}>Duration: {formatTime(track.duration)}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="trending-up-outline" size={16} color="#888" />
                            <Text style={styles.detailText}>Popularity: {track.popularity}%</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="musical-notes-outline" size={16} color="#888" />
                            <Text style={styles.detailText}>Type: {track.type}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.similarButton} onPress={onClose}>
                        <Text style={styles.similarButtonText}>Find Similar Tracks</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1,
    },
    artwork: {
        width: 240,
        height: 240,
        borderRadius: 8,
        marginVertical: 20,
    },
    infoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    artist: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    sliderContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    slider: {
        flex: 1,
        marginHorizontal: 10,
    },
    timeText: {
        fontSize: 12,
        color: '#888',
        width: 40,
        textAlign: 'center',
    },
    controlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 20,
    },
    controlButton: {
        marginHorizontal: 20,
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#8DAA6D',
        alignItems: 'center',
        justifyContent: 'center',
    },
    noPreviewIcon: {
        marginBottom: 10,
    },
    noPreviewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 10,
    },
    noPreviewContainer: {
        padding: 16,
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        marginTop: 20,
        alignItems: 'center',
        width: '100%',
    },
    noPreviewText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 16,
    },
    trackDetailsContainer: {
        marginTop: 10,
        marginBottom: 20,
        width: '100%',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    detailText: {
        fontSize: 14,
        color: '#555',
        marginLeft: 8,
    },
    similarButton: {
        backgroundColor: '#8DAA6D',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    similarButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 16,
        marginTop: 10,
    },
    categoryBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default MusicPlayer;