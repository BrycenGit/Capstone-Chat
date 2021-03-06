import './App.css';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useState, useRef } from 'react';

const config = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID 
}


if (!firebase.apps.length) {
  firebase.initializeApp(config);
}else {
  firebase.app(); // if already initialized, use that one
}
const key = "bye bye bye"
const CryptoJS = require('crypto-js');
const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {

  const [user] = useAuthState(auth);
  console.log(auth)
  return (
    <div className='App'>
      <header>
        <h1>👽👾🤖</h1><SignOut />
      </header>
      <section>
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
    
  );
}


function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  return (
    <button onClick={signInWithGoogle}>Sign in with Google</button>
  )
}

function SignOut() { //sign out function
  return auth.currentUser && (

    <button onClick={() => auth.signOut()}>Sign Out</button>
  )
}

function ChatRoom() {
  
  const dummy = useRef()

  const messagesRef = firestore.collection('messages'); // gets messages from firestore
  const query = messagesRef.orderBy('createdAt').limit(25); // limits shown messages to 25

  const [messages] = useCollectionData(query, {idField: 'id'}); // listen to data with a hook

  const [formValue, setFormValue] = useState('');

  const sendMessage = async(e) => {
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;

    await messagesRef.add({
      text: CryptoJS.AES.encrypt(formValue, key).toString(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL: photoURL ? photoURL : null
    });
  
    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }
  
  return (
    <>
      <main>
        {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}

        <div ref={dummy}></div>
      </main>
      
      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={(e) => {setFormValue(e.target.value);}}/>
        <button type="submit">Send</button>
      </form>
    </>
  )
}

function ChatMessage(props) {
  const { text, uid, photoURL } = props.message; 
  const bytes = CryptoJS.AES.decrypt(text, key);
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
  console.log(bytes.toString(CryptoJS.enc.Utf8))
  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL} />
      <div className='neonText'><p>{bytes.toString(CryptoJS.enc.Utf8)}</p></div>
    </div>
  )
}

export default App;
