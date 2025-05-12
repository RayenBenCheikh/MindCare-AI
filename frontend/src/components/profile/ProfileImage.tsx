import React, { useState } from 'react';
import {
    View,
    Image,
    TouchableOpacity,
    Modal,
    Text,
    StyleSheet,
    Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface ProfileImageProps {
    imageUri: string;
    size?: number;
    onImageChange: (newImageUri: string) => void;
    borderColor?: string;
    borderWidth?: number;
    editButtonColor?: string;
    defaultImage?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
    imageUri,
    size = 120,
    onImageChange,
    borderColor = 'white',
    borderWidth = 4,
    editButtonColor = '#5D4037',
    defaultImage = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'
}) => {
    const [showImageOptions, setShowImageOptions] = useState(false);

    // Calculate positions and sizes based on the profile image size
    const editButtonSize = Math.max(size / 3.3, 36);
    const editButtonPosition = {
        bottom: 0,
        right: `${35}%`,
    };

    const requestPermission = async (type: 'camera' | 'mediaLibrary') => {
        try {
            if (type === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                return status === 'granted';
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                return status === 'granted';
            }
        } catch (error) {
            console.error(`Error requesting ${type} permission:`, error);
            return false;
        }
    };

    const takePhoto = async () => {
        try {
            const hasPermission = await requestPermission('camera');
            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Please allow camera access to take photos');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                onImageChange(result.assets[0].uri);
                setShowImageOptions(false);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo. Please try again.');
        }
    };

    const pickImage = async () => {
        try {
            const hasPermission = await requestPermission('mediaLibrary');
            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Please allow photo library access to select images');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                onImageChange(result.assets[0].uri);
                setShowImageOptions(false);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to select image. Please try again.');
        }
    };

    return (
        <>
            <View style={styles.profileImageContainer}>
                <Image
                    source={{ uri: imageUri }}
                    style={[
                        styles.profileImage,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            borderWidth,
                            borderColor
                        }
                    ]}
                    onError={() => {
                        console.log('Image failed to load, using default');
                        onImageChange(defaultImage);
                    }}
                />
                <TouchableOpacity
                    style={[
                        styles.editImageButton,
                    ]}
                    onPress={() => setShowImageOptions(true)}
                >
                    <MaterialCommunityIcons
                        name="pencil"
                        size={editButtonSize / 2}
                        color="white"
                    />
                </TouchableOpacity>
            </View>

            {/* Image Options Modal */}
            <Modal
                visible={showImageOptions}
                animationType="slide"
                transparent={true}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowImageOptions(false)}
                >
                    <View style={styles.imageOptionsContainer}>
                        <View style={styles.imageOptionsHeader}>
                            <Text style={styles.imageOptionsTitle}>Profile Picture</Text>
                            <TouchableOpacity onPress={() => setShowImageOptions(false)}>
                                <Ionicons name="close" size={24} color="#5D4037" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.imageOption}
                            onPress={takePhoto}
                        >
                            <Ionicons name="camera" size={24} color="#5D4037" />
                            <Text style={styles.imageOptionText}>Take Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.imageOption}
                            onPress={pickImage}
                        >
                            <Ionicons name="images" size={24} color="#5D4037" />
                            <Text style={styles.imageOptionText}>Choose from Gallery</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    profileImageContainer: {
        alignItems: 'center',
        marginVertical: 20,
        position: 'relative',
    },
    profileImage: {
        // Width, height, borderRadius, borderWidth and borderColor are dynamically set by props
    },
    editImageButton: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    imageOptionsContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    imageOptionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    imageOptionsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#5D4037',
    },
    imageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
    },
    imageOptionText: {
        fontSize: 16,
        color: '#5D4037',
        marginLeft: 15,
    },
});

export default ProfileImage;