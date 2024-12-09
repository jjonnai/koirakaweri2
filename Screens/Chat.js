import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet} from 'react-native';
import { Button } from '@rneui/base';
import { sendMessage, fetchMessages } from '../Components/MessageFunc';
import { getAuth } from 'firebase/auth';
import { useRoute } from '@react-navigation/native';
import { getDatabase, ref, onValue } from 'firebase/database';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    //const [newMessages, setNewMessages] = useState(false);
    const route = useRoute();
    const { contactEmail } = route.params;
    const auth = getAuth();
    const userEmail = auth.currentUser.email.replace(/\./g, '_');
    const contactEmailKey = contactEmail.replace(/\./g, '_');
    const db = getDatabase();
    
  
    const scrollViewRef = useRef();
    
    


    useEffect(() => {
      const messagesRef = ref(db, `messages`);
      
      const unsubscribe = onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const allMessages = Object.keys(data).flatMap(key => 
            Object.values(data[key])
          );
  
          const contactMessages = allMessages.filter(
            (msg) => 
              (msg.from === userEmail && msg.to === contactEmailKey) ||
              (msg.from === contactEmailKey && msg.to === userEmail)
          );
    
  
         const sortedMessages = contactMessages.sort((a, b) => a.timestamp - b.timestamp);
          
          setMessages(sortedMessages); 
          scrollViewRef.current.scrollToEnd({ animated: true });  
        } else {
          setMessages([]);  
        }
      });
      
      return () => unsubscribe();
      
    }, [contactEmailKey, userEmail]);
  
    const handleSendMessage = async () => {
      if (newMessage.trim() === '') return;
      
      try {
        await sendMessage(contactEmail, newMessage);
        setNewMessage('');
        
       
      } catch (error) {
        console.error('Viestin lähetys epäonnistui:', error);
      }
    };
  
    return (
      <View style={styles.container}>
        <ScrollView 
          style={styles.messageList}
          ref={scrollViewRef}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageItem,
                msg.from === userEmail ? styles.sentMessage : styles.receivedMessage,
              ]}
            >
              <Text style={styles.messageText}>{msg.message}</Text>
              <Text style={styles.timestamp}>{new Date(msg.timestamp).toLocaleString()}</Text>
            </View>
          ))}
        </ScrollView>
  
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Kirjoita viesti"
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <Button
          title='Lähetä'
          onPress={handleSendMessage}
          buttonStyle={{ backgroundColor: '#ff3300',
            borderRadius:16,
            paddingHorizontal:14
           }} 
          titleStyle={{ color: '#ffffff' }}
          />
          
            
        </View>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
      backgroundColor:'#f2f2f2'
    },
    messageList: {
      flex: 1,
      marginBottom: 10,
    },
    messageItem: {
      padding: 10,
      borderRadius: 10,
      marginVertical: 5,
    },
    sentMessage: {
      backgroundColor: '#dcf8c6',
      alignSelf: 'flex-end',
      marginLeft:70,
      
    },
    receivedMessage: {
      backgroundColor: '#cccccc',
      alignSelf: 'flex-start',
      marginRight:70
    },
    messageText: {
      fontSize: 16,
    },
    timestamp: {
      fontSize: 12,
      color: '#888',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      borderWidth: 1,
      padding: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    button: {

    }
  });