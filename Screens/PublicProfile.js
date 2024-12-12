import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { database, ref, get, set, onValue } from '../firebase';
import { getAuth } from 'firebase/auth';
import { Feather } from '@expo/vector-icons';
import { Rating } from 'react-native-ratings';
import { sendMessage } from '../Components/MessageFunc';



export default function PublicProfile({ route }) {

  const { userData } = route.params;  
  const [userDataState, setUserDataState] = useState(null);
  const [petData, setPetData] = useState([]);
  const [isHoitaja, setIsHoitaja] = useState(false);

  
  const [ratingCount, setRatingCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingUpdated, setRatingUpdated] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSaved, setRatingSaved] = useState(false);

  const [showMessageForm, setShowMessageForm] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  //const [messages, setMessages] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const auth = getAuth();

  //Haetaan navigoinnin kautta välitetyllä item.id:llä käyttäjän profiili
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

//Haetaan käyttäjän lemmikkien tiedot
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

  //ARVOSTELU
  useEffect(() => {
    if (!userData) {
      console.error("Virhe: käyttäjän sähköposti puuttuu.");
      return;
    }
  
    //console.log("Käynnistetään keskiarvon ja arvostelujen määrän haku käyttäjälle:", userData);
  
    const fetchRatingSummary = async () => {
      const ratedUserEmailFormatted = userData.replace(/\./g, '_');
      const ratingsSummaryRef = ref(database, `users/${ratedUserEmailFormatted}/ratingsSummary`);
  
      try {
        const snapshot = await get(ratingsSummaryRef);
  
        if (snapshot.exists()) {
          const summaryData = snapshot.val();
          const average = summaryData.average || 0;
          const count = summaryData.count || 0;
  
          setRatingCount(count);
          setAverageRating(average);
  
          console.log(`Haetut arvot: keskiarvo = ${average}, määrä = ${count}`);
        } else {
          console.log("Tietoja ei löytynyt.");
          setRatingCount(0);
          setAverageRating(0);
        }
      } catch (error) {
        console.error("Virhe yhteenvetotietojen haussa:", error);
        setRatingCount(0);
        setAverageRating(0);
      }
    };
  
    fetchRatingSummary();

    setRatingUpdated(false);
  
  }, [userData, ratingUpdated]);  
 

//Haetaan ja lasketaan arvostelujen keskiarvo ja lisätään se tietokantaan, 
  const handleRating = async (rating) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('Käyttäjä ei ole kirjautunut sisään.');
        return;
      }
  
      const ratedUserEmailFormatted = userData.replace(/\./g, '_');
      const raterUserEmailFormatted = user.email.replace(/\./g, '_');
      const ratingRef = ref(database, `users/${ratedUserEmailFormatted}/ratings/${raterUserEmailFormatted}`);

      await set(ratingRef, { rating });
  
      const ratingsRef = ref(database, `users/${ratedUserEmailFormatted}/ratings`);
      const snapshot = await get(ratingsRef);
  
      if (snapshot.exists()) {
        const ratings = snapshot.val();
        const ratingEntries = Object.values(ratings);

        const currentCount = ratingEntries.length;
        const totalRating = ratingEntries.reduce((sum, ratingData) => sum + ratingData.rating, 0);
 
        const newAverage = totalRating / currentCount;

        const summaryRef = ref(database, `users/${ratedUserEmailFormatted}/ratingsSummary`);
        await set(summaryRef, {
          average: newAverage,  
          count: currentCount,  
        });
 
        setRatingUpdated(true);
  
      }
    } catch (error) {
      console.error('Virhe tallennettaessa ratingia:', error);
    }
  };
  
 

  const toggleMessageForm = () => {
    setShowMessageForm((prev) => !prev); 
  };

  //Lähettää käyttäjälle viestin
  const handleSendMessageFromProfile = async () => {
    if (!userData) {
      console.error('Vastaanottajan sähköposti puuttuu.');
      return;
    }
  
    const formattedEmail = userData.replace(/\./g, '_'); 
    try {
      await sendMessage(formattedEmail, newMessage);

      setNewMessage('');
      setShowMessageForm(false);
      console.log("Viesti lähetetty!");
    } catch (error) {
      console.error('Viestin lähetys epäonnistui:', error);
    }
  };


  const handleSaveRating = async () => {
    if (rating > 0) {
      await handleRating(rating); 
      setRatingSaved(true);
    } else {
      alert('Valitse ensin arvostelu ennen tallentamista.');
    }
  };

  const handleRatingSelection = (newRating) => {
    setRating(newRating);
    setRatingSaved(false); 
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileNameContainer}>
      <Text style={styles.profileName}>{userData}</Text>
      </View>
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
        <Text style={styles.detailText}>Paikkakunta: {userDataState?.city || "Tietoa ei saatavilla"}</Text>
        <Text style={styles.detailText}>{userDataState?.info || "Tietoa ei saatavilla"}</Text>
      </View>

      {/* Lemmikkien tiedot */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lemmikit</Text>
        {petData.length > 0 ? (
          petData.map((pet) => (
            <View key={pet.id} style={styles.petBox}>
              <View style={styles.petImageContainer}>
              {pet.petImage ? (
          <Image source={{ uri: pet.petImage }} style={styles.petImage} />
        ) : (
          <Feather name="image" size={150} color="black" /> 
        )}
        </View>
        <View style={styles.section}>
              <Text style={styles.detailText}>Nimi: {pet.name || "Tietoa ei saatavilla"}</Text>
              <Text style={styles.detailText}>Ikä: {pet.age || "Tietoa ei saatavilla"}</Text>
              <Text style={styles.detailText}>Rotu: {pet.race || "Tietoa ei saatavilla"}</Text>
              <Text style={styles.detailText}>Sukupuoli: {pet.gender || "Tietoa ei saatavilla"}</Text>
              <Text style={styles.detailText}>{pet.info || "Tietoa ei saatavilla"}</Text>
            </View>
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
      <View style={styles.section2}>
        <View style={styles.headerContainerRating}>
        <Text style={styles.sectionTitle}>Arvostelut</Text>
    <Text>Arvosteluja: {ratingCount}</Text>
    <Text>Keskimääräinen arvosana: {Math.round(averageRating)}</Text>
    <View style={styles.ratingView}>
      <Rating
        type='star'
        ratingCount={5}
        startingValue={averageRating}
        imageSize={40}
        showRating
        onFinishRating={handleRatingSelection}
        jumpValue={1}
      
        ratingTextColor='black'
      />
    </View>
    <TouchableOpacity onPress={handleSaveRating} style={styles.actionButton}>
      <Text style={styles.actionButtonText}>
        {ratingSaved ? 'Arvostelu tallennettu' : 'Tallenna arvostelu'}
      </Text>
    </TouchableOpacity>
        </View>
        </View>
        <View style={styles.newMail}>
      <TouchableOpacity  onPress={toggleMessageForm} style={styles.actionButton}>
      <Text style={styles.actionButtonText}>Viesti hoitajalle</Text>
      </TouchableOpacity>
      </View>
      {showMessageForm && (
        <View style={styles.inputContainer}>

          <TextInput
            style={styles.input}
            placeholder="Kirjoita viesti"
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity onPress={handleSendMessageFromProfile} style={styles.actionButton} >
        <Text style={styles.actionButtonText}>Lähetä viesti</Text>
        </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

 

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f2f2f2',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop:8,
    padding:8,
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ccc',
    marginTop:8,
    backgroundColor:'#99ccff'
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: 'rgba(95, 158, 160, 0.6)',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  section2: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#ffffff',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  detailText: {
    fontSize: 16,
    color: 'black',
    marginBottom: 8,
  },
  petBox: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 0.3,
    //borderColor: 'rgba(95, 158, 160, 0.8)',
    backgroundColor: '#ffffff',
    marginBottom:16
 
  },
  hoitaja: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  hoitajaText: {
    fontSize: 16,
    marginLeft: 16,
    marginBottom:16,
    fontWeight:'bold'
  },
  actionButton: {
    marginVertical: 8,
    paddingHorizontal: 16,
    padding:8,
    backgroundColor: '#ff3300',
    borderRadius: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign:'center',
    color:'#ffffff'
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 2,
    padding: 8,
    marginVertical: 8,
    borderRadius: 8,
  },
  profileName:{
    textAlign:'center',
    fontWeight:'bold',
    fontSize:24,
    padding:8,
  },
  profileNameContainer:{
    padding:8,
    width:'100%'
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

});