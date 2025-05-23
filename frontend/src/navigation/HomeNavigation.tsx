import React from "react";
import Home from "../screens/Home/Home";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Chatbot from "../screens/Home/Chatbot";
import Conversations from "../components/home/chat/Conversation";
import LLMSettings from "../components/home/chat/LLMSettings";
export type HomeStackParamList = {
    home: undefined;
    Chatbot: { conversationId?: string };
    conversation: undefined;
    settings: undefined;
}

const Stack = createNativeStackNavigator<HomeStackParamList>();

// Change this name from WelcomeNavigator to HomeNavigator
const HomeNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="home"
                component={Home}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Chatbot"
                component={Chatbot}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="conversation"
                component={Conversations}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="settings"
                component={LLMSettings}
                options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}

export default HomeNavigator;