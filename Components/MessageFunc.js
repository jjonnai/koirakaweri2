import { getDatabase, ref, push, set, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';



export const sendMessage = async (receiverEmail, messageText) => {
  const db = getDatabase();
  const auth = getAuth();
  const sender = auth.currentUser;
 

  if (!sender) {
    alert('Kirjaudu sisään lähettääksesi viestin.');
    return;
  }

  const senderEmail = sender.email.replace(/\./g, '_');
  const receiverEmailKey = receiverEmail.replace(/\./g, '_');

  const messageData = {
    from: senderEmail,
    to: receiverEmailKey,
    message: messageText,
    timestamp: Date.now(),
  };

  const senderMessagesRef = ref(db, `messages/${senderEmail}`);
  const receiverMessagesRef = ref(db, `messages/${receiverEmailKey}`);

  try {
    await set(push(senderMessagesRef), messageData);
    await set(push(receiverMessagesRef), messageData);
  } catch (error) {
    console.error('Viestin lähetys epäonnistui:', error);
    alert('Viestin lähetys epäonnistui.');
  }
};



export const fetchMessages = (setMessages) => {
  const db = getDatabase();
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    alert('Kirjaudu sisään nähdäksesi viestit.');
    return;
  }

  const userEmailKey = user.email.replace(/\./g, '_');
  const messagesRef = ref(db, `messages/${userEmailKey}`);

  onValue(messagesRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const messagesArray = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));

      const groupedMessages = messagesArray.reduce((groups, message) => {
        const { from } = message;
        if (!groups[from]) {
          groups[from] = [];
        }
        groups[from].push(message);
        return groups;
      }, {});

      setMessages(groupedMessages);
    } else {
      setMessages({});
      console.log('Ei viestejä.');
    }
  });
};
