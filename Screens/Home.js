import { StyleSheet, Text, View, FlatList, ScrollView, TouchableOpacity, TextInput} from 'react-native';
import { Button } from '@rneui/themed';
import { getAuth } from 'firebase/auth';
import { database, ref, onValue, update, remove } from '../firebase';
import React, { useState, useEffect } from 'react';
import AntDesign from '@expo/vector-icons/AntDesign';
import { sendMessage } from '../Components/MessageFunc';
import { Provider, Dialog, Portal, useTheme } from 'react-native-paper';
import OwnCalendar from '../Components/OwnCalendar';
import Offers from '../Components/Offers';



const Home = ({navigation}) => {

  const auth = getAuth();

  const [notificationWaiting, setNotificationWaiting] = useState([])
  const [ownNotificationsWaiting, setOwnNotificationsWaiting] = useState([])

  const [visibleAlert, setVisibleAlert] = useState(false);
  const [finalAlert, setFinalAlert] = useState(false);
  const theme = useTheme(); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [isHoitaja, setIsHoitaja] = useState(false);



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
                        dates: notification.dates || "Ei määritelty",
                        petDetails: Array.isArray(notification.petDetails) ? notification.petDetails : [],
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



//Hyväksytyt ilmoitukset, näkyy vain jos käyttäjä on ilmoittautunut hoitajaksi
useEffect(() => {
  const fetchAcceptedNotifications = () => {
    const user = auth.currentUser;
    if (!user) {
     console.log("Käyttäjä ei ole kirjautunut sisään.")
      return;
    }

    const sanitizedEmail = user.email.replace(/\./g, '_'); 
    const notificationsRef = ref(database, 'users'); 

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();

        const currentUserData = usersData[sanitizedEmail];
        const isHoitaja = currentUserData?.isHoitaja || false;
        setIsHoitaja(isHoitaja);

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
                  dates: notification.dates || "Ei määritelty",
                  petDetails: Array.isArray(notification.petDetails) ? notification.petDetails : [],
                
                }))
            : []
          );

        setOwnNotificationsWaiting(acceptedNotifications);
        console.log("Hyväksytyt ilmoitukset haettu");
        console.log(isHoitaja)
      
      } else {
        setOwnNotificationsWaiting([]);
        console.log("Ei löytynyt hyväksyttyjä ilmoituksia");
        setIsHoitaja(false);
      }
    });

    return unsubscribe;
  };

  const unsubscribe = fetchAcceptedNotifications();
  return () => unsubscribe && unsubscribe();
}, []);


//Ilmoituksen poistaminen tietokannasta
const handleDeleteNotification = async (item) => {

    const ownerEmailSanitized = item.userEmail.replace(/\./g, '_');
    const notificationDeleteRef = ref(database, `users/${ownerEmailSanitized}/notifications/${item.id}`);
  
    try {
      await remove(notificationDeleteRef);
      console.log('Ilmoitus poistettu!');

      setOwnNotificationsWaiting((prevNotifications) =>
        prevNotifications.filter((notification) => notification.id !== item.id)
      );

    } catch (error) {
      console.error('Virhe ilmoituksen poistamisessa:', error);
    }
  };

//Kieltäydy hoitajasta, palauttaa tilan "odottaa valintaa"
const handleDecline = async (item) => {

  const user = auth.currentUser;
      if (!user) {
      console.log('Käyttäjä ei ole kirjautunut sisään.');
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
      console.log('Käyttäjä ei ole kirjautunut sisään.');
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

      //Lähetetään automaattinen viesti ilmoittautuneelle hoitajalle
      try {
          await sendMessage(
              recieverEmail, 
              `Hei, käyttäjä ${item.userEmail} on hyväksynyt sinut hoitajaksi ${formattedDates}.ajalle! Voitte nyt lähettää toisillenne viestejä hoitoa koskien. Kiitos, että käytätte palveluamme!`);
          console.log("Viesti lähetetty onnistuneesti");

      //Lisätään reservations-tietueeseen varauksen tiedot
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
          setFinalAlert(true)
      } catch (messageError) {
          console.error("Virhe viestin lähettämisessä", messageError);
         
      }
  } catch (error) {
      console.error("Virhe hyväksynnässä", error);
  }
};




  const renderItem =({item}) => (
 
    <View style={{ padding: 10, borderBottomWidth: 1 }}>
    <Text style={styles.serviceText}>Palvelu: {item.service}</Text>
    <Text style={styles.acceptedByText}>Hoitaja: {item.acceptedBy}</Text>
    <Text>
    Hoidontarve:{' '}
    {item.dates
    .map((date) => new Date(date).toLocaleDateString('fi-FI'))
    .join(', ')}
    </Text>
    <Text style={{ fontWeight: 'bold' }}>Hoidettavat lemmikit:</Text>
    {item.petDetails && item.petDetails.length > 0 ? (
      item.petDetails.map((pet, index) => (
        <View key={index}>
          <Text>Lemmikin nimi: {pet.name}</Text>
          <Text>Sukupuoli: {pet.gender}</Text>
          <Text>Rotu: {pet.race}</Text>
        </View>
      ))
    ) : (
      <Text>Ei valittuja lemmikkejä</Text>
    )}
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
          {isHoitaja && (
        <View style={styles.bodyContainer}>
          <Text style={styles.headerText2}>Hyväksytyt hoitovaraukset</Text>
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
          </View>
          )}
          <View style={styles.bodyContainer}>
          <Text style={styles.calendarHeader}> Omat varatut palvelut</Text>
          <View style={styles.calendarContainer}>

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
              setFinalAlert(true);
             
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
<Portal>
  <Dialog visible={finalAlert} onDismiss={() => setFinalAlert(false)}
    style={{ backgroundColor: '#f2f2f2'  }}>
    <Dialog.Title></Dialog.Title>
    <Dialog.Content>
      <Text>Maksu onnistui!</Text>
    </Dialog.Content>
    <Dialog.Actions>
    <Button
      onPress={() => setFinalAlert(false)}
      buttonStyle={{ backgroundColor: '#ff3300', borderRadius: 12 }}
      titleStyle={{ color: '#ffffff' }}
    >
    Sulje
    </Button>
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
    borderWidth:0.1,
    backgroundColor: '#ffffff',
    //backgroundColor: '#ff3300',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding:4,

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
    //marginTop: 20,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  calendarHeader: {
    fontSize: 18,
    fontWeight: 'bold',
   // marginBottom: 10,
    textAlign:'center',
    //borderWidth:1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor:'#ff3300',
    color:'#ffffff',
    padding:4
  },

});

export default Home;