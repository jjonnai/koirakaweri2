import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ImageBackground, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebase } from '../firebase';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoginScreen = ({ navigation }) => {
  const imageUrl = 'https://firebasestorage.googleapis.com/v0/b/koirakaweri.appspot.com/o/KOIRAKAWERI12.jpg?alt=media&token=f5c11c93-f7f8-4faf-9b63-8f57a927a835';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const auth = getAuth();

  const handleLogin = () => {
    if (email === '' || password === '') {
      setError('Tarkista kentät');
    } else {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          navigation.replace('MainTabs');
        })
        .catch((error) => {
          if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-login-credentials') {
            setError('Väärä sähköposti tai salasana');
          } else if (error.code === 'auth/invalid-email') {
            setError('Väärä sähköposti');
          } else {
            setError('Kirjautumisessa tapahtui virhe');
          }
          console.error(error);
        });
    }
  };

  return (
   
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ImageBackground source={{ uri: imageUrl }} style={styles.background}>
        <View style={styles.overlay}>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder='Sähköposti'
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType='email-address'
            />
            <TextInput
              placeholder='Salasana'
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <TouchableOpacity onPress={handleLogin} style={styles.button}>
            <Text style={styles.buttonText}>Kirjaudu</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Rekisterointi')}>
            <Text style={styles.newUser}>Uusi käyttäjä? Rekisteröidy tästä!</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView> 
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 20,
  },
  inputContainer: {
    width: '80%',
    marginBottom: 20,
    marginTop:20,
    justifyContent: 'flex-end', 
    alignItems: 'center',
    
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 40,
    fontSize: 16,
    width: '100%',
    
    
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  newUser: {
    marginTop: 10,
    color: 'white',
    marginBottom:40,
    marginTop: 30,
    fontSize:16
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
});

export default LoginScreen;



