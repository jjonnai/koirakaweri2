import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ref, get } from 'firebase/database';
import { database } from '../firebase';
import { useNavigation } from '@react-navigation/native';

export default function FinderScreen({navigation}) {
  const [hoitajat, setHoitajat] = useState([]);

  useEffect(() => {
    const fetchHoitajat = async () => {
      const usersRef = ref(database, 'users');

      try {
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
          const data = snapshot.val();

          const hoitajaList = Object.entries(data)
            .filter(([, userData]) => userData.isHoitaja === true)  
            .map(([id, userData]) => ({
              id,           
              ...userData,  
            }));

          setHoitajat(hoitajaList);
        } else {
          console.log("Ei löytynyt hoitajia.");
        }
      } catch (error) {
        console.error("Virhe hoitajien haussa:", error);
      }
    };

    fetchHoitajat();
  }, []);


  const handlePress = (item) => {
    console.log("Navigoidaan käyttäjän kanssa:", item.id);  
    navigation.navigate('YleinenProfiili', { userData: item.id });  
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.hoitajaItem} onPress={() => handlePress(item)}>
      {item.profileImage ? (
        <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
      ) : (
        <View style={styles.placeholderImage} />
      )}
      <Text style={styles.hoitajaName}>{item.name || "Nimetön käyttäjä"}</Text>
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
    backgroundColor: '#fff'
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
    backgroundColor: '#f9f9f9',
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
    textAlign: 'center'
  },
  hoitajaInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  }
});