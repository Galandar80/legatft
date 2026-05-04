// Firebase configuration handled in firebase-config.js
const html = window.escapeHTML || (value => String(value ?? ''));
const url = window.safeURL || ((value, fallback = '#') => value || fallback);

if (typeof firebase !== 'undefined') {
    // database is already initialized in firebase-config.js


    // Carica gli eventi quando la pagina è pronta
    document.addEventListener('DOMContentLoaded', () => {
        caricaEventi();







        // Animation for elements
        function handleScrollAnimations() {
            const elements = document.querySelectorAll('.event-card, .step-card');

            elements.forEach(element => {
                const position = element.getBoundingClientRect();

                // Check if element is in viewport
                if (position.top < window.innerHeight && position.bottom >= 0) {
                    element.classList.add('fade-in');
                }
            });
        }

        handleScrollAnimations();
        window.addEventListener('scroll', handleScrollAnimations);
    });
} else {
    console.error("Firebase non è disponibile!");
}

// Carica eventi futuri e passati
function caricaEventi() {
    const containerFuturi = document.getElementById('eventiContainer');
    const containerPassati = document.getElementById('eventiPassatiContainer');

    if (!containerFuturi || !containerPassati) {
        console.error("Contenitori eventi non trovati!");
        return;
    }

    containerFuturi.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Caricamento eventi...</div>';
    containerPassati.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Caricamento eventi passati...</div>';

    firebase.database().ref('eventi').once('value')
        .then(snapshot => {
            const eventi = snapshot.val() || {};
            let eventiArray = Object.entries(eventi);

            // Se non ci sono eventi
            if (eventiArray.length === 0) {
                containerFuturi.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-calendar-times"></i>
                        <p>Nessun evento programmato</p>
                    </div>`;
                containerPassati.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-calendar-times"></i>
                        <p>Nessun evento passato</p>
                    </div>`;
                return;
            }

            containerFuturi.innerHTML = '';
            containerPassati.innerHTML = '';

            // Separa eventi futuri e passati
            const oggi = new Date();
            oggi.setHours(0, 0, 0, 0); // Reset dell'ora per confrontare solo le date

            const eventiFuturi = [];
            const eventiPassati = [];

            eventiArray.forEach(([eventoId, evento]) => {
                const dataEvento = new Date(evento.data);
                if (dataEvento >= oggi) {
                    eventiFuturi.push([eventoId, evento]);
                } else {
                    eventiPassati.push([eventoId, evento]);
                }
            });

            // Ordina eventi futuri (dal più vicino al più lontano)
            eventiFuturi.sort((a, b) => new Date(a[1].data) - new Date(b[1].data));

            // Ordina eventi passati (dal più recente al più vecchio)
            eventiPassati.sort((a, b) => new Date(b[1].data) - new Date(a[1].data));

            // Visualizza eventi futuri
            if (eventiFuturi.length === 0) {
                containerFuturi.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-calendar-times"></i>
                        <p>Nessun evento futuro programmato</p>
                    </div>`;
            } else {
                eventiFuturi.forEach(([eventoId, evento]) => {
                    const dataEvento = new Date(evento.data);
                    const formattedData = dataEvento.toLocaleDateString('it-IT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });

                    // Calcola giorni mancanti
                    const giorniMancanti = Math.ceil((dataEvento - oggi) / (1000 * 60 * 60 * 24));
                    let countdownText = '';

                    if (giorniMancanti === 0) {
                        countdownText = `<span class="countdown-badge">Oggi!</span>`;
                    } else if (giorniMancanti === 1) {
                        countdownText = `<span class="countdown-badge">Domani!</span>`;
                    } else if (giorniMancanti <= 7) {
                        countdownText = `<span class="countdown-badge">Tra ${giorniMancanti} giorni</span>`;
                    }

                    // Immagine predefinita se non specificata
                    const immagineEvento = url(evento.immagine, "https://i.imgur.com/Y2WXnK8.jpg");

                    const eventCard = document.createElement('div');
                    eventCard.className = 'event-card';
                    eventCard.innerHTML = `
                        <img src="${immagineEvento}" alt="${html(evento.nome || 'Evento')}" class="event-img">
                        <div class="event-info">
                            <h3 class="event-title">${html(evento.nome || 'Evento Lega TFT')}</h3>
                            <p class="event-date"><i class="far fa-calendar-alt"></i> ${formattedData} ${countdownText}</p>
                            <p class="event-time"><i class="far fa-clock"></i> Inizio: ${html(evento.orario || 'Da definire')}</p>
                            <p class="event-location"><i class="fas fa-map-marker-alt"></i> ${html(evento.luogo || 'Luogo da definire')}</p>
                            <p class="event-description">${html(evento.descrizione || 'Vieni a partecipare a questo evento della Lega TFT!')}</p>
                            <div class="event-details">
                                <p><strong>Formato:</strong> ${html(evento.formato || 'Swiss + Top 8')}</p>
                                <p><strong>Quota Iscrizione:</strong> ${html(evento.quota || '€15')}</p>
                                <p><strong>Premi:</strong> ${html(evento.premi || 'Carte promo esclusive, tappetini di gioco ufficiali')}</p>
                                <p><strong>Stato Iscrizioni:</strong> <span class="${evento.iscrizioneAperta ? 'iscrizione-aperta' : 'iscrizione-chiusa'}">${evento.iscrizioneAperta ? 'Aperte' : 'Chiuse'}</span></p>
                                <p><strong>Modalità Iscrizione:</strong> ${html(evento.modalitaIscrizione || 'Compila il modulo online')}</p>
                            </div>
                            <a href="https://docs.google.com/forms/d/e/1FAIpQLScAxwNm6If2sCzhepZ-sV7tMtqh6wZ3SrZnubUI47ph3Oe4Jg/viewform?usp=dialog" target="_blank" rel="noopener noreferrer" class="event-link btn ${evento.iscrizioneAperta ? 'btn-primary' : 'btn-secondary'}">${evento.iscrizioneAperta ? 'Iscriviti' : 'Iscrizioni Chiuse'}</a>
                        </div>
                    `;

                    containerFuturi.appendChild(eventCard);
                });
            }

            // Visualizza eventi passati
            if (eventiPassati.length === 0) {
                containerPassati.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-calendar-times"></i>
                        <p>Nessun evento passato</p>
                    </div>`;
            } else {
                eventiPassati.forEach(([eventoId, evento]) => {
                    const dataEvento = new Date(evento.data);
                    const formattedData = dataEvento.toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });

                    // Immagine predefinita se non specificata
                    const immagineEvento = url(evento.immagine, "https://i.imgur.com/JtBPMsK.jpg");

                    const eventCard = document.createElement('div');
                    eventCard.className = 'event-card evento-passato';
                    eventCard.innerHTML = `
                        <img src="${immagineEvento}" alt="${html(evento.nome || 'Evento')}" class="event-img">
                        <div class="event-info">
                            <h3 class="event-title">${html(evento.nome || 'Evento Lega TFT')}</h3>
                            <p class="event-date"><i class="far fa-calendar-alt"></i> ${formattedData}</p>
                            <p class="event-location"><i class="fas fa-map-marker-alt"></i> ${html(evento.luogo || 'Luogo non specificato')}</p>
                            <div class="event-results">
                                <h4>Risultati:</h4>
                                <ol class="winners-list">
                                    ${evento.risultati ? generaListaVincitori(evento.risultati) : '<li>Risultati non disponibili</li>'}
                                </ol>
                            </div>
                            ${evento.galleria ? `<a href="${url(evento.galleria)}" target="_blank" rel="noopener noreferrer" class="event-link btn btn-secondary">Galleria Foto</a>` : ''}
                        </div>
                    `;

                    containerPassati.appendChild(eventCard);
                });
            }
        })
        .catch(error => {
            console.error("Errore nel caricamento degli eventi:", error);
            containerFuturi.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Errore nel caricamento degli eventi</p>
                </div>
            `;
            containerPassati.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Errore nel caricamento degli eventi passati</p>
                </div>
            `;
        });
}

// Funzione ausiliaria per generare la lista dei vincitori
function generaListaVincitori(risultati) {
    if (!risultati || !Array.isArray(risultati)) return '<li>Risultati non disponibili</li>';

    return risultati.map(vincitore => `<li>${html(vincitore)}</li>`).join('');
}
