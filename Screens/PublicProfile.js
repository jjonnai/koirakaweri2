import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { database, ref, get, push, set } from '../firebase';
import { getAuth } from 'firebase/auth';
import { Feather } from '@expo/vector-icons';
import { Rating } from 'react-native-ratings';

export default function PublicProfile({ route }) {

  const { userData } = route.params;  
  const [userDataState, setUserDataState] = useState(null);
  const [petData, setPetData] = useState([]);
  const [isHoitaja, setIsHoitaja] = useState(false);

  
  const [ratingCount, setRatingCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
/*  const [ratingInfo, setRatingInfo] = useState(false);
  const [RatingData, setRatingData] = useState([]);
  const [newRatingData, setNewRatingData] = useState({
    email: '',
    
  });*/
  const auth = getAuth();

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

  //ARVOSTELU
  useEffect(() => {
    console.log("userData ennen tarkistusta:", userData);
    if (!userData) {
      console.error("Virhe: käyttäjän sähköposti puuttuu.");
      return; 
    }
    
    console.log("suoritetaan useEffect");

    const fetchRatingData = async (email) => {
      console.log(email)
    const ratedUserEmailFormatted = userData.replace(/\./g, '_');
    const ratingsRef = ref(database, `users/${ratedUserEmailFormatted}/ratings`)
    console.log("RatingsRef:", ratingsRef);
    
    
    try {
      console.log("Ennen get-kutsua");
      const snapshot = await get(ratingsRef);
      if (snapshot.exists()) {
        console.log("Tietoja löytyi:", snapshot.val());
        console.log("Haettu RatingData:", RatingData);
        const RatingData = snapshot.val()
        const ratingEntries = Object.values(RatingData);
        console.log(RatingData)

        const count = ratingEntries.length;
        setRatingCount(count)

        const totalRating = ratingEntries.reduce((sum, ratingData) => sum + ratingData.rating, 0);
        const average = totalRating / count;
        setAverageRating(average);
        console.log(average)
      }else {
        setRatingCount(0);
        setAverageRating(0);
        console.log("ei toimi oikein")
        console.log("Tietoja ei löytynyt.");
      }
    } catch(error) {
      console.error('Virhe arvostelujen haussa', error)
      setRatingCount(0);
      setAverageRating(0);
    }
    
    }
    fetchRatingData();
   

  }, [userData])


  const handleRating = async (rating) => {
    try {
      console.log('Tallennettava rating:', rating);
  
      const user = auth.currentUser;
      if (!user) {
        alert('Käyttäjä ei ole kirjautunut sisään.');
        return;
      }
  
      const ratedUserEmailFormatted = userData.replace(/\./g, '_');
      const raterUserEmailFormatted = user.email.replace(/\./g, '_');
      const ratingRef = ref(database, `users/${ratedUserEmailFormatted}/ratings/${raterUserEmailFormatted}`);
      //const newRatingRef = push(ratingsRef);

      await set(ratingRef, {
        rating: rating, 
      });
  
      console.log('Rating tallennettu onnistuneesti');
      alert('Arvostelu tallennettu onnistuneesti!');
    } catch (error) {
      console.error('Virhe tallennettaessa ratingia:', error);
      alert('Arvostelun tallennus epäonnistui.');
    }
  };


 




  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{auth.currentUser?.email}</Text>
      <Text style={styles.title}>{userData}</Text>
      
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
      <View style={styles.section}>
        <View style={styles.headerContainerRating}>
          <Text style={styles.sectionTitle}>Arvostelut</Text>
          <Text>Arvosteluja: {ratingCount}</Text>
          <Rating
           type='star'
           ratingCount={5}
           startingValue={averageRating}
           imageSize={40}
           showRating
           onFinishRating={handleRating}
/>
<Text>Kerkiarvo: {averageRating}</Text>
        </View>
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
    marginBottom:15,
  },
  headerContainerRating:{
  
  },
});