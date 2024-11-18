import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function Varauskalenteri() {
  const [varaukset, setVaraukset] = useState({});

  const addVaraus = (date) => {
    setVaraukset((prevVaraukset) => ({
      ...prevVaraukset,
      [date]: { selected: true, marked: true, selectedColor: 'blue' },
    }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Varauskalenteri</Text>
      <Calendar
        onDayPress={(day) => addVaraus(day.dateString)}
        markedDates={varaukset}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
