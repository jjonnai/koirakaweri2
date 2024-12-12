import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { database, ref, onValue, update} from '../firebase';
import { getAuth } from 'firebase/auth';
import { Provider, Dialog, Portal, useTheme } from 'react-native-paper';
import { Button } from '@rneui/base';

export default function Notifications({navigation}) {
  const [allNotifications, setAllNotifications] = useState([]);
  const [ownNotifications, setOwnNotifications] = useState([]);
  const [expandedNotification, setExpandedNotification] = useState(null);
  const [ownExpandedNotification, setOwnExpandedNotification] = useState(null);
  const [showOwnNotifications, setShowOwnNotifications] = useState(false);
  const [isHoitaja, setIsHoitaja] = useState(false);
  

  const [visibleAlert, setVisibleAlert] = useState(false);
  const theme = useTheme(); 

  const auth = getAuth();
  const user = auth.currentUser;

//Haetaan tietokannasta kaikki ilmoitukset
  useEffect(() => {
    const fetchAllNotifications = () => {

      const user = auth.currentUser;
      if (!user) {
        console.log('Käyttäjä ei ole kirjautunut sisään.');
        return;
      }
      const sanitizedEmail = user.email.replace(/\./g, '_');
      const usersRef = ref(database, 'users');
  
      const unsubscribe = onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const usersData = snapshot.val();

          //Tarkistetaan isHoitaja-tietue
          const currentUserData = usersData[sanitizedEmail];
          const isHoitaja = currentUserData?.isHoitaja || false;
          setIsHoitaja(isHoitaja);

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
          console.log("Kaikki ilmoitukset löytyi")
          setAllNotifications(notifications); 
        } else {
          setAllNotifications([]); 
          setIsHoitaja(false);
        }
      });
  
      return unsubscribe;
    };
    const unsubscribe = fetchAllNotifications();
    return () => unsubscribe();
  }, []);



  //Omien ilmoitusten hakeminen
  useEffect(() => {
    const fetchOwnNotifications = () => {
      const user = auth.currentUser;
      if (!user) {
        console.log('Käyttäjä ei ole kirjautunut sisään.');
        return;
      }
  
      const userEmail = user.email.replace(/\./g, '_');
      const notificationsRef = ref(database, `users/${userEmail}/notifications`);
  
      const unsubscribe = onValue(notificationsRef, (snapshot) => {
        if (snapshot.exists()) {
          const notifications = [];
          const notificationsData = snapshot.val();

          Object.entries(notificationsData).forEach(([notificationId, notificationData]) => {
            notifications.push({
              id: notificationId,
              ...notificationData,
            });
          });
          //lajitellaan uusin viesti ensimmäiseksi
          notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          console.log("Löytyi omia ilmoituksia")
          setOwnNotifications(notifications);
        } else {
          console.log("Ei löytynyt omia ilmoituksia")
          setOwnNotifications([]); 
        }
      });
  
      return unsubscribe;
    };
  
    const unsubscribe = fetchOwnNotifications();
    return () => unsubscribe(); 
  }, []);


  //Näytä tiedot napin funktio
  const toggleNotificationDetails = (notificationId) => {
    setExpandedNotification(expandedNotification === notificationId ? null : notificationId);
  };
  const toggleOwnNotificationDetails = (notificationId) => {
    setOwnExpandedNotification(ownExpandedNotification === notificationId ? null : notificationId);
  };


  //Funktio ilmoituksen hyväksynnälle, tarkistaa onko ilmoittautuvalla käyttäjällä 
  //kyseiselle päivälle jo varauksia
  const handleAccept = async (item) => {
    const user = auth.currentUser;
    if (!user) {
        console.log('Käyttäjä ei ole kirjautunut sisään.');
        return;
    }
    const acceptedByEmail = user.email;
    const sanitazedEmail = item.userEmail.replace(/\./g, '_');
    const userEmail = user.email.replace(/\./g, '_');
    const dateKey = item.dates; 

    const reservationRef = ref(database, `reservations/${userEmail}/${dateKey}`);

    console.log(acceptedByEmail)

    onValue(reservationRef, (snapshot) => {
        if (snapshot.exists()) {

            console.log('Sinulla on jo varaus tälle päivälle!');
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
                })
                .catch((error) => {
                    console.error('Virhe hyväksynnässä', error);
                    console.log('Hyväksyminen epäonnistui');
                });
        }
    });
};

//Kaikkien ilmoitusten renderöinti
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
       <Text style={{ fontWeight: 'bold' }}>Valitut lemmikit:</Text>
            {item.petDetails.map((pet, index) => (
                <View key={index}>
                    <Text>Lemmikin nimi: {pet.name}</Text>
                    <Text>Sukupuoli: {pet.gender}</Text>
                    <Text>Rotu: {pet.race}</Text>
                </View>
            ))}
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
          <Text>Lisätiedot varauksesta:</Text>
          <Text>- Tulee toimeen muiden kanssa: {item.additionalInfo.getsAlong ? 'Kyllä' : 'Ei'}</Text>
          <Text>- Hoitajalla voi olla muita lemmikkejä: {item.additionalInfo.allowsOtherPets ? 'Ei ' : 'Kyllä'}</Text>
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



  //Omien ilmoitusten renderöinti
  const renderOwnNotification = ({ item }) => (

    <View style={styles.notificationItem2}>
      <Text style={styles.serviceText}>Palvelu: {item.service}</Text>
      <Text>Omistaja: {item.userEmail}</Text>
      <Text>
  Hoidontarve:{' '}
  {item.dates
    .map((date) => new Date(date).toLocaleDateString('fi-FI'))
    .join(', ')}
</Text>
      {ownExpandedNotification === item.id && (
        <>
             <Text style={{ fontWeight: 'bold' }}>Hoidettavat lemmikit:</Text>
            {item.petDetails.map((pet, index) => (
                <View key={index}>
                    <Text>Lemmikin nimi: {pet.name}</Text>
                    <Text>Sukupuoli: {pet.gender}</Text>
                    <Text>Rotu: {pet.race}</Text>
                </View>
            ))}
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
          <Text>Lisätiedot varauksesta:</Text>
          <Text>- Tulee toimeen muiden kanssa: {item.additionalInfo.getsAlong ? 'Kyllä' : 'Ei'}</Text>
          <Text>- Hoitajalla voi olla muita lemmikkejä: {item.additionalInfo.allowsOtherPets ? 'Kyllä' : 'Ei'}</Text>
          <Text>- Erityistarpeet: {item.additionalInfo.specialNeeds ? 'Kyllä' : 'Ei'}</Text>
          <Text>- Lisätiedot: {item.additionalInfo.moreInfo}</Text>
        </View>
      )}</>
    )}

        <TouchableOpacity onPress={() => toggleOwnNotificationDetails(item.id)}>
        <Text style={styles.acceptionText}>{ownExpandedNotification === item.id ? 'Piilota tiedot' : 'Näytä tiedot'}</Text>
      </TouchableOpacity>
    </View>
  

  );

  return (
 <Provider>
  <ScrollView>
    <View style={styles.container}>
      <View style={styles.ownContainer}>
  
      <TouchableOpacity onPress={() => setShowOwnNotifications(!showOwnNotifications)} style={styles.ownNotis}>
          <Text style={styles.ownNotisText}>{showOwnNotifications ? 'Piilota omat ilmoitukset' : 'Näytä omat ilmoitukset'}</Text>
        </TouchableOpacity>

        {showOwnNotifications && ownNotifications.length > 0 ? (
          <FlatList
            data={ownNotifications}
            renderItem={renderOwnNotification}
            keyExtractor={(item) => item.id}
          />
        ) : (
          showOwnNotifications && <Text style={styles.noNotificationsButton}>Ei omia ilmoituksia</Text>
        )}
        </View>
    
      {isHoitaja && allNotifications.length > 0 ? (
        <FlatList
          data={allNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
        />
      ) : isHoitaja && allNotifications.length === 0 ?  (
        <Text style={styles.noNotifications}>Ei ilmoituksia</Text>
      ): null}
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
    </ScrollView>
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
  notificationItem2:{
    marginBottom: 24,
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
  noNotificationsButton: {
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
  ownNotis:{
    padding:16,
    marginTop:8,
    marginBottom:8,
    backgroundColor:'#ff3300',
    textAlign:'center',
    borderRadius:16,
    marginRight:20,
    marginLeft:20
  },
  ownNotisText:{
    color:'#ffffff',
    textAlign:'center',
    fontWeight:'bold'
  },
  ownContainer:{
    borderWidth:0.1,
    backgroundColor:'#ffffff',
    marginBottom:24,
    borderRadius:16
  }


});
