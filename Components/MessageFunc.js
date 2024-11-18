import { getDatabase, ref, push, set, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Viestin lähetysfunktio
export const sendMessage = async (receiverEmail, messageText) => {
  const db = getDatabase();
  const auth = getAuth();
  const sender = auth.currentUser;

  if (!sender) {
    alert('Kirjaudu sisään lähettääksesi viestin.');
    return;
  }

  // Määritä sähköpostit Firebase-yhteensopiviksi
  const senderEmail = sender.email.replace(/\./g, '_');
  const receiverEmailKey = receiverEmail.replace(/\./g, '_');

  // Luo viesti
  const messageData = {
    from: senderEmail,
    to: receiverEmailKey,
    message: messageText,
    timestamp: Date.now(),
  };

  // Lisää viesti vastaanottajan polun alle
  const messageRef = ref(db, `messages/${receiverEmailKey}`);
  const newMessageRef = push(messageRef);

  try {
    await set(newMessageRef, messageData);
    //alert('Viestisi on lähetetty!');
  } catch (error) {
    console.error('Viestin lähetys epäonnistui:', error);
    alert('Viestin lähetys epäonnistui.');
  }
};

// Viestien haku funktio
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

      // Ryhmittele viestit lähettäjän mukaan
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
