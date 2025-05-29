import React from "react";
import Home from "../screens/Home/Home";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Chatbot from "../screens/Home/Chatbot";
import Conversations from "../components/home/chat/Conversation";
import LLMSettings from "../components/home/chat/LLMSettings";
import ArticleSelection from "../components/home/Article/ArticleSelection";
import ArticleDetail from "../components/home/Article/ArticleDetail";
import MusicSelection from "../components/home/Music/MusicSelection";
export type HomeStackParamList = {
    home: undefined;
    Chatbot: { conversationId?: string };
    conversation: undefined;
    settings: undefined;
    ArticleSelection: undefined;
    ArticleDetail: {
        articleId: string;
        articleUrl?: string; // Optional for external articles
    };
    MusicSelection: undefined;
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
            <Stack.Screen
                name="ArticleSelection"
                component={ArticleSelection}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ArticleDetail"
                component={ArticleDetail}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="MusicSelection"
                component={MusicSelection}
                options={{
                    headerShown: false,
                    title: 'Music Library'
                }}
            />
        </Stack.Navigator>
    );
}

export default HomeNavigator;