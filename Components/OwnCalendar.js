import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Dialog, Portal, Text as PaperText, Provider, useTheme } from 'react-native-paper';
import { ref, onValue } from 'firebase/database';
import { Button } from '@rneui/themed';

const OwnCalendar = ({ userEmail, database }) => {
  const [reservations, setReservations] = useState({}); 
  const [selectedDate, setSelectedDate] = useState(null); 
  const [visible, setVisible] = useState(false); 
  const [reservationDetails, setReservationDetails] = useState([]); 
  const theme = useTheme();

  useEffect(() => {

    const sanitizedEmail = userEmail.replace(/\./g, '_'); 
    console.log(sanitizedEmail)
    const ownReservationRef = ref(database, `users/${sanitizedEmail}/notifications`); 

    onValue(ownReservationRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedNotifications = snapshot.val();
        const formattedReservations = Object.keys(fetchedNotifications).reduce((acc, notificationId) => {
          const notification = fetchedNotifications[notificationId];


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
  }, [userEmail, database]);

 
  const fetchReservationDetails = (date) => {
    const sanitizedEmail = userEmail.replace(/\./g, '_'); 
    const ownReservationRef = ref(database, `users/${sanitizedEmail}/notifications`); 
    onValue(ownReservationRef, (snapshot) => {
      if (snapshot.exists()) {
        const fetchedNotifications = snapshot.val();
        const matchingNotifications = [];
  
        Object.keys(fetchedNotifications).forEach((notificationId) => {
          const notification = fetchedNotifications[notificationId];
  
          if (notification.dates && notification.dates.includes(date) && notification.status?.value === "hyväksytty") {
            matchingNotifications.push({
              ...notification, 
              userEmail: userEmail, 
            });
          }
        });
  
        if (matchingNotifications.length > 0) {
          setReservationDetails(matchingNotifications); 
          setVisible(true); 
        } else {
          setReservationDetails([]);
          setVisible(false); 
        }
      } else {
        setReservationDetails([]);
        setVisible(false); 
      }
    });
  };

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString); 
    fetchReservationDetails(day.dateString); 
    console.log(fetchReservationDetails)
  };

  const hideDialog = () => setVisible(false); 

  return (
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
                  <Text >Hoitaja: {notification.status?.acceptedBy.replace(/\_/g, '.')}</Text>
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
              <PaperText>Ei varauksia tälle päivälle.</PaperText>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  selectedDateContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OwnCalendar;