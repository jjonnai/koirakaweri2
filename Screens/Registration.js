import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { database } from '../firebase';

export default function RegistrationScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    const auth = getAuth();
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
       
        const user = userCredential.user;
        Alert.alert("Rekisteröityminen onnistui!");

        
        const userEmail = user.email.replace(/\./g, '_'); 
        const userRef = ref(database, `users/${userEmail}`);

        
        await set(userRef, {
          name: '',
          info: '',
          profileImage: '',
          pets: {} 
        });


        navigation.replace('Login'); 
      })
      .catch(error => {
        Alert.alert("Virhe", error.message);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rekisteröidy</Text>
      
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

      <Button title="Rekisteröidy" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
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
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
});
