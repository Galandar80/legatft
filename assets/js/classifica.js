// Firebase configuration handled in firebase-config.js
// database is already initialized in firebase-config.js
let torneiData = {};
const html = window.escapeHTML || (value => String(value ?? ''));

function emptyRow(colspan, icon, title, copy) {
    return `
        <tr>
            <td colspan="${colspan}" class="no-data">
                <i class="${icon}"></i>
                <span class="empty-title">${html(title)}</span>
                <span class="empty-copy">${html(copy)}</span>
            </td>
        </tr>`;
}

function updateRankingPodium(sortedPlayers) {
    const podium = document.getElementById('rankingPodium');
    if (!podium) return;

    const podiumOrder = [
        { index: 1, rank: 2, className: 'podium-card-second' },
        { index: 0, rank: 1, className: 'podium-card-first' },
        { index: 2, rank: 3, className: 'podium-card-third' }
    ];

    podium.innerHTML = '';
    podiumOrder.forEach(slot => {
        const player = sortedPlayers[slot.index];
        const card = document.createElement('article');
        card.className = `podium-card ${slot.className}${player ? '' : ' podium-card-empty'}`;

        const rank = document.createElement('div');
        rank.className = 'podium-rank';
        rank.textContent = slot.rank;

        const name = document.createElement('div');
        name.className = 'podium-name';
        name.textContent = player ? player[0] : 'In attesa';

        const points = document.createElement('div');
        points.className = 'podium-points';
        points.textContent = player ? `${player[1].total} punti` : '0 punti';

        card.append(rank, name, points);
        podium.appendChild(card);
    });
}

// Toggle tema chiaro/scuro


// Toggle menu mobile


// Funzione per aggiornare la Classifica Torneo
function updateClassificaTorneo() {
    const torneoId = document.getElementById('selectTorneo').value;
    const tableBody = document.getElementById('classificaTorneoBody');
    const linksContainer = document.getElementById('torneoLinks');
    tableBody.innerHTML = '';
    linksContainer.innerHTML = '';

    if (torneoId && torneiData[torneoId]) {
        const torneo = torneiData[torneoId];

        // Aggiungi il link al bracket Challonge se disponibile
        if (torneo.linkChallonge) {
            const bracketUrl = window.safeURL ? window.safeURL(torneo.linkChallonge) : torneo.linkChallonge;
            linksContainer.innerHTML = `
                <a href="${bracketUrl}" target="_blank" rel="noopener noreferrer" class="challonge-link">
                    <i class="fas fa-trophy"></i> Visualizza Bracket Challonge
                </a>
            `;
        }

        const giocatori = Object.values(torneo.giocatori || {});
        if (giocatori.length === 0) {
            tableBody.innerHTML = emptyRow(3, 'fas fa-users', 'Classifica non ancora disponibile', 'I risultati appariranno qui appena il torneo avra giocatori registrati.');
            return;
        }

        giocatori.sort((a, b) => a.posizione - b.posizione)
            .forEach(giocatore => {
                const row = document.createElement('tr');
                const rank = parseInt(giocatore.posizione, 10) || 0;
                if (rank > 0 && rank <= 3) row.classList.add(`rank-top-${rank}`);
                const positionCell = document.createElement('td');
                if (rank > 0) {
                    const badge = document.createElement('span');
                    badge.className = `rank-badge rank-${rank}`;
                    badge.textContent = rank;
                    positionCell.appendChild(badge);
                    positionCell.appendChild(document.createTextNode(`${rank}°`));
                } else {
                    positionCell.textContent = '-';
                }
                const nameCell = document.createElement('td');
                nameCell.className = 'player-name';
                nameCell.textContent = giocatore.nome || 'Giocatore';
                nameCell.addEventListener('click', () => showUserProfile(null, giocatore.nome || ''));
                const pointsCell = document.createElement('td');
                pointsCell.textContent = giocatore.punti ?? 0;
                row.append(positionCell, nameCell, pointsCell);
                tableBody.appendChild(row);
            });
    } else {
        tableBody.innerHTML = emptyRow(3, 'fas fa-trophy', 'Seleziona un torneo', 'Scegli una competizione dal menu per visualizzare ranking e rating.');
    }
}

// Funzione per aggiornare lo Storico Giocatori
function updateStoricoGiocatori() {
    const container = document.getElementById('storicoBody');
    container.innerHTML = '';

    // Oggetto per memorizzare lo storico partecipazioni
    const giocatoriStorico = {};

    // Scorro tutti i tornei e raccolgo le posizioni
    Object.values(torneiData).forEach(torneo => {
        // Converti i giocatori in array e ordinali per posizione
        const giocatoriArray = Object.values(torneo.giocatori || {});
        giocatoriArray.sort((a, b) => a.posizione - b.posizione);

        // Assegna posizione corretta a ciascun giocatore
        giocatoriArray.forEach((giocatore, index) => {
            const nome = giocatore.nome;
            const posizione = parseInt(giocatore.posizione) || (index + 1);

            // Inizializza l'array delle partecipazioni se è la prima volta
            if (!giocatoriStorico[nome]) {
                giocatoriStorico[nome] = [];
            }

            // Aggiungi questo torneo allo storico del giocatore
            giocatoriStorico[nome].push({
                torneo: torneo.nome,
                posizione: posizione
            });
        });
    });

    // Crea una riga per ogni giocatore
    const entries = Object.entries(giocatoriStorico);
    if (entries.length === 0) {
        container.innerHTML = emptyRow(2, 'fas fa-history', 'Nessuna partecipazione registrata', 'Lo storico si popolera automaticamente dopo i primi tornei.');
        return;
    }

    entries.forEach(([nome, partecipazioni]) => {
        const row = document.createElement('tr');

        // Formatta le partecipazioni come solo posizioni
        const posizioni = partecipazioni.map(p => `${p.posizione}°`).join(' - ');

        const nameCell = document.createElement('td');
        nameCell.className = 'player-name';
        nameCell.textContent = nome;
        nameCell.addEventListener('click', () => showUserProfile(null, nome));
        const positionsCell = document.createElement('td');
        positionsCell.textContent = posizioni;
        row.append(nameCell, positionsCell);

        container.appendChild(row);
    });
}

function collectRankingStats(tornei) {
    const giocatoriStats = {};

    tornei.forEach(torneo => {
        Object.values(torneo.giocatori || {}).forEach(giocatore => {
            const nome = giocatore.nome;
            const punti = parseInt(giocatore.punti, 10) || 0;
            if (!nome) return;

            if (!giocatoriStats[nome]) {
                giocatoriStats[nome] = { total: 0 };
            }

            giocatoriStats[nome].total += punti;
        });
    });

    return Object.entries(giocatoriStats).sort((a, b) => b[1].total - a[1].total);
}

function renderRankingRows(container, sorted, emptyColspan, emptyTitle, emptyCopy) {
    const maxPunti = sorted.length > 0 ? sorted[0][1].total : 1;

    if (sorted.length === 0) {
        container.innerHTML = emptyRow(emptyColspan, 'fas fa-star', emptyTitle, emptyCopy);
        return;
    }

    sorted.forEach(([nome, stats], idx) => {
        const row = document.createElement('tr');
        const rank = idx + 1;
        const medal = rank <= 3 ? String(rank) : '';
        const medalClass = rank === 1 ? 'medal-gold' : rank === 2 ? 'medal-silver' : rank === 3 ? 'medal-bronze' : '';

        if (rank <= 3) row.classList.add(`rank-top-${rank}`);

        const pct = maxPunti > 0 ? Math.round((stats.total / maxPunti) * 100) : 0;
        const barHtml = `
            <div class="points-bar-wrap">
                <span class="points-val"><strong>${stats.total}</strong></span>
                <div class="points-bar-bg"><div class="points-bar-fill" style="width:${pct}%"></div></div>
            </div>`;

        const nameCell = document.createElement('td');
        nameCell.className = 'player-name';
        if (medal) {
            const medalSpan = document.createElement('span');
            medalSpan.className = `rank-medal ${medalClass}`;
            medalSpan.textContent = medal;
            nameCell.appendChild(medalSpan);
        }
        nameCell.appendChild(document.createTextNode(nome));
        nameCell.addEventListener('click', () => showUserProfile(null, nome));

        const pointsCell = document.createElement('td');
        pointsCell.innerHTML = barHtml;
        row.append(nameCell, pointsCell);
        container.appendChild(row);
    });
}

// Funzione per aggiornare i Punti Totali generali, escludendo le Coppe
async function updatePuntiTotali() {
    const container = document.getElementById('puntiTotaliBody');
    const headerRow = document.getElementById('puntiTotaliHeader');
    container.innerHTML = '';

    headerRow.innerHTML = '<th>Giocatore</th><th>Punti Totali</th>';
    const torneiGenerali = Object.values(torneiData).filter(torneo => !torneo.cupId);
    const sorted = collectRankingStats(torneiGenerali);

    if (sorted.length === 0) {
        updateRankingPodium([]);
        container.innerHTML = emptyRow(2, 'fas fa-star', 'Ranking generale in attesa', 'I punti totali verranno mostrati dopo la pubblicazione dei risultati dei tornei non associati a coppe.');
        return;
    }

    updateRankingPodium(sorted);
    renderRankingRows(container, sorted, 2, 'Ranking generale in attesa', 'I punti totali verranno mostrati dopo la pubblicazione dei risultati.');
}

async function updateCoppeRankings() {
    const container = document.getElementById('coppeRankingContainer');
    if (!container) return;

    const cupsSnapshot = await database.ref('cups').once('value');
    const cups = cupsSnapshot.val() || {};
    const cupsArray = Object.entries(cups);

    container.innerHTML = '';
    if (cupsArray.length === 0) {
        container.innerHTML = `
            <div class="premium-empty">
                <i class="fas fa-trophy"></i>
                <div class="empty-title">Nessuna coppa configurata</div>
                <div class="empty-copy">Le classifiche coppa appariranno quando verranno create dal backend.</div>
            </div>`;
        return;
    }

    cupsArray.forEach(([cupId, cup]) => {
        const section = document.createElement('section');
        section.className = 'ranking-card-shell table-section cup-ranking-card';
        section.innerHTML = `
            <h3 class="section-title premium-table-title"><i class="fas fa-trophy"></i> ${html(cup.name || 'Coppa')}</h3>
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Giocatore</th>
                            <th>Punti Coppa</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>`;

        const tbody = section.querySelector('tbody');
        const torneiCoppa = Object.values(torneiData).filter(torneo => torneo.cupId === cupId);
        const sorted = collectRankingStats(torneiCoppa);
        renderRankingRows(tbody, sorted, 2, 'Coppa in attesa', 'I punti di questa coppa verranno mostrati dopo i primi risultati.');
        container.appendChild(section);
    });
}

// Funzione per mostrare il profilo utente
function showUserProfile(giocatoreId, giocatoreNome) {
    // Imposta il nome del giocatore nel modal
    document.getElementById('modalPlayerName').textContent = giocatoreNome;

    // Carica i dati del giocatore
    database.ref('tornei').once('value')
        .then(snapshot => {
            const tornei = snapshot.val() || {};
            const storicoTornei = [];
            let puntiTotali = 0;
            let migliorPosizione = Infinity;

            // Raccogli i dati del giocatore da tutti i tornei
            Object.keys(tornei).forEach(torneoId => {
                const torneo = tornei[torneoId];
                const giocatori = torneo.giocatori || {};

                // Trova il giocatore per NOME invece che per ID
                const giocatoriArray = Object.values(giocatori);
                const matchingGiocatori = giocatoriArray.filter(g => g.nome === giocatoreNome);

                matchingGiocatori.forEach(giocatore => {
                    const punti = giocatore.punti || 0;
                    puntiTotali += punti;

                    // Calcola la posizione del giocatore in questo torneo
                    const posizione = giocatore.posizione || 0;

                    if (posizione > 0 && posizione < migliorPosizione) {
                        migliorPosizione = posizione;
                    }

                    storicoTornei.push({
                        torneoId: torneoId,
                        torneoNome: torneo.nome,
                        data: torneo.creatoIl || '',
                        posizione: posizione,
                        punti: punti,
                        partecipanti: giocatoriArray.length
                    });
                });
            });

            // Ordina lo storico per data (più recenti prima)
            storicoTornei.sort((a, b) => {
                return new Date(b.data) - new Date(a.data);
            });

            // Aggiorna le statistiche
            document.getElementById('statTornei').textContent = storicoTornei.length;
            document.getElementById('statPuntiTotali').textContent = puntiTotali;
            document.getElementById('statMediaPunti').textContent = storicoTornei.length > 0 ?
                Math.round(puntiTotali / storicoTornei.length) : 0;
            document.getElementById('statMigliorPosizione').textContent =
                migliorPosizione !== Infinity ? `${migliorPosizione}°` : '-';

            // Aggiorna la tabella dello storico tornei
            const tbody = document.getElementById('playerTournamentHistory');

            if (storicoTornei.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="no-data">Nessun torneo giocato</td></tr>`;
                return;
            }

            tbody.innerHTML = '';
            storicoTornei.forEach(torneo => {
                const row = document.createElement('tr');
                const data = torneo.data ? new Date(torneo.data).toLocaleDateString() : '-';

                row.innerHTML = `
                    <td>${html(torneo.torneoNome)}</td>
                    <td>${html(data)}</td>
                    <td>${html(torneo.posizione)}°</td>
                    <td>${html(torneo.punti)}</td>
                    <td>${html(torneo.partecipanti)}</td>
                `;
                tbody.appendChild(row);
            });

            // Mostra il modal
            document.getElementById('userProfileModal').style.display = 'flex';
        })
        .catch(error => {
            console.error("Errore nel caricamento del profilo:", error);
            alert("Errore nel caricamento del profilo utente");
        });
}

// Funzione per chiudere il profilo utente
function closeUserProfile() {
    const modal = document.getElementById('userProfileModal');
    if (modal) {
        modal.style.display = 'none';
    }
}
// Make closeUserProfile globally available
window.closeUserProfile = closeUserProfile;
window.showUserProfile = showUserProfile;
window.updateClassificaTorneo = updateClassificaTorneo;

// Inizializzazione all'avvio
function init() {


    // Carica i dati dei tornei da Firebase
    database.ref('tornei').once('value')
        .then(snapshot => {
            torneiData = snapshot.val() || {};

            // Popola il dropdown dei tornei
            const select = document.getElementById('selectTorneo');
            select.innerHTML = '<option value="" disabled selected>Seleziona Torneo</option>';

            // Converti in array e ordina per data (più recenti prima)
            Object.entries(torneiData)
                .sort((a, b) => {
                    const dateA = a[1].creatoIl ? new Date(a[1].creatoIl) : new Date(0);
                    const dateB = b[1].creatoIl ? new Date(b[1].creatoIl) : new Date(0);
                    return dateB - dateA;
                })
                .forEach(([id, torneo]) => {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = torneo.nome;
                    select.appendChild(option);
                });

            // Seleziona il primo torneo di default (se esiste)
            if (select.options.length > 1) {
                select.selectedIndex = 1;
            }

            // Inizializza le tabelle con i dati
            updateClassificaTorneo();
            updateStoricoGiocatori();
            updatePuntiTotali();
            updateCoppeRankings().catch(error => {
                console.error("Errore nel caricamento delle classifiche coppa:", error);
                const container = document.getElementById('coppeRankingContainer');
                if (container) {
                    container.innerHTML = `
                        <div class="premium-empty">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div class="empty-title">Classifiche coppa non disponibili</div>
                            <div class="empty-copy">Riprova piu tardi o controlla la configurazione delle coppe.</div>
                        </div>`;
                }
            });
        })
        .catch(error => {
            console.error("Errore nel caricamento dei dati:", error);
            document.querySelectorAll('.loading-cell').forEach(el => {
                el.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Errore nel caricamento dei dati</p>
                    </div>
                `;
            });
        });
}

// Inizializza la pagina quando il DOM è caricato
document.addEventListener('DOMContentLoaded', init);
