import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView, Modal, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Button } from '@rneui/base';
import { database, ref, get, push } from '../firebase';
import { getAuth } from 'firebase/auth';
import { CheckBox } from '@rneui/themed';
import { Menu, Provider, Dialog, Portal, useTheme } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import OwnCalendar from '../Components/OwnCalendar';


export default function Reservation({navigation}) {
    const auth = getAuth();
    const [visibleMenu, setVisibleMenu] = useState(false);
    const [visibleAlert, setVisibleAlert] = useState(false);
    const [selectedService, setSelectedService] = useState('');
    const [petData, setPetData] = useState([]);
    const [selectedPet, setSelectedPet] = useState(null);
    const [selectedPets, setSelectedPets] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    

    const [checked1, setChecked1] = useState(false);
    const [checked2, setChecked2] = useState(false);
    const [checked3, setChecked3] = useState(false);
    const [moreInfo, setMoreInfo] = useState('');
    const [serviceInfo, setServiceInfo] = useState('');
    const [selectedDates, setSelectedDates] = useState({}); 
    const [reservations, setReservations] = useState({}); 
    //const currentDate = new Date().toISOString().split('T')[0];


     const theme = useTheme(); 

    const openMenu = () => setVisibleMenu(true);
    const closeMenu = () => setVisibleMenu(false);


    //Haetaan käyttäjän lemmikkien tiedot
    useEffect(() => {
        const fetchData = async () => {
            const user = auth.currentUser;
            if (!user) {
                alert('Käyttäjä ei ole kirjautunut sisään.');
                return;
            }
            const userEmail = user.email.replace(/\./g, '_');
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


    //Tarkistetaan checkboxien muuttuminen, valitaan siis lemmikki
    const handleCheckboxChange = (petId) => {
        setSelectedPets((prevSelected) => {
            if (prevSelected.includes(petId)) {
                return prevSelected.filter((id) => id !== petId);
            } else {
                return [...prevSelected, petId];
            }
        });
    };





    const renderPet = ({ item }) => (
    <View style={styles.petRow}>
        <CheckBox
            checked={selectedPets.includes(item.id)}
            onPress={() => handleCheckboxChange(item.id)}
            containerStyle={styles.checkboxContainer2}
         />
        <Text style={styles.petName}>{item.name}</Text>
        <TouchableOpacity
            style={styles.petItem}
            onPress={() => {
            setSelectedPet(item);
            setModalVisible(true);
            }}
        >
        <SimpleLineIcons name="info" size={24} color="black" />
        </TouchableOpacity>    
    </View>
    );

    //Vahvistetaan ilmoitus ja tallennetaan se tietokantaan
    const handleSubmit = () => {
      if (!selectedService || selectedPets.length === 0) {
        Alert.alert('Valitse palvelu ja vähintään yksi lemmikki.');
        return;
    }
      const user = auth.currentUser;
      if (!user) {
          Alert.alert('Käyttäjä ei ole kirjautunut sisään.');
          return;
      }
 

        const userEmail = user.email.replace(/\./g, '_');
        const notificationsRef = ref(database, `users/${userEmail}/notifications`);

        const selectedPetNames = petData
        .filter(pet => selectedPets.includes(pet.id))
        .map(pet => pet.name);

        //Ilmoituksen tiedot
        const newNotification = {
            service: selectedService,
            pets: selectedPets,
            petNames:selectedPetNames,
            dates:Object.keys(selectedDates), 
            additionalInfo: {
                getsAlong: checked1,
                allowsOtherPets: checked2,
                specialNeeds: checked3,
                serviceInfo: serviceInfo,
                moreInfo: moreInfo,
            },
            status: {
                value:'odottaa valintaa',
                acceptedBy:""
            },
            createdAt: new Date().toISOString(),
            userEmail: user.email,
        };
        //Push lisää tietokantaan
        push(notificationsRef, newNotification)
            .then(() => {
                //Jos lisääminen onnistuu, ilmoitus tulee näytölle
                setVisibleAlert(true);
                setSelectedPets([]);
                setSelectedService('');  
            })
            .catch((error) => {
                console.error('Virhe tietokantaan tallennuksessa:', error);
                Alert.alert('Ilmoituksen luonti epäonnistui.');
            });  
    };


   /* useEffect(() => {
      const user = auth.currentUser;
    
      if (!user) {
        alert('Käyttäjä ei ole kirjautunut sisään.');
        return;
      }
      
      if (!user.email) {
        alert('Käyttäjän sähköpostiosoite ei ole saatavilla.');
        return;
      }
    
      // Käytä suoraan auth.currentUser.email
      const sanitizedEmail = user.email.replace(/\./g, '_');
      console.log(sanitizedEmail);
    
      const ownReservationRef = ref(database, `users/${sanitizedEmail}/notifications`);
    
      onValue(ownReservationRef, (snapshot) => {
        if (snapshot.exists()) {
          const fetchedNotifications = snapshot.val();
          if (!fetchedNotifications) {
            console.error("Fetched notifications are undefined.");
            return;
          }
          const formattedReservations = Object.keys(fetchedNotifications).reduce((acc, notificationId) => {
            const notification = fetchedNotifications[notificationId];
            if (!notification) {
              console.error(`Notification with id ${notificationId} is undefined.`);
              return acc;
            }
    
            if (Array.isArray(notification.dates)) {
              notification.dates.forEach((date) => {
                if (notification.status.value === "hyväksytty") {
                  acc[date] = {
                    startingDay: true,
                    endingDay: true,
                    color: 'red',
                    textColor: 'white',
                  };
                }
              });
            }
            return acc;
          }, {});
    
          setReservations(formattedReservations);
        } else {
          console.log('Ei löytynyt varauksia');
        }
      });
    }, [database]);  */


  //Hoidon päivämäärän valinta
  const handleDayPress = (day) => {
    setSelectedDates((prevDates) => {
      const dateString = day.dateString;

      if (prevDates[dateString]) {
        const updatedDates = { ...prevDates };
        delete updatedDates[dateString];
        return updatedDates;
      } else {

        return {
          ...prevDates,
          [dateString]: {
            startingDay: true,
            endingDay: true,
            color: '#50cebb',
            textColor: 'white',
          },
        };
      }
    });
  };


 /*   const combinedMarked={
      ...selectedDates,
      ...reservations,
    }*/
  

    return (
    <Provider>
        <ScrollView style={{backgroundColor: '#f2f2f2'}}>
        <Menu
            visible={visibleMenu}
            onDismiss={closeMenu}
            style={styles.menu}
            anchor={
                <TouchableOpacity
                mode="contained"
                onPress={openMenu}
                style={styles.serviceButton}
                >
            <Text style={styles.serviceText}>{selectedService ? selectedService : 'Valitse palvelu klikkaamalla'}</Text>
            </TouchableOpacity>
            }
        >
         <Menu.Item
            onPress={() => {
            setSelectedService('Koiran ulkoilutus 1 kerta /15€');
            closeMenu();
            }}
            title="Koiran ulkoilutus 1 kerta /15€"
            />
            <Menu.Item
            onPress={() => {
            setSelectedService('Koiran ulkoilutus 2 krt /20€');
            closeMenu();
            }}
            title="Koiran ulkoilutus 2 krt /20€"
            />
         <Menu.Item
            onPress={() => {
            setSelectedService('1 päivä /25€');
            closeMenu();
            }}
            title="1 päivä /25€"
            />
            <Menu.Item
            onPress={() => {
            setSelectedService('1 yö /30€');
            closeMenu();
            }}
            title="1 yö /30€"
            />
            <Menu.Item
            onPress={() => {
            setSelectedService('Muu ');
            closeMenu();
            }}
            title="Muu palvelu, kirjoita lisätietoihin"
            />
            </Menu>
        <TextInput
        style={styles.input}
        placeholder="Muu palvelu, kirjoita lisätiedot"
        value={serviceInfo}
        onChangeText={(text) => setServiceInfo(text)}
        
        />
        <View style={styles.CalendarContainer}>
        <Text style={styles.dateText}>Valitse päivämäärät</Text>
        <Calendar
        markingType={'period'}
        markedDates={selectedDates}
        onDayPress={handleDayPress}
        theme={{
          selectedDayBackgroundColor: 'blue',
          todayTextColor: 'red',
          arrowColor: 'orange',
        }}
      />
      </View>
        <Text style={styles.header2}>Valitse hoitoa tarvitseva lemmikki:</Text>
            <View style={styles.petList}>
            {petData.map((item) => (
            <View key={item.id} style={styles.petRow}>
            <CheckBox
            checked={selectedPets.includes(item.id)}
            onPress={() => handleCheckboxChange(item.id)}
            containerStyle={styles.checkboxContainer2}
            
            title={item.name}
            />
            <TouchableOpacity
            style={styles.petItem}
            onPress={() => {
            setSelectedPet(item);
            setModalVisible(true);
            }}
            >
            <SimpleLineIcons name="info" 
            size={24} 
            color="#ff3300"                        
            />
            </TouchableOpacity>
            </View>
            ))}
            </View>
            {selectedPet && (
            <Modal
            visible={modalVisible}
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
            >
        <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Lemmikin tiedot</Text>
        <Text>Nimi: {selectedPet.name}</Text>
        <Text>Ikä: {selectedPet.age}</Text>
        <Text>Sukupuoli: {selectedPet.gender}</Text>
        <Text>Rotu: {selectedPet.race}</Text>
        <TouchableOpacity
        onPress={() => setModalVisible(false)}
        style={styles.closeButton}
        >
        <Text style={styles.closeButtonText}>Sulje</Text>
        </TouchableOpacity>
        </View>
        </Modal>
        )}
        <Text style={styles.header2}>Lisätiedot</Text>
        <CheckBox
            title="Tulee toimeen muiden koirien kanssa"
            checked={checked1}
            onPress={() => setChecked1(!checked1)}
            containerStyle={styles.checkboxContainer}
            />
                <CheckBox
                    title="Hoitajalla ei saa olla muita lemmikkejä"
                    checked={checked2}
                    onPress={() => setChecked2(!checked2)}
                    containerStyle={styles.checkboxContainer}
                />
                <CheckBox
                    title="Erityistarpeita"
                    checked={checked3}
                    onPress={() => setChecked3(!checked3)}
                    containerStyle={styles.checkboxContainer}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Muuta huomioitavaa"
                    value={moreInfo}
                    onChangeText={(text) => setMoreInfo(text)}
                />
                <TouchableOpacity
                    mode="contained"
                    onPress={handleSubmit}
                    style={styles.submitButton}
                >
                 <Text style={styles.submitButtonText}>Vahvista ilmoitus</Text>   
                </TouchableOpacity>
                <View style={styles.bottomContainer}>

                </View>
            </ScrollView>
    <Portal>
        <Dialog
            visible={visibleAlert}
            onDismiss={() => setVisibleAlert(false)}>
            <Dialog.Title>Ilmoitus luotu onnistuneesti!</Dialog.Title>
            <Dialog.Content>
                <Text>Ilmoitus on nyt siirretty odottamaan hoitajan valintaa. Kun hoitaja ilmoittautuu tähän varaukseen, voit vahvistaa varauksen ja hoitajan kotisivultasi!</Text>
                </Dialog.Content>
                <Dialog.Actions>
                <Button 
                buttonStyle={{
                backgroundColor: '#ff3300', 
                borderRadius: 5,           
                padding: 10,               
                }}
                onPress={() => {
                setVisibleAlert(false);
                navigation.navigate('Home');
                }}>
                Sulje
                </Button>
            </Dialog.Actions>
            </Dialog>
        </Portal>
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
      marginBottom: 16,
      fontWeight: 'bold',
      //backgroundColor:'rgba(95, 158, 160, 0.7)'
    },
    header2: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 2,
      padding: 16,
      //backgroundColor: 'rgba(95, 158, 160, 0.7)', 
      fontWeight: '600',
    },
    input: {
      marginBottom: 16,
      padding: 12,
      borderRadius: 8,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#ced4da',
    },
    serviceButton: {
      marginTop:16,
      marginBottom: 24,
      padding: 16,
      backgroundColor: '#ff3300', 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,

    },serviceText:{
        fontSize:16,
        fontWeight:'bold',
        textAlign:'center',
        color:'#ffffff'
    },
    checkboxContainer: {
      marginBottom: 10,
      padding: 10,
      //backgroundColor: 'rgba(95, 158, 160, 0.7)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#dee2e6',
    },
    submitButton: {
      marginTop: 32,
      padding: 8,
      backgroundColor: '#ff3300', 
      borderRadius: 16,
      alignItems: 'center',
      marginBottom:16,
      marginLeft:34,
      marginRight:34,
      
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color:'#ffffff'
    },
    error: {
      color: 'red',
      marginBottom: 10,
      textAlign: 'center',
      fontWeight: 'bold',
    },
    menu: {
      width: '90%',
      alignSelf: 'center',
      
    },
    petItem: {
      flex: 1,
      padding: 8,
      marginVertical: 4,
      marginHorizontal: 8,
      justifyContent:'flex-end',
      marginRight:8,
      marginLeft:70,
     // backgroundColor: 'rgba(95, 158, 160, 0.1)',
      borderRadius: 8,
      flexDirection: 'row',
      
    },
    petName: {
      fontSize: 16, 
      fontWeight: '500',
      
    },
    petList:{
    backgroundColor:'#ffffff'
    },
    petRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      padding: 0,
      //backgroundColor:'rgba(95, 158, 160, 0.5)',
      borderRadius: 8,
    },
    checkboxContainer2: {
      alignContent:'flex-end',
      alignItems:'flex-end',
      justifyContent:'flex-end',
      paddingRight:80,
      padding: 8,
     // borderWidth: 1,
      //backgroundColor: 'rgba(95, 158, 160, 0.1)'
    },
    modalContent: {
      flex: 1,
      margin: 24,
      marginTop:80,
      marginBottom:80,
      //backgroundColor: 'rgba(95, 158, 160, 0.7)',
      borderRadius: 8,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
      color: '#333',
      
    },
    closeButton: {
      marginTop: 24,
      padding: 8,
      backgroundColor: '#ff3300', 
      borderRadius: 16,
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color:'#ffffff'
    },
    CalendarContainer:{
        marginTop: 20,
        padding: 16,
       // backgroundColor: 'rgba(95, 158, 160, 0.7)',
        borderRadius: 16,
      borderWidth:0.1,
        marginBottom: 16,
    },
    dateText:{
        textAlign:'center',
        borderWidth:0.2,
       // borderColor: 'rgba(95, 158, 160, 0.7)',
        padding:8,
        fontSize:16,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        backgroundColor:'#ff3300',
        color:'#ffffff'
    },
    bottomContainer:{
        borderWidth:0,
        padding:20,
        backgroundColor:'#f2f2f2'
    },
    petImage: {
      width: 100,
      height: 100,
      borderRadius: 75,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: '#5f9ea0',
      alignContent:'center'
    },
  });
