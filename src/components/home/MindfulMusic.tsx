import JamendoAPI, { MusicTrack } from '@/src/service/MusicApi';

const handleMusicPress = (track: MusicTrack) => {
    if (userToken) {
        // Open Jamendo URL
        Linking.openURL(track.jamendoUrl).catch(err => {
            console.error('Error opening Jamendo URL:', err);
        });
    } else {
        console.log('User not authenticated, redirect to sign in');
    }
}; 