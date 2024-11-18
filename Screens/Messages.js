import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchMessages, sendMessage } from '../Components/MessageFunc'; 
import AntDesign from '@expo/vector-icons/AntDesign';


export default function Messages() {
  const [contacts, setContacts] = useState([]);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    fetchMessages((messages) => {
      const uniqueContacts = Object.keys(messages);
      setContacts(uniqueContacts);
    });
  }, []);

  const toggleMessageForm = () => setShowMessageForm(!showMessageForm);

  const handleSendMessage = async () => {
    try {
      await sendMessage(receiverEmail, newMessage);
      alert('Viestisi on lähetetty!');
      setReceiverEmail('');
      setNewMessage('');
      setShowMessageForm(false);
    } catch (error) {
      console.error('Viestin lähetys epäonnistui:', error);
      alert('Viestin lähetys epäonnistui.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Viestit</Text>
  
      {/* Viestit näkyvät listassa */}
      <FlatList
        data={contacts}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Viestit', { contactEmail: item })}
            style={styles.contactItem}
          >
            <Text style={styles.contactText}>{item.replace(/_/g, '.')}</Text>
          </TouchableOpacity>
        )}
      />
  
      {/* Lisää uusi viesti -painike */}
      <TouchableOpacity onPress={toggleMessageForm}>
        <AntDesign name="pluscircleo" size={24} color="black" />
      </TouchableOpacity>
  
      {/* Viestin syöttölomake */}
      {showMessageForm && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Vastaanottajan sähköposti"
            value={receiverEmail}
            onChangeText={setReceiverEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Kirjoita viesti"
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <Button title="Lähetä viesti" onPress={handleSendMessage} />
        </View>
      )}
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  contactItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  contactText: {
    fontSize: 18,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#25D366',  // Esimerkiksi vihreä WhatsApp-tyylinen väri
    borderRadius: 50,
    padding: 15,
    elevation: 5,  // Luo varjon
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
});