import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { database, ref, get } from '../firebase';
import { Feather } from '@expo/vector-icons';

export default function PublicProfile({ route }) {
  const { userData } = route.params;  
  const [userDataState, setUserDataState] = useState(null);
  const [petData, setPetData] = useState([]);
  const [isHoitaja, setIsHoitaja] = useState(false);

  useEffect(() => {
    if (!userData) {
      console.error("Virhe: käyttäjän sähköposti puuttuu.");
      return; 
    }

    const loadData = async () => {
      try {
        const user = await fetchUserData(userData);  
        const pets = await fetchPetData(userData);  
        if (user) {
          setUserDataState(user);
          setIsHoitaja(user.isHoitaja);
        }
        setPetData(pets);
      } catch (error) {
        console.error("Virhe tietojen haussa:", error);
      }
    };

    loadData();
  }, [userData]);


  const fetchUserData = async (email) => {
    const userEmailFormatted = email.replace(/\./g, '_');  
    const userRef = ref(database, `users/${userEmailFormatted}`);

    try {
      const userSnapshot = await get(userRef);
      if (userSnapshot.exists()) {
        return userSnapshot.val();  
      } else {
        console.log('Käyttäjää ei löytynyt.');
        return null;
      }
    } catch (error) {
      console.error("Virhe käyttäjätietojen haussa:", error);
      return null;
    }
  };


  const fetchPetData = async (email) => {
    const userEmailFormatted = email.replace(/\./g, '_');  
    const petsRef = ref(database, `users/${userEmailFormatted}/pets`);

    try {
      const petsSnapshot = await get(petsRef);
      if (petsSnapshot.exists()) {
        return Object.entries(petsSnapshot.val()).map(([id, data]) => ({
          id,
          ...data,
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error("Virhe lemmikkitietojen haussa:", error);
      return [];
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profiilikuva */}
      <View style={styles.profileImageContainer}>
        {userDataState?.profileImage ? (
          <Image source={{ uri: userDataState.profileImage }} style={styles.profileImage} />
        ) : (
          <Feather name="user" size={150} color="black" />
        )}
      </View>

      {/* Käyttäjän tiedot */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Käyttäjän tiedot</Text>
        <Text style={styles.detailText}>Nimi: {userDataState?.name || "Tietoa ei saatavilla"}</Text>
        <Text style={styles.detailText}>Esittely: {userDataState?.info || "Tietoa ei saatavilla"}</Text>
      </View>

      {/* Lemmikkien tiedot */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lemmikit</Text>
        {petData.length > 0 ? (
          petData.map((pet) => (
            <View key={pet.id} style={styles.petBox}>
              <Text style={styles.detailText}>Nimi: {pet.name || "Tietoa ei saatavilla"}</Text>
              <Text style={styles.detailText}>Ikä: {pet.age || "Tietoa ei saatavilla"}</Text>
              <Text style={styles.detailText}>Rotu: {pet.race || "Tietoa ei saatavilla"}</Text>
              <Text style={styles.detailText}>Sukupuoli: {pet.gender || "Tietoa ei saatavilla"}</Text>
              <Text style={styles.detailText}>Esittely: {pet.info || "Tietoa ei saatavilla"}</Text>
            </View>
          ))
        ) : (
          <Text>Lemmikkitietoja ei ole saatavilla</Text>
        )}
      </View>
      <View style={styles.hoitaja}>
        <Text style={styles.hoitajaText}>
          {isHoitaja ? 'Ilmoittautunut hoitajaksi' : 'Ei ole ilmoittautunut hoitajaksi'}
        </Text>
      </View>
  
    </ScrollView>
  );
}

 

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detailText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  petBox: {
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  hoitaja: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  hoitajaText: {
    fontSize: 20,
    marginLeft: 15,
  },
});