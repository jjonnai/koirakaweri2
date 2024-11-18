import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, update, remove, get, addDoc, collection, doc, setDoc, set, 
  query, orderByChild, equalTo, onValue  } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";





const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const database = getDatabase(app);
const auth = getAuth(app);

const MESSAGES = 'messages';

  export {
    app,
    auth,
    firestore,
    database,
    ref,
    push,
    update,
    remove,
    get,
    set,
    getAuth,
    signInWithEmailAndPassword,
    onValue,
    addDoc,
    MESSAGES,
    collection,
    doc,
    setDoc,
    query,
    equalTo,
    orderByChild
  }
