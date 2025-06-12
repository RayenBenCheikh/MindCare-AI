import React from "react";
import Home from "../screens/Home/Home";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Chatbot from "../screens/Home/Chatbot";
import Conversations from "../components/home/chat/Conversation";
import LLMSettings from "../components/home/chat/LLMSettings";
import ArticleSelection from "../components/home/Article/ArticleSelection";
import ArticleDetail from "../components/home/Article/ArticleDetail";
import MusicSelection from "../components/home/Music/MusicSelection";
import MindfulDashboard from "../components/home/Mindful/MindfulDashbord";
import AssessmentHistory from "../components/home/Mindful/AssessmentHistory";
import MindfulHours from "../components/home/Mindful/MindfulHours";
import SleepQuality from "../components/home/Mindful/SleepQuality";
import MoodTracker from "../components/home/Mindful/MoodTracker";
import StressLevel from "./StressLevel";

export type HomeStackParamList = {
    home: undefined;
    Chatbot: { conversationId?: string };
    conversation: undefined;
    settings: undefined;
    ArticleSelection: undefined;
    ArticleDetail: {
        articleId: string;
        articleUrl?: string;
    };
    MusicSelection: undefined;
    MindfulDashboard: undefined;
    AssessmentHistory: undefined;
    MindfulHours: undefined;
    SleepQuality: undefined;
    StressLevel: undefined;
    MoodTracker: undefined;
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
            <Stack.Screen
                name="MindfulDashboard"
                component={MindfulDashboard}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="AssessmentHistory"
                component={AssessmentHistory}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="MindfulHours"
                component={MindfulHours}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SleepQuality"
                component={SleepQuality}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="StressLevel"
                component={StressLevel}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="MoodTracker"
                component={MoodTracker}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

export default HomeNavigator;