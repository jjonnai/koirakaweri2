import { StyleSheet, Text, View, FlatList, ScrollView, TouchableOpacity, TextInput, ActivityIndicator} from 'react-native';
import { Button, Card } from '@rneui/themed';
import { getAuth } from 'firebase/auth';
import { database, ref, onValue, update, remove } from '../firebase';
import React, { useState, useEffect } from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';
import { sendMessage } from '../Components/MessageFunc';
import { Provider, Dialog, Portal, useTheme } from 'react-native-paper';
import OwnCalendar from '../Components/OwnCalendar';
import { useFonts } from 'expo-font';
import Offers from '../Components/Offers';



const Home = ({navigation}) => {

  const auth = getAuth();

  const [notificationWaiting, setNotificationWaiting] = useState([])
  const [ownNotificationsWaiting, setOwnNotificationsWaiting] = useState([])

  const [visibleAlert, setVisibleAlert] = useState(false);
  const theme = useTheme(); 
  const [selectedItem, setSelectedItem] = useState(null);



  //Hyväksyntää odottavat ilmoitukset
  useEffect(() => {
    const fetchWaitingNotifications = () => {
        const user = auth.currentUser;
        if (!user) {
            alert('Käyttäjä ei ole kirjautunut sisään.');
            return;
        }

        const sanitazedEmail = user.email.replace(/\./g, '_');
        const userNotificationRef = ref(database, `users/${sanitazedEmail}/notifications`);

        const unsubscribe = onValue(userNotificationRef, (snapshot) => {
            if (snapshot.exists()) {
                const notificationsData = snapshot.val();
                const waitingNotifications = Object.entries(notificationsData)
                    .filter(([_, notification]) => notification.status?.value === "odottaa hyväksyntää")
                    .map(([id, notification]) => ({
                        id,
                        service: notification.service || "Ei määritelty",
                        statusValue: notification.status?.value || "Tila ei määritelty",
                        acceptedBy: notification.status?.acceptedBy || "Ei määritelty",
                        createdAt: notification.createdAt || "Ei määritelty",
                        userEmail: notification.userEmail || "Ei määritelty",
                        dates: notification.dates || "Ei määritelty"
                    }));

                setNotificationWaiting(waitingNotifications);
                console.log("Löytyi");
            } else {
                setNotificationWaiting([]);
                console.log("Ei löytynyt");
            }
        });

        return unsubscribe;
    };

    const unsubscribe = fetchWaitingNotifications();
    return () => unsubscribe && unsubscribe();
}, []);



//Hyväksytyt ilmoitukset
useEffect(() => {
  const fetchAcceptedNotifications = () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Käyttäjä ei ole kirjautunut sisään.');
      return;
    }

    const sanitizedEmail = user.email.replace(/\./g, '_'); 
    const notificationsRef = ref(database, 'users'); 

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const acceptedNotifications = Object.entries(usersData)
          .flatMap(([userKey, userData]) => 
            userData.notifications ? 
              Object.entries(userData.notifications)
                .filter(([_, notification]) => 
                  notification.status?.value === 'hyväksytty' &&
                  notification.status?.acceptedBy === sanitizedEmail
                )
                .map(([id, notification]) => ({
                  id,
                  service: notification.service || 'Ei määritelty',
                  statusValue: notification.status?.value || 'Ei määritelty',
                  acceptedBy: notification.status?.acceptedBy || 'Ei määritelty',
                  createdAt: notification.createdAt || 'Ei määritelty',
                  userEmail: userKey.replace(/_/g, '.'),
                  dates: notification.dates || "Ei määritelty"
                }))
            : []
          );

        setOwnNotificationsWaiting(acceptedNotifications);
        console.log("Hyväksytyt ilmoitukset haettu");
      } else {
        setOwnNotificationsWaiting([]);
        console.log("Ei löytynyt hyväksyttyjä ilmoituksia");
      }
    });

    return unsubscribe;
  };

  const unsubscribe = fetchAcceptedNotifications();
  return () => unsubscribe && unsubscribe();
}, []);


//Ilmoituksen poistaminen tietokannasta
const handleDeleteNotification = async (item) => {
  const user = auth.currentUser;
  if (!user) {
    alert('Käyttäjä ei ole kirjautunut sisään.');
    return;
  }

  const userEmail = user.email.replace(/\./g, '_');
  const notificationDeleteRef = ref(database, `users/${userEmail}/notifications/${item.id}`);
  console.log(item.id)
  console.log(userEmail)

  try {
    await remove(notificationDeleteRef);
    alert('Ilmoitus poistettu!');
    setPetData(petData.filter(pet => pet.id !== petId));
  } catch (error) {
    console.error("Virhe ilmoituksen poistamisessa:", error);
    alert('Poisto epäonnistui');
  }
};


//Kieltäydy hoitajasta, palauttaa tilan "odottaa valintaa"
const handleDecline = async (item) => {

  const user = auth.currentUser;
      if (!user) {
      alert('Käyttäjä ei ole kirjautunut sisään.');
      return;
  }

 console.log(item.statusValue)
 console.log(item.id)
 console.log(item.userEmail)

 const sanitazedEmail = item.userEmail.replace(/\./g, '_');
 const updateStatusDeclineRef = ref(database, `users/${sanitazedEmail}/notifications/${item.id}`)

  console.log(updateStatusDeclineRef)
  const updateStatusDecline = {
    status: {
      value: "odottaa valintaa",
    } 
  } 
  update (updateStatusDeclineRef, updateStatusDecline)
  .then(() => {
      console.log("Kieltäytyminen onnistui")
  })
  .catch((error) => {
      console.error('Virhe hyväksynnässä', error)
     
  })
};

//Hyväksy hoitaja, lähettää viestin hyväksynnästä
const handleAcceptRequest = async (item) => {
  const user = auth.currentUser;
  if (!user) {
      alert('Käyttäjä ei ole kirjautunut sisään.');
      return;
  }

  try {
      console.log(item.statusValue);
      console.log(item.id);
      console.log(item.userEmail);

      const formattedDates = Array.isArray(item.dates)
  ? item.dates.map((date) => new Date(date).toLocaleDateString('fi-FI')).join(', ')
  : 'Ei valittuja päivämääriä';

      const recieverEmail = item.acceptedBy.replace(/\./g, '_'); 
      const sanitazedEmail = item.userEmail.replace(/\./g, '_');
      const updateStatusAcceptRef = ref(database, `users/${sanitazedEmail}/notifications/${item.id}`);

      console.log(updateStatusAcceptRef);
      const updateStatusAccept = {
          status: {
          value: "hyväksytty",
          acceptedBy: recieverEmail,}
      };

      await update(updateStatusAcceptRef, updateStatusAccept);
      console.log("Hyväksyminen onnistui");

      try {
          await sendMessage(
              recieverEmail, 
              `Hei, käyttäjä ${item.userEmail} on hyväksynyt sinut hoitajaksi ${formattedDates}.ajalle! Voitte nyt lähettää toisillenne viestejä hoitoa koskien. Kiitos, että käytätte palveluamme!`);
          console.log("Viesti lähetetty onnistuneesti");


          const dateKey = item.dates
      const availabilityRef = ref(database, `reservations/${recieverEmail}`);
      
          const newAvailability = {
            [dateKey]: {
              startingDay: true,
              endingDay: true,
              color: 'red', 
            
            },
          };

          await update(availabilityRef, newAvailability);
          //setVisibleAlert(true);
      } catch (messageError) {
          console.error("Virhe viestin lähettämisessä", messageError);
          alert("Viestin lähettäminen epäonnistui.");
      }
  } catch (error) {
      console.error("Virhe hyväksynnässä", error);
      alert("Hyväksyntä epäonnistui.");
  }
};




  const renderItem =({item}) => (
 
    <View style={{ padding: 10, borderBottomWidth: 1 }}>
    <Text style={styles.serviceText}>Palvelu: {item.service}</Text>
    <Text style={styles.acceptedByText}>Ilmoittautunut hoitaja: {item.acceptedBy}</Text>
    <Text>
    Hoidontarve:{' '}
    {item.dates
    .map((date) => new Date(date).toLocaleDateString('fi-FI'))
    .join(', ')}
    </Text>
    <Text>Luotu: {new Date(item.createdAt).toLocaleString('fi-FI', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })}</Text>
    <Text>Tila: {item.statusValue}</Text>
    

    <Text>Omistaja: {item.userEmail}</Text>
    <View style={styles.deleteContainer}>
      <TouchableOpacity onPress={() => handleDeleteNotification(item)}>
      <AntDesign name="delete" size={28} color='#ff3300' />
      </TouchableOpacity>
    </View>

    {item.statusValue !== "hyväksytty" &&(
    <View style={styles.acceptContainer}>
<TouchableOpacity
    onPress={() => {
    setSelectedItem(item);
    setVisibleAlert(true);
  }}
  style={styles.acceptIcon}
>
       <Text style={styles.chooseText}>Hyväksy</Text>
      </TouchableOpacity>
      <TouchableOpacity  onPress={() => handleDecline(item)}>
        <Text style={styles.chooseText}>Hylkää</Text>
      </TouchableOpacity>
      </View>
      )}
  </View>
  )
 
  return (
    <Provider>
      <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: '#f2f2f2' }}>
      <Offers/>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Varaus')} style={styles.button}>
            <Text style={styles.buttonText}>Ilmoita uusi hoidontarve</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bodyContainer}>
        <Text style={styles.headerText2}>Hyväksyntää odottavat varaukset</Text>
          <View style={styles.notificationContainer}> 
          
              {notificationWaiting.length === 0 ? (
                <Text style={styles.noNotificationsText}>Ei uusia ilmoituksia</Text>
              ) : (
                <FlatList
                  data={notificationWaiting}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.id}
                 
                />
              )}
            </View>
          </View>
          
        <View style={styles.bodyContainer}>
          <Text style={styles.headerText2}>Hyväksytyt varaukset</Text>
          <View style={styles.notificationContainer}>
           
              {ownNotificationsWaiting.length === 0 ? (
                <Text style={styles.noNotificationsText}>Ei hyväksyttyjä varauksia</Text>
              ) : (
                <FlatList
                  data={ownNotificationsWaiting}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.id}
                  
                />
              )}
           
          </View>
          <View style={styles.calendarContainer}>
          <Text style={styles.calendarHeader}> Varatut palvelut</Text>
          <OwnCalendar userEmail={auth.currentUser.email.replace(/\./g, '_')} database={database} />
        </View>
        </View>
  
        <Portal>
  <Dialog visible={visibleAlert} onDismiss={() => setVisibleAlert(false)}
    style={{ backgroundColor: '#f2f2f2'  }} >
    <Dialog.Title>Vahvista varaus syöttämällä korttitiedot</Dialog.Title>
    <Dialog.Content>
      <Text>
        Hyväksyminen lähettää automaattisen viestin hoitajalle. Voitte sopia viestit-välilehdellä tarkemmin hoidosta! Kiitos palvelun käytöstä.
      </Text>
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Syötä korttitiedot maksua varten</Text>
        <TextInput
          placeholder="Kortin numero"
          style={styles.input}
          keyboardType="numeric"
          maxLength={16}
        />
        <TextInput
          placeholder="MM/YY"
          style={styles.input}
          keyboardType="numeric"
          maxLength={5}
        />
        <TextInput
          placeholder="CVV"
          style={styles.input}
          keyboardType="numeric"
          maxLength={3}
        />
      </View>
    </Dialog.Content>
    <Dialog.Actions>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '60%' }}>
    
        <Button
          onPress={() => {
            if (selectedItem) {
              handleDecline(selectedItem);
              setVisibleAlert(false);
            }
          }}
          buttonStyle={{
            backgroundColor: '#ff3300', 
            borderRadius: 12, 
          }}
          titleStyle={{
            color: '#ffffff', 
          }}
        >
          Peruuta
        </Button>
        <Button
          onPress={() => {
            if (selectedItem) {
              handleAcceptRequest(selectedItem);
              setVisibleAlert(false);
              alert('Maksu onnistui!');
            }
          }}
          buttonStyle={{
            backgroundColor: '#ff3300', 
            borderRadius: 12, 
          }}
          titleStyle={{
            color: '#ffffff', 
          }}
        >
          Maksa
        </Button>
      </View>
    </Dialog.Actions>
  </Dialog>
</Portal>
<View style={styles.bottomContainer}></View>
</ScrollView>
</Provider>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 10,
  },
  headerContainer: {
    borderRadius: 8,
    padding: 0,
    marginTop:16,
  },
  headerText2: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth:0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,

  },
  descriptionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
  bodyContainer: {
    borderRadius: 8,
    padding: 24,
    marginTop: 8,
    backgroundColor: '#f2f2f2',
    marginBottom:8,
    //borderColor:'#e6e6e6'
    
  },
  bodyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'justify',
    lineHeight: 20,
  },
  acceptContainer:{
    flexDirection:'row',
    justifyContent:'center'

  },
  waitingText:{
    textAlign:'center'
  },
  notificationContainer:{
    borderWidth:0,
    padding:8,
    backgroundColor:'#ffffff',
    borderColor:'#e6e6e6',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  noNotificationsText:{
    fontSize:16,
    textAlign:'center',
   // fontWeight:'bold'
  },
  button:{
    borderWidth:0,
    padding:8,
    marginLeft:34,
    marginRight:34,
    marginTop:16,
    borderRadius:16,
    backgroundColor: '#ff3300',
    
    
  },
  buttonText:{
    textAlign:'center',
    fontSize:16,
    fontWeight:'bold',
    color:'#ffffff'
  },
acceptIcon:{
  marginRight:30
},
  deleteContainer:{
    alignItems:'flex-end',
    marginLeft:34,
    marginTop:6
  },
  serviceText:{
    fontSize:16,
    textAlign:'center',
    //marginBottom:8,
    fontWeight:'bold',
    borderWidth:0.5,
    backgroundColor:'#ffffff',
    borderColor:'#e6e6e6',
    borderRadius:8,
    padding:6
  },
  acceptedByText:{
  fontWeight:'bold',
  fontSize:14
  },
  bottomContainer:{
    borderWidth:0,
    paddingHorizontal:32,
    padding:30,
    backgroundColor:'#f2f2f2',
  },
  chooseText:{
    //borderWidth:0.5,
    borderRadius:16,
    padding:8,
    paddingHorizontal:16,
    marginTop:8,
    //fontWeight:'bold',
    backgroundColor:'#ff3300',
    color:'#ffffff'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f7f7f7',
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

});

export default Home;