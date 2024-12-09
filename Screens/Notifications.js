import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { database, ref, get, onValue, auth,set, update} from '../firebase';
import { getAuth } from 'firebase/auth';
import { Provider, Dialog, Portal, useTheme } from 'react-native-paper';
import { Button } from '@rneui/base';

export default function Notifications({navigation}) {
  const [allNotifications, setAllNotifications] = useState([]);
  const [expandedNotification, setExpandedNotification] = useState(null);
  const [updateStatus, setUpdateStatus] = useState(false);

  const [visibleAlert, setVisibleAlert] = useState(false);
  const theme = useTheme(); 

  const auth = getAuth();
  const user = auth.currentUser;

//Haetaan tietokannasta kaikki ilmoitukset
  useEffect(() => {
    const fetchAllNotifications = () => {
      const usersRef = ref(database, 'users');
  
      const unsubscribe = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          const notifications = [];
  
          Object.entries(usersData).forEach(([userEmail, userData]) => {
            if (userData.notifications) {
              Object.entries(userData.notifications).forEach(([notificationId, notificationData]) => {
                if (notificationData.status?.value === 'odottaa valintaa' && userEmail !== user.email.replace(/\./g, '_')) {
                  notifications.push({
                    id: notificationId,
                    userEmail: userEmail.replace(/_/g, '.'),
                    ...notificationData,
                  });
                }
              });
            }
          });
          
          notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          setAllNotifications(notifications); 
        } else {
          setAllNotifications([]); 
        }
      });
  
      return unsubscribe;
    };
    const unsubscribe = fetchAllNotifications();
    return () => unsubscribe();
  }, []);


  //Näytä tiedot napin funktio
  const toggleNotificationDetails = (notificationId) => {
    setExpandedNotification(expandedNotification === notificationId ? null : notificationId);
  };


  //Funktio ilmoituksen hyväksynnälle, tarkistaa onko ilmoittautuvalla käyttäjällä 
  //kyseiselle päivälle jo varauksia
  const handleAccept = async (item) => {
    const user = auth.currentUser;
    if (!user) {
        alert('Käyttäjä ei ole kirjautunut sisään.');
        return;
    }
    const acceptedByEmail = user.email;
    const sanitazedEmail = item.userEmail.replace(/\./g, '_');
    const userEmail = user.email.replace(/\./g, '_');
    const dateKey = item.dates; 

    const reservationRef = ref(database, `reservations/${userEmail}/${dateKey}`);
    console.log(reservationRef)
    console.log(sanitazedEmail)
    console.log(acceptedByEmail)

    onValue(reservationRef, (snapshot) => {
        if (snapshot.exists()) {

            alert('Sinulla on jo varaus tälle päivälle!');
            return; 
        } else {
            const updateStatusRef = ref(database, `users/${sanitazedEmail}/notifications/${item.id}`);

            const updateStatus = {
                status: {
                    value: 'odottaa hyväksyntää',
                    acceptedBy: acceptedByEmail,
                }
            };

            update(updateStatusRef, updateStatus)
                .then(() => {
                    setVisibleAlert(true);
                    console.log("Toimiiko update");
                })
                .catch((error) => {
                    console.error('Virhe hyväksynnässä', error);
                    Alert.alert('Hyväksyminen epäonnistui');
                });
        }
    });
};

  const renderNotification = ({ item }) => (

    <View style={styles.notificationItem}>
      <Text style={styles.serviceText}>Palvelu: {item.service}</Text>
      <Text>Omistaja: {item.userEmail}</Text>
      <Text>
  Hoidontarve:{' '}
  {item.dates
    .map((date) => new Date(date).toLocaleDateString('fi-FI'))
    .join(', ')}
</Text>
      {expandedNotification === item.id && (
        <>
      <Text>Lemmikkien nimet: {item.petNames ? item.petNames.join(', ') : 'Nimet puuttuvat'}</Text>
      <Text>Luotu: {new Date(item.createdAt).toLocaleString('fi-FI', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })}</Text>
      {item.additionalInfo && (
        <View style={styles.additionalInfo}>
          <Text>Lisätiedot:</Text>
          <Text>- Tulee toimeen muiden kanssa: {item.additionalInfo.getsAlong ? 'Kyllä' : 'Ei'}</Text>
          <Text>- Saa olla muita lemmikkejä: {item.additionalInfo.allowsOtherPets ? 'Kyllä' : 'Ei'}</Text>
          <Text>- Erityistarpeet: {item.additionalInfo.specialNeeds ? 'Kyllä' : 'Ei'}</Text>
          <Text>- Lisätiedot: {item.additionalInfo.moreInfo}</Text>
        </View>
      )}</>
    )}

        <TouchableOpacity onPress={() => toggleNotificationDetails(item.id)}>
        <Text style={styles.acceptionText}>{expandedNotification === item.id ? 'Piilota tiedot' : 'Näytä tiedot'}</Text>
      </TouchableOpacity>

        <TouchableOpacity  onPress={() => handleAccept(item)}>
            <Text style={styles.acceptionText}>Ilmoittaudu hoitajaksi</Text>
        </TouchableOpacity>
    </View>
  

  );

  return (
 <Provider>
    <View style={styles.container}>
      {allNotifications.length > 0 ? (
        <FlatList
          data={allNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
        />

        
        
      ) : (
        <Text style={styles.noNotifications}>Ei ilmoituksia</Text>
      )}
  <Portal>
    <Dialog visible={visibleAlert} onDismiss={() => setVisibleAlert(false)}
      style={{ backgroundColor: '#f2f2f2'  }}>
      <Dialog.Title>Kiitos ilmoittautumisesta!</Dialog.Title>
        <Dialog.Content>
          <Text>Ilmoitus odottaa nyt omistajan hyväksyntää. Kun omistaja hyväksyy tai hylkää ilmoittaumisesi, lähetämme siitä viestin!</Text>
        </Dialog.Content>
        <Dialog.Actions>
        <Button onPress={() => {
          setVisibleAlert(false);
          navigation.navigate('Home');
          }}
          buttonStyle={{
            backgroundColor: '#ff3300', 
            borderRadius: 12, 
            paddingHorizontal:16
          }}
          titleStyle={{
            color: '#ffffff', 
          }}>
          Sulje!
        </Button>
      </Dialog.Actions>
    </Dialog>
  </Portal>
  <View style={styles.bottomContainer}></View>
    </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f2f2f2',
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  serviceText: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor:'#ffffff',
    marginBottom: 8,
    textAlign:'center',
    padding:8
  },
  additionalInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  noNotifications: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
  },
  acceptionText:{
    //borderWidth:0.1,
    padding:8,
    marginTop:8,
    backgroundColor:'#ff3300',
    textAlign:'center',
    color:'#ffffff',
    borderRadius:16,
    marginRight:20,
    marginLeft:20
  },
  bottomContainer:{
    borderWidth:0,
    paddingHorizontal:32,
    padding:30,
    backgroundColor:'#f2f2f2',
  },

});
