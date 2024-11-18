import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Switch } from 'react-native';
import { getAuth } from 'firebase/auth';
import { database, ref, set, update, get, push, remove } from '../firebase';
import { useFonts } from 'expo-font';
import Feather from '@expo/vector-icons/Feather';
import { pickImage, takePhoto, saveProfileImage, fetchProfileImage } from "../Components/ProfileFunctions";

export default function ProfileScreen({ navigation }) {
  const [loaded] = useFonts({
    DeliusSwashCaps: require('../assets/fonts/DeliusSwashCaps-Regular.ttf'),
    Raleway_italic: require('../assets/fonts/Raleway-Italic-VariableFont_wght.ttf'),
    Raleway: require('../assets/fonts/Raleway-VariableFont_wght.ttf')
  })

  if (!loaded) {return null;}

  const auth = getAuth();
  const [isHoitaja, setIsHoitaja] = useState(false);

  const [userInfo, setUserInfo] = useState(false); 
  const [userData, setUserData] = useState({
    name: '',
    info: '',
  });
 //const [profileImage, setProfileImage] = useState(null);

  const [petInfo, setPetInfo] = useState(false);
  const [petData, setPetData] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null); 
  const [newPetData, setNewPetData] = useState({
    name: '',
    age: '',
    race: '',
    gender: '',
    info: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        alert('Käyttäjä ei ole kirjautunut sisään.');
        return;
      }

      const userEmail = user.email.replace(/\./g, '_');
      const userRef = ref(database, `users/${userEmail}`);

      try {
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists()) {
          const data = userSnapshot.val();
          setUserData({
            name: data.name,
            info: data.info,
          });
          setIsHoitaja(data.isHoitaja || false); 
        }
      } catch (error) {
        console.error("Virhe käyttäjätietojen hakemisessa:", error);
      }

      const petsRef = ref(database, `users/${userEmail}/pets`);
      try {
        const petsSnapshot = await get(petsRef);
        if (petsSnapshot.exists()) {
          const pets = petsSnapshot.val();
          setPetData(Object.entries(pets).map(([id, data]) => ({ id, ...data }))); 
        }
      } catch (error) {
        console.error("Virhe lemmikkitietojen hakemisessa:", error);
      }
    };

    fetchData();
  }, [auth.currentUser]);

  const handleUserData = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Käyttäjä ei ole kirjautunut sisään.');
      return;
    }
  
    const userEmail = user.email.replace(/\./g, '_');
    const userRef = ref(database, `users/${userEmail}`);
  
    try {
      await update(userRef, { name: userData.name, info: userData.info, isHoitaja: isHoitaja, });
      alert("Käyttäjätiedot tallennettu!");
    } catch (error) {
      console.error("Virhe käyttäjätietojen tallennuksessa:", error);
      alert("Tietojen tallennus epäonnistui");
    }
  };

  const handleAddPet = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Käyttäjä ei ole kirjautunut sisään.');
      return;
    }

    const userEmail = user.email.replace(/\./g, '_');
    const petsRef = ref(database, `users/${userEmail}/pets`);

    try {
      const newPetRef = push(petsRef);
      await update(newPetRef, newPetData);
      alert('Lemmikkitiedot tallennettu!');
      
      setPetData([...petData, { id: newPetRef.key, ...newPetData }]);
      setNewPetData({
        name: '',
        age: '',
        race: '',
        gender: '',
        info: ''
      });
    } catch (error) {
      console.error("Virhe tallentaessa lemmikkitietoja:", error);
      alert('Tietojen tallennus epäonnistui');
    }

    setPetInfo(false);
  };

  const handleEditPet = async () => {
    if (!selectedPetId) return;

    const user = auth.currentUser;
    if (!user) {
      alert('Käyttäjä ei ole kirjautunut sisään.');
      return;
    }

    const userEmail = user.email.replace(/\./g, '_');
    const petRef = ref(database, `users/${userEmail}/pets/${selectedPetId}`);

    try {
      await update(petRef, newPetData);
      alert('Lemmikkitiedot päivitetty!');

      setPetData(petData.map(pet => 
        pet.id === selectedPetId ? { id: pet.id, ...newPetData } : pet
      ));
      setNewPetData({ name: '', age: '', race: '', gender: '', info: '' });
      setSelectedPetId(null);
    } catch (error) {
      console.error("Virhe lemmikkitietojen päivittämisessä:", error);
      alert('Tietojen päivitys epäonnistui');
    }

    setPetInfo(false);
  };

  const handleDeletePet = async (petId) => {
    const user = auth.currentUser;
    if (!user) {
      alert('Käyttäjä ei ole kirjautunut sisään.');
      return;
    }

    const userEmail = user.email.replace(/\./g, '_');
    const petRef = ref(database, `users/${userEmail}/pets/${petId}`);

    try {
      await remove(petRef);
      alert('Lemmikki poistettu!');
      setPetData(petData.filter(pet => pet.id !== petId));
    } catch (error) {
      console.error("Virhe lemmikin poistamisessa:", error);
      alert('Poisto epäonnistui');
    }
  };

   //PROFIILIKUVAN LISÄÄMINEN

   //const Profile = () => {
    const [profileImage, setProfileImage] = useState(null);
  
    useEffect(() => {
      fetchProfileImage(setProfileImage, auth, database);
    }, [auth.currentUser]);


    const toggleHoitajaStatus = () => {
      setIsHoitaja((prevStatus) => {
        const newStatus = !prevStatus;
        // Tallennetaan uusi tila Firebaseen
        const user = auth.currentUser;
        if (user) {
          const userEmail = user.email.replace(/\./g, '_');
          const userRef = ref(database, `users/${userEmail}`);
          update(userRef, { isHoitaja: newStatus }).catch((error) => {
            console.error("Virhe isHoitaja-arvon tallennuksessa:", error);
            Alert.alert("isHoitaja-arvon tallennus epäonnistui");
          });
        }
        return newStatus;
      })}



  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{auth.currentUser?.email}</Text>

    {/* PROFIILIKUVA */}
      <View style={styles.profileImageContainer}>
        {profileImage ? (
          <Image
            source={{ uri: profileImage }}
            style={styles.profileImage}
          />
        ) : (
          <Feather name="user" size={150} color="black" />
        )}
      <TouchableOpacity onPress={() => pickImage(setProfileImage, (uri) => saveProfileImage(uri, auth, database))}>
        <Text>Valitse profiilikuva galleriasta</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => takePhoto(setProfileImage, (uri) => saveProfileImage(uri, auth, database))}>
        <Text>Ota uusi profiilikuva</Text>
      </TouchableOpacity>
      </View>

      {/* OMAT TIEDOT */}
      <View style={styles.section}>
        <View style={styles.headerContainer}>
          <Text style={styles.sectionTitle}>Omat tiedot</Text>
          <TouchableOpacity onPress={() => setUserInfo(true)}>
            <Feather name="edit" size={20} color="#2196F3" />
          </TouchableOpacity>
        </View>

        {userInfo ? (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Nimi"
              value={userData.name}
              onChangeText={(text) => setUserData({ ...userData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Esittelyteksti"
              value={userData.info}
              onChangeText={(text) => setUserData({ ...userData, info: text })}
            />
            <Button title="Tallenna muutokset" onPress={async () => {
    await handleUserData();
    setUserInfo(false); 
  }} />
          </View>
        ) : (
          <View>
            <Text style={styles.detailText}>Nimi: {userData.name || "Tietoa ei saatavilla"}</Text>
            <Text style={styles.detailText}>Esittely: {userData.info || "Tietoa ei saatavilla"}</Text>
          </View>
        )}
      </View>

      {/* LEMMIKKI TIEDOT */}
      <View style={styles.section}>
        <View style={styles.headerContainer}>
          <Text style={styles.sectionTitle}>Lemmikit</Text>
          <TouchableOpacity onPress={() => setPetInfo(true)} style={styles.iconButton}>
            <Feather name="plus" size={28} color="#2196F3" />
          </TouchableOpacity>
        </View>

        {petInfo ? (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Nimi"
              value={newPetData.name}
              onChangeText={(text) => setNewPetData({ ...newPetData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Ikä"
              value={newPetData.age}
              onChangeText={(text) => setNewPetData({ ...newPetData, age: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Rotu"
              value={newPetData.race}
              onChangeText={(text) => setNewPetData({ ...newPetData, race: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Sukupuoli"
              value={newPetData.gender}
              onChangeText={(text) => setNewPetData({ ...newPetData, gender: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Esittely"
              value={newPetData.info}
              onChangeText={(text) => setNewPetData({ ...newPetData, info: text })}
            />
            <Button
              title={selectedPetId ? "Tallenna muutokset" : "Lisää lemmikki"}
              onPress={selectedPetId ? handleEditPet : handleAddPet}
            />
          </View>
        ) : (
          petData.map((pet) => (
            <View key={pet.id} style={styles.petBox}>
              <Text style={styles.detailText}>Nimi: {pet.name || "Tietoa ei saatavilla"}</Text>
              <Text style={styles.detailText}>Ikä: {pet.age || "Tietoa ei saatavilla"}</Text>
              <Text style={styles.detailText}>Rotu: {pet.race || "Tietoa ei saatavilla"}</Text>
              <Text style={styles.detailText}>Sukupuoli: {pet.gender || "Tietoa ei saatavilla"}</Text>
              <Text style={styles.detailText}>Esittely: {pet.info || "Tietoa ei saatavilla"}</Text>
              <View style={styles.petEdit}>
              <TouchableOpacity onPress={() => setPetInfo(true)}>
            <Feather name="edit" size={28} color="#2196F3" onPress={() => {
                setSelectedPetId(pet.id);
                setNewPetData(pet);
                setPetInfo(true);}}/>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeletePet(pet.id)}>
                  <Feather name="trash-2" size={28} color="#FF6347" />
                </TouchableOpacity>
            </View>
            </View>
          ))
        )}
      </View>


      {/* Toiminnot */}
      <View style={styles.hoitaja}>
        <Text style={styles.hoitajaText}>{isHoitaja ? 'Olet ilmoittautunut hoitajaksi' : 'Ilmoittaudu hoitajaksi'}</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isHoitaja ? '#3b981f' : '#62695f'}
          onValueChange={toggleHoitajaStatus}
          value={isHoitaja}
          style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
        />
      </View >
      <View style={styles.section}>
        <View style={styles.headerContainer}>
          <Text style={styles.sectionTitle}>Omat varaukset</Text>
          <TouchableOpacity onPress={() => setUserInfo(true)}>  
          </TouchableOpacity>
        </View>
        </View>
        <View style={styles.section}>
        <View style={styles.headerContainer}>
          <Text style={styles.sectionTitle}>Arvostelut</Text>
          <TouchableOpacity onPress={() => setUserInfo(true)}>  
          </TouchableOpacity>
        </View>
        </View>
        <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionButtonText}>Poista Käyttäjä</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 26,
    //fontWeight: 'bold',
    marginBottom: 20,
    color: '#000000',
    textAlign: 'center',
    fontFamily:'DeliusSwashCaps'
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
  imageButton: {
    marginVertical: 5,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
  },
  imageButtonText: {
    color: '#000000',
    fontSize: 14,
    //fontWeight: '500',
    fontFamily:'DeliusSwashCaps'
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    //fontWeight: 'bold',
    color: '#000000',
    fontFamily:'DeliusSwashCaps'
  },
  detailText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 5,
    fontFamily:'DeliusSwashCaps'
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 8,
    paddingHorizontal: 5,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  actionButton: {
    marginVertical: 10,
    paddingVertical: 15,
    backgroundColor: '#2196F3',
    borderRadius: 25,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#000000',
    fontSize: 16,
    //fontWeight: 'bold',
    fontFamily:'DeliusSwashCaps'
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
    elevation: 3
  },
  petEdit:{
    flexDirection:'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 15,
  },
  iconButton: {
    padding: 5,
    borderRadius: 5,
  },
  hoitaja: {
    flexDirection:'row-reverse',
    justifyContent:'flex-end',
    alignItems: 'center',
  },
  hoitajaText:{
    fontSize:20,
    marginLeft:15,
    fontFamily:'DeliusSwashCaps',
    color:'#000000'
  }
});