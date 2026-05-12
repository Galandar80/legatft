// Firebase configuration handled in firebase-config.js
// database/auth are initialized in firebase-config.js
const html = window.escapeHTML || (value => String(value ?? ''));

function tournamentDateValue(torneo) {
    return torneo.dataInizio || torneo.data || torneo.creatoIl || '';
}

function parseTournamentDate(torneo) {
    const value = tournamentDateValue(torneo);
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatTournamentDate(torneo) {
    const date = parseTournamentDate(torneo);
    if (!date) return 'Data da definire';
    return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatTournamentTime(torneo) {
    return torneo.orario ? `<p><strong>Orario:</strong> ${html(torneo.orario)}</p>` : '';
}

function isUpcomingTournament(torneo) {
    const date = parseTournamentDate(torneo);
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date >= today;
}

function isRegistrationDeadlineOpen(torneo) {
    const value = torneo.dataInizio || torneo.data || '';
    if (!value) return true;
    const eventDate = new Date(value);
    if (Number.isNaN(eventDate.getTime())) return true;
    eventDate.setHours(0, 0, 0, 0);
    const closeDate = new Date(eventDate);
    closeDate.setDate(closeDate.getDate() - 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today < closeDate;
}

function renderTournamentEmpty(container, title = 'Nessun torneo programmato') {
    container.innerHTML = `
        <div class="premium-empty" style="grid-column: 1/-1;">
            <i class="fas fa-calendar-alt"></i>
            <div class="empty-title">${html(title)}</div>
            <div class="empty-copy">La prossima data verra pubblicata qui appena confermata. Nel frattempo puoi contattare il team per pre-iscrizioni e informazioni.</div>
            <a href="contatti.html" class="btn btn-primary">Contatta il team</a>
        </div>`;
}

function registrationButton(torneoId, torneo, currentUser, iscrizioni) {
    const iscrizioneAperta = torneo.iscrizioneAperta !== false;
    const alreadyRegistered = Boolean(currentUser && iscrizioni && iscrizioni[currentUser.uid]);

    if (!iscrizioneAperta) {
        return '<button class="btn btn-secondary tournament-signup-button" type="button" disabled>Iscrizioni chiuse</button>';
    }

    if (!isRegistrationDeadlineOpen(torneo)) {
        return '<button class="btn btn-secondary tournament-signup-button" type="button" disabled>Iscrizioni chiuse dal giorno prima</button>';
    }

    if (!currentUser) {
        return '<a href="account.html?next=tornei.html" class="btn btn-secondary">Accedi per iscriverti</a>';
    }

    if (alreadyRegistered) {
        return `<button class="btn btn-secondary tournament-unsubscribe-button" type="button" data-tournament-id="${html(torneoId)}">Disiscriviti</button>`;
    }

    return `<button class="btn btn-primary tournament-signup-button" type="button" data-tournament-id="${html(torneoId)}">Iscriviti</button>`;
}

function tournamentParticipants(torneo, iscrizioni) {
    const byKey = new Map();

    Object.entries(iscrizioni || {}).forEach(([uid, iscrizione]) => {
        const name = iscrizione.nickname || iscrizione.displayName || iscrizione.nome || iscrizione.email || 'Giocatore registrato';
        byKey.set(uid, {
            key: uid,
            name,
            createdAt: iscrizione.createdAt || '',
            source: 'signup'
        });
    });

    Object.values(torneo.giocatori || {}).forEach(giocatore => {
        const name = giocatore.nome || giocatore.nickname || giocatore.displayName;
        if (!name) return;
        const key = giocatore.userId || `manual:${name.toLowerCase()}`;
        const existing = byKey.get(key);
        byKey.set(key, {
            key,
            name,
            createdAt: existing?.createdAt || giocatore.createdAt || '',
            source: existing?.source || 'player'
        });
    });

    return Array.from(byKey.values())
        .sort((a, b) => {
            const dateCompare = (a.createdAt || '').localeCompare(b.createdAt || '');
            if (dateCompare !== 0) return dateCompare;
            return a.name.localeCompare(b.name, 'it');
        });
}

function renderSignupList(torneo, iscrizioni) {
    const participants = tournamentParticipants(torneo, iscrizioni);

    if (participants.length === 0) {
        return '<div class="tournament-signups-empty">Nessun iscritto al momento</div>';
    }

    const names = participants
        .map(participant => participant.name)
        .sort((a, b) => a.localeCompare(b, 'it'));

    return `
        <div class="tournament-signups">
            <strong>Iscritti (${names.length})</strong>
            <ul>
                ${names.map(name => `<li>${html(name)}</li>`).join('')}
            </ul>
        </div>`;
}

function renderAutomaticLobbies(torneo, iscrizioni) {
    const participants = tournamentParticipants(torneo, iscrizioni);

    if (participants.length === 0) {
        return '';
    }

    const lobbies = [];
    for (let index = 0; index < participants.length; index += 8) {
        lobbies.push(participants.slice(index, index + 8));
    }

    return `
        <div class="tournament-auto-lobbies">
            <strong>Lobby automatiche</strong>
            <div class="auto-lobbies-grid">
                ${lobbies.map((lobby, index) => `
                    <section class="auto-lobby">
                        <div class="auto-lobby-title">
                            <span>Lobby ${String.fromCharCode(65 + index)}</span>
                            <small>${lobby.length}/8</small>
                        </div>
                        <ol>
                            ${lobby.map(player => `<li>${html(player.name)}</li>`).join('')}
                        </ol>
                    </section>
                `).join('')}
            </div>
        </div>`;
}

function tournamentImage(torneo) {
    if (!torneo.immagine) return '';
    const src = window.safeURL ? window.safeURL(torneo.immagine, '') : torneo.immagine;
    if (!src) return '';
    return `<img src="${src}" alt="${html(torneo.nome || 'Torneo')}" class="tournament-card-image" loading="lazy">`;
}

function cupInfo(torneo, cups) {
    if (!torneo.cupId) {
        return '<p><strong>Coppa:</strong> No</p>';
    }
    const cup = cups && cups[torneo.cupId];
    return `<p><strong>Coppa:</strong> ${html(cup?.name || 'Si')}</p>`;
}

function wireTournamentButtons() {
    document.querySelectorAll('.tournament-signup-button[data-tournament-id]').forEach(button => {
        button.addEventListener('click', () => {
            if (!window.UserAuth || !window.UserAuth.signupToTournament) {
                alert('Accesso utenti non disponibile. Riprova tra poco.');
                return;
            }
            const torneoId = button.getAttribute('data-tournament-id');
            button.disabled = true;
            button.textContent = 'Iscrizione...';
            window.UserAuth.signupToTournament(torneoId)
                .then(() => {
                    loadUpcomingTournaments();
                })
                .catch(error => {
                    button.disabled = false;
                    button.textContent = 'Iscriviti';
                    alert(error.message || 'Errore durante l iscrizione.');
                });
        });
    });

    document.querySelectorAll('.tournament-unsubscribe-button[data-tournament-id]').forEach(button => {
        button.addEventListener('click', () => {
            if (!window.UserAuth || !window.UserAuth.unsubscribeFromTournament) {
                alert('Accesso utenti non disponibile. Riprova tra poco.');
                return;
            }
            const torneoId = button.getAttribute('data-tournament-id');
            button.disabled = true;
            button.textContent = 'Disiscrizione...';
            window.UserAuth.unsubscribeFromTournament(torneoId)
                .then(() => {
                    loadUpcomingTournaments();
                })
                .catch(error => {
                    button.disabled = false;
                    button.textContent = 'Disiscriviti';
                    alert(error.message || 'Errore durante la disiscrizione.');
                });
        });
    });
}

async function loadCups() {
    if (!database) return {};
    const snapshot = await database.ref('cups').once('value');
    return snapshot.val() || {};
}

async function loadSignupsForTournaments(tournamentIds) {
    if (!database || tournamentIds.length === 0) return {};
    const snapshots = await Promise.all(
        tournamentIds.map(id => database.ref(`iscrizioni/${id}`).once('value').then(snapshot => [id, snapshot.val() || {}]))
    );
    return Object.fromEntries(snapshots);
}

// Carica tornei imminenti da Firebase
function loadUpcomingTournaments() {
    const container = document.getElementById('nextTournaments');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Caricamento tornei in corso...</div>';

    if (!database) {
        console.error("Database Firebase non disponibile");
        renderTournamentEmpty(container, 'Calendario in aggiornamento');
        return;
    }

    database.ref('tornei').once('value')
        .then(async snapshot => {
            const tornei = snapshot.val() || {};
            const torneiFuturi = Object.entries(tornei)
                .filter(([_, torneo]) => isUpcomingTournament(torneo))
                .sort((a, b) => parseTournamentDate(a[1]) - parseTournamentDate(b[1]));

            if (torneiFuturi.length === 0) {
                renderTournamentEmpty(container, 'Nessun torneo futuro programmato');
                return;
            }

            const currentUser = window.UserAuth ? window.UserAuth.currentUser() : null;
            const visibleTournamentIds = torneiFuturi.slice(0, 3).map(([id]) => id);
            const [signupMap, cups] = await Promise.all([
                loadSignupsForTournaments(visibleTournamentIds),
                loadCups()
            ]);

            container.innerHTML = '';
            torneiFuturi.slice(0, 3).forEach(([torneoId, torneo]) => {
                const iscrizioni = signupMap[torneoId] || {};
                const tournamentCard = document.createElement('div');
                tournamentCard.className = 'tournament-card';
                tournamentCard.innerHTML = `
                    ${tournamentImage(torneo)}
                    <div class="tournament-date">
                        <i class="far fa-calendar"></i> ${html(formatTournamentDate(torneo))}
                    </div>
                    <h4 class="tournament-title">${html(torneo.nome || 'Torneo Lega TFT')}</h4>
                    ${torneo.luogo ? `<div class="tournament-location"><i class="fas fa-map-marker-alt"></i> ${html(torneo.luogo)}</div>` : ''}
                    <div class="tournament-details">
                        <p><strong>Formato:</strong> ${html(torneo.tipo || torneo.formato || 'TFT')}</p>
                        ${formatTournamentTime(torneo)}
                        ${cupInfo(torneo, cups)}
                        <p><strong>Iscrizione:</strong> ${torneo.iscrizioneAperta === false ? 'Chiusa' : 'Aperta'}</p>
                        ${torneo.linkChallonge ? `<p><strong>Bracket:</strong> <a href="${window.safeURL ? window.safeURL(torneo.linkChallonge) : html(torneo.linkChallonge)}" target="_blank" rel="noopener noreferrer">Challonge</a></p>` : ''}
                    </div>
                    ${renderSignupList(torneo, iscrizioni)}
                    ${renderAutomaticLobbies(torneo, iscrizioni)}
                    <div class="tournament-action">
                        ${registrationButton(torneoId, torneo, currentUser, iscrizioni)}
                    </div>
                `;

                container.appendChild(tournamentCard);
            });
            wireTournamentButtons();
        })
        .catch(error => {
            console.error("Errore nel caricamento dei tornei:", error);
            renderTournamentEmpty(container, 'Calendario non disponibile');
        });
}

function init() {
    if (window.UserAuth && typeof auth !== 'undefined' && auth) {
        auth.onAuthStateChanged(() => loadUpcomingTournaments());
        window.UserAuth.renderAuthStatus('userAuthStatus');
        return;
    }
    loadUpcomingTournaments();
}

document.addEventListener('DOMContentLoaded', init);
