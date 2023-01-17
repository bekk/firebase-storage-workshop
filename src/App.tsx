import React, { useEffect } from "react";
import logo from "./logo.svg";
import {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytes,
  connectStorageEmulator,
} from "firebase/storage";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  connectAuthEmulator,
} from "firebase/auth";
import "./App.css";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCdKPKRxtUW9TU9ssXQmRf9NCTIXo0m588",
  authDomain: "fir-storage-ws.firebaseapp.com",
  projectId: "fir-storage-ws",
  storageBucket: "fir-storage-ws.appspot.com",
  messagingSenderId: "1075292488392",
  appId: "1:1075292488392:web:c4f813bc6b31493699dbfd",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const storage = getStorage();
const auth = getAuth();

if (window.origin.startsWith("http://localhost")) {
  connectStorageEmulator(storage, "localhost", 9199);
  connectAuthEmulator(auth, "http://localhost:9099");
}

const imageRef = ref(storage, "Snø.jpg");

function App() {
  const [imageUrl, setImageUrl] = React.useState("");
  const [uid, setUid] = React.useState<string | undefined>();

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch(console.error);
      }
      console.log("user", user?.uid);
      setUid(user?.uid);
    });
  }, []);

  useEffect(() => {
    getDownloadURL(imageRef).then(setImageUrl);
  }, []);

  console.log(imageUrl);

  const uploadFile: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!uid) {
      return alert("uid manglar!");
    }

    const uploadedImageRef = ref(storage, `${uid}/${file.name}`);

    uploadBytes(uploadedImageRef, file).then((snapshot) => {
      alert("Uploaded file successfully!");
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <img
          src="https://firebasestorage.googleapis.com/v0/b/fir-storage-ws.appspot.com/o/Sn%C3%B8.jpg?alt=media&token=fd73dead-bf4d-494b-914d-01614db279a1"
          height="200"
          width="200"
        />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <input
          type="file"
          id="file-upload"
          name="file-upload"
          accept="image/png, image/jpeg"
          onChange={uploadFile}
        />
      </header>
    </div>
  );
}

export default App;
