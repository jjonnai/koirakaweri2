import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { LogBox } from 'react-native';

import LoginScreen from './Screens/LoginScreen';
import Home from './Screens/Home';
import Registration from './Screens/Registration';
import LogOut from './Components/LogOut';
import Profile from './Screens/Profile';
import Messages from './Screens/Messages';
import Calender from './Screens/Calendar';
import Chat from './Screens/Chat';
import PublicProfile from './Screens/PublicProfile';
import Finder from './Screens/Finder';

LogBox.ignoreAllLogs();

export default function App() {
  const Stack = createNativeStackNavigator();
  const Tab = createBottomTabNavigator();
  const [initialRoute, setInitialRoute] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setInitialRoute('MainTabs'); 
      } else {
        setInitialRoute('Login');  
      }
    });
    return unsubscribe;
  }, []);

  if (!initialRoute) return null;

  function HomeTabs({ navigation }) {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Home') iconName = 'home';
            else if (route.name === 'Profile') iconName = 'person';
            else if (route.name === 'Message') iconName = 'mail';
            else if (route.name === 'Calender') iconName = 'calendar-today';
            else if (route.name === 'Finder') iconName = 'search';

            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={Home} 
          options={{ 
            title: 'Koti',
            headerRight: () => (
              <LogOut onPress={() => {
                auth.signOut().then(() => {
                  navigation.replace('Login'); 
                }).catch(error => alert(error.message));
              }} />
            ),
          }} 
        />
        <Tab.Screen 
          name="Profile" 
          component={Profile} 
          options={{ 
            title: 'Profiili',
            headerRight: () => (
              <LogOut onPress={() => {
                auth.signOut().then(() => {
                  navigation.replace('Login'); 
                }).catch(error => alert(error.message));
              }} />
            ),
          }} 
        />
        <Tab.Screen 
          name="Message" 
          component={Messages} 
          options={{ 
            title: 'Viestit',
            headerRight: () => (
              <LogOut onPress={() => {
                auth.signOut().then(() => {
                  navigation.replace('Login'); 
                }).catch(error => alert(error.message));
              }} />
            ),
          }} 
        />
        <Tab.Screen 
          name="Calender" 
          component={Calender} 
          options={{ 
            title: 'Kalenteri',
            headerRight: () => (
              <LogOut onPress={() => {
                auth.signOut().then(() => {
                  navigation.replace('Login'); 
                }).catch(error => alert(error.message));
              }} />
            ),
          }} 
        />
        <Tab.Screen 
          name="Finder" 
          component={Finder} 
          options={{ 
            title: 'Etsi hoitaja',
            headerRight: () => (
              <LogOut onPress={() => {
                auth.signOut().then(() => {
                  navigation.replace('Login'); 
                }).catch(error => alert(error.message));
              }} />
            ),
          }} 
        />
      </Tab.Navigator>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="MainTabs" 
          component={HomeTabs}
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="Rekisterointi"
          component={Registration}
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="Viestit"
          component={Chat}
          options={{ headerShown: true }} 
        />
        <Stack.Screen
          name="YleinenProfiili"
          component={PublicProfile}
          options={{ headerShown: true }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
