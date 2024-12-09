import React from "react";
import { auth } from '../firebase';
import { TouchableOpacity, View, Alert } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';  

const LogOutButton = ({ onPress }) => {
    const navigation = useNavigation(); 

    const signOutHandler = () => {
        auth.signOut()
            .then(() => {
              //  Alert.alert("Logged out successfully.");
                navigation.replace('Login'); 
            })
            .catch((error) => {
                Alert.alert("Logout Error", error.message);
            });
    };

    return (
        <View>
            <TouchableOpacity onPress={onPress || signOutHandler}>
                <MaterialIcons name="logout" size={32} color="#ff3300" style={{ marginRight: 30 }} />
            </TouchableOpacity>
        </View>
    );
};

export default LogOutButton;
