import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';
import  {sendMessage ,fetchMessages} from '../Components/MessageFunc'
import { fetchProfileImage } from '../Components/ProfileFunctions';
import { auth, database } from '../firebase';


export default function Messages({onClearBadge}) {
  const [contacts, setContacts] = useState([]);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const navigation = useNavigation();

//Uusien viestin ilmoitus punaisella pallolla
useEffect(() => {
  const fetchMessagesData = setTimeout(() => {
    //setMessages([{ id: 1, content: 'Uusi viesti!' }]); 
    if (onClearBadge) onClearBadge(); 
  }, 2000);

  return () => clearTimeout(fetchMessagesData);
}, [onClearBadge]);

useEffect(() => {
  fetchMessages((messages) => {
    const uniqueContacts = Object.keys(messages);  
    const contactsWithImages = uniqueContacts.map(async (contact) => {
      let profileImage = null;
      try {
        await fetchProfileImage(
          (imageUri) => {
            profileImage = imageUri;
          },
          { currentUser: { email: contact.replace(/_/g, '.') } }, 
          database
        );
      } catch (error) {
        console.error(`Profiilikuvan haku epäonnistui: ${contact}, virhe: ${error}`);
      }
      return { email: contact, profileImage }; 
    });

    Promise.all(contactsWithImages).then((contactsData) => {
      setContacts(contactsData); // Varmistetaan, että contacts päivitetään
    });
  });
}, []);





const toggleMessageForm = () => {
  setShowMessageForm((prev) => !prev); 
};

const handleSendMessage = async () => {
  try {
    await sendMessage(receiverEmail, newMessage);  // Lähetetään viesti
    alert('Viestisi on lähetetty!');

    // Päivitetään viestit ja yhteystiedot
    fetchMessages((messages) => {
      const uniqueContacts = Object.keys(messages);
      const contactsWithImages = uniqueContacts.map(async (contact) => {
        let profileImage = null;
        try {
          await fetchProfileImage(
            (imageUri) => {
              profileImage = imageUri;
            },
            { currentUser: { email: contact.replace(/_/g, '.') } },
            database
          );
        } catch (error) {
          console.error(`Profiilikuvan haku epäonnistui: ${contact}, virhe: ${error}`);
        }
        return { email: contact, profileImage };
      });

      // Odotetaan kaikkien profiilikuvien lataamista ja päivitetään contacts
      Promise.all(contactsWithImages).then((contactsData) => {
        setContacts(contactsData); // Päivitetään yhteystiedot, jolloin uusi viestiketju näkyy
        console.log(contactsData);  // Varmistetaan, että uusi viesti ilmestyy
      });
    });

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
    {contacts.length === 0 ? (
      <Text style={styles.noMessagesText}>Aloita keskustelu etsimällä etsi sivulta hoitaja ja laittamalla viestiä! Tai tekemällä uusi ilmoitus hoidon tarpeesta.</Text>
    ) : (
      <FlatList
      data={contacts}
      keyExtractor={(item) => item.email}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Viestit', { contactEmail: item.email });
            if (onClearBadge) onClearBadge();
          }}
          style={styles.contactItem}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}>
              <Image
                style={styles.Image}
                src={item.profileImage || 'default-profile.png'}
                alt="Profiilikuva"
              />
              <Text style={styles.contactText}>{item.email.replace(/_/g, '.')}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    )}


<View style={styles.newMail}>
      <TouchableOpacity  onPress={toggleMessageForm}>
        <AntDesign name={showMessageForm ? "minuscircleo" : "pluscircleo"}
        size={40} 
        color="black" 
        />
      </TouchableOpacity>
      </View>
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
    backgroundColor:'#f2f2f2'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  contactItem: {
    padding: 8,
    borderWidth:0.2,
    borderRadius:16,
    marginBottom:6,
    //borderBottomWidth: 1,
    borderBottomColor: 'black',
    flexDirection:'row',
    //borderTopWidth:1,
    borderTopColor: 'black'
    
  },
  contactText: {
    fontSize: 18,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#25D366',  
    borderRadius: 50,
    padding: 15,
    elevation: 5,  
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
  Image:{
    width: 40,
    height: 40,
    borderRadius: 24,
    marginRight: 8,
    
   
  },
  newMail:{
    alignSelf: 'flex-end',
    marginBottom: 10,
    flexDirection:'row'
  },
  noMessagesText:{
    fontSize:16,

  }
});