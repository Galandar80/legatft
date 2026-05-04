// Script per aggiungere i dati delle statistiche al database Firebase - Lega TFT
// Eseguire questo script per inizializzare o aggiornare le statistiche

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

// Inizializzazione Firebase (esempio con Node.js)
// Richiede: npm install firebase
const firebase = require('firebase/app');
require('firebase/database');

// Inizializza Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();

// Dati statistiche reali
const statistiche = {
    giocatori: 120,  // Numero di giocatori registrati
    tornei: 25,      // Numero di tornei organizzati
    citta: 3,        // Numero di città coinvolte
};

// Aggiorna o crea le statistiche nel database
database.ref('statistiche').set(statistiche)
    .then(() => {
        console.log('Statistiche aggiornate con successo nel database!');
        // Chiudi la connessione al database
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    })
    .catch((error) => {
        console.error('Errore durante l\'aggiornamento delle statistiche:', error);
        process.exit(1);
    }); 
