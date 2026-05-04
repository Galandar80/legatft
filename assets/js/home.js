

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });

            // Close mobile menu if open
            const mainNav = document.getElementById('mainNav');
            if (mainNav && mainNav.classList.contains('active')) {
                mainNav.classList.remove('active');
            }
        }
    });
});

// Contact Form
const contactForm = document.getElementById('contactForm');
const confirmationMessage = document.getElementById('confirmationMessage');
const html = window.escapeHTML || (value => String(value ?? ''));

if (contactForm) {
    // Gestione form con Formspree
    contactForm.addEventListener('submit', function (e) {
        // La validazione viene gestita dai campi required
        // Formspree si occuperà dell'invio

        // Disabilita il pulsante per evitare invii multipli
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Invio in corso...';

        // Formspree gestirà il resto (non serve preventDefault)
        // Il browser si occuperà di inviare il form a Formspree
    });

    // Controllo se c'è un messaggio di successo nell'URL (reindirizzamento da Formspree)
    if (window.location.search.includes('contact_success=true') && confirmationMessage) {
        contactForm.style.display = 'none';
        confirmationMessage.style.display = 'block';
    }
}

// Animation for counters
function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    const speed = 200;

    counters.forEach(counter => {
        const target = +counter.innerText.replace(/[^\d]/g, '');
        let count = 0;
        const increment = target / speed;

        const updateCount = () => {
            if (count < target) {
                count += increment;
                counter.innerText = Math.ceil(count) + (counter.innerText.includes('+') ? '+' : '');
                counter.innerText = counter.innerText.includes('€') ? '€' + counter.innerText : counter.innerText;
                setTimeout(updateCount, 1);
            } else {
                counter.innerText = target + (counter.innerText.includes('+') ? '+' : '');
                counter.innerText = counter.innerText.includes('€') ? '€' + counter.innerText : counter.innerText;
            }
        };

        updateCount();
    });
}

// Run animations when elements are in viewport
function handleScrollAnimations() {
    const elements = document.querySelectorAll('.feature-card, .event-card, .ranking-box');

    elements.forEach(element => {
        const position = element.getBoundingClientRect();

        // Check if element is in viewport
        if (position.top < window.innerHeight && position.bottom >= 0) {
            element.classList.add('fade-in');
        }
    });
}

// Initialize animations
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(animateCounters, 500);
    handleScrollAnimations();

    window.addEventListener('scroll', handleScrollAnimations);

    // Inizializza Firebase e carica le classifiche e gli eventi
    initFirebaseAndLoadRankings();
    updateHomeNextTournament();


});

function parseHomeTournamentDate(torneo) {
    const value = torneo.dataInizio || torneo.data || torneo.creatoIl || '';
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function isHomeUpcomingTournament(torneo) {
    const date = parseHomeTournamentDate(torneo);
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date >= today;
}

function renderHomeTournamentEmpty(title = 'Nessun torneo futuro programmato') {
    const container = document.getElementById('homeNextTournament');
    if (!container) return;
    container.innerHTML = `
        <div class="premium-empty" style="grid-column: 1/-1;">
            <i class="fas fa-calendar-alt"></i>
            <div class="empty-title">${html(title)}</div>
            <div class="empty-copy">La prossima data apparira qui appena sara confermata dal team.</div>
            <a href="tornei.html" class="btn btn-primary">Vai ai tornei</a>
        </div>`;
}

function updateHomeNextTournament() {
    const container = document.getElementById('homeNextTournament');
    if (!container) return;

    if (!database) {
        renderHomeTournamentEmpty('Calendario in aggiornamento');
        return;
    }

    Promise.all([
        database.ref('tornei').once('value'),
        database.ref('cups').once('value')
    ])
        .then(([torneiSnapshot, cupsSnapshot]) => {
            const tornei = torneiSnapshot.val() || {};
            const cups = cupsSnapshot.val() || {};
            const next = Object.entries(tornei)
                .filter(([_, torneo]) => isHomeUpcomingTournament(torneo))
                .sort((a, b) => parseHomeTournamentDate(a[1]) - parseHomeTournamentDate(b[1]))[0];

            if (!next) {
                renderHomeTournamentEmpty();
                return;
            }

            const [, torneo] = next;
            const data = parseHomeTournamentDate(torneo);
            const formattedData = data ? data.toLocaleDateString('it-IT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }) : 'Data da definire';
            const imageUrl = torneo.immagine && window.safeURL ? window.safeURL(torneo.immagine, '') : (torneo.immagine || '');
            const cupName = torneo.cupId ? (cups[torneo.cupId]?.name || 'Si') : 'No';
            const orario = torneo.orario ? `<p><strong>Orario:</strong> ${html(torneo.orario)}</p>` : '';

            container.innerHTML = `
                <article class="tournament-card home-next-tournament-card" style="grid-column: 1/-1;">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${html(torneo.nome || 'Torneo')}" class="tournament-card-image" loading="lazy">` : ''}
                    <div class="tournament-date">
                        <i class="far fa-calendar"></i> ${html(formattedData)}
                    </div>
                    <h3 class="tournament-title">${html(torneo.nome || 'Torneo Lega TFT')}</h3>
                    ${torneo.luogo ? `<div class="tournament-location"><i class="fas fa-map-marker-alt"></i> ${html(torneo.luogo)}</div>` : ''}
                    <div class="tournament-details">
                        <p><strong>Formato:</strong> ${html(torneo.tipo || torneo.formato || 'TFT')}</p>
                        ${orario}
                        <p><strong>Coppa:</strong> ${html(cupName)}</p>
                        <p><strong>Iscrizioni:</strong> ${torneo.iscrizioneAperta === false ? 'Chiuse' : 'Aperte'}</p>
                    </div>
                    <div class="tournament-action">
                        <a href="tornei.html#nextTournaments" class="btn btn-primary">Dettagli e iscrizione</a>
                    </div>
                </article>`;
        })
        .catch(error => {
            console.error("Errore nel caricamento del prossimo torneo:", error);
            renderHomeTournamentEmpty('Prossimo torneo non disponibile');
        });
}

// Funzione per aggiornare la classifica top players
function updateTopPlayers(torneiData) {
    const container = document.getElementById('topPlayersRanking');
    if (!container) return;

    container.innerHTML = '';

    // Oggetto per memorizzare i punti totali per ogni giocatore
    const giocatoriPunti = {};

    // Raccogli tutti i dati dai tornei
    Object.values(torneiData).forEach(torneo => {
        // Raccolgo tutti i giocatori di questo torneo
        Object.values(torneo.giocatori || {}).forEach(giocatore => {
            const nome = giocatore.nome;
            const punti = parseInt(giocatore.punti) || 0;

            // Se è la prima volta che vedo questo giocatore, inizializzo il contatore
            if (!giocatoriPunti[nome]) {
                giocatoriPunti[nome] = 0;
            }

            // Aggiungo i punti di questo torneo
            giocatoriPunti[nome] += punti;
        });
    });

    // Creo le righe della classifica ordinate per punti totali
    const giocatoriOrdinati = Object.entries(giocatoriPunti)
        .sort((a, b) => b[1] - a[1]) // Ordino per punti totali (dal più alto al più basso)
        .slice(0, 5); // Prendo solo i primi 5

    // Se non ci sono giocatori
    if (giocatoriOrdinati.length === 0) {
        container.innerHTML = `
            <div class="ranking-item no-data">
                Nessun dato disponibile
            </div>
        `;
        return;
    }

    // Genero la classifica
    giocatoriOrdinati.forEach(([nome, punti], index) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
            <span class="ranking-position">${index + 1}</span>
            <span class="ranking-player">${html(nome)}</span>
            <span class="ranking-points">${html(punti)} pt</span>
        `;
        container.appendChild(item);
    });
}

// Funzione per aggiornare la lista qualificati
function updateQualificati(torneiData) {
    const container = document.getElementById('qualificatiList');
    if (!container) return;

    container.innerHTML = '';

    const qualificati = [];
    Object.values(torneiData).forEach(torneo => {
        Object.values(torneo.giocatori || {}).forEach(giocatore => {
            if (giocatore.qualificato) {
                qualificati.push({
                    nome: giocatore.nome,
                    torneo: torneo.nome
                });
            }
        });
    });

    // Se non ci sono qualificati
    if (qualificati.length === 0) {
        container.innerHTML = `
            <div class="ranking-item no-data">
                Nessun giocatore qualificato
            </div>
        `;
        return;
    }

    // Limita a 5 qualificati
    qualificati.slice(0, 5).forEach((q, index) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
            <span class="ranking-position">${index + 1}</span>
            <span class="ranking-player">${html(q.nome)}</span>
            <span class="ranking-points">${html(q.torneo)}</span>
        `;
        container.appendChild(item);
    });
}

// Funzione per caricare e visualizzare gli eventi futuri
function updateEventi() {
    const container = document.getElementById('eventsContainer');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Caricamento eventi...</div>';

    // Carica eventi futuri da Firebase
    firebase.database().ref('eventi').once('value')
        .then(snapshot => {
            const eventi = snapshot.val() || {};
            let eventiArray = Object.values(eventi);

            container.innerHTML = '';

            // Se non ci sono eventi programmati, mostra un messaggio
            if (eventiArray.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-calendar-times"></i>
                        <p>Nessun evento programmato</p>
                    </div>
                `;
                return;
            }

            // Filtra solo gli eventi futuri
            const oggi = new Date();
            oggi.setHours(0, 0, 0, 0); // Reset dell'ora per confrontare solo le date

            eventiArray = eventiArray.filter(evento => {
                const dataEvento = new Date(evento.data);
                return dataEvento >= oggi;
            });

            // Ordina gli eventi per data (dal più vicino al più lontano)
            eventiArray.sort((a, b) => new Date(a.data) - new Date(b.data));

            // Se dopo il filtraggio non ci sono eventi futuri
            if (eventiArray.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-calendar-times"></i>
                        <p>Nessun evento futuro programmato</p>
                    </div>
                `;
                return;
            }

            // Prendi solo i primi 3 eventi futuri
            eventiArray = eventiArray.slice(0, 3);

            // Crea una card per ogni evento
            eventiArray.forEach((evento, index) => {
                const dataEvento = new Date(evento.data);
                const formattedData = dataEvento.toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });

                // Calcola giorni mancanti per badge
                const giorniMancanti = Math.ceil((dataEvento - oggi) / (1000 * 60 * 60 * 24));
                let countdownText = '';

                if (giorniMancanti === 0) {
                    countdownText = `Oggi!`;
                } else if (giorniMancanti === 1) {
                    countdownText = `Domani!`;
                } else if (giorniMancanti <= 7) {
                    countdownText = `Tra ${giorniMancanti} giorni`;
                }

                // Immagini predefinite per eventi
                const immaginiDefault = [
                    "https://i.imgur.com/Y2WXnK8.jpg",
                    "https://i.imgur.com/UiVXjfZ.jpg",
                    "https://i.imgur.com/t3JtFI9.jpg"
                ];

                // Usa l'immagine homepage se disponibile, altrimenti usa l'immagine standard o una predefinita
                const immagineEvento = window.safeURL
                    ? window.safeURL(evento.immagineHome || evento.immagine, immaginiDefault[index % immaginiDefault.length])
                    : (evento.immagineHome || evento.immagine || immaginiDefault[index % immaginiDefault.length]);

                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';
                eventCard.innerHTML = `
                    <img src="${immagineEvento}" alt="${html(evento.nome || 'Evento')}" class="event-img" onerror="this.src='${immaginiDefault[index % immaginiDefault.length]}'">
                    <div class="event-info">
                        <h3 class="event-title">${html(evento.nome || 'Evento Lega TFT')}</h3>
                        <p class="event-date"><i class="far fa-calendar-alt"></i> ${formattedData} ${countdownText ? `<span class="countdown-badge">${countdownText}</span>` : ''}</p>
                        <p class="event-location"><i class="fas fa-map-marker-alt"></i> ${html(evento.luogo || 'Luogo da definire')}</p>
                        <p class="event-description">${html(evento.descrizione || 'Vieni a partecipare a questo evento della Lega TFT!')}</p>
                        <a href="eventi.html" class="event-link">Maggiori Informazioni</a>
                    </div>
                `;

                container.appendChild(eventCard);
            });
        })
        .catch(error => {
            console.error("Errore nel caricamento degli eventi:", error);
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Errore nel caricamento degli eventi</p>
                </div>
            `;
        });
}

// Inizializza Firebase e carica le classifiche e gli eventi
function initFirebaseAndLoadRankings() {
    // Firebase configuration handled in firebase-config.js
    if (typeof firebase !== 'undefined') {
        // database is already initialized in firebase-config.js


        // Carica gli eventi
        updateEventi();

        // Carica le statistiche direttamente
        database.ref('statistiche').once('value')
            .then(snapshot => {
                const stats = snapshot.val() || {};
                console.log("Statistiche caricate dal database:", stats);
                updateStats(stats);
            })
            .catch(error => {
                console.error("Errore nel caricamento delle statistiche:", error);
            });

        // Carica i dati dei tornei da Firebase
        database.ref('tornei').once('value')
            .then(snapshot => {
                const torneiData = snapshot.val() || {};

                // Carica la classifica top players
                updateTopPlayers(torneiData);

                // Carica la lista qualificati
                updateQualificati(torneiData);

                // Se non ci sono statistiche, calcola i tornei dal database
                const statsContainer = document.getElementById('statsContainer');
                const counters = statsContainer ? statsContainer.querySelectorAll('.counter') : [];
                if (counters[1] && counters[1].getAttribute('data-count') === '0') {
                    const numTornei = Object.keys(torneiData).length;
                    counters[1].setAttribute('data-count', numTornei);
                    counters[1].textContent = numTornei + '+';
                }
            })
            .catch(error => {
                console.error("Errore nel caricamento dei dati:", error);
            });
    } else {
        console.error("Firebase non è disponibile. Assicurati di includere le librerie Firebase.");

        // Carica dati di esempio se Firebase non è disponibile
        const topPlayersContainer = document.getElementById('topPlayersRanking');
        const qualificatiContainer = document.getElementById('qualificatiList');
        const eventsContainer = document.getElementById('eventsContainer');

        if (topPlayersContainer) {
            topPlayersContainer.innerHTML = `
                <div class="ranking-item">
                    <span class="ranking-position">1</span>
                    <span class="ranking-player">Salvatore Morabito</span>
                    <span class="ranking-points">780 pt</span>
                </div>
                <div class="ranking-item">
                    <span class="ranking-position">2</span>
                    <span class="ranking-player">Giuseppe Bernava</span>
                    <span class="ranking-points">620 pt</span>
                </div>
                <div class="ranking-item">
                    <span class="ranking-position">3</span>
                    <span class="ranking-player">Francesco Rizzo</span>
                    <span class="ranking-points">580 pt</span>
                </div>
                <div class="ranking-item">
                    <span class="ranking-position">4</span>
                    <span class="ranking-player">Antonio Donato</span>
                    <span class="ranking-points">490 pt</span>
                </div>
                <div class="ranking-item">
                    <span class="ranking-position">5</span>
                    <span class="ranking-player">Marco Carbone</span>
                    <span class="ranking-points">450 pt</span>
                </div>
            `;
        }

        if (qualificatiContainer) {
            qualificatiContainer.innerHTML = `
                <div class="ranking-item">
                    <span class="ranking-position">1</span>
                    <span class="ranking-player">Salvatore Morabito</span>
                    <span class="ranking-points">Regionale Messina</span>
                </div>
                <div class="ranking-item">
                    <span class="ranking-position">2</span>
                    <span class="ranking-player">Giuseppe Bernava</span>
                    <span class="ranking-points">Championship</span>
                </div>
                <div class="ranking-item">
                    <span class="ranking-position">3</span>
                    <span class="ranking-player">Francesco Rizzo</span>
                    <span class="ranking-points">Reggio Calabria</span>
                </div>
                <div class="ranking-item">
                    <span class="ranking-position">4</span>
                    <span class="ranking-player">Antonio Donato</span>
                    <span class="ranking-points">Regionale Messina</span>
                </div>
                <div class="ranking-item">
                    <span class="ranking-position">5</span>
                    <span class="ranking-player">Marco Carbone</span>
                    <span class="ranking-points">Championship</span>
                </div>
            `;
        }

        if (eventsContainer) {
            eventsContainer.innerHTML = `
                <div class="event-card">
                    <img src="https://i.imgur.com/Y2WXnK8.jpg" alt="Torneo Regionale Messina" class="event-img">
                    <div class="event-info">
                        <h3 class="event-title">Torneo Regionale Messina</h3>
                        <p class="event-date"><i class="far fa-calendar-alt"></i> 22 Dicembre 2023</p>
                        <p class="event-location"><i class="fas fa-map-marker-alt"></i> Games Academy Messina</p>
                        <p class="event-description">Il più grande torneo regionale della Lega TFT con un montepremi di 800 pacchetti e premi esclusivi.</p>
                        <a href="eventi.html" class="event-link">Maggiori Informazioni</a>
                    </div>
                </div>
                <div class="event-card">
                    <img src="https://i.imgur.com/UiVXjfZ.jpg" alt="Qualificazioni Reggio Calabria" class="event-img">
                    <div class="event-info">
                        <h3 class="event-title">Qualificazioni Reggio Calabria</h3>
                        <p class="event-date"><i class="far fa-calendar-alt"></i> 15 Gennaio 2024</p>
                        <p class="event-location"><i class="fas fa-map-marker-alt"></i> Game Time, Reggio Calabria</p>
                        <p class="event-description">Torneo di qualificazione per il Championship regionale. I primi 4 classificati accederanno alla finale.</p>
                        <a href="eventi.html" class="event-link">Maggiori Informazioni</a>
                    </div>
                </div>
                <div class="event-card">
                    <img src="https://i.imgur.com/t3JtFI9.jpg" alt="Championship Messina" class="event-img">
                    <div class="event-info">
                        <h3 class="event-title">Championship Messina</h3>
                        <p class="event-date"><i class="far fa-calendar-alt"></i> 5 Febbraio 2024</p>
                        <p class="event-location"><i class="fas fa-map-marker-alt"></i> Centro Commerciale Messina</p>
                        <p class="event-description">Tappa finale del circuito regionale con ospiti speciali e montepremi totale di €1500.</p>
                        <a href="eventi.html" class="event-link">Maggiori Informazioni</a>
                    </div>
                </div>
            `;
        }
    }
}

// Funzione per aggiornare le statistiche
function updateStats(stats) {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;

    const counters = statsContainer.querySelectorAll('.counter');

    console.log("Aggiornamento statistiche con i dati:", stats);

    // Imposta valori di default in caso di dati mancanti
    if (!stats || Object.keys(stats).length === 0) {
        console.warn("Nessun dato statistico trovato nel database!");
        return;
    }

    // Aggiorna il numero di giocatori se disponibile
    if (stats.giocatori !== undefined) {
        counters[0].setAttribute('data-count', stats.giocatori);
        counters[0].textContent = stats.giocatori + '+';
        console.log("Giocatori impostati a:", stats.giocatori);
    } else {
        console.warn("Statistiche giocatori non trovate!");
    }

    // Aggiorna il numero di tornei se disponibile
    if (stats.tornei !== undefined) {
        counters[1].setAttribute('data-count', stats.tornei);
        counters[1].textContent = stats.tornei + '+';
        console.log("Tornei impostati a:", stats.tornei);
    } else {
        console.warn("Statistiche tornei non trovate!");
    }

    // Aggiorna il numero di città se disponibile
    if (stats.citta !== undefined) {
        counters[2].setAttribute('data-count', stats.citta);
        counters[2].textContent = stats.citta + '+';
        console.log("Città impostate a:", stats.citta);
    } else {
        console.warn("Statistiche città non trovate!");
    }

    // Avvia l'animazione dei contatori
    animateCounters();
}
