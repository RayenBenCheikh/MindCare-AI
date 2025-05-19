import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import Home from '../screens/Home/Home';
import Profile from '../screens/Home/Profile';
import Chatbot from '../screens/Home/Chatbot';
import Statistic from '../screens/Home/Statistic';
import VitalSignsScreen from '../screens/Stress Managment/HealthScanScreenAI';

const Tab = createBottomTabNavigator();

// Custom Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    return (
        <View style={styles.tabBarContainer}>
            {/* Floating Action Button */}
            <View style={styles.floatingButtonWrapper}>
                <TouchableOpacity
                    style={styles.floatingButton}
                    onPress={() => navigation.navigate('AddButton')}
                >
                    <Ionicons name="add" size={32} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Pill-shaped Tab Bar */}
            <View style={styles.pillTabBar}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label = options.tabBarLabel || options.title || route.name;
                    const isFocused = state.index === index;

                    // Skip rendering the middle tab (it's just a placeholder for FAB)
                    if (index === 2) return <View key={route.key} style={styles.tabItem} />;

                    // Get icon name based on route
                    let iconName: keyof typeof Ionicons.glyphMap = 'help-circle-outline'; // Default value
                    if (route.name === 'Home') {
                        iconName = isFocused ? 'home' : 'home-outline';
                    } else if (route.name === 'ChatBot') {
                        iconName = isFocused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
                    } else if (route.name === 'Statistic') {
                        iconName = isFocused ? 'stats-chart' : 'stats-chart-outline';
                    } else if (route.name === 'Profile') {
                        iconName = isFocused ? 'person' : 'person-outline';
                    }

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            style={styles.tabItem}
                            onPress={onPress}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                        >
                            <View style={styles.tabIconContainer}>
                                <Ionicons
                                    name={iconName}
                                    size={24}
                                    color={isFocused ? '#5D4037' : '#AAAAAA'}
                                />
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const TabNavigator = () => {
    return (
        <Tab.Navigator
            initialRouteName="Home"
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
            }}
        >
            <Tab.Screen name="Home" component={Home} />
            <Tab.Screen name="ChatBot" component={Chatbot} />
            {/* Empty screen for the center button */}
            <Tab.Screen
                name="AddButton"
                component={VitalSignsScreen}
                options={{
                    tabBarButton: () => null,
                }}
            />
            <Tab.Screen name="Statistic" component={Statistic} />
            <Tab.Screen name="Profile" component={Profile} />
        </Tab.Navigator>
    );
};

// Empty component for the middle tab
const EmptyComponent = () => <View />;

// Styles from your Home component
const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 20, // <-- stick to the bottom
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 999,
        backgroundColor: 'transparent', // ensure background is clear
    },
    pillTabBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        width: '85%',
        alignItems: 'center',
        marginBottom: 10, // add some space above the bottom if needed
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIconContainer: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingButtonWrapper: {
        position: 'absolute',
        alignItems: 'center',
        bottom: 20,
        zIndex: 1000,
        elevation: 10,
    },
    floatingButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#8DAA6D',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 10,
    },
});

export default TabNavigator;