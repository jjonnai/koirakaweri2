import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ref, onValue } from 'firebase/database';
import { Dialog, Portal, useTheme, Provider } from 'react-native-paper';
import { Button } from '@rneui/themed';

const CalendarComponent = ({ userEmail, database }) => {
  const [selectedDate, setSelectedDate] = useState(null);  
  const [reservations, setReservations] = useState({}); 
  const [reservationDetails, setReservationDetails] = useState(null);  
  const [visible, setVisible] = useState(false);  
  const theme = useTheme(); 


  //Haetaan ilmoitukset ja kerrotaan miten ne näytetään kalenterissa
  useEffect(() => {

    const sanitizedEmail = userEmail.replace(/\./g, '_');
    const reservationRef = ref(database, `reservations/${sanitizedEmail}`);
    
    onValue(reservationRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedReservations = snapshot.val();
        //Miten päivät merkitään
        const formattedReservations = Object.keys(fetchedReservations).reduce((acc, date) => {
          return {
            ...acc,
            [date]: {
              startingDay: true,
              endingDay: true,
              color: 'red',  
              textColor: 'white',
            },
          };
        }, {});

        setReservations(formattedReservations);
      } else {
        console.log("Ei löytynyt varauksia.");
      }
    });
  }, [database, userEmail]);


  //Funktio, jolla määritellään mitä päivää painamalla tapahtuu
  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
    fetchReservationDetails(day.dateString);
  };

  //Varauksien tietojen haku
  const fetchReservationDetails = (date) => {
    const sanitizedEmail = userEmail.replace(/\./g, '_');
    const usersRef = ref(database, 'users');

    onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const matchingNotifications = [];

        Object.keys(usersData).forEach((sanitizedEmailKey) => {
          const userNotifications = usersData[sanitizedEmailKey]?.notifications || {};

          Object.values(userNotifications).forEach((notification) => {
            if (notification.dates && notification.dates.includes(date)) {
              if (notification.status?.acceptedBy === userEmail) {
                matchingNotifications.push({
                  ...notification,
                  userEmail: sanitizedEmailKey.replace(/_/g, '.'), 
                });
              }
            }
          });
        });

        if (matchingNotifications.length > 0) {
          setReservationDetails(matchingNotifications);
          setVisible(true);
        } else {
          setReservationDetails(null);
          setVisible(false);
        }
      } else {
        setReservationDetails(null);
        setVisible(false);
      }
    });
  };

  const hideDialog = () => {
    setVisible(false);
    setReservationDetails(null);
  };



  return(
    <Provider>
          <View style={styles.container}>
      <Calendar
        markedDates={reservations}
        onDayPress={handleDayPress}
        markingType="period"
        firstDay={1}
        
      />
           </View>
    <Portal>
          <Dialog visible={visible} onDismiss={hideDialog}
          style={{ backgroundColor: '#f2f2f2'  }}>
            <Dialog.Title>Varaukset päivälle {selectedDate}</Dialog.Title>
            <Dialog.Content>
              {reservationDetails && reservationDetails.length > 0 ? (
                reservationDetails.map((notification, index) => (
                  <View key={index} style={{ marginBottom: 10 }}>
                    <Text style={{ fontWeight: 'bold' }}>Palvelu: {notification.service || 'Ei tietoa'}</Text>
                    <Text>Omistaja: {notification.userEmail}</Text>
                    <Text style={{ fontWeight: 'bold' }}>Hoidettavat lemmikit:</Text>
                       {notification.petDetails && notification.petDetails.length > 0 ? (
                        notification.petDetails.map((pet, index) => (
                        <View key={index}>
                       <Text>Lemmikin nimi: {pet.name}</Text>
                        <Text>Sukupuoli: {pet.gender}</Text>
                        <Text>Rotu: {pet.race}</Text>
                      </View>
                      ))
                    ) : (
                      <Text>Ei valittuja lemmikkejä</Text>
                    )}

                    <Text>Lisätiedot:</Text>
                    <Text>- Tulee toimeen muiden kanssa: {notification.additionalInfo.getsAlong ? 'Kyllä' : 'Ei'}</Text>
                    <Text>- Saa olla muita lemmikkejä: {notification.additionalInfo.allowsOtherPets ? 'Kyllä' : 'Ei'}</Text>
                    <Text>- Erityistarpeet: {notification.additionalInfo.specialNeeds ? 'Kyllä' : 'Ei'}</Text>
                    
                  </View>
                ))
              ) : (
                <Text>Ei varauksia tälle päivälle.</Text>
              )}
            </Dialog.Content>
            <Dialog.Actions>
            <Button onPress={hideDialog}
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
        </Provider>
        
  )}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
});

export default CalendarComponent;


