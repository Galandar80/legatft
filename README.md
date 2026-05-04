# Lega TFT

Sito statico per la gestione e la pubblicazione della Lega TFT: home, tornei, classifiche, eventi, premi, Hall of Fame, contatti e pannelli admin.

## Setup rapido

1. Installa le dipendenze:

```bash
npm install
```

2. Avvia un server statico dalla root del progetto:

```bash
python -m http.server 8000
```

3. Apri `http://127.0.0.1:8000/index.html`.

## Firebase

La configurazione client e' in `assets/js/firebase-config.js` e punta al progetto `legatft-7ba5e`.

Il sito usa ancora gli SDK compat:

- `firebase-app-compat.js`
- `firebase-database-compat.js`
- `firebase-auth-compat.js` per le pagine admin

Le regole consigliate per Realtime Database sono in `database.rules.json`. Prima del deploy, pubblicale dal pannello Firebase o tramite Firebase CLI. Le scritture admin richiedono un utente autenticato con custom claim `admin === true`.

## Admin

Il login admin usa Firebase Auth email/password. Non ci sono piu' password hardcoded nel frontend.

Pagine protette:

- `admin-dashboard.html`
- `backend-improved.html`
- `backend.html`

La dashboard principale e' `backend-improved.html`; eventuali strumenti legacy non piu' presenti non sono linkati dalla dashboard.

Per autorizzare un admin in modo completo servono:

1. utente creato in Firebase Authentication;
2. custom claim `admin: true`;
3. regole database pubblicate.

## Test

Esegui:

```bash
npm test -- --runInBand
```

La suite copre il core testabile in `assets/js/app-core.js`: escape HTML, aggregazione punti e separazione eventi futuri/passati.

## Struttura

- `index.html`: homepage pubblica.
- `tornei.html`: tornei e embed Challonge.
- `eventi.html`: eventi futuri e passati da Firebase.
- `classifica.html`: ranking e profili giocatori.
- `assets/js/`: logica frontend.
- `assets/css/`: stili condivisi e tema TFT.
- `database_setup/`: strumenti manuali per inizializzare statistiche.

## Note di sicurezza

I dati Firebase client-side non sono segreti. La sicurezza deve stare in Auth, custom claims e regole database. Qualsiasi dato proveniente da Firebase o da input utente va renderizzato con escape o `textContent`.
