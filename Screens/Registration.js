import React, { useState } from 'react';
import { View, TouchableOpacity, Text, TextInput, Button, StyleSheet, Alert, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { database } from '../firebase';

export default function RegistrationScreen({ navigation }) {
  const imageUrl = 'https://firebasestorage.googleapis.com/v0/b/koirakaweri.appspot.com/o/KOIRAKAWERI12.jpg?alt=media&token=f5c11c93-f7f8-4faf-9b63-8f57a927a835';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    const auth = getAuth();
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        Alert.alert("Rekisteröityminen onnistui!");

        await signInWithEmailAndPassword(auth, email, password);  


        const userEmail = user.email.replace(/\./g, '_'); 
        const userRef = ref(database, `users/${userEmail}`);
        await set(userRef, {
          name: '',
          info: '',
          profileImage: '',
          pets: {} 
        });

        navigation.replace('MainTabs');
      })
      .catch(error => {
        Alert.alert("Virhe", error.message);
      });
  };


  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ImageBackground source={{ uri: imageUrl }} style={styles.background}>
    <View style={styles.overlay}>
    <Text style={styles.title}>Rekisteröidy</Text>
    <View style={styles.inputContainer}>
      
      
      <TextInput
        style={styles.input}
        placeholder="Sähköposti"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Salasana"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      
    </View>
   <TouchableOpacity onPress={handleRegister} style={styles.button}>
      <Text style={styles.buttonText}>Rekisteröidy</Text>
    </TouchableOpacity>
    </View>
    
    </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 20,
  }, background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    
  }, 
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    width: '100%',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 40,
    fontSize: 16,
  },
  inputContainer: {
    width: '80%',
    marginBottom: 20,
    marginTop:20,
    justifyContent: 'flex-end', 
    alignItems: 'center',
    
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    marginBottom:50,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
