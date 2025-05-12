import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    ActivityIndicator,
    Image
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface Country {
    name: {
        common: string;
    };
    flags: {
        png: string;
    };
}

interface LocationPickerProps {
    visible: boolean;
    countries: Country[];
    selectedLocation: string;
    isLoading: boolean;
    onClose: () => void;
    onSelect: (location: string) => void;
}

const LocationPicker = ({
    visible,
    countries,
    selectedLocation,
    isLoading,
    onClose,
    onSelect
}: LocationPickerProps) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCountries = countries.filter(country =>
        country.name.common.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Your Country</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#5D4037" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#7D6E83" />
                        <TextInput
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search countries..."
                            autoCapitalize="none"
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color="#7D6E83" />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {isLoading ? (
                        <ActivityIndicator size="large" color="#8DAA6D" style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            data={filteredCountries}
                            keyExtractor={(item) => item.name.common}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.countryItem}
                                    onPress={() => {
                                        onSelect(item.name.common);
                                        setSearchQuery('');
                                    }}
                                >
                                    <View style={styles.countryItemContent}>
                                        <Image
                                            source={{ uri: item.flags.png }}
                                            style={styles.countryFlag}
                                        />
                                        <Text style={[
                                            styles.countryItemText,
                                            selectedLocation === item.name.common && styles.selectedCountryText
                                        ]}>
                                            {item.name.common}
                                        </Text>
                                    </View>
                                    {selectedLocation === item.name.common && (
                                        <Ionicons name="checkmark" size={20} color="#8DAA6D" />
                                    )}
                                </TouchableOpacity>
                            )}
                            style={styles.countryList}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 15,
        maxHeight: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#5D4037',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 15,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
    },
    countryList: {
        maxHeight: 400,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    countryItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countryFlag: {
        width: 28,
        height: 20,
        marginRight: 12,
        borderRadius: 2,
    },
    countryItemText: {
        fontSize: 16,
        color: '#333',
    },
    selectedCountryText: {
        fontWeight: '600',
        color: '#8DAA6D',
    },
});

export default LocationPicker;