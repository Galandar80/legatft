// Script migliorato per il backend della Lega TFT

// Funzioni per la gestione avanzata dei tornei e dei giocatori
let chartInstances = {}; // Per tenere traccia dei grafici creati
const backendHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function displayPlayerName(giocatore) {
    return giocatore.nome || giocatore.nickname || giocatore.displayName || 'Giocatore';
}

function displayRiotId(record) {
    return record.riotId || record.riotID || record.riot || '-';
}

// Funzione per generare grafici di analisi per un torneo specifico
function generaGraficiTorneo(torneoId) {
    const torneo = torneiData[torneoId];
    if (!torneo || !torneo.giocatori) return;
    
    const giocatori = Object.values(torneo.giocatori);
    if (giocatori.length === 0) return;
    
    // Prepara i dati per i grafici
    const nomi = giocatori.map(g => g.nome);
    const punti = giocatori.map(g => g.punti || 0);
    
    // Distruggi i grafici esistenti se presenti
    if (chartInstances.distribuzionePunti) {
        chartInstances.distribuzionePunti.destroy();
    }
    
    // Crea il grafico di distribuzione punti
    const ctxPunti = document.getElementById('graficoDistribuzionePunti');
    if (ctxPunti) {
        chartInstances.distribuzionePunti = new Chart(ctxPunti, {
            type: 'bar',
            data: {
                labels: nomi,
                datasets: [{
                    label: 'Rating',
                    data: punti,
                    backgroundColor: 'rgba(243, 210, 62, 0.7)',
                    borderColor: 'rgba(243, 210, 62, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    },
                    x: {
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                return tooltipItems[0].label;
                            },
                            label: function(context) {
                                return `Rating: ${context.raw}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Funzione per esportare i dati di un torneo in formato CSV
function esportaTorneoCSV(torneoId) {
    const torneo = torneiData[torneoId];
    if (!torneo) {
        showAlert('Torneo non trovato!', 'error');
        return;
    }
    
    const giocatori = torneo.giocatori || {};
    const giocatoriArray = Object.values(giocatori);
    
    // Crea l'intestazione del CSV
    let csv = 'Nome,Riot ID,Rating,Posizione,Qualificato\n';
    
    // Aggiungi i dati dei giocatori
    giocatoriArray.forEach(giocatore => {
        const nome = displayPlayerName(giocatore).replace(/,/g, ' ');
        const riotId = displayRiotId(giocatore).replace(/,/g, ' ');
        const punti = giocatore.punti || 0;
        const posizione = giocatore.posizione || 0;
        const qualificato = giocatore.qualificato ? 'Sì' : 'No';
        
        csv += `${nome},${riotId},${punti},${posizione},${qualificato}\n`;
    });
    
    // Crea un blob e un link per il download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${torneo.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Funzione per generare un report completo del torneo
function generaReportTorneo(torneoId) {
    const torneo = torneiData[torneoId];
    if (!torneo) {
        showAlert('Torneo non trovato!', 'error');
        return;
    }
    
    const giocatori = torneo.giocatori || {};
    const giocatoriArray = Object.values(giocatori).sort((a, b) => (b.punti || 0) - (a.punti || 0));
    
    // Crea il contenuto del report
    let reportHTML = `
        <div class="report-header">
            <h2>${torneo.nome}</h2>
            <p>Data: ${new Date(torneo.creatoIl).toLocaleDateString()}</p>
            ${torneo.tipo ? `<p>Tipo: ${torneo.tipo}</p>` : ''}
            ${torneo.dataInizio ? `<p>Data inizio: ${torneo.dataInizio}</p>` : ''}
            <p>Partecipanti: ${giocatoriArray.length}</p>
        </div>
        
        <h3>Classifica</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Pos.</th>
                    <th>Giocatore</th>
                    <th>Riot ID</th>
                    <th>Rating</th>
                    <th>Qualificato</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    giocatoriArray.forEach((giocatore, index) => {
        reportHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${giocatore.nome}</td>
                <td>${giocatore.riotId || '-'}</td>
                <td>${giocatore.punti || 0}</td>
                <td>${giocatore.qualificato ? 'Sì' : 'No'}</td>
            </tr>
        `;
    });
    
    reportHTML += `
            </tbody>
        </table>
        
        <div class="report-footer">
            <p>Report generato il ${new Date().toLocaleString()}</p>
        </div>
    `;
    
    // Crea una finestra popup con il report
    const reportWindow = window.open('', '_blank', 'width=800,height=600');
    reportWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Report: ${torneo.nome}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .report-header { margin-bottom: 20px; }
                .report-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .report-table th, .report-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                .report-table th { background-color: #f2f2f2; }
                .report-footer { margin-top: 30px; font-size: 0.8em; color: #666; }
                @media print {
                    body { margin: 0; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <button onclick="window.print()" style="padding: 8px 16px; margin-bottom: 20px;">Stampa Report</button>
            ${reportHTML}
        </body>
        </html>
    `);
}

// Funzione per calcolare statistiche avanzate di un giocatore
function calcolaStatisticheGiocatore(nomeGiocatore) {
    if (!nomeGiocatore) return null;
    
    const tornei = Object.values(torneiData);
    const statistiche = {
        nome: nomeGiocatore,
        torneiPartecipati: 0,
        puntiTotali: 0,
        mediaRating: 0,
        vittorie: 0,
        podio: 0,
        migliorPosizione: Infinity,
        peggiorPosizione: 0,
        ultimoTorneo: null,
        storicoTornei: []
    };
    
    // Analizza ogni torneo
    tornei.forEach(torneo => {
        const giocatori = torneo.giocatori || {};
        const giocatoriArray = Object.values(giocatori);
        
        // Trova il giocatore in questo torneo
        const giocatore = giocatoriArray.find(g => g.nome === nomeGiocatore);
        if (!giocatore) return;
        
        // Incrementa contatori
        statistiche.torneiPartecipati++;
        statistiche.puntiTotali += giocatore.punti || 0;
        
        // Calcola la posizione se non è già impostata
        let posizione = giocatore.posizione;
        if (!posizione) {
            // Ordina i giocatori per punti e trova la posizione
            const giocatoriOrdinati = [...giocatoriArray].sort((a, b) => (b.punti || 0) - (a.punti || 0));
            posizione = giocatoriOrdinati.findIndex(g => g.nome === nomeGiocatore) + 1;
        }
        
        // Aggiorna statistiche di posizione
        if (posizione < statistiche.migliorPosizione) {
            statistiche.migliorPosizione = posizione;
        }
        if (posizione > statistiche.peggiorPosizione) {
            statistiche.peggiorPosizione = posizione;
        }
        
        // Conta vittorie e podi
        if (posizione === 1) statistiche.vittorie++;
        if (posizione <= 3) statistiche.podio++;
        
        // Aggiungi al registro storico
        statistiche.storicoTornei.push({
            torneoNome: torneo.nome,
            torneoData: torneo.creatoIl,
            punti: giocatore.punti || 0,
            posizione: posizione,
            qualificato: giocatore.qualificato || false
        });
    });
    
    // Ordina lo storico per data (più recenti prima)
    statistiche.storicoTornei.sort((a, b) => new Date(b.torneoData) - new Date(a.torneoData));
    
    // Calcola la media Rating
    if (statistiche.torneiPartecipati > 0) {
        statistiche.mediaRating = Math.round(statistiche.puntiTotali / statistiche.torneiPartecipati);
    }
    
    // Imposta l'ultimo torneo
    if (statistiche.storicoTornei.length > 0) {
        statistiche.ultimoTorneo = statistiche.storicoTornei[0];
    }
    
    // Correggi i valori infiniti
    if (statistiche.migliorPosizione === Infinity) {
        statistiche.migliorPosizione = '-';
    }
    
    return statistiche;
}

// Funzione per visualizzare il profilo dettagliato di un giocatore
function visualizzaProfiloGiocatore(nomeGiocatore) {
    const statistiche = calcolaStatisticheGiocatore(nomeGiocatore);
    if (!statistiche) {
        showAlert('Giocatore non trovato!', 'error');
        return;
    }
    
    // Crea il contenuto del profilo
    let profiloHTML = `
        <div class="profilo-header">
            <h2>${statistiche.nome}</h2>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${statistiche.torneiPartecipati}</div>
                <div class="stat-label">Tornei</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${statistiche.puntiTotali}</div>
                <div class="stat-label">Rating Totale</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${statistiche.mediaRating}</div>
                <div class="stat-label">Media Rating</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${statistiche.vittorie}</div>
                <div class="stat-label">Vittorie</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${statistiche.podio}</div>
                <div class="stat-label">Podi</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${statistiche.migliorPosizione}</div>
                <div class="stat-label">Miglior Posizione</div>
            </div>
        </div>
        
        <h3>Storico Tornei</h3>
        <table class="profilo-table">
            <thead>
                <tr>
                    <th>Torneo</th>
                    <th>Data</th>
                    <th>Posizione</th>
                    <th>Rating</th>
                    <th>Qualificato</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (statistiche.storicoTornei.length === 0) {
        profiloHTML += `
            <tr>
                <td colspan="5" class="no-data">Nessun torneo giocato</td>
            </tr>
        `;
    } else {
        statistiche.storicoTornei.forEach(torneo => {
            const data = torneo.torneoData ? new Date(torneo.torneoData).toLocaleDateString() : '-';
            
            profiloHTML += `
                <tr>
                    <td>${torneo.torneoNome}</td>
                    <td>${data}</td>
                    <td>${torneo.posizione}°</td>
                    <td>${torneo.punti}</td>
                    <td>${torneo.qualificato ? 'Sì' : 'No'}</td>
                </tr>
            `;
        });
    }
    
    profiloHTML += `
            </tbody>
        </table>
    `;
    
    // Crea una finestra modale con il profilo
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal active';
    modalDiv.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Profilo Giocatore</h2>
                <button class="modal-close">&times;</button>
            </div>
            ${profiloHTML}
        </div>
    `;
    
    document.body.appendChild(modalDiv);
    
    // Aggiungi event listener per chiudere la modale
    modalDiv.querySelector('.modal-close').addEventListener('click', () => {
        document.body.removeChild(modalDiv);
    });
    
    // Chiudi la modale cliccando fuori dal contenuto
    modalDiv.addEventListener('click', (e) => {
        if (e.target === modalDiv) {
            document.body.removeChild(modalDiv);
        }
    });
}

// Funzione per cercare giocatori in tutti i tornei
function cercaGiocatoriGlobale(searchTerm) {
    if (!searchTerm) return [];
    
    searchTerm = searchTerm.toLowerCase();
    const risultati = new Set();
    
    // Cerca in tutti i tornei
    Object.values(torneiData).forEach(torneo => {
        const giocatori = torneo.giocatori || {};
        
        Object.values(giocatori).forEach(giocatore => {
            if (giocatore.nome.toLowerCase().includes(searchTerm)) {
                risultati.add(giocatore.nome);
            }
        });
    });
    
    return Array.from(risultati);
}

// Funzione per visualizzare suggerimenti di ricerca
function mostraSuggerimentiRicerca(inputElement, risultati) {
    // Rimuovi eventuali suggerimenti esistenti
    const suggerimentiEsistenti = document.querySelector('.suggerimenti-ricerca');
    if (suggerimentiEsistenti) {
        suggerimentiEsistenti.remove();
    }
    
    if (risultati.length === 0) return;
    
    // Crea il container dei suggerimenti
    const suggerimentiDiv = document.createElement('div');
    suggerimentiDiv.className = 'suggerimenti-ricerca';
    
    // Posiziona i suggerimenti sotto l'input
    const rect = inputElement.getBoundingClientRect();
    suggerimentiDiv.style.position = 'absolute';
    suggerimentiDiv.style.top = `${rect.bottom}px`;
    suggerimentiDiv.style.left = `${rect.left}px`;
    suggerimentiDiv.style.width = `${rect.width}px`;
    suggerimentiDiv.style.maxHeight = '200px';
    suggerimentiDiv.style.overflowY = 'auto';
    suggerimentiDiv.style.backgroundColor = 'var(--bg-secondary)';
    suggerimentiDiv.style.border = '1px solid var(--border-color)';
    suggerimentiDiv.style.borderRadius = 'var(--border-radius)';
    suggerimentiDiv.style.boxShadow = 'var(--shadow)';
    suggerimentiDiv.style.zIndex = '1000';
    
    // Aggiungi i risultati
    risultati.forEach(risultato => {
        const item = document.createElement('div');
        item.className = 'suggerimento-item';
        item.textContent = risultato;
        item.style.padding = '8px 12px';
        item.style.cursor = 'pointer';
        item.style.transition = 'background-color 0.2s';
        
        item.addEventListener('mouseover', () => {
            item.style.backgroundColor = 'var(--bg-accent)';
        });
        
        item.addEventListener('mouseout', () => {
            item.style.backgroundColor = 'transparent';
        });
        
        item.addEventListener('click', () => {
            inputElement.value = risultato;
            suggerimentiDiv.remove();
            
            // Simula un evento input per attivare la ricerca
            const event = new Event('input', { bubbles: true });
            inputElement.dispatchEvent(event);
        });
        
        suggerimentiDiv.appendChild(item);
    });
    
    document.body.appendChild(suggerimentiDiv);
    
    // Chiudi i suggerimenti cliccando fuori
    document.addEventListener('click', function chiudiSuggerimenti(e) {
        if (!suggerimentiDiv.contains(e.target) && e.target !== inputElement) {
            suggerimentiDiv.remove();
            document.removeEventListener('click', chiudiSuggerimenti);
        }
    });
}

// Funzione per caricare le statistiche generali
function caricaStatistiche() {
    const tornei = Object.values(torneiData);
    
    // Calcola statistiche di base
    const numTornei = tornei.length;
    let giocatoriUnici = new Set();
    let puntiTotali = 0;
    let ultimoTorneo = null;
    let giocatoriStats = {};
    
    // Trova l'ultimo torneo per data
    if (numTornei > 0) {
        ultimoTorneo = tornei.reduce((a, b) => {
            return new Date(a.creatoIl) > new Date(b.creatoIl) ? a : b;
        });
    }
    
    // Calcola statistiche per ogni torneo
    tornei.forEach(torneo => {
        const giocatori = torneo.giocatori || {};
        
        Object.values(giocatori).forEach(giocatore => {
            giocatoriUnici.add(giocatore.nome);
            puntiTotali += giocatore.punti || 0;
            
            // Aggiorna statistiche giocatore
            if (!giocatoriStats[giocatore.nome]) {
                giocatoriStats[giocatore.nome] = {
                    nome: giocatore.nome,
                    tornei: 0,
                    punti: 0
                };
            }
            
            giocatoriStats[giocatore.nome].tornei += 1;
            giocatoriStats[giocatore.nome].punti += giocatore.punti || 0;
        });
    });
    
    // Calcola media punti per ogni giocatore
    Object.values(giocatoriStats).forEach(stats => {
        stats.media = stats.tornei > 0 ? Math.round(stats.punti / stats.tornei) : 0;
    });
    
    // Aggiorna i valori nella UI
    document.getElementById('statTorneiTotali').textContent = numTornei;
    document.getElementById('statGiocatoriTotali').textContent = giocatoriUnici.size;
    document.getElementById('statPuntiTotali').textContent = puntiTotali;
    document.getElementById('statUltimoTorneo').textContent = ultimoTorneo ? ultimoTorneo.nome : '-';
    
    // Aggiorna la tabella dei top giocatori
    const giocatoriArray = Object.values(giocatoriStats);
    giocatoriArray.sort((a, b) => b.punti - a.punti);
    
    const tbody = document.getElementById('topGiocatoriBody');
    tbody.innerHTML = '';
    
    if (giocatoriArray.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">Nessun giocatore trovato</td>
            </tr>
        `;
        return;
    }
    
    giocatoriArray.slice(0, 5).forEach((giocatore, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="player-name" onclick="visualizzaProfiloGiocatore('${giocatore.nome}')">${giocatore.nome}</td>
            <td>${giocatore.tornei}</td>
            <td>${giocatore.punti}</td>
            <td>${giocatore.media}</td>
        `;
        tbody.appendChild(row);
    });
}

// Funzione per salvare le impostazioni di un torneo
function salvaImpostazioniTorneo() {
    if (!torneoSelezionatoId) {
        showAlert('Nessun torneo selezionato!', 'error');
        return;
    }
    
    const nome = document.getElementById('editNomeTorneo').value.trim();
    const tipo = document.getElementById('editTipoTorneo').value.trim();
    const data = document.getElementById('editDataTorneo').value;
    const orario = document.getElementById('editOrarioTorneo').value;
    const linkChallonge = document.getElementById('editLinkChallonge').value.trim();
    const immagine = document.getElementById('editImmagineTorneo').value.trim();
    const cupId = document.getElementById('editTorneoCoppa').value;
    const iscrizioneAperta = document.getElementById('editIscrizioneTorneo').value === 'true';
    
    if (!nome) {
        showAlert('Il nome del torneo non può essere vuoto!', 'error');
        return;
    }
    
    // Prepara i dati da aggiornare
    const updates = {
        nome: nome,
        cupId: cupId || null,
        iscrizioneAperta: iscrizioneAperta,
        immagine: immagine || null,
        orario: orario || null
    };
    
    // Aggiungi campo tipo se presente
    if (tipo) {
        updates.tipo = tipo;
    }
    
    // Aggiungi campo data se presente
    if (data) {
        updates.dataInizio = data;
    }
    
    // Aggiungi campo linkChallonge se presente
    if (linkChallonge) {
        updates.linkChallonge = linkChallonge;
    }
    
    // Aggiorna nel database
    database.ref(`tornei/${torneoSelezionatoId}`).update(updates)
        .then(() => {
            showAlert(`Impostazioni salvate con successo!`);
            
            // Aggiorna il nome mostrato nell'interfaccia
            document.getElementById('nomeTorneoSelezionato').textContent = nome;
            
            // Aggiorna i dati locali
            if (torneiData[torneoSelezionatoId]) {
                torneiData[torneoSelezionatoId].nome = nome;
                if (tipo) torneiData[torneoSelezionatoId].tipo = tipo;
                if (data) torneiData[torneoSelezionatoId].dataInizio = data;
                torneiData[torneoSelezionatoId].orario = orario || null;
                if (linkChallonge) torneiData[torneoSelezionatoId].linkChallonge = linkChallonge;
                torneiData[torneoSelezionatoId].immagine = immagine || null;
                torneiData[torneoSelezionatoId].cupId = cupId || null;
                torneiData[torneoSelezionatoId].iscrizioneAperta = iscrizioneAperta;
            }
        })
        .catch(error => {
            console.error("Errore nel salvataggio delle impostazioni:", error);
            showAlert(`Errore nel salvataggio: ${error.message}`, 'error');
        });
}

// Funzione per aggiungere un giocatore al torneo selezionato
function aggiungiGiocatore() {
    if (!torneoSelezionatoId) {
        showAlert('Nessun torneo selezionato!', 'error');
        return;
    }
    
    const nomeInput = document.getElementById('nuovoGiocatore');
    const nome = nomeInput.value.trim();
    
    if (!nome) {
        showAlert('Inserisci un nome per il giocatore!', 'error');
        return;
    }
    
    const nuovoGiocatore = {
        nome: nome,
        punti: 0,
        posizione: 0,
        qualificato: false
    };
    
    database.ref(`tornei/${torneoSelezionatoId}/giocatori`).push(nuovoGiocatore)
        .then(() => {
            nomeInput.value = '';
            showAlert('Giocatore aggiunto con successo!');
            caricaGiocatoriTorneo(torneoSelezionatoId);
        })
        .catch(error => {
            console.error("Errore nell'aggiunta del giocatore:", error);
            showAlert(`Errore nell'aggiunta del giocatore: ${error.message}`, 'error');
        });
}

// Funzione per eliminare un torneo
function eliminaTorneo(torneoId) {
    if (!confirm(`Sei sicuro di voler eliminare questo torneo? Questa azione non può essere annullata.`)) {
        return;
    }
    
    database.ref(`tornei/${torneoId}`).remove()
        .then(() => {
            showAlert('Torneo eliminato con successo!');
            
            // Se era il torneo selezionato, chiudi la gestione
            if (torneoId === torneoSelezionatoId) {
                chiudiGestione();
            }
            
            // Aggiorna la lista dei tornei
            caricaTornei();
        })
        .catch(error => {
            console.error("Errore nell'eliminazione del torneo:", error);
            showAlert(`Errore nell'eliminazione: ${error.message}`, 'error');
        });
}

function caricaIscrizioniTorneo(torneoId) {
    const container = document.getElementById('iscrizioniGrid');
    if (!container) return;

    container.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Caricamento iscrizioni...</div>';

    database.ref(`iscrizioni/${torneoId}`).once('value')
        .then(snapshot => {
            const iscrizioni = snapshot.val() || {};
            const iscrizioniArray = Object.entries(iscrizioni)
                .sort((a, b) => new Date(a[1].createdAt || 0) - new Date(b[1].createdAt || 0));

            container.innerHTML = '';

            if (iscrizioniArray.length === 0) {
                container.innerHTML = '<div class="no-data">Nessuna iscrizione registrata per questo torneo</div>';
                return;
            }

            iscrizioniArray.forEach(([uid, iscrizione]) => {
                const card = document.createElement('div');
                card.className = 'giocatore-card';
                const safeName = backendHtml(iscrizione.nickname || iscrizione.displayName || iscrizione.email || 'Utente registrato');
                const safeRiotId = backendHtml(displayRiotId(iscrizione));
                const safeStatus = backendHtml(iscrizione.status || 'confirmed');
                card.innerHTML = `
                    <div class="giocatore-nome">${safeName}</div>
                    <div class="giocatore-stats">
                        <div class="giocatore-stat">
                            <div class="giocatore-stat-value">${safeRiotId}</div>
                            <div class="giocatore-stat-label">Riot ID</div>
                        </div>
                        <div class="giocatore-stat">
                            <div class="giocatore-stat-value">${safeStatus}</div>
                            <div class="giocatore-stat-label">Stato</div>
                        </div>
                        <div class="giocatore-stat">
                            <div class="giocatore-stat-value">${iscrizione.createdAt ? new Date(iscrizione.createdAt).toLocaleDateString() : '-'}</div>
                            <div class="giocatore-stat-label">Data</div>
                        </div>
                    </div>
                    <div class="flex-group" style="margin-top: 10px;">
                        <button onclick="importaIscrittoComeGiocatore('${torneoId}', '${uid}')" class="small-button"><i class="fas fa-user-plus"></i> Importa</button>
                        <button onclick="rimuoviIscrizione('${torneoId}', '${uid}')" class="small-button" style="background: #dc3545"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                container.appendChild(card);
            });
        })
        .catch(error => {
            console.error("Errore nel caricamento delle iscrizioni:", error);
            container.innerHTML = `<div class="error">Errore nel caricamento iscrizioni: ${error.message}</div>`;
        });
}

function importaIscrittoComeGiocatore(torneoId, uid) {
    database.ref(`iscrizioni/${torneoId}/${uid}`).once('value')
        .then(snapshot => {
            const iscrizione = snapshot.val();
            if (!iscrizione) {
                showAlert('Iscrizione non trovata', 'error');
                return null;
            }

            const nuovoGiocatore = {
                nome: iscrizione.nickname || iscrizione.displayName || iscrizione.email || 'Giocatore',
                nickname: iscrizione.nickname || iscrizione.displayName || iscrizione.email || 'Giocatore',
                displayName: iscrizione.nickname || iscrizione.displayName || iscrizione.email || 'Giocatore',
                riotId: displayRiotId(iscrizione) === '-' ? '' : displayRiotId(iscrizione),
                punti: 0,
                posizione: 0,
                qualificato: false,
                userId: uid
            };

            return database.ref(`tornei/${torneoId}/giocatori`).push(nuovoGiocatore)
                .then(() => database.ref(`iscrizioni/${torneoId}/${uid}/status`).set('imported'));
        })
        .then(() => {
            showAlert('Iscritto importato tra i giocatori');
            caricaGiocatoriTorneo(torneoId);
            caricaIscrizioniTorneo(torneoId);
        })
        .catch(error => {
            console.error("Errore nell importazione dell iscritto:", error);
            showAlert(`Errore importazione: ${error.message}`, 'error');
        });
}

function rimuoviIscrizione(torneoId, uid) {
    if (!confirm('Rimuovere questa iscrizione?')) return;

    database.ref(`iscrizioni/${torneoId}/${uid}`).remove()
        .then(() => {
            showAlert('Iscrizione rimossa');
            caricaIscrizioniTorneo(torneoId);
        })
        .catch(error => {
            console.error("Errore nella rimozione dell iscrizione:", error);
            showAlert(`Errore rimozione: ${error.message}`, 'error');
        });
}

// Funzione per salvare le modifiche a un giocatore
function salvaModificheGiocatore(giocatoreId) {
    if (!torneoSelezionatoId) {
        showAlert('Nessun torneo selezionato!', 'error');
        return;
    }
    
    const punti = parseInt(document.getElementById(`punti-${giocatoreId}`).value) || 0;
    const posizione = parseInt(document.getElementById(`posizione-${giocatoreId}`).value) || 0;
    const qualificato = document.getElementById(`qualificato-${giocatoreId}`).checked;
    const nome = document.getElementById(`nome-${giocatoreId}`).value.trim();
    const riotId = document.getElementById(`riot-${giocatoreId}`).value.trim();

    if (!nome) {
        showAlert('Il nickname del giocatore non puo essere vuoto.', 'error');
        return;
    }
    
    const updates = {
        nome,
        nickname: nome,
        displayName: nome,
        riotId,
        punti,
        posizione: Math.max(0, posizione),
        qualificato: qualificato
    };

    const playerRef = database.ref(`tornei/${torneoSelezionatoId}/giocatori/${giocatoreId}`);

    playerRef.once('value')
        .then(snapshot => {
            const giocatore = snapshot.val() || {};
            return playerRef.update(updates).then(() => giocatore);
        })
        .then(giocatore => {
            if (!giocatore.userId) return null;

            const mirroredProfile = {
                nome,
                nickname: nome,
                displayName: nome,
                riotId
            };

            return Promise.all([
                database.ref(`iscrizioni/${torneoSelezionatoId}/${giocatore.userId}`).update(mirroredProfile),
                database.ref(`users/${giocatore.userId}`).update({
                    nickname: nome,
                    displayName: nome,
                    riotId,
                    updatedAt: new Date().toISOString()
                }).catch(error => {
                    console.warn('Profilo utente non aggiornato:', error);
                    return null;
                })
            ]);
        })
        .then(() => {
            showAlert('Modifiche salvate con successo!');
            caricaGiocatoriTorneo(torneoSelezionatoId);
        })
        .catch(error => {
            console.error("Errore nel salvataggio delle modifiche:", error);
            showAlert(`Errore nel salvataggio delle modifiche: ${error.message}`, 'error');
        });
}

function applicaPenalitaAssenza(giocatoreId) {
    if (!torneoSelezionatoId) {
        showAlert('Nessun torneo selezionato!', 'error');
        return;
    }

    if (!confirm('Applicare la penalita di -20 punti per assenza?')) return;

    database.ref(`tornei/${torneoSelezionatoId}/giocatori/${giocatoreId}`).update({
        punti: -20,
        posizione: 0,
        noShow: true
    })
        .then(() => {
            showAlert('Penalita applicata.');
            caricaGiocatoriTorneo(torneoSelezionatoId);
        })
        .catch(error => {
            console.error("Errore nell applicazione della penalita:", error);
            showAlert(`Errore penalita: ${error.message}`, 'error');
        });
}

// Funzione per rimuovere un giocatore dal torneo
function rimuoviGiocatore(giocatoreId) {
    if (!torneoSelezionatoId) {
        showAlert('Nessun torneo selezionato!', 'error');
        return;
    }
    
    if (!confirm('Sei sicuro di voler rimuovere questo giocatore?')) {
        return;
    }
    
    database.ref(`tornei/${torneoSelezionatoId}/giocatori/${giocatoreId}`).remove()
        .then(() => {
            showAlert('Giocatore rimosso con successo!');
            caricaGiocatoriTorneo(torneoSelezionatoId);
        })
        .catch(error => {
            console.error("Errore nella rimozione del giocatore:", error);
            showAlert(`Errore nella rimozione del giocatore: ${error.message}`, 'error');
        });
}

// Funzioni per la gestione degli eventi
function caricaEventi() {
    console.log("Caricamento eventi in corso...");
    const container = document.getElementById('eventiContainer');
    
    if (!container) {
        console.error("Elemento 'eventiContainer' non trovato!");
        return;
    }
    
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Caricamento eventi...</div>';
    
    database.ref('eventi').once('value')
        .then(snapshot => {
            console.log("Dati degli eventi ricevuti da Firebase");
            const eventi = snapshot.val() || {};
            let eventiArray = Object.entries(eventi);
            
            // Ordina gli eventi per data (dal più vicino al più lontano)
            eventiArray.sort((a, b) => new Date(b[1].data) - new Date(a[1].data));
            
            container.innerHTML = '';
            
            if (eventiArray.length === 0) {
                container.innerHTML = '<div class="no-data">Nessun evento programmato</div>';
                return;
            }
            
            console.log(`Visualizzo ${eventiArray.length} eventi`);
            
            // Crea una card per ogni evento
            eventiArray.forEach(([eventoId, evento]) => {
                const dataEvento = new Date(evento.data);
                const formattedData = dataEvento.toLocaleDateString('it-IT', {
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric'
                });
                
                // Determina se l'evento è passato
                const oggi = new Date();
                oggi.setHours(0, 0, 0, 0);
                const isPassato = dataEvento < oggi;
                
                const eventoCard = document.createElement('div');
                eventoCard.className = `evento-card ${isPassato ? 'evento-passato' : ''}`;
                
                eventoCard.innerHTML = `
                    <div class="evento-header">
                        <h3>${evento.nome}</h3>
                        <div class="evento-actions">
                            <button onclick="modificaEvento('${eventoId}')" class="btn-icon">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="eliminaEvento('${eventoId}')" class="btn-icon btn-danger">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="evento-details">
                        <div class="evento-info">
                            <i class="fas fa-calendar-day"></i> ${formattedData}
                        </div>
                        <div class="evento-info">
                            <i class="far fa-clock"></i> ${evento.orario || 'Non specificato'}
                        </div>
                        <div class="evento-info">
                            <i class="fas fa-map-marker-alt"></i> ${evento.luogo || 'Non specificato'}
                        </div>
                        <div class="evento-info">
                            <i class="fas fa-sign-in-alt"></i> Iscrizione: 
                            <span class="${evento.iscrizioneAperta ? 'iscrizione-aperta' : 'iscrizione-chiusa'}">
                                ${evento.iscrizioneAperta ? 'Aperta' : 'Chiusa'}
                            </span>
                            ${evento.modalitaIscrizione ? `<br><small>${evento.modalitaIscrizione}</small>` : ''}
                        </div>
                    </div>
                `;
                
                container.appendChild(eventoCard);
            });
        })
        .catch(error => {
            console.error("Errore nel caricamento degli eventi:", error);
            container.innerHTML = `<div class="error">Errore nel caricamento degli eventi: ${error.message}</div>`;
        });
}

function showEventoForm() {
    // Imposta la data di default a oggi
    const oggi = new Date();
    const formatData = oggi.toISOString().split('T')[0];
    document.getElementById('eventoData').value = formatData;
    
    // Mostra il form
    document.getElementById('eventoForm').style.display = 'block';
}

function hideEventoForm() {
    document.getElementById('eventoForm').style.display = 'none';
    
    // Reset del form
    document.getElementById('eventoNome').value = '';
    document.getElementById('eventoData').value = '';
    document.getElementById('eventoOrario').value = '';
    document.getElementById('eventoLuogo').value = '';
    document.getElementById('eventoIscrizione').value = 'true';
    document.getElementById('eventoModalita').value = '';
}

function salvaEvento() {
    const nome = document.getElementById('eventoNome').value.trim();
    const data = document.getElementById('eventoData').value;
    const orario = document.getElementById('eventoOrario').value.trim();
    const luogo = document.getElementById('eventoLuogo').value.trim();
    const iscrizioneAperta = document.getElementById('eventoIscrizione').value === 'true';
    const modalitaIscrizione = document.getElementById('eventoModalita').value.trim();
    const immagine = document.getElementById('eventoImmagine').value.trim();
    const immagineHome = document.getElementById('eventoImmagineHome').value.trim();
    const descrizione = document.getElementById('eventoDescrizione').value.trim();
    const formato = document.getElementById('eventoFormato').value.trim();
    const quota = document.getElementById('eventoQuota').value.trim();
    const premi = document.getElementById('eventoPremi').value.trim();
    
    // Validazione
    if (!nome || !data || !orario || !luogo) {
        showAlert('Compila tutti i campi obbligatori', 'error');
        return;
    }
    
    // Prepara l'oggetto evento
    const nuovoEvento = {
        nome,
        data,
        orario,
        luogo,
        iscrizioneAperta,
        modalitaIscrizione,
        immagine,
        immagineHome,
        descrizione,
        formato,
        quota, 
        premi,
        creatoIl: new Date().toISOString()
    };
    
    // Salva nel database
    const eventoRef = database.ref('eventi').push();
    eventoRef.set(nuovoEvento)
        .then(() => {
            showAlert('Evento salvato con successo', 'success');
            hideEventoForm();
            caricaEventi();
        })
        .catch(error => {
            console.error("Errore nel salvataggio dell'evento:", error);
            showAlert(`Errore nel salvataggio: ${error.message}`, 'error');
        });
}

function modificaEvento(eventoId) {
    database.ref(`eventi/${eventoId}`).once('value')
        .then(snapshot => {
            const evento = snapshot.val();
            if (!evento) {
                showAlert('Evento non trovato', 'error');
                return;
            }
            
            // Popola il form con i dati dell'evento
            document.getElementById('eventoNome').value = evento.nome || '';
            document.getElementById('eventoData').value = evento.data || '';
            document.getElementById('eventoOrario').value = evento.orario || '';
            document.getElementById('eventoLuogo').value = evento.luogo || '';
            document.getElementById('eventoIscrizione').value = evento.iscrizioneAperta ? 'true' : 'false';
            document.getElementById('eventoModalita').value = evento.modalitaIscrizione || '';
            document.getElementById('eventoImmagine').value = evento.immagine || '';
            document.getElementById('eventoImmagineHome').value = evento.immagineHome || '';
            document.getElementById('eventoDescrizione').value = evento.descrizione || '';
            document.getElementById('eventoFormato').value = evento.formato || '';
            document.getElementById('eventoQuota').value = evento.quota || '';
            document.getElementById('eventoPremi').value = evento.premi || '';
            
            // Mostra il form
            document.getElementById('eventoForm').style.display = 'block';
            
            // Cambia la funzione di salvataggio
            const salvaBtn = document.querySelector('#eventoForm .primary');
            salvaBtn.textContent = 'Aggiorna';
            salvaBtn.onclick = function() {
                aggiornaEvento(eventoId);
            };
        })
        .catch(error => {
            console.error("Errore nel caricamento dell'evento:", error);
            showAlert(`Errore: ${error.message}`, 'error');
        });
}

function aggiornaEvento(eventoId) {
    const nome = document.getElementById('eventoNome').value.trim();
    const data = document.getElementById('eventoData').value;
    const orario = document.getElementById('eventoOrario').value.trim();
    const luogo = document.getElementById('eventoLuogo').value.trim();
    const iscrizioneAperta = document.getElementById('eventoIscrizione').value === 'true';
    const modalitaIscrizione = document.getElementById('eventoModalita').value.trim();
    const immagine = document.getElementById('eventoImmagine').value.trim();
    const immagineHome = document.getElementById('eventoImmagineHome').value.trim();
    const descrizione = document.getElementById('eventoDescrizione').value.trim();
    const formato = document.getElementById('eventoFormato').value.trim();
    const quota = document.getElementById('eventoQuota').value.trim();
    const premi = document.getElementById('eventoPremi').value.trim();
    
    // Validazione
    if (!nome || !data || !orario || !luogo) {
        showAlert('Compila tutti i campi obbligatori', 'error');
        return;
    }
    
    // Prepara l'oggetto evento
    const eventoAggiornato = {
        nome,
        data,
        orario,
        luogo,
        iscrizioneAperta,
        modalitaIscrizione,
        immagine,
        immagineHome,
        descrizione,
        formato,
        quota,
        premi,
        aggiornatoIl: new Date().toISOString()
    };
    
    // Aggiorna nel database
    database.ref(`eventi/${eventoId}`).update(eventoAggiornato)
        .then(() => {
            showAlert('Evento aggiornato con successo', 'success');
            hideEventoForm();
            caricaEventi();
            
            // Ripristina il comportamento originale del pulsante Salva
            const salvaBtn = document.querySelector('#eventoForm .primary');
            salvaBtn.textContent = 'Salva';
            salvaBtn.onclick = salvaEvento;
        })
        .catch(error => {
            console.error("Errore nell'aggiornamento dell'evento:", error);
            showAlert(`Errore: ${error.message}`, 'error');
        });
}

function eliminaEvento(eventoId) {
    if (!confirm('Sei sicuro di voler eliminare questo evento?')) {
        return;
    }
    
    database.ref(`eventi/${eventoId}`).remove()
        .then(() => {
            showAlert('Evento eliminato con successo', 'success');
            caricaEventi();
        })
        .catch(error => {
            console.error("Errore nell'eliminazione dell'evento:", error);
            showAlert(`Errore: ${error.message}`, 'error');
        });
}

// --- GESTIONE COPPE E HALL OF FAME ---

// Inizializzazione navigazione sidebar
function initCoppeHofAdmin() {
    if (window.__coppeHofAdminReady) return;
    window.__coppeHofAdminReady = true;

    const menuTornei = document.getElementById('menuTornei');
    const menuStatistiche = document.getElementById('menuStatistiche');
    const menuEventi = document.getElementById('menuEventi');
    const menuCoppe = document.getElementById('menuCoppe');
    const menuHOF = document.getElementById('menuHOF');

    const sezioneTornei = document.getElementById('sezioneTornei');
    const sezioneStatistiche = document.getElementById('sezioneStatistiche');
    const sezioneEventi = document.getElementById('sezioneEventi');
    const sezioneCoppe = document.getElementById('sezioneCoppe');
    const sezioneHOF = document.getElementById('sezioneHOF');
    const gestioneTorneo = document.getElementById('gestioneTorneo');

    function hideAllSections() {
        if (sezioneTornei) sezioneTornei.style.display = 'none';
        if (sezioneStatistiche) sezioneStatistiche.style.display = 'none';
        if (sezioneEventi) sezioneEventi.style.display = 'none';
        if (sezioneCoppe) sezioneCoppe.style.display = 'none';
        if (sezioneHOF) sezioneHOF.style.display = 'none';
        if (gestioneTorneo) gestioneTorneo.style.display = 'none';
        
        document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    }

    if (menuTornei) {
        menuTornei.onclick = (e) => {
            e.preventDefault();
            hideAllSections();
            sezioneTornei.style.display = 'block';
            menuTornei.classList.add('active');
        };
    }

    if (menuStatistiche) {
        menuStatistiche.onclick = (e) => {
            e.preventDefault();
            hideAllSections();
            sezioneStatistiche.style.display = 'block';
            menuStatistiche.classList.add('active');
            if (typeof caricaStatistiche === 'function') caricaStatistiche();
        };
    }

    if (menuEventi) {
        menuEventi.onclick = (e) => {
            e.preventDefault();
            hideAllSections();
            sezioneEventi.style.display = 'block';
            menuEventi.classList.add('active');
            if (typeof caricaEventi === 'function') caricaEventi();
        };
    }

    if (menuCoppe) {
        menuCoppe.onclick = (e) => {
            e.preventDefault();
            hideAllSections();
            sezioneCoppe.style.display = 'block';
            menuCoppe.classList.add('active');
            caricaCoppe();
        };
    }

    if (menuHOF) {
        menuHOF.onclick = (e) => {
            e.preventDefault();
            hideAllSections();
            sezioneHOF.style.display = 'block';
            menuHOF.classList.add('active');
            caricaHOFBackend();
            popolaTendinaCoppeHOF();
        };
    }

    // Handlers per Cup/HOF
    if (document.getElementById('btnCreaCoppa')) {
        document.getElementById('btnCreaCoppa').onclick = creaCoppa;
    }
    if (document.getElementById('btnSalvaHOF')) {
        document.getElementById('btnSalvaHOF').onclick = salvaHOF;
    }

    caricaCoppe();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCoppeHofAdmin);
} else {
    initCoppeHofAdmin();
}

// Funzioni per le Coppe
function caricaCoppe() {
    if (window.AdminCupsManager) {
        return window.AdminCupsManager.load();
    }
    return Promise.resolve({});
}

function creaCoppa() {
    if (window.AdminCupsManager) {
        return window.AdminCupsManager.create();
    }
    return Promise.resolve();
}

function eliminaCoppa(id) {
    if (window.AdminCupsManager) {
        return window.AdminCupsManager.delete(id);
    }
    return Promise.resolve();
}

// Funzioni per HOF
function popolaTendinaCoppeHOF() {
    database.ref('cups').once('value', (snapshot) => {
        const coppe = snapshot.val() || {};
        const select = document.getElementById('hofCoppaVinta');
        if (!select) return;
        select.innerHTML = '<option value="">Seleziona Coppa</option>';
        Object.values(coppe).forEach(coppa => {
            select.innerHTML += `<option value="${coppa.name}">${coppa.name}</option>`;
        });
    });
}

function salvaHOF() {
    const nome = document.getElementById('hofVincitoreNome').value.trim();
    const cupName = document.getElementById('hofCoppaVinta').value;
    const imageUrl = document.getElementById('hofImmagineUrl').value.trim();

    if (!nome || !cupName) return showAlert('Nome e Coppa sono obbligatori', 'error');

    database.ref('hallOfFame').push({
        nome, cupName, imageUrl, creatoIl: new Date().toISOString()
    }).then(() => {
        showAlert('Vincitore aggiunto!');
        document.getElementById('hofVincitoreNome').value = '';
        document.getElementById('hofImmagineUrl').value = '';
    });
}

function caricaHOFBackend() {
    database.ref('hallOfFame').on('value', (snapshot) => {
        const hofs = snapshot.val() || {};
        const container = document.getElementById('hofList');
        if (!container) return;
        container.innerHTML = '';

        Object.entries(hofs).forEach(([id, hof]) => {
            const item = document.createElement('div');
            item.className = 'event-card';
            item.style.marginBottom = '10px';
            item.innerHTML = `
                <div class="event-info">
                    <strong>${hof.nome}</strong> - ${hof.cupName}
                </div>
                <div class="event-actions">
                    <button onclick="eliminaHOF('${id}')" class="small-button" style="background:#dc3545"><i class="fas fa-trash"></i></button>
                </div>
            `;
            container.appendChild(item);
        });
    });
}

function eliminaHOF(id) {
    if (confirm('Rimuovere questo vincitore?')) {
        database.ref(`hallOfFame/${id}`).remove();
    }
}
