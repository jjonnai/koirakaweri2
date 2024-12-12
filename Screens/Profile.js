import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Switch } from 'react-native';
import { getAuth } from 'firebase/auth';
import { Button} from '@rneui/themed';
import { database, ref, set, update, get, push, remove } from '../firebase';
import Feather from '@expo/vector-icons/Feather';
import { pickProfileImage, pickPetImage, takePhoto, saveProfileImage, fetchProfileImage, fetchPetImage, savePetImage } from "../Components/ProfileFunctions";
import CalendarComponent from '../Components/CalendarComponent'


export default function ProfileScreen({ navigation }) {

  const auth = getAuth();
  const [isHoitaja, setIsHoitaja] = useState(false);
  const [isPetSaved, setIsPetSaved] = useState(false);


  const [userInfo, setUserInfo] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    info: '',
    city: '',
  });


  const [petInfo, setPetInfo] = useState(false);
  const [petData, setPetData] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [newPetData, setNewPetData] = useState({
    name: '',
    age: '',
    race: '',
    gender: '',
    info: '',
    petImage:''
  });


  //Käyttäjä ja lemmikki tietojen hakeminen tietokannasta
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.log('Käyttäjä ei ole kirjautunut sisään.');
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
            city: data.city,
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


  //Käyttäjän tietojen muokkaaminen
  const handleUserData = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.log('Käyttäjä ei ole kirjautunut sisään.');
      return;
    }

    const userEmail = user.email.replace(/\./g, '_');
    const userRef = ref(database, `users/${userEmail}`);

    try {
      await update(userRef, { name: userData.name, info: userData.info, city: userData.city, isHoitaja: isHoitaja, });
      console.log("Käyttäjätiedot tallennettu!");
    } catch (error) {
      console.error("Virhe käyttäjätietojen tallennuksessa:", error);
      console.log("Tietojen tallennus epäonnistui");
    }
  };

  //Lemmikin lisääminen tietokantaan
  const handleAddPet = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.log('Käyttäjä ei ole kirjautunut sisään.');
      return;
    }
  
    const userEmail = user.email.replace(/\./g, '_');
    const petsRef = ref(database, `users/${userEmail}/pets`);
  
    try {
      const newPetRef = push(petsRef);
      const newPetId = newPetRef.key;
  
      const petWithId = {
        id: newPetId,
        ...newPetData,
        petImage, 
      };
  
      await update(newPetRef, petWithId);
      console.log('Lemmikkitiedot tallennettu!');
  
      setPetData([...petData, petWithId]);
  
      setIsPetSaved(true);

      setNewPetData({
        name: '',
        age: '',
        race: '',
        gender: '',
        info: '',
        petImage: '',
      });
      setPetImage(''); 
    } catch (error) {
      console.error('Virhe tallentaessa lemmikkitietoja:', error);
      console.log('Tietojen tallennus epäonnistui');
    }
  
    setPetInfo(false);
  };
  
  //Lemmikki tietojen muokkaaminen
  const handleEditPet = async () => {
    if (!selectedPetId) {
      console.log('Valitse muokattava lemmikki.');
      return;
    }
  
    const user = auth.currentUser;
    if (!user) {
      console.log('Käyttäjä ei ole kirjautunut sisään.');
      return;
    }
    console.log("Lemmikin tieto: ${isPetSaved}")
  
    const userEmail = user.email.replace(/\./g, '_');
    const petRef = ref(database, `users/${userEmail}/pets/${selectedPetId}`);
  
    try {
      await update(petRef, { ...newPetData, petImage });
      console.log('Lemmikkitiedot päivitetty!');
  
      setPetData(petData.map(pet =>
        pet.id === selectedPetId ? { id: pet.id, ...newPetData, petImage } : pet
      ));
  
      setNewPetData({ name: '', age: '', race: '', gender: '', info: '', petImage:'' });
      setPetImage(null);
      setSelectedPetId(null);
    } catch (error) {
      console.error("Virhe lemmikkitietojen päivittämisessä:", error);
    }
  
    setPetInfo(false);
  };

  //Lemmikin poistaminen tietokannasta
  const handleDeletePet = async (petId) => {
    const user = auth.currentUser;
    if (!user) {
      console.log('Käyttäjä ei ole kirjautunut sisään.');
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
    }
  };



  //PROFIILIKUVAN LISÄÄMINEN

  //const Profile = () => {
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    fetchProfileImage(setProfileImage, auth, database);
  }, [auth.currentUser]);


  //LEMMIKKIKUVAN LISÄÄMINEN
  const [petImage, setPetImage] = useState(null);
  useEffect(() => {
    if (selectedPetId) {
      fetchPetImage(setPetImage, auth, database, selectedPetId);
    }
  }, [auth.currentUser, selectedPetId]);

 

  //Hoitajaksi ilmoittautuminen
  const toggleHoitajaStatus = () => {
    setIsHoitaja((prevStatus) => {
      const newStatus = !prevStatus;
      const user = auth.currentUser;
      if (user) {
        const userEmail = user.email.replace(/\./g, '_');
        const userRef = ref(database, `users/${userEmail}`);
        update(userRef, { isHoitaja: newStatus }).catch((error) => {
          console.error("Virhe isHoitaja-arvon tallennuksessa:", error);
        });
      }
      return newStatus;
    })
  }


  const handlePress = (item) => {
    //console.log("Navigoidaan käyttäjän kanssa:", item.id);  
    navigation.navigate('Varaus', { userData: item.id });
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* PROFIILIKUVA */}
      <View style={styles.profileImageContainer}>
        {profileImage ? (
          <Image
            source={{ uri: profileImage }}
            style={styles.profileImage}
          />
        ) : (
          <Feather name="user" size={150} color='black' />
        )}
        <TouchableOpacity onPress={() => pickProfileImage(setProfileImage, (uri) => saveProfileImage(uri, auth, database))}>
          <Text style={styles.choosePhoto}>Valitse galleriasta</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => takePhoto(setProfileImage, (uri) => saveProfileImage(uri, auth, database))}>
          <Text style={styles.choosePhoto}>Ota uusi kuva</Text>
        </TouchableOpacity>
      </View>

      {/* OMAT TIEDOT */}
      <View style={styles.section}>
        <View style={styles.headerContainer}>
          <Text style={styles.sectionTitle}>Omat tiedot</Text>
          <TouchableOpacity onPress={() => setUserInfo(true)}>
            <Feather name="edit" size={24} color='#ff3300'/>
          </TouchableOpacity>
        </View>
        <Text style={styles.detailText}>{auth.currentUser?.email}</Text>
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
              placeholder="Paikkakunta"
              value={userData.city}
              onChangeText={(text) => setUserData({ ...userData, city: text })}
            />
            <TextInput
            multiline={true}
            numberOfLines={6}
            scrollEnabled={true}
            //textAlignVertical="top'
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
          <View style={styles.petBox}>
     
            <Text style={styles.detailText}>Nimi: {userData.name || "Tietoa ei saatavilla"}</Text>
            <Text style={styles.detailText}>Paikkakunta: {userData.city || "Tietoa ei saatavilla"}</Text>
              <Text style={styles.detailText}>{userData.info || "Tietoa ei saatavilla"}</Text>

          </View>
        )}
      </View>

      {/* LEMMIKKI TIEDOT */}
      <View style={styles.section}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Lemmikit</Text>
        <TouchableOpacity
      onPress={() => {
        setPetInfo(true);  
        setSelectedPetId(null);
        setNewPetData({
          name: '',
          age: '',
          race: '',
          gender: '',
          info: '',
        });
        setIsPetSaved(false);  
      }}
      style={styles.iconButton}
    >
          <Feather name="plus" size={28} color='#ff3300' />
        </TouchableOpacity>
      </View>

      {petInfo ? (
        
        <View>
          {petImage && isPetSaved ? (
            <Image source={{ uri: petImage }} style={styles.petImage} />
            
          ) : (
            !isPetSaved && (
              console.log("ei kuvaa")
            )
          )}
          
          <TouchableOpacity onPress={() => pickPetImage(setPetImage)}>
  <Text style={styles.choosePhoto}>
    {petImage ? 'Vaihda kuva' : 'Valitse galleriasta'}
  </Text>
</TouchableOpacity>

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
          multiline={true}
          numberOfLines={6}
          scrollEnabled={true}
            style={styles.input}
            placeholder="Esittely"
            value={newPetData.info}
            onChangeText={(text) => setNewPetData({ ...newPetData, info: text })}
          />

<Button
      title={isPetSaved ? "Tallenna muutokset" : "Lisää lemmikki"}  
      onPress={async () => {
        if (isPetSaved) {
          await handleEditPet(); 
        } else {
          await handleAddPet(); 
        }
      }}
      buttonStyle={{
        backgroundColor: '#ff3300',
        borderRadius: 12,
      }}
      titleStyle={{
        color: '#ffffff',
      }}
    />
<Button
  title="Peruuta"
  onPress={ () => {
    setPetInfo(false);
  }}
  buttonStyle={{
    backgroundColor: '#ff3300', 
    borderRadius: 16, 
    marginTop:8,
    
  }}
  titleStyle={{
    color: '#ffffff', 
  }}
/>
          
        </View>
      ) : (
        petData.map((pet) => (
          <View key={pet.id} style={styles.petBox}>
      <View style={styles.petImageContainer}>
          <Image source={{ uri: pet.petImage }} style={styles.petImage} />
        </View>
            <View style={styles.petImageContainer}>
            </View>
            <Text style={styles.detailText}>Nimi: {pet.name || "Tietoa ei saatavilla"}</Text>
            <Text style={styles.detailText}>Ikä: {pet.age || "Tietoa ei saatavilla"}</Text>
            <Text style={styles.detailText}>Rotu: {pet.race || "Tietoa ei saatavilla"}</Text>
            <Text style={styles.detailText}>Sukupuoli: {pet.gender || "Tietoa ei saatavilla"}</Text>
            <Text style={styles.detailText}>Esittely: {pet.info || "Tietoa ei saatavilla"}</Text>
            <View style={styles.petEdit}>
              <TouchableOpacity onPress={() => setPetInfo(true)}>
                <Feather name="edit" size={28} color='#ff3300' onPress={() => {
                  setSelectedPetId(pet.id);
                  setNewPetData(pet);
                  setPetInfo(true);
                  setIsPetSaved(true); 
                }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeletePet(pet.id)}>
                <Feather name="trash-2" size={28} color='#ff3300' />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>



      <View style={styles.hoitaja}>
        <Text style={styles.hoitajaText}>{isHoitaja ? 'Olet ilmoittautunut hoitajaksi' : 'Ilmoittaudu hoitajaksi'}</Text>
        <Switch
          trackColor={{ false: '#ffffff', true: '#ff3300' }}
          thumbColor={isHoitaja ? '#ffffff': '#ff3300'}
          onValueChange={toggleHoitajaStatus}
          value={isHoitaja}
          style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
        />
      </View>
      <View>
        {isHoitaja && (
          <View style={styles.calendarContainer}>
            <Text style={styles.calendarHeader}> Olet ilmoittautunut hoitajaksi näille ajoille</Text>

            <CalendarComponent userEmail={auth.currentUser.email.replace(/\./g, '_')} database={database} />
          </View>
        )}
      </View >
      <TouchableOpacity onPress={handlePress} style={styles.actionButton}>
        <Text style={styles.actionButtonText}>Ilmoita hoidontarve</Text>
      </TouchableOpacity>



      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionButtonText}>Poista Käyttäjä</Text>
      </TouchableOpacity>
      <View style={styles.bottomContainer}></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 24,
    //fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    //fontFamily:'DeliusSwashCaps'
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 95,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  imageButton: {
    marginVertical: 5,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
  },
  imageButtonText: {
    color: '#000000',
    fontSize: 14,
    //fontWeight: '500',
    //fontFamily:'DeliusSwashCaps'
  },
  section: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    textAlign: 'center'
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }, 
  sectionTitle: {
    fontSize: 24,
    //fontWeight: 'bold',
    color: '#000000',

    //fontFamily:'DeliusSwashCaps'
  },
  detailText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 5,
    marginTop: 5
    //fontFamily:'DeliusSwashCaps'
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
    borderWidth:0,
    padding:8,
    marginLeft:34,
    marginRight:34,
    marginTop:16,
    borderRadius:16,
    backgroundColor: '#ff3300',
    alignItems: 'center',
  },
  actionButtonText: {
    
    fontSize: 16,
    fontWeight: 'bold',
    color:'#ffffff'
    //fontFamily:'DeliusSwashCaps'
  },
  petBox: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#ddd',
    backgroundColor: '#ffffff',


  },
  petEdit: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 15,
  },
  iconButton: {
    padding: 5,
    borderRadius: 5,
  },
  hoitaja: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  hoitajaText: {
    fontSize: 20,
    marginLeft: 15,
    //fontFamily:'DeliusSwashCaps',
    color: '#000000'
  },

  calendarContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  calendarHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  notificationText: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,

  },
  choosePhoto: {
    borderWidth:0.1,
    backgroundColor:'#ff3300',
    padding:8,
    borderRadius:16,
    marginBottom:3,
    color:'#ffffff',
    textAlign:'center',
    paddingHorizontal:16,

  },
  button2: {
    borderWidth: 0,
    backgroundColor: '#fffff',
    padding: 16,
    borderRadius: 16
  },
  petImage: {
    width: 100,
    height: 100,
    borderRadius: 75,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#f2f2f2',
    alignContent:'center'
  },
  petImageContainer: {
    alignItems:'center'
  },
  bottomContainer:{
    borderWidth:0,
    paddingHorizontal:32,
    padding:30,
    backgroundColor:'#f2f2f2',
  },

});