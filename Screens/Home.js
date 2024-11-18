import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';

const Home = () => {
  const [loaded] = useFonts({
    DeliusSwashCaps: require('../assets/fonts/DeliusSwashCaps-Regular.ttf'),
    Raleway_italic: require('../assets/fonts/Raleway-Italic-VariableFont_wght.ttf'),
    Raleway: require('../assets/fonts/Raleway-VariableFont_wght.ttf')
  })

  if (!loaded) {return null;}

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Tervetuloa käyttämään Koirakaweria!</Text>
      </View>
      <Text style={styles.descriptionText}>
        Tervetuloa Koirakaweriin, koirasi hoitokaverin kotiin! 🐾
      </Text>
      <Text style={styles.bodyText}>
        Kiireinen arki tai lomamatka tulossa? Koirakawerissa löydät luotettavan hoitajan
        lemmikillesi nopeasti ja turvallisesti. Tutustu hoitajiin ja varaa mielenrauha
        sekä itsellesi että koirallesi. Meillä voit löytää luotettavan hoitajan, joka
        välittää koirastasi kuin omastaan. Etsi, vertaile ja varaa hoito helposti – 
        lähdetään tekemään lemmikillesi paras hoitokokemus!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fefefe',
  },
  headerContainer: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#b42a2a',
  },
  headerText: {
    fontSize: 28,
    color: 'white',
    textAlign: 'center',
    fontFamily:'Raleway'
  },
  descriptionText: {
    fontSize: 24,
    fontWeight: '650',
    color: '#b42a2a',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily:'Raleway'
  },
  bodyText: {
    fontSize: 16,
    color: 'black',
    lineHeight: 28,
    textAlign: 'center',
    paddingHorizontal: 10,
    fontFamily: 'Raleway_italic',
  },
});

export default Home;