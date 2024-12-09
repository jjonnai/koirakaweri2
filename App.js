import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { StyleSheet  } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { LogBox } from 'react-native';
import { BlurView } from 'expo-blur';

import LoginScreen from './Screens/LoginScreen';
import Home from './Screens/Home';
import Registration from './Screens/Registration';
import LogOut from './Components/LogOut';
import Profile from './Screens/Profile';
import Messages from './Screens/Messages';
import Chat from './Screens/Chat';
import PublicProfile from './Screens/PublicProfile';
import Finder from './Screens/Finder';
import Reservation from './Screens/Reservation';
import Notifications from './Screens/Notifications';

LogBox.ignoreAllLogs(); 

export default function App() {
  const Stack = createNativeStackNavigator();
  const Tab = createBottomTabNavigator();
  const [initialRoute, setInitialRoute] = useState(null);
  const auth = getAuth();
  const [showNewMessage, setNewMessage] = useState(false);

  useEffect(() => {
    const simulateNewMessage = setTimeout(() => {
      setNewMessage(true); 
    }, 5000);

    return () => clearTimeout(simulateNewMessage);
  }, []);

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
          tabBarStyle: { position: 'bottom',
            height:70,
            paddingBottom:15,
            paddingTop:10
          
           },
       
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Home') iconName = 'home';
            else if (route.name === 'Messages') iconName = 'mail';
            else if (route.name === 'Notifications') iconName = 'notifications';
            else if (route.name === 'Finder') iconName = 'search';
            else if (route.name === 'Profile') iconName = 'person';

            return <MaterialIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor:'#ff3300',
          tabBarInactiveTintColor: 'black',
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={Home} 
          options={{ 
            title: 'Koti',
            headerStyle: {
              backgroundColor: '#f2f2f2',  
            },
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
            headerStyle: {
              backgroundColor: '#f2f2f2',   
            },
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
          name="Messages" 
          component={(props) => (
            <Messages
            {...props} onClearBadge={() => setNewMessage(false)} 
            />
          )}
          options={{ 
            title: 'Viestit',
            headerStyle: {
              backgroundColor: '#f2f2f2',   
            },
            tabBarBadge: showNewMessage ? '•' : null,
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
          name="Notifications" 
          component={Notifications} 
          options={{ 
            title: 'Ilmoitukset',
            headerStyle: {
              backgroundColor: '#f2f2f2',   
            },
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
            headerStyle: {
              backgroundColor: '#f2f2f2',   
            },
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
          options={{ headerShown: true,
            headerStyle: {
              backgroundColor:'#f2f2f2',   
            },
           }} 
        />
        <Stack.Screen
          name="YleinenProfiili"
          component={PublicProfile}
          options={{ headerShown: true,
            headerStyle: {
              backgroundColor: '#f2f2f2',   
            },
           }} 
        />
        <Stack.Screen
          name="Varaus"
          component={Reservation}
          options={{ headerShown: true,
            headerStyle: {
              backgroundColor: '#f2f2f2',  
            },
           }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
