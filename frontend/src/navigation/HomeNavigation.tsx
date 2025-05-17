import React from "react";
import Home from "../screens/Home/Home";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Chatbot from "../screens/Home/Chatbot";




export type HomeStackParamList = {
    home: undefined;
    Chatbot: undefined;
}
const Stack = createNativeStackNavigator<HomeStackParamList>();
const WelcomeNavigator = () => {
    return (
        <Stack.Navigator >
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

        </Stack.Navigator>
    );
}  