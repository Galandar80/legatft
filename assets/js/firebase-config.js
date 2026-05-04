// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDXmEYK9ZWikOEeI5q2OEeXP8ugqYiAFis",
    authDomain: "legatft-7ba5e.firebaseapp.com",
    databaseURL: "https://legatft-7ba5e-default-rtdb.firebaseio.com",
    projectId: "legatft-7ba5e",
    storageBucket: "legatft-7ba5e.firebasestorage.app",
    messagingSenderId: "190413073048",
    appId: "1:190413073048:web:f91edf87ff446a89653eed",
    measurementId: "G-P896J948LR"
};

// Inizializzazione Firebase
let app;
let database;
let auth;

if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }
    if (typeof firebase.database === 'function') {
        database = firebase.database();
    }
    if (typeof firebase.auth === 'function') {
        auth = firebase.auth();
    }
} else {
    console.error("Firebase SDK non caricato!");
}
