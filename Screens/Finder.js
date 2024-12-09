import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ref, get } from 'firebase/database';
import { database } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { Rating } from 'react-native-ratings';


export default function FinderScreen({navigation}) {
  const [hoitajat, setHoitajat] = useState([]);
 

  //Haetaan tietokannasta kaikki käyttäjät, joilla isHoitaja arvo on true.
  //Haetaan samalla myös tietokannasta arvostelujen keskiarvo
  useEffect(() => {
    const fetchHoitajatWithRatings = async () => {
      const usersRef = ref(database, 'users');
  
      try {
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log(data)
  
          const hoitajaList = Object.entries(data)
            .filter(([, userData]) => userData.isHoitaja === true)
            .map(([id, userData]) => ({
              id, 
              name: userData.name || "Nimetön käyttäjä",
              profileImage: userData.profileImage || null,
              averageRating: userData.ratingsSummary?.average || 0, 
              ratingCount: userData.ratingsSummary?.count || 0,
            }));
  
          setHoitajat(hoitajaList);
        } else {
          console.log("Ei löytynyt hoitajia.");
        }
      } catch (error) {
        console.error("Virhe hoitajien ja arvostelujen haussa:", error);
      }
    };
  
    fetchHoitajatWithRatings();
  }, []);


  //Navigointi käyttäjän yleiseen profiiliin, välitetään item.id profiiliin
  const handlePress = (item) => {
    console.log("Navigoidaan käyttäjän kanssa:", item.id);  
    navigation.navigate('YleinenProfiili', { userData: item.id });  
  };

  //Renderöidään hoitaja lista
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.hoitajaItem} onPress={() => handlePress(item)}>
      {item.profileImage ? (
        <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
      ) : (
        <View style={styles.placeholderImage} />
      )}
      <Text style={styles.hoitajaName}>{item.name}</Text>
      <View style={styles.ratingView}>
      <Rating
        type='star'
        ratingCount={5}
        startingValue={item.averageRating} 
        imageSize={15}
        readonly
        tintColor='#ffffff'
      />
      <Text style={styles.ratingText}>Arvosteluja: {item.ratingCount}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      
      <FlatList
        data={hoitajat}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2} 
        columnWrapperStyle={styles.columnWrapper} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor:'#f2f2f2'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  columnWrapper: {
    justifyContent: 'space-between', 
    marginBottom:20,
  },
  hoitajaItem: {
    flex: 1,
    padding: 10,
    marginVertical: 10,
    marginHorizontal:10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    backgroundColor: '#ccc',
  },
  hoitajaName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom:10,
  },
  ratingText:{
    fontSize:12
  }



});