// Versione del calcolatore
        const VERSION = "3.0";
        
        // Variabili per i grafici
        let prizeDistributionChart = null;
        let simulationChart = null;
        let comparisonChart = null;
        let historyChart = null;
        
        // Array per memorizzare i tornei salvati
        let savedTournaments = [];
        
        // Array per memorizzare i risultati delle simulazioni
        let simulationResults = [];
        
        // Funzione per gestire il tema chiaro/scuro
        function toggleTheme() {
            const body = document.body;
            const themeToggle = document.getElementById('themeToggle');
            
            if (body.classList.contains('dark-mode')) {
                body.classList.remove('dark-mode');
                themeToggle.textContent = '☀️';
                localStorage.setItem('theme', 'light');
            } else {
                body.classList.add('dark-mode');
                themeToggle.textContent = '🌙';
                localStorage.setItem('theme', 'dark');
            }
        }
        
        // Funzione per gestire la visibilità della riga profitto/perdita
        function toggleProfitVisibility() {
            const profitRow = document.getElementById('profit').parentElement.parentElement;
            const showProfit = document.getElementById('showProfit').checked;
            profitRow.style.display = showProfit ? '' : 'none';
        }
        
        // Funzione per gestire la visibilità del campo profitto desiderato
        function toggleTargetProfitVisibility() {
            const targetProfitContainer = document.getElementById('targetProfitContainer');
            const showTargetProfit = document.getElementById('showTargetProfit').checked;
            targetProfitContainer.style.display = showTargetProfit ? '' : 'none';
        }
        
        // Funzione per esportare in PDF
        function exportToPDF() {
            // Configurazione per html2pdf
            const element = document.body;
            const opt = {
                margin: 10,
                filename: 'Calcolatore_Torneo_Lega_TFT.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            
            // Nascondi temporaneamente i pulsanti di esportazione
            const exportButtons = document.querySelectorAll('.export-buttons');
            exportButtons.forEach(btn => btn.style.display = 'none');
            
            // Genera il PDF
            html2pdf().set(opt).from(element).save().then(() => {
                // Ripristina i pulsanti dopo la generazione
                exportButtons.forEach(btn => btn.style.display = 'flex');
            });
        }
        
        // Funzione per aggiungere event listeners a tutti gli input
        function setupAutoCalculate() {
            // Lista di tutti gli elementi input che influenzano il calcolo
            const inputs = [
                'participants', 'fee', 'boosterPrice', 'rareCards', 'targetProfit',
                'position1Percent', 'position2Percent', 'position3Percent',
                'position4Boosters', 'position5Boosters', 'position6Boosters',
                'position7Boosters', 'position8Boosters', 'includeParticipationBoosters'
            ];
            
            // Aggiungi event listener a ciascun input
            inputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.addEventListener('change', calculate);
                    } else {
                        element.addEventListener('input', calculate);
                        
                        // Aggiungi validazione per i campi numerici
                        if (element.type === 'number') {
                            element.addEventListener('input', validateInput);
                        }
                    }
                }
            });
            
            // Validazione speciale per le percentuali
            document.getElementById('position1Percent').addEventListener('input', validatePercentages);
            document.getElementById('position2Percent').addEventListener('input', validatePercentages);
            document.getElementById('position3Percent').addEventListener('input', validatePercentages);
            
            // Setup per gli slider di personalizzazione
            setupPrizeSliders();
            
            // Setup per i pulsanti di modalità
            setupModeSwitcher();
        }
        
        // Funzione per inizializzare gli slider di personalizzazione
        function setupPrizeSliders() {
            const position1Slider = document.getElementById('position1Slider');
            const position2Slider = document.getElementById('position2Slider');
            const position3Slider = document.getElementById('position3Slider');
            const position1Value = document.getElementById('position1SliderValue');
            const position2Value = document.getElementById('position2SliderValue');
            const position3Value = document.getElementById('position3SliderValue');
            const totalPercentage = document.getElementById('totalPercentage');
            const percentageStatus = document.getElementById('percentageStatus');
            const resetButton = document.getElementById('resetPercentages');
            
            // Funzione per aggiornare i valori degli input numerici dalle slider
            function updateInputsFromSliders() {
                document.getElementById('position1Percent').value = position1Slider.value;
                document.getElementById('position2Percent').value = position2Slider.value;
                document.getElementById('position3Percent').value = position3Slider.value;
                validatePercentages();
                calculate();
                updatePrizeDistributionChart();
            }
            
            // Funzione per aggiornare i valori visualizzati
            function updateSliderValues() {
                position1Value.textContent = position1Slider.value;
                position2Value.textContent = position2Slider.value;
                position3Value.textContent = position3Slider.value;
                
                const total = parseInt(position1Slider.value) + parseInt(position2Slider.value) + parseInt(position3Slider.value);
                totalPercentage.textContent = total;
                
                if (total === 100) {
                    percentageStatus.textContent = '✅';
                    document.getElementById('sliderPercentValidation').style.display = 'none';
                } else {
                    percentageStatus.textContent = '❌';
                    const validationMessage = document.getElementById('sliderPercentValidation');
                    validationMessage.textContent = `La somma attuale è ${total}%. Deve essere 100%.`;
                    validationMessage.style.display = 'block';
                }
            }
            
            // Aggiungi event listeners agli slider
            position1Slider.addEventListener('input', function() {
                updateSliderValues();
                // Aggiusta gli altri slider per mantenere il totale a 100%
                const remaining = 100 - parseInt(position1Slider.value);
                const ratio = parseInt(position2Slider.value) / (parseInt(position2Slider.value) + parseInt(position3Slider.value));
                
                if (!isNaN(ratio)) {
                    position2Slider.value = Math.round(remaining * ratio);
                    position3Slider.value = remaining - position2Slider.value;
                    updateSliderValues();
                    updateInputsFromSliders();
                }
            });
            
            position2Slider.addEventListener('input', function() {
                updateSliderValues();
                // Aggiusta il terzo slider per mantenere il totale a 100%
                const remaining = 100 - parseInt(position1Slider.value) - parseInt(position2Slider.value);
                position3Slider.value = remaining;
                updateSliderValues();
                updateInputsFromSliders();
            });
            
            position3Slider.addEventListener('input', function() {
                updateSliderValues();
                // Aggiusta il secondo slider per mantenere il totale a 100%
                const remaining = 100 - parseInt(position1Slider.value) - parseInt(position3Slider.value);
                position2Slider.value = remaining;
                updateSliderValues();
                updateInputsFromSliders();
            });
            
            // Pulsante per ripristinare i valori predefiniti
            resetButton.addEventListener('click', function() {
                position1Slider.value = 60;
                position2Slider.value = 30;
                position3Slider.value = 10;
                updateSliderValues();
                updateInputsFromSliders();
            });
            
            // Inizializza i valori
            updateSliderValues();
        }
        
        // Funzione per inizializzare e aggiornare il grafico di distribuzione premi
        function updatePrizeDistributionChart() {
            const ctx = document.getElementById('prizeDistributionChart').getContext('2d');
            
            // Ottieni i valori delle percentuali
            const position1Percent = parseInt(document.getElementById('position1Percent').value) || 60;
            const position2Percent = parseInt(document.getElementById('position2Percent').value) || 30;
            const position3Percent = parseInt(document.getElementById('position3Percent').value) || 10;
            
            // Ottieni i valori dei premi in pacchetti
            const position4Boosters = parseInt(document.getElementById('position4Boosters').value) || 0;
            const position5Boosters = parseInt(document.getElementById('position5Boosters').value) || 0;
            const position6Boosters = parseInt(document.getElementById('position6Boosters').value) || 0;
            const position7Boosters = parseInt(document.getElementById('position7Boosters').value) || 0;
            const position8Boosters = parseInt(document.getElementById('position8Boosters').value) || 0;
            
            // Calcola il valore totale delle carte rare
            const rareCards = parseFloat(document.getElementById('rareCards').value) || 0;
            
            // Calcola il valore dei pacchetti
            const boosterPrice = parseFloat(document.getElementById('boosterPrice').value) || 0;
            const boosterValues = [
                position4Boosters * boosterPrice,
                position5Boosters * boosterPrice,
                position6Boosters * boosterPrice,
                position7Boosters * boosterPrice,
                position8Boosters * boosterPrice
            ];
            
            // Calcola i valori dei premi in carte rare
            const rareCardValues = [
                rareCards * (position1Percent / 100),
                rareCards * (position2Percent / 100),
                rareCards * (position3Percent / 100)
            ];
            
            // Prepara i dati per il grafico
            const data = {
                labels: ['1° posto', '2° posto', '3° posto', '4° posto', '5° posto', '6° posto', '7° posto', '8° posto'],
                datasets: [{
                    label: 'Valore Premio (€)',
                    data: [...rareCardValues, ...boosterValues],
                    backgroundColor: [
                        '#FFCD00', // Oro per il 1° posto
                        '#C0C0C0', // Argento per il 2° posto
                        '#AF6528', // Bronzo per il 3° posto
                        '#62C3F8', // Blu per gli altri posti
                        '#62C3F8',
                        '#62C3F8',
                        '#62C3F8',
                        '#62C3F8'
                    ],
                    borderColor: '#f3d23e',
                    borderWidth: 1
                }]
            };
            
            // Opzioni del grafico
            const options = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                return `€${value.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Valore (€)'
                        }
                    }
                }
            };
            
            // Distruggi il grafico esistente se presente
            if (prizeDistributionChart) {
                prizeDistributionChart.destroy();
            }
            
            // Crea il nuovo grafico
            prizeDistributionChart = new Chart(ctx, {
                type: 'bar',
                data: data,
                options: options
            });
        }
        
        // Funzione per gestire il cambio di modalità
        function setupModeSwitcher() {
            const basicModeBtn = document.getElementById('basicModeBtn');
            const advancedModeBtn = document.getElementById('advancedModeBtn');
            const simulationModeBtn = document.getElementById('simulationModeBtn');
            const historyModeBtn = document.getElementById('historyModeBtn');
            
            // Funzione per attivare una modalità
            function activateMode(mode) {
                // Rimuovi la classe active da tutti i pulsanti
                [basicModeBtn, advancedModeBtn, simulationModeBtn, historyModeBtn].forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                
                // Aggiungi la classe active al pulsante selezionato
                mode.classList.add('active');
                mode.setAttribute('aria-pressed', 'true');
                
                // Nascondi tutte le sezioni di modalità
                document.getElementById('basicModeSection').style.display = 'none';
                document.getElementById('advancedModeSection').style.display = 'none';
                document.getElementById('simulationModeSection').style.display = 'none';
                document.getElementById('historyModeSection').style.display = 'none';
                
                // Mostra la sezione corrispondente alla modalità selezionata
                if (mode === basicModeBtn) {
                    document.getElementById('basicModeSection').style.display = 'block';
                } else if (mode === advancedModeBtn) {
                    document.getElementById('advancedModeSection').style.display = 'block';
                    setupAdvancedMode(); // Inizializza la modalità avanzata
                } else if (mode === simulationModeBtn) {
                    document.getElementById('simulationModeSection').style.display = 'block';
                    setupSimulationMode(); // Inizializza la modalità simulazione
                } else if (mode === historyModeBtn) {
                    document.getElementById('historyModeSection').style.display = 'block';
                    setupHistoryMode(); // Inizializza la modalità storia
                }
            }
            
            // Aggiungi event listeners ai pulsanti di modalità
            basicModeBtn.addEventListener('click', function() {
                activateMode(basicModeBtn);
            });
            
            advancedModeBtn.addEventListener('click', function() {
                activateMode(advancedModeBtn);
            });
            
            simulationModeBtn.addEventListener('click', function() {
                activateMode(simulationModeBtn);
            });
            
            historyModeBtn.addEventListener('click', function() {
                activateMode(historyModeBtn);
            });
        }
        
        // Funzione per inizializzare la modalità avanzata
        function setupAdvancedMode() {
            // Ottieni gli elementi del DOM
            const tournamentFormat = document.getElementById('tournamentFormat');
            const roundsContainer = document.getElementById('roundsContainer');
            const customPrizesContainer = document.getElementById('customPrizesContainer');
            
            // Aggiorna la visualizzazione in base al formato selezionato
            function updateAdvancedView() {
                const format = tournamentFormat.value;
                
                // Mostra/nascondi opzioni specifiche per formato
                if (format === 'elimination') {
                    roundsContainer.style.display = 'block';
                    // Calcola il numero di round in base ai partecipanti
                    const participants = parseInt(document.getElementById('advancedParticipants').value) || 8;
                    const rounds = Math.ceil(Math.log2(participants));
                    document.getElementById('tournamentRounds').value = rounds;
                } else if (format === 'swiss') {
                    roundsContainer.style.display = 'block';
                    // Per il formato svizzero, suggerisci un numero di round
                    const participants = parseInt(document.getElementById('advancedParticipants').value) || 8;
                    const rounds = Math.ceil(Math.log2(participants)) + 1;
                    document.getElementById('tournamentRounds').value = rounds;
                } else if (format === 'roundRobin') {
                    roundsContainer.style.display = 'block';
                    // Per il girone all'italiana, ogni partecipante gioca contro tutti gli altri
                    const participants = parseInt(document.getElementById('advancedParticipants').value) || 8;
                    const rounds = participants - 1;
                    document.getElementById('tournamentRounds').value = rounds;
                }
                
                // Aggiorna la tabella dei premi personalizzati
                updateCustomPrizesTable();
                
                // Calcola i risultati avanzati
                calculateAdvanced();
            }
            
            // Funzione per aggiornare la tabella dei premi personalizzati
            function updateCustomPrizesTable() {
                const participants = parseInt(document.getElementById('advancedParticipants').value) || 8;
                const prizeTable = document.getElementById('customPrizesTable');
                const tbody = prizeTable.querySelector('tbody');
                
                // Svuota la tabella esistente
                tbody.innerHTML = '';
                
                // Funzione per calcolare i risultati avanzati
                function calculateAdvanced() {
                    // Ottieni i valori di input
                    const participants = parseInt(document.getElementById('advancedParticipants').value) || 8;
                    const fee = parseFloat(document.getElementById('advancedFee').value) || 15;
                    const boosterPrice = parseFloat(document.getElementById('advancedBoosterPrice').value) || 4.25;
                    const locationCost = parseFloat(document.getElementById('locationCost').value) || 0;
                    const judgeCost = parseFloat(document.getElementById('judgeCost').value) || 0;
                    const otherCosts = parseFloat(document.getElementById('otherCosts').value) || 0;
                    
                    // Calcola il montepremi totale
                    const prizePool = participants * fee;
                    
                    // Calcola i costi totali
                    let totalCosts = locationCost + judgeCost + otherCosts;
                    let totalPrizeValue = 0;
                    
                    // Calcola il valore totale dei premi
                    const maxPrizes = Math.min(participants, 8);
                    for (let i = 1; i <= maxPrizes; i++) {
                        const rareValue = parseFloat(document.getElementById(`advancedRare${i}`).value) || 0;
                        const boosters = parseInt(document.getElementById(`advancedBoosters${i}`).value) || 0;
                        const boosterValue = boosters * boosterPrice;
                        const totalValue = rareValue + boosterValue;
                        
                        document.getElementById(`advancedTotal${i}`).textContent = `€${totalValue.toFixed(2)}`;
                        totalPrizeValue += totalValue;
                    }
                    
                    // Aggiorna i risultati
                    document.getElementById('advancedPrizePool').textContent = `€${prizePool.toFixed(2)}`;
                    
                    // Calcola il numero di partite in base al formato
                    const format = document.getElementById('tournamentFormat').value;
                    const rounds = parseInt(document.getElementById('tournamentRounds').value) || 3;
                    let matches = 0;
                    
                    if (format === 'elimination') {
                        // In un torneo a eliminazione diretta, il numero di partite è n-1
                        matches = participants - 1;
                    } else if (format === 'swiss') {
                        // In un torneo svizzero, ogni giocatore gioca un numero fisso di round
                        matches = Math.floor(participants * rounds / 2);
                    } else if (format === 'roundRobin') {
                        // In un girone all'italiana, ogni giocatore gioca contro tutti gli altri
                        matches = (participants * (participants - 1)) / 2;
                    }
                    
                    document.getElementById('advancedMatches').textContent = matches;
                    
                    // Stima la durata del torneo (assumendo 45 minuti per partita)
                    const durationHours = (matches * 45) / 60;
                    document.getElementById('advancedDuration').textContent = `${durationHours.toFixed(1)} ore`;
                    
                    // Calcola il profitto
                    const profit = prizePool - totalPrizeValue - totalCosts;
                    document.getElementById('advancedProfit').textContent = `€${profit.toFixed(2)}`;
                    document.getElementById('advancedProfit').className = profit >= 0 ? 'green' : 'red';
                    
                    // Calcola la percentuale di profitto
                    const profitPercentage = (profit / prizePool) * 100;
                    document.getElementById('advancedProfitPercentage').textContent = `${profitPercentage.toFixed(2)}%`;
                    document.getElementById('advancedProfitPercentage').className = profitPercentage >= 0 ? 'green' : 'red';
                    
                    // Calcola il rapporto premi/iscrizione
                    const prizeRatio = (totalPrizeValue / prizePool) * 100;
                    document.getElementById('advancedPrizeRatio').textContent = `${prizeRatio.toFixed(2)}%`;
                    
                    // Aggiorna il grafico dei premi
                    updateAdvancedPrizeChart();
                }
                
                // Aggiungi event listener per il pulsante di calcolo
                document.getElementById('tournamentFormat').addEventListener('change', updateAdvancedView);
                document.getElementById('advancedParticipants').addEventListener('input', updateAdvancedView);
                document.getElementById('advancedFee').addEventListener('input', calculateAdvanced);
                document.getElementById('advancedBoosterPrice').addEventListener('input', calculateAdvanced);
                document.getElementById('locationCost').addEventListener('input', calculateAdvanced);
                document.getElementById('judgeCost').addEventListener('input', calculateAdvanced);
                document.getElementById('otherCosts').addEventListener('input', calculateAdvanced);
                
                // Funzione per aggiornare il grafico dei premi avanzati
                function updateAdvancedPrizeChart() {
                    const ctx = document.getElementById('advancedPrizeChart').getContext('2d');
                    
                    // Prepara i dati per il grafico
                    const labels = [];
                    const rareData = [];
                    const boosterData = [];
                    
                    // Raccogli i dati dai premi personalizzati
                    const maxPrizes = Math.min(parseInt(document.getElementById('advancedParticipants').value) || 8, 8);
                    const boosterPrice = parseFloat(document.getElementById('advancedBoosterPrice').value) || 4.25;
                    
                    for (let i = 1; i <= maxPrizes; i++) {
                        labels.push(`${i}° posto`);
                        const rareValue = parseFloat(document.getElementById(`advancedRare${i}`).value) || 0;
                        const boosters = parseInt(document.getElementById(`advancedBoosters${i}`).value) || 0;
                        const boosterValue = boosters * boosterPrice;
                        
                        rareData.push(rareValue);
                        boosterData.push(boosterValue);
                    }
                    
                    // Distruggi il grafico esistente se presente
                    if (window.advancedPrizeChart) {
                        window.advancedPrizeChart.destroy();
                    }
                    
                    // Crea il nuovo grafico
                    window.advancedPrizeChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [
                                {
                                    backgroundColor: 'rgba(215, 0, 0, 0.7)',
                                    borderColor: 'rgba(215, 0, 0, 1)',
                                    borderWidth: 1
                                },
                                {
                                    label: 'Valore Pacchetti (€)',
                                    data: boosterData,
                                    backgroundColor: 'rgba(243, 210, 62, 0.7)',
                                    borderColor: 'rgba(243, 210, 62, 1)',
                                    borderWidth: 1
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    stacked: true,
                                    title: {
                                        display: true,
                                        text: 'Valore (€)',
                                        color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                                    },
                                    grid: {
                                        color: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                    },
                                    ticks: {
                                        color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                                    }
                                },
                                x: {
                                    stacked: true,
                                    grid: {
                                        color: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                    },
                                    ticks: {
                                        color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    labels: {
                                        color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                                    }
                                },
                                title: {
                                    display: true,
                                    text: 'Distribuzione Premi Lega TFT',
                                    color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                                }
                            }
                        }
                    });
                }
                
                // Salva la configurazione avanzata
                document.getElementById('saveAdvancedConfig').addEventListener('click', function() {
                    // Crea un oggetto con la configurazione
                    const config = {
                        format: document.getElementById('tournamentFormat').value,
                        participants: document.getElementById('advancedParticipants').value,
                        fee: document.getElementById('advancedFee').value,
                        boosterPrice: document.getElementById('advancedBoosterPrice').value,
                        locationCost: document.getElementById('locationCost').value,
                        judgeCost: document.getElementById('judgeCost').value,
                        otherCosts: document.getElementById('otherCosts').value,
                        rounds: document.getElementById('tournamentRounds').value,
                        prizes: []
                    };
                    
                    // Salva i premi personalizzati
                    const maxPrizes = Math.min(parseInt(document.getElementById('advancedParticipants').value) || 8, 8);
                    for (let i = 1; i <= maxPrizes; i++) {
                        config.prizes.push({
                            rare: document.getElementById(`advancedRare${i}`).value,
                            boosters: document.getElementById(`advancedBoosters${i}`).value,
                            extra: document.getElementById(`advancedExtra${i}`).value
                        });
                    }
                    
                    // Salva nel localStorage
                    localStorage.setItem('tftAdvancedConfig', JSON.stringify(config));
                    
                    // Mostra notifica
                    const notification = document.getElementById('saveNotification');
                    notification.style.display = 'block';
                    notification.classList.add('slide-in-right');
                    
                    setTimeout(() => {
                        notification.classList.remove('slide-in-right');
                        notification.style.display = 'none';
                    }, 3000);
                });
                
                // Carica la configurazione salvata
                const savedConfig = localStorage.getItem('tftAdvancedConfig');
                if (savedConfig) {
                    const config = JSON.parse(savedConfig);
                    
                    // Applica i valori salvati
                    document.getElementById('tournamentFormat').value = config.format;
                    document.getElementById('advancedParticipants').value = config.participants;
                    document.getElementById('advancedFee').value = config.fee;
                    document.getElementById('advancedBoosterPrice').value = config.boosterPrice;
                    document.getElementById('locationCost').value = config.locationCost;
                    document.getElementById('judgeCost').value = config.judgeCost;
                    document.getElementById('otherCosts').value = config.otherCosts;
                    document.getElementById('tournamentRounds').value = config.rounds;
                    
                    // Aggiorna la vista
                    updateAdvancedView();
                    
                    // Applica i premi personalizzati dopo che la tabella è stata creata
                    setTimeout(() => {
                        config.prizes.forEach((prize, index) => {
                            const i = index + 1;
                            if (i <= maxPrizes) {
                                document.getElementById(`advancedRare${i}`).value = prize.rare;
                                document.getElementById(`advancedBoosters${i}`).value = prize.boosters;
                                document.getElementById(`advancedExtra${i}`).value = prize.extra;
                            }
                        });
                        
                        // Calcola con i valori caricati
                        calculateAdvanced();
                    }, 100);
                }
                
                // Crea righe per ogni posizione premiata
                const maxPrizes = Math.min(participants, 8); // Massimo 8 premi
                
                for (let i = 1; i <= maxPrizes; i++) {
                    const row = document.createElement('tr');
                    
                    // Posizione
                    const posCell = document.createElement('td');
                    posCell.textContent = `${i}° posto`;
                    row.appendChild(posCell);
                    
                    // Input per carte rare
                    const rareCell = document.createElement('td');
                    const rareInput = document.createElement('input');
                    rareInput.type = 'number';
                    rareInput.min = '0';
                    rareInput.id = `advancedRare${i}`;
                    rareInput.className = 'prize-input';
                    rareInput.placeholder = 'Valore in €';
                    rareInput.addEventListener('input', calculateAdvanced);
                    rareCell.appendChild(rareInput);
                    row.appendChild(rareCell);
                    
                    // Input per pacchetti
                    const boosterCell = document.createElement('td');
                    const boosterInput = document.createElement('input');
                    boosterInput.type = 'number';
                    boosterInput.min = '0';
                    boosterInput.id = `advancedBoosters${i}`;
                    boosterInput.className = 'prize-input';
                    boosterInput.placeholder = 'Numero pacchetti';
                    boosterInput.addEventListener('input', calculateAdvanced);
                    boosterCell.appendChild(boosterInput);
                    row.appendChild(boosterCell);
                    
                    // Input per premi extra
                    const extraCell = document.createElement('td');
                    const extraInput = document.createElement('input');
                    extraInput.type = 'text';
                    extraInput.id = `advancedExtra${i}`;
                    extraInput.className = 'prize-input';
                    extraInput.placeholder = 'Descrizione premio extra';
                    extraCell.appendChild(extraInput);
                    row.appendChild(extraCell);
                    
                    // Valore totale (calcolato)
                    const totalCell = document.createElement('td');
                    totalCell.id = `advancedTotal${i}`;
                    totalCell.textContent = '€0.00';
                    row.appendChild(totalCell);
                    
                    tbody.appendChild(row);
                }
            }
            
            // Funzione per calcolare i risultati della modalità avanzata
            function calculateAdvanced() {
                const participants = parseInt(document.getElementById('advancedParticipants').value) || 8;
                const fee = parseFloat(document.getElementById('advancedFee').value) || 15;
                const boosterPrice = parseFloat(document.getElementById('advancedBoosterPrice').value) || 4.25;
                const format = document.getElementById('tournamentFormat').value;
                const rounds = parseInt(document.getElementById('tournamentRounds').value) || 3;
                
                // Calcola il montepremi totale
                const prizePool = participants * fee;
                document.getElementById('advancedPrizePool').textContent = `€${prizePool.toFixed(2)}`;
                
                // Calcola il numero di partite
                let matches = 0;
                if (format === 'elimination') {
                    matches = participants - 1; // In un torneo a eliminazione diretta
                } else if (format === 'swiss') {
                    matches = Math.floor(participants * rounds / 2); // In un torneo svizzero
                } else if (format === 'roundRobin') {
                    matches = (participants * (participants - 1)) / 2; // In un girone all'italiana
                }
                document.getElementById('advancedMatches').textContent = matches;
                
                // Calcola la durata stimata (20 minuti per partita + pause)
                const durationHours = Math.ceil((matches * 20 + (rounds * 10)) / 60);
                document.getElementById('advancedDuration').textContent = `${durationHours} ore`;
                
                // Calcola i costi totali dei premi
                let totalPrizeCost = 0;
                const maxPrizes = Math.min(participants, 8);
                
                for (let i = 1; i <= maxPrizes; i++) {
                    const rareValue = parseFloat(document.getElementById(`advancedRare${i}`).value) || 0;
                    const boosters = parseInt(document.getElementById(`advancedBoosters${i}`).value) || 0;
                    const boosterValue = boosters * boosterPrice;
                    
                    const totalValue = rareValue + boosterValue;
                    document.getElementById(`advancedTotal${i}`).textContent = `€${totalValue.toFixed(2)}`;
                    
                    totalPrizeCost += totalValue;
                }
                
                // Aggiorna i totali
                document.getElementById('advancedTotalPrizeCost').textContent = `€${totalPrizeCost.toFixed(2)}`;
                
                // Calcola il profitto
                const profit = prizePool - totalPrizeCost;
                const profitElement = document.getElementById('advancedProfit');
                profitElement.textContent = `€${profit.toFixed(2)}`;
                profitElement.className = profit >= 0 ? 'green' : 'red';
                
                // Calcola e aggiorna le statistiche
                const profitPercentage = (profit / prizePool) * 100;
                document.getElementById('advancedProfitPercentage').textContent = 
                    `${profitPercentage.toFixed(2)}% ${profitPercentage >= 0 ? '✅' : '❌'}`;
                
                const prizeToFeeRatio = totalPrizeCost / prizePool * 100;
                document.getElementById('advancedPrizeRatio').textContent = 
                    `${prizeToFeeRatio.toFixed(2)}% ${prizeToFeeRatio <= 100 ? '✅' : '⚠️'}`;
                
                // Aggiorna il grafico
                updateAdvancedChart();
            }
            
            // Funzione per aggiornare il grafico della modalità avanzata
            function updateAdvancedChart() {
                const ctx = document.getElementById('advancedPrizeChart').getContext('2d');
                const maxPrizes = Math.min(parseInt(document.getElementById('advancedParticipants').value) || 8, 8);
                const boosterPrice = parseFloat(document.getElementById('advancedBoosterPrice').value) || 4.25;
                
                // Raccogli i dati per il grafico
                const labels = [];
                const rareValues = [];
                const boosterValues = [];
                
                for (let i = 1; i <= maxPrizes; i++) {
                    labels.push(`${i}° posto`);
                    rareValues.push(parseFloat(document.getElementById(`advancedRare${i}`).value) || 0);
                    boosterValues.push((parseInt(document.getElementById(`advancedBoosters${i}`).value) || 0) * boosterPrice);
                }
                
                // Distruggi il grafico esistente se presente
                if (window.advancedChart) {
                    window.advancedChart.destroy();
                }
                
                // Crea il nuovo grafico
                window.advancedChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Carte Rare (€)',
                                data: rareValues,
                                backgroundColor: '#FFCD00',
                                borderColor: '#2E62A3',
                                borderWidth: 1
                            },
                            {
                                label: 'Pacchetti (€)',
                                data: boosterValues,
                                backgroundColor: '#62C3F8',
                                borderColor: '#2E62A3',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                stacked: true
                            },
                            y: {
                                stacked: true,
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Valore (€)'
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const value = context.raw;
                                        return `${context.dataset.label}: €${value.toFixed(2)}`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
            
            // Aggiungi event listeners
            tournamentFormat.addEventListener('change', updateAdvancedView);
            document.getElementById('advancedParticipants').addEventListener('input', updateAdvancedView);
            document.getElementById('advancedFee').addEventListener('input', calculateAdvanced);
            document.getElementById('advancedBoosterPrice').addEventListener('input', calculateAdvanced);
            document.getElementById('tournamentRounds').addEventListener('input', calculateAdvanced);
            
            // Inizializza la vista
            updateAdvancedView();
        }
        
        // Funzione per validare gli input numerici
        function validateInput(e) {
            const input = e.target;
            const value = parseFloat(input.value);
            const inputId = input.id;
            let validationMessage = '';
            
            if (input.min && value < parseFloat(input.min)) {
                validationMessage = `Il valore minimo è ${input.min}`;
                input.setCustomValidity(validationMessage);
            } else if (input.max && value > parseFloat(input.max)) {
                validationMessage = `Il valore massimo è ${input.max}`;
                input.setCustomValidity(validationMessage);
            } else if (isNaN(value)) {
                validationMessage = 'Inserisci un numero valido';
                input.setCustomValidity(validationMessage);
            } else {
                input.setCustomValidity('');
            }
            
            // Gestione messaggi di validazione specifici
            const validationElement = document.getElementById(`${inputId}Validation`);
            if (validationElement) {
                if (validationMessage) {
                    validationElement.textContent = validationMessage;
                    validationElement.style.display = 'block';
                    input.classList.add('invalid');
                } else {
                    validationElement.style.display = 'none';
                    input.classList.remove('invalid');
                }
            }
        }
        
        // Funzione per inizializzare la modalità simulazione
        function setupSimulationMode() {
            // Ottieni gli elementi del DOM
            const simulationForm = document.getElementById('simulationForm');
            const runSimulationBtn = document.getElementById('runSimulation');
            const simulationResults = document.getElementById('simulationResults');
            const comparisonChartCanvas = document.getElementById('comparisonChart');
            
            // Array per memorizzare i risultati delle simulazioni
            if (!window.simulationResults) {
                window.simulationResults = [];
            }
            
            // Aggiungi event listener per il pulsante di simulazione
            if (runSimulationBtn) {
                runSimulationBtn.addEventListener('click', runSimulation);
            }
            
            // Funzione per eseguire la simulazione
            function runSimulation() {
                // Ottieni i parametri della simulazione
                const baseParticipants = parseInt(document.getElementById('baseParticipants').value) || 8;
                const maxParticipants = parseInt(document.getElementById('maxParticipants').value) || 32;
                const participantsStep = parseInt(document.getElementById('participantsStep').value) || 4;
                
                const baseFee = parseFloat(document.getElementById('baseFee').value) || 15;
                const maxFee = parseFloat(document.getElementById('maxFee').value) || 25;
                const feeStep = parseFloat(document.getElementById('feeStep').value) || 2.5;
                
                const boosterPrice = parseFloat(document.getElementById('simulationBoosterPrice').value) || 4.25;
                const rareCardsValue = parseFloat(document.getElementById('simulationRareCards').value) || 250;
                
                // Svuota i risultati precedenti
                window.simulationResults = [];
                
                // Esegui simulazioni per diverse combinazioni di partecipanti e quote
                for (let participants = baseParticipants; participants <= maxParticipants; participants += participantsStep) {
                    for (let fee = baseFee; fee <= maxFee; fee += feeStep) {
                        // Calcola i risultati per questa combinazione
                        const prizePool = participants * fee;
                        
                        // Calcola la distribuzione dei premi (semplificata)
                        const firstPlacePrize = prizePool * 0.5; // 50% al primo
                        const secondPlacePrize = prizePool * 0.3; // 30% al secondo
                        const thirdPlacePrize = prizePool * 0.1; // 10% al terzo
                        
                        // Calcola il costo dei premi (pacchetti)
                        const totalBoosters = Math.floor(participants * 0.5); // Metà dei partecipanti riceve bustine
                        const boostersCost = totalBoosters * boosterPrice;
                        
                        // Calcola il profitto
                        const profit = prizePool - (firstPlacePrize + secondPlacePrize + thirdPlacePrize + boostersCost);
                        const profitPercentage = (profit / prizePool) * 100;
                        
                        // Calcola l'efficienza
                        const efficiency = (firstPlacePrize + secondPlacePrize + thirdPlacePrize + boostersCost) / prizePool * 100;
                        
                        // Aggiungi i risultati all'array
                        window.simulationResults.push({
                            participants: participants,
                            fee: fee,
                            prizePool: prizePool,
                            profit: profit,
                            profitPercentage: profitPercentage,
                            efficiency: efficiency
                        });
                    }
                }
                
                // Aggiorna la tabella dei risultati
                updateSimulationTable();
                
                // Aggiorna il grafico comparativo
                updateComparisonChart();
                
                // Genera raccomandazioni
                generateRecommendations();
            }
            
            // Funzione per aggiornare la tabella dei risultati
            function updateSimulationTable() {
                const tableBody = document.getElementById('simulationResultsBody');
                tableBody.innerHTML = '';
                
                // Ordina i risultati per efficienza (decrescente)
                window.simulationResults.sort((a, b) => b.efficiency - a.efficiency);
                
                // Aggiungi righe alla tabella
                window.simulationResults.forEach((result, index) => {
                    const row = document.createElement('tr');
                    
                    // Aggiungi classe per evidenziare i migliori risultati
                    if (index < 3) {
                        row.classList.add('highlight-row');
                    }
                    
                    row.innerHTML = `
                        <td>${result.participants}</td>
                        <td>€${result.fee.toFixed(2)}</td>
                        <td>€${result.prizePool.toFixed(2)}</td>
                        <td class="${result.profit >= 0 ? 'green' : 'red'}">€${result.profit.toFixed(2)}</td>
                        <td>${result.profitPercentage.toFixed(2)}%</td>
                        <td>${result.efficiency.toFixed(2)}%</td>
                        <td>
                            <button class="small-btn" onclick="applySimulation(${index})">Applica</button>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
            }
            
            // Funzione per aggiornare il grafico comparativo
            function updateComparisonChart() {
                const ctx = document.getElementById('comparisonChart').getContext('2d');
                
                // Prepara i dati per il grafico
                const labels = [];
                const profitData = [];
                const efficiencyData = [];
                
                // Prendi i primi 5 risultati per il grafico
                const topResults = window.simulationResults.slice(0, 5);
                
                topResults.forEach(result => {
                    labels.push(`${result.participants} part. - €${result.fee}`);
                    profitData.push(result.profitPercentage);
                    efficiencyData.push(result.efficiency);
                });
                
                // Distruggi il grafico esistente se presente
                if (comparisonChart) {
                    comparisonChart.destroy();
                }
                
                // Crea il nuovo grafico
                comparisonChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: '% Profitto',
                                data: profitData,
                                backgroundColor: 'rgba(215, 0, 0, 0.7)',
                                borderColor: 'rgba(215, 0, 0, 1)',
                                borderWidth: 1
                            },
                            {
                                label: '% Efficienza',
                                data: efficiencyData,
                                backgroundColor: 'rgba(46, 98, 163, 0.7)',
                                borderColor: 'rgba(46, 98, 163, 1)',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Percentuale (%)',
                                    color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                                },
                                grid: {
                                    color: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                },
                                ticks: {
                                    color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                                }
                            },
                            x: {
                                grid: {
                                    color: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                },
                                ticks: {
                                    color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                labels: {
                                    color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                                }
                            },
                            title: {
                                display: true,
                                text: 'Confronto Configurazioni',
                                color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                            }
                        }
                    }
                });
            }
            
            // Funzione per generare raccomandazioni
            function generateRecommendations() {
                const recommendationsDiv = document.getElementById('recommendations');
                
                // Trova la configurazione con la migliore efficienza
                const bestEfficiency = window.simulationResults.reduce((prev, current) => 
                    (prev.efficiency > current.efficiency) ? prev : current);
                
                // Trova la configurazione con il miglior profitto
                const bestProfit = window.simulationResults.reduce((prev, current) => 
                    (prev.profit > current.profit) ? prev : current);
                
                // Genera le raccomandazioni
                let recommendations = `
                    <h4>Raccomandazioni</h4>
                    <ul>
                        <li><strong>Configurazione più efficiente:</strong> ${bestEfficiency.participants} partecipanti con quota di €${bestEfficiency.fee.toFixed(2)} (efficienza: ${bestEfficiency.efficiency.toFixed(2)}%)</li>
                        <li><strong>Configurazione più redditizia:</strong> ${bestProfit.participants} partecipanti con quota di €${bestProfit.fee.toFixed(2)} (profitto: €${bestProfit.profit.toFixed(2)})</li>
                `;
                
                // Aggiungi consigli specifici
                if (bestEfficiency.participants !== bestProfit.participants || bestEfficiency.fee !== bestProfit.fee) {
                    recommendations += `
                        <li><strong>Consiglio:</strong> Se prioritizzi la soddisfazione dei giocatori, scegli la configurazione più efficiente. Se prioritizzi il guadagno, scegli quella più redditizia.</li>
                    `;
                }
                
                // Aggiungi consigli sul prezzo dei pacchetti
                const boosterPrice = parseFloat(document.getElementById('simulationBoosterPrice').value) || 4.25;
                if (boosterPrice > 4.5) {
                    recommendations += `
                        <li><strong>Attenzione:</strong> Il prezzo dei pacchetti è relativamente alto (€${boosterPrice.toFixed(2)}). Considera di negoziare un prezzo migliore con il fornitore.</li>
                    `;
                }
                
                recommendations += `</ul>`;
                
                // Aggiorna il div delle raccomandazioni
                recommendationsDiv.innerHTML = recommendations;
            }
            
            // Funzione per applicare una configurazione simulata
            function applySimulation(index) {
                const result = window.simulationResults[index];
                
                // Applica i valori alla modalità base
                document.getElementById('participants').value = result.participants;
                document.getElementById('entryFee').value = result.fee.toFixed(2);
                
                // Passa alla modalità base
                document.getElementById('basicModeBtn').click();
                
                // Calcola con i nuovi valori
                calculate();
                
                // Mostra notifica
                const notification = document.getElementById('saveNotification');
                notification.textContent = 'Configurazione applicata!';
                notification.style.display = 'block';
                notification.classList.add('slide-in-right');
                
                setTimeout(() => {
                    notification.classList.remove('slide-in-right');
                    notification.style.display = 'none';
                    notification.textContent = 'Configurazione salvata!';
                }, 3000);
            }
            }
            
            // Funzione per aggiornare il grafico comparativo
            function updateComparisonChart() {
                const ctx = comparisonChartCanvas.getContext('2d');
                
                // Prepara i dati per il grafico
                const labels = window.simulationResults.slice(0, 5).map(result => 
                    `${result.participants} part. - €${result.fee.toFixed(2)}`);
                
                const prizePoolData = window.simulationResults.slice(0, 5).map(result => result.prizePool);
                const profitData = window.simulationResults.slice(0, 5).map(result => result.profit);
                
                // Distruggi il grafico esistente se presente
                if (window.comparisonChart) {
                    window.comparisonChart.destroy();
                }
                
                // Crea il nuovo grafico
                window.comparisonChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Montepremi (€)',
                                data: prizePoolData,
                                backgroundColor: '#FFCD00',
                                borderColor: '#2E62A3',
                                borderWidth: 1
                            },
                            {
                                label: 'Profitto (€)',
                                data: profitData,
                                backgroundColor: '#D70000',
                                borderColor: '#2E62A3',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Valore (€)'
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const value = context.raw;
                                        return `${context.dataset.label}: €${value.toFixed(2)}`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
            
            // Funzione per generare raccomandazioni
            function generateRecommendations() {
                const recommendationElement = document.getElementById('simulationRecommendation');
                
                if (window.simulationResults.length === 0) {
                    recommendationElement.textContent = 'Esegui una simulazione per ricevere raccomandazioni.';
                    return;
                }
                
                // Trova la simulazione con la migliore efficienza
                const bestEfficiency = window.simulationResults[0];
                
                // Trova la simulazione con il miglior profitto
                const bestProfit = [...window.simulationResults].sort((a, b) => b.profit - a.profit)[0];
                
                // Genera la raccomandazione
                let recommendation = `<strong>Configurazione ottimale:</strong> `;
                
                if (bestEfficiency.participants === bestProfit.participants && 
                    bestEfficiency.fee === bestProfit.fee) {
                    // Stessa configurazione per efficienza e profitto
                    recommendation += `${bestEfficiency.participants} partecipanti con quota di €${bestEfficiency.fee.toFixed(2)}. `;
                    recommendation += `Questa configurazione offre sia la migliore efficienza (${bestEfficiency.efficiency.toFixed(2)}%) `;
                    recommendation += `che il miglior profitto (€${bestEfficiency.profit.toFixed(2)}).`;
                } else {
                    // Configurazioni diverse
                    recommendation += `Per la migliore efficienza: ${bestEfficiency.participants} partecipanti con quota di €${bestEfficiency.fee.toFixed(2)} `;
                    recommendation += `(efficienza: ${bestEfficiency.efficiency.toFixed(2)}%, profitto: €${bestEfficiency.profit.toFixed(2)}). `;
                    recommendation += `<br><br>Per il miglior profitto: ${bestProfit.participants} partecipanti con quota di €${bestProfit.fee.toFixed(2)} `;
                    recommendation += `(profitto: €${bestProfit.profit.toFixed(2)}, efficienza: ${bestProfit.efficiency.toFixed(2)}%).`;
                }
                
                recommendationElement.innerHTML = recommendation;
            }
            
            // Funzione per applicare una simulazione alla modalità base
            window.applySimulation = function(index) {
                const simulation = window.simulationResults[index];
                
                // Passa alla modalità base
                document.getElementById('basicModeBtn').click();
                
                // Applica i valori della simulazione
                document.getElementById('participants').value = simulation.participants;
                document.getElementById('fee').value = simulation.fee;
                
                // Ricalcola
                calculate();
                
                // Mostra notifica
                const notification = document.getElementById('saveNotification');
                notification.textContent = 'Simulazione applicata!';
                notification.style.display = 'block';
                notification.classList.add('slide-in-right');
                
                setTimeout(() => {
                    notification.classList.remove('slide-in-right');
                    notification.style.display = 'none';
                    notification.textContent = 'Configurazione salvata!';
                }, 3000);
            }
            
            // Event listener per il pulsante di simulazione è già stato aggiunto in precedenza
        
        // Funzione per inizializzare la modalità storia tornei
        function setupHistoryMode() {
            // Ottieni gli elementi del DOM
            const saveTournamentBtn = document.getElementById('saveTournament');
            const tournamentHistoryTable = document.getElementById('tournamentHistoryTable');
            const historyChartCanvas = document.getElementById('historyChart');
            
            // Carica i tornei salvati dal localStorage
            if (!window.savedTournaments) {
                const savedData = localStorage.getItem('onePieceTournamentHistory');
                window.savedTournaments = savedData ? JSON.parse(savedData) : [];
            }
            
            // Aggiorna la tabella della storia
            updateHistoryTable();
            
            // Aggiorna il grafico della storia
            updateHistoryChart();
            
            // Funzione per salvare un nuovo torneo
            function saveTournament() {
                // Ottieni i dati del torneo
                const tournamentName = document.getElementById('tournamentName').value;
                const tournamentDate = document.getElementById('tournamentDate').value;
                const tournamentLocation = document.getElementById('tournamentLocation').value;
                const participants = parseInt(document.getElementById('historyParticipants').value) || 0;
                const fee = parseFloat(document.getElementById('historyFee').value) || 0;
                const prizePool = participants * fee;
                const expenses = parseFloat(document.getElementById('historyExpenses').value) || 0;
                const profit = prizePool - expenses;
                
                // Validazione
                if (!tournamentName || !tournamentDate || participants <= 0 || fee <= 0) {
                    alert('Compila tutti i campi obbligatori: nome, data, partecipanti e quota.');
                    return;
                }
                
                // Crea l'oggetto torneo
                const tournament = {
                    id: Date.now(), // ID univoco basato sul timestamp
                    name: tournamentName,
                    date: tournamentDate,
                    location: tournamentLocation,
                    participants: participants,
                    fee: fee,
                    prizePool: prizePool,
                    expenses: expenses,
                    profit: profit,
                    notes: document.getElementById('tournamentNotes').value
                };
                
                // Aggiungi il torneo all'array
                window.savedTournaments.push(tournament);
                
                // Salva nel localStorage
                localStorage.setItem('onePieceTournamentHistory', JSON.stringify(window.savedTournaments));
                
                // Aggiorna la tabella e il grafico
                updateHistoryTable();
                updateHistoryChart();
                
                // Resetta il form
                document.getElementById('tournamentName').value = '';
                document.getElementById('tournamentDate').value = '';
                document.getElementById('tournamentLocation').value = '';
                document.getElementById('historyParticipants').value = '';
                document.getElementById('historyFee').value = '';
                document.getElementById('historyExpenses').value = '';
                document.getElementById('tournamentNotes').value = '';
                
                // Mostra notifica
                const notification = document.getElementById('saveNotification');
                notification.textContent = 'Torneo salvato!';
                notification.style.display = 'block';
                notification.classList.add('slide-in-right');
                
                setTimeout(() => {
                    notification.classList.remove('slide-in-right');
                    notification.style.display = 'none';
                    notification.textContent = 'Configurazione salvata!';
                }, 3000);
            }
            
            // Funzione per aggiornare la tabella della storia
            function updateHistoryTable() {
                const tableBody = document.getElementById('historyTableBody');
                tableBody.innerHTML = '';
                
                // Ordina i tornei per data (più recenti prima)
                window.savedTournaments.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // Aggiungi righe alla tabella
                window.savedTournaments.forEach((tournament) => {
                    const row = document.createElement('tr');
                    
                    const date = new Date(tournament.date);
                    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                    
                    row.innerHTML = `
                        <td>${tournament.name}</td>
                        <td>${formattedDate}</td>
                        <td>${tournament.location}</td>
                        <td>${tournament.participants}</td>
                        <td>€${tournament.fee.toFixed(2)}</td>
                        <td>€${tournament.prizePool.toFixed(2)}</td>
                        <td class="${tournament.profit >= 0 ? 'green' : 'red'}">€${tournament.profit.toFixed(2)}</td>
                        <td>
                            <button class="small-btn" onclick="viewTournamentDetails(${tournament.id})">Dettagli</button>
                            <button class="small-btn" onclick="deleteTournament(${tournament.id})">Elimina</button>
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
                
                // Aggiorna le statistiche complessive
                updateHistoryStats();
            }
            
            // Funzione per aggiornare le statistiche complessive
            function updateHistoryStats() {
                const statsDiv = document.getElementById('historyStats');
                
                // Se non ci sono tornei, mostra un messaggio
                if (window.savedTournaments.length === 0) {
                    statsDiv.innerHTML = '<p>Nessun torneo salvato.</p>';
                    return;
                }
                
                // Calcola le statistiche complessive
                const totalTournaments = window.savedTournaments.length;
                const totalParticipants = window.savedTournaments.reduce((sum, t) => sum + t.participants, 0);
                const totalPrizePool = window.savedTournaments.reduce((sum, t) => sum + t.prizePool, 0);
                const totalProfit = window.savedTournaments.reduce((sum, t) => sum + t.profit, 0);
                const avgParticipants = totalParticipants / totalTournaments;
                const avgPrizePool = totalPrizePool / totalTournaments;
                const avgProfit = totalProfit / totalTournaments;
                
                // Trova il torneo con il maggior numero di partecipanti
                const maxParticipantsTournament = window.savedTournaments.reduce((prev, current) => 
                    (prev.participants > current.participants) ? prev : current);
                
                // Trova il torneo più redditizio
                const mostProfitableTournament = window.savedTournaments.reduce((prev, current) => 
                    (prev.profit > current.profit) ? prev : current);
                
                // Aggiorna il div delle statistiche
                statsDiv.innerHTML = `
                    <p><strong>Totale tornei:</strong> ${totalTournaments}</p>
                    <p><strong>Totale partecipanti:</strong> ${totalParticipants}</p>
                    <p><strong>Media partecipanti:</strong> ${avgParticipants.toFixed(1)}</p>
                    <p><strong>Montepremi totale:</strong> €${totalPrizePool.toFixed(2)}</p>
                    <p><strong>Profitto totale:</strong> <span class="${totalProfit >= 0 ? 'green' : 'red'}">€${totalProfit.toFixed(2)}</span></p>
                    <p><strong>Profitto medio:</strong> <span class="${avgProfit >= 0 ? 'green' : 'red'}">€${avgProfit.toFixed(2)}</span></p>
                    <p><strong>Torneo più grande:</strong> ${maxParticipantsTournament.name} (${maxParticipantsTournament.participants} partecipanti)</p>
                    <p><strong>Torneo più redditizio:</strong> ${mostProfitableTournament.name} (€${mostProfitableTournament.profit.toFixed(2)})</p>
                `;
                
                // Aggiorna il grafico storico
                updateHistoryChart();
            }
            
            // Funzione per aggiornare il grafico storico
            function updateHistoryChart() {
                const ctx = document.getElementById('historyChart').getContext('2d');
                
                // Se non ci sono tornei, non creare il grafico
                if (window.savedTournaments.length === 0) {
                    return;
                }
                
                // Ordina i tornei per data (più vecchi prima)
                const sortedTournaments = [...window.savedTournaments].sort((a, b) => new Date(a.date) - new Date(b.date));
                
                // Prepara i dati per il grafico
                const labels = [];
                const participantsData = [];
                const profitData = [];
                
                sortedTournaments.forEach(tournament => {
                    const date = new Date(tournament.date);
                    labels.push(`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().substr(2, 2)}`);
                    participantsData.push(tournament.participants);
                    profitData.push(tournament.profit);
                });
                
                // Distruggi il grafico esistente se presente
                if (historyChart) {
                    historyChart.destroy();
                }
                
                // Crea il nuovo grafico
                historyChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Partecipanti',
                                data: participantsData,
                                backgroundColor: 'rgba(46, 98, 163, 0.2)',
                                borderColor: 'rgba(46, 98, 163, 1)',
                                borderWidth: 2,
                                yAxisID: 'y',
                                tension: 0.1
                            },
                            {
                                label: 'Profitto (€)',
                                data: profitData,
                                backgroundColor: 'rgba(215, 0, 0, 0.2)',
                                borderColor: 'rgba(215, 0, 0, 1)',
                                borderWidth: 2,
                                yAxisID: 'y1',
                                tension: 0.1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                title: {
                                    display: true,
                                    text: 'Partecipanti',
                                    color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                                },
                                grid: {
                                    color: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                },
                                ticks: {
                                    color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                                }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: {
                                    display: true,
                                    text: 'Profitto (€)',
                                    color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                                },
                                grid: {
                                    drawOnChartArea: false,
                                    color: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                },
                                ticks: {
                                    color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                                }
                            },
                            x: {
                                grid: {
                                    color: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                },
                                ticks: {
                                    color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                labels: {
                                    color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                                }
                            },
                            title: {
                                display: true,
                                text: 'Andamento Storico Tornei',
                                color: document.body.classList.contains('dark-mode') ? '#e0e0e0' : '#333'
                            }
                        }
                    }
                });
            }
            
            // Funzione per visualizzare i dettagli di un torneo
            function viewTournamentDetails(tournamentId) {
                // Trova il torneo con l'ID specificato
                const tournament = window.savedTournaments.find(t => t.id === tournamentId);
                
                if (!tournament) {
                    return;
                }
                
                // Formatta la data
                const date = new Date(tournament.date);
                const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                
                // Aggiorna il div dei dettagli
                const detailsDiv = document.getElementById('tournamentDetails');
                detailsDiv.innerHTML = `
                    <h3>${tournament.name}</h3>
                    <p><strong>Data:</strong> ${formattedDate}</p>
                    <p><strong>Luogo:</strong> ${tournament.location}</p>
                    <p><strong>Partecipanti:</strong> ${tournament.participants}</p>
                    <p><strong>Quota iscrizione:</strong> €${tournament.fee.toFixed(2)}</p>
                    <p><strong>Montepremi totale:</strong> €${tournament.prizePool.toFixed(2)}</p>
                    <p><strong>Spese:</strong> €${tournament.expenses.toFixed(2)}</p>
                    <p><strong>Profitto:</strong> <span class="${tournament.profit >= 0 ? 'green' : 'red'}">€${tournament.profit.toFixed(2)}</span></p>
                    ${tournament.notes ? `<p><strong>Note:</strong> ${tournament.notes}</p>` : ''}
                `;
            }
            
            // Funzione per eliminare un torneo
            function deleteTournament(tournamentId) {
                if (!confirm('Sei sicuro di voler eliminare questo torneo?')) {
                    return;
                }
                
                // Rimuovi il torneo dall'array
                window.savedTournaments = window.savedTournaments.filter(t => t.id !== tournamentId);
                
                // Salva nel localStorage
                localStorage.setItem('onePieceTournamentHistory', JSON.stringify(window.savedTournaments));
                
                // Aggiorna la tabella e il grafico
                updateHistoryTable();
                updateHistoryChart();
                
                // Mostra notifica
                const notification = document.getElementById('saveNotification');
                notification.textContent = 'Torneo eliminato!';
                notification.style.display = 'block';
                notification.classList.add('slide-in-right');
                
                setTimeout(() => {
                    notification.classList.remove('slide-in-right');
                    notification.style.display = 'none';
                    notification.textContent = 'Configurazione salvata!';
                }, 3000);
            }
            
            // Aggiungi event listener per i pulsanti di esportazione/importazione
            document.getElementById('exportHistory').addEventListener('click', function() {
                // Crea un file JSON con i tornei salvati
                const dataStr = JSON.stringify(window.savedTournaments);
                const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                
                // Crea un link per il download
                const exportLink = document.createElement('a');
                exportLink.setAttribute('href', dataUri);
                exportLink.setAttribute('download', 'one_piece_tournament_history.json');
                exportLink.click();
            });
            
            document.getElementById('importHistory').addEventListener('click', function() {
                // Crea un input file nascosto
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json';
                
                fileInput.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        try {
                            const importedData = JSON.parse(e.target.result);
                            
                            // Verifica che i dati siano validi
                            if (Array.isArray(importedData)) {
                                // Aggiungi i tornei importati a quelli esistenti
                                window.savedTournaments = [...window.savedTournaments, ...importedData];
                                
                                // Salva nel localStorage
                                localStorage.setItem('onePieceTournamentHistory', JSON.stringify(window.savedTournaments));
                                
                                // Aggiorna la tabella e il grafico
                                updateHistoryTable();
                                updateHistoryChart();
                                
                                // Mostra notifica
                                const notification = document.getElementById('saveNotification');
                                notification.textContent = `Importati ${importedData.length} tornei!`;
                                notification.style.display = 'block';
                                notification.classList.add('slide-in-right');
                                
                                setTimeout(() => {
                                    notification.classList.remove('slide-in-right');
                                    notification.style.display = 'none';
                                    notification.textContent = 'Configurazione salvata!';
                                }, 3000);
                            } else {
                                alert('Il file importato non contiene dati validi.');
                            }
                        } catch (error) {
                            alert('Errore durante l\'importazione: ' + error.message);
                        }
                    };
                    reader.readAsText(file);
                });
                
                fileInput.click();
            });
            
            // Funzione per aggiornare le statistiche della storia
            function updateHistoryStats() {
                const statsElement = document.getElementById('historyStats');
                
                if (window.savedTournaments.length === 0) {
                    statsElement.innerHTML = '<p>Nessun torneo salvato.</p>';
                    return;
                }
                
                // Calcola le statistiche
                const totalTournaments = window.savedTournaments.length;
                const totalParticipants = window.savedTournaments.reduce((sum, t) => sum + t.participants, 0);
                const totalPrizePool = window.savedTournaments.reduce((sum, t) => sum + t.prizePool, 0);
                const totalProfit = window.savedTournaments.reduce((sum, t) => sum + t.profit, 0);
                const avgParticipants = totalParticipants / totalTournaments;
                const avgPrizePool = totalPrizePool / totalTournaments;
                const avgProfit = totalProfit / totalTournaments;
                
                // Aggiorna l'HTML
                statsElement.innerHTML = `
                    <div><strong>Tornei totali:</strong> ${totalTournaments}</div>
                    <div><strong>Partecipanti totali:</strong> ${totalParticipants}</div>
                    <div><strong>Media partecipanti:</strong> ${avgParticipants.toFixed(1)}</div>
                    <div><strong>Montepremi totale:</strong> €${totalPrizePool.toFixed(2)}</div>
                    <div><strong>Media montepremi:</strong> €${avgPrizePool.toFixed(2)}</div>
                    <div><strong>Profitto totale:</strong> <span class="${totalProfit >= 0 ? 'green' : 'red'}">€${totalProfit.toFixed(2)}</span></div>
                    <div><strong>Profitto medio:</strong> <span class="${avgProfit >= 0 ? 'green' : 'red'}">€${avgProfit.toFixed(2)}</span></div>
                `;
            }
            
            // Funzione per aggiornare il grafico della storia
            function updateHistoryChart() {
                const ctx = historyChartCanvas.getContext('2d');
                
                if (window.savedTournaments.length === 0) {
                    return;
                }
                
                // Ordina i tornei per data (più vecchi prima)
                const sortedTournaments = [...window.savedTournaments].sort((a, b) => new Date(a.date) - new Date(b.date));
                
                // Limita a massimo 10 tornei per il grafico
                const displayTournaments = sortedTournaments.slice(-10);
                
                // Prepara i dati per il grafico
                const labels = displayTournaments.map(t => t.name);
                const participantsData = displayTournaments.map(t => t.participants);
                const prizePoolData = displayTournaments.map(t => t.prizePool);
                const profitData = displayTournaments.map(t => t.profit);
                
                // Distruggi il grafico esistente se presente
                if (window.historyChart) {
                    window.historyChart.destroy();
                }
                
                // Crea il nuovo grafico
                window.historyChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Partecipanti',
                                data: participantsData,
                                borderColor: '#2E62A3',
                                backgroundColor: 'rgba(46, 98, 163, 0.1)',
                                borderWidth: 2,
                                fill: false,
                                tension: 0.1,
                                yAxisID: 'y'
                            },
                            {
                                label: 'Montepremi (€)',
                                data: prizePoolData,
                                borderColor: '#FFCD00',
                                backgroundColor: 'rgba(255, 205, 0, 0.1)',
                                borderWidth: 2,
                                fill: false,
                                tension: 0.1,
                                yAxisID: 'y1'
                            },
                            {
                                label: 'Profitto (€)',
                                data: profitData,
                                borderColor: '#D70000',
                                backgroundColor: 'rgba(215, 0, 0, 0.1)',
                                borderWidth: 2,
                                fill: false,
                                tension: 0.1,
                                yAxisID: 'y1'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                title: {
                                    display: true,
                                    text: 'Partecipanti'
                                }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: {
                                    display: true,
                                    text: 'Valore (€)'
                                },
                                grid: {
                                    drawOnChartArea: false
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const value = context.raw;
                                        if (context.dataset.label === 'Partecipanti') {
                                            return `${context.dataset.label}: ${value}`;
                                        } else {
                                            return `${context.dataset.label}: €${value.toFixed(2)}`;
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            }
            
            // Funzione per visualizzare i dettagli di un torneo
            window.viewTournamentDetails = function(id) {
                const tournament = window.savedTournaments.find(t => t.id === id);
                
                if (!tournament) {
                    return;
                }
                
                // Crea un modal per i dettagli
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.style.display = 'block';
                
                const date = new Date(tournament.date);
                const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
                        <h3>Dettagli Torneo: ${tournament.name}</h3>
                        <div class="tournament-details">
                            <p><strong>Data:</strong> ${formattedDate}</p>
                            <p><strong>Luogo:</strong> ${tournament.location || 'Non specificato'}</p>
                            <p><strong>Partecipanti:</strong> ${tournament.participants}</p>
                            <p><strong>Quota d'iscrizione:</strong> €${tournament.fee.toFixed(2)}</p>
                            <p><strong>Montepremi totale:</strong> €${tournament.prizePool.toFixed(2)}</p>
                            <p><strong>Spese:</strong> €${tournament.expenses.toFixed(2)}</p>
                            <p><strong>Profitto:</strong> <span class="${tournament.profit >= 0 ? 'green' : 'red'}">€${tournament.profit.toFixed(2)}</span></p>
                            <p><strong>Note:</strong> ${tournament.notes || 'Nessuna nota'}</p>
                        </div>
                        <div class="modal-buttons">
                            <button class="copy-btn" onclick="applyHistoryTournament(${tournament.id})">Applica alla modalità base</button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
            };
            
            // Funzione per eliminare un torneo
            window.deleteTournament = function(id) {
                if (confirm('Sei sicuro di voler eliminare questo torneo?')) {
                    window.savedTournaments = window.savedTournaments.filter(t => t.id !== id);
                    
                    // Salva nel localStorage
                    localStorage.setItem('onePieceTournamentHistory', JSON.stringify(window.savedTournaments));
                    
                    // Aggiorna la tabella e il grafico
                    updateHistoryTable();
                    updateHistoryChart();
                }
            };
            
            // Funzione per applicare un torneo storico alla modalità base
            window.applyHistoryTournament = function(id) {
                const tournament = window.savedTournaments.find(t => t.id === id);
                
                if (!tournament) {
                    return;
                }
                
                // Passa alla modalità base
                document.getElementById('basicModeBtn').click();
                
                // Applica i valori del torneo
                document.getElementById('participants').value = tournament.participants;
                document.getElementById('fee').value = tournament.fee;
                
                // Ricalcola
                calculate();
                
                // Mostra notifica
                const notification = document.getElementById('saveNotification');
                notification.textContent = 'Configurazione torneo applicata!';
                notification.style.display = 'block';
                notification.classList.add('slide-in-right');
                
                setTimeout(() => {
                    notification.classList.remove('slide-in-right');
                    notification.style.display = 'none';
                    notification.textContent = 'Configurazione salvata!';
                }, 3000);
                
                // Chiudi eventuali modal aperti
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => modal.remove());
            };
            
            // Aggiungi event listener al pulsante di salvataggio
            saveTournamentBtn.addEventListener('click', saveTournament);
        }
        
        // Funzione per validare le percentuali
        function validatePercentages() {
            const position1Percent = parseInt(document.getElementById('position1Percent').value) || 0;
            const position2Percent = parseInt(document.getElementById('position2Percent').value) || 0;
            const position3Percent = parseInt(document.getElementById('position3Percent').value) || 0;
            
            const totalPercent = position1Percent + position2Percent + position3Percent;
            const validationMessage = document.getElementById('percentValidation');
            
            if (totalPercent !== 100) {
                validationMessage.style.display = 'block';
                validationMessage.textContent = `La somma attuale è ${totalPercent}%. Deve essere 100%.`;
            } else {
                validationMessage.style.display = 'none';
            }
        }
        
        // Funzione per salvare la configurazione attuale
        function saveConfiguration() {
            const config = {
                participants: document.getElementById('participants').value,
                fee: document.getElementById('fee').value,
                boosterPrice: document.getElementById('boosterPrice').value,
                rareCards: document.getElementById('rareCards').value,
                includeParticipationBoosters: document.getElementById('includeParticipationBoosters').checked,
                showProfit: document.getElementById('showProfit').checked,
                showTargetProfit: document.getElementById('showTargetProfit').checked,
                targetProfit: document.getElementById('targetProfit').value,
                position1Percent: document.getElementById('position1Percent').value,
                position2Percent: document.getElementById('position2Percent').value,
                position3Percent: document.getElementById('position3Percent').value,
                position4Boosters: document.getElementById('position4Boosters').value,
                position5Boosters: document.getElementById('position5Boosters').value,
                position6Boosters: document.getElementById('position6Boosters').value,
                position7Boosters: document.getElementById('position7Boosters').value,
                position8Boosters: document.getElementById('position8Boosters').value,
                version: VERSION
            };
            
            localStorage.setItem('onePieceTournamentConfig', JSON.stringify(config));
            
            // Mostra notifica di salvataggio con animazione
            const notification = document.getElementById('saveNotification');
            notification.style.display = 'block';
            notification.classList.add('slide-in-right');
            
            // Nascondi la notifica dopo 3 secondi
            setTimeout(() => {
                notification.classList.remove('slide-in-right');
                notification.style.display = 'none';
            }, 3000);
            
            return config;
        }
        
        // Funzioni per la condivisione
        function openShareModal() {
            const modal = document.getElementById('shareModal');
            const shareCodeArea = document.getElementById('shareCode');
            
            // Genera il codice di condivisione
            const config = saveConfiguration();
            const shareCode = btoa(JSON.stringify(config));
            
            shareCodeArea.value = shareCode;
            modal.style.display = 'block';
        }
        
        function closeShareModal() {
            document.getElementById('shareModal').style.display = 'none';
        }
        
        function copyShareCode() {
            const shareCodeArea = document.getElementById('shareCode');
            shareCodeArea.select();
            document.execCommand('copy');
            
            // Feedback visivo
            const copyBtn = document.querySelector('.copy-btn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copiato! ✓';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }
        
        function importConfiguration() {
            const importCode = document.getElementById('importCode').value.trim();
            
            if (!importCode) {
                alert('Inserisci un codice di configurazione valido!');
                return;
            }
            
            try {
                const config = JSON.parse(atob(importCode));
                applyConfiguration(config);
                closeShareModal();
                
                // Mostra notifica
                const notification = document.getElementById('saveNotification');
                notification.textContent = 'Configurazione importata con successo!';
                notification.style.display = 'block';
                
                setTimeout(() => {
                    notification.style.display = 'none';
                    notification.textContent = 'Configurazione salvata!';
                }, 3000);
                
            } catch (e) {
                alert('Codice di configurazione non valido. Verifica e riprova.');
            }
        }
        
        // Chiudi il modal quando si clicca fuori
        window.onclick = function(event) {
            const modal = document.getElementById('shareModal');
            if (event.target === modal) {
                closeShareModal();
            }
        }
        
        // Funzione per caricare la configurazione salvata
        function loadConfiguration() {
            const savedConfig = localStorage.getItem('onePieceTournamentConfig');
            
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                
                // Verifica la versione
                if (!config.version || config.version !== VERSION) {
                    if (confirm('La configurazione salvata è di una versione precedente. Alcune impostazioni potrebbero non essere compatibili. Vuoi continuare?')) {
                        applyConfiguration(config);
                    }
                } else {
                    applyConfiguration(config);
                }
            } else {
                alert('Nessuna configurazione salvata trovata!');
            }
        }
        
        // Valori predefiniti del calcolatore
        const DEFAULT_CONFIG = {
            participants: 8,
            fee: 15,
            boosterPrice: 4.25,
            rareCards: 250,
            includeParticipationBoosters: true,
            showProfit: true,
            showTargetProfit: true,
            targetProfit: 120,
            position1Percent: 60,
            position2Percent: 30,
            position3Percent: 10,
            position4Boosters: 2,
            position5Boosters: 1,
            position6Boosters: 1,
            position7Boosters: 1,
            position8Boosters: 1,
            version: VERSION
        };
        
        // Funzione per reimpostare i valori predefiniti
        function resetToDefaults() {
            if (confirm('Sei sicuro di voler reimpostare tutti i valori ai predefiniti?')) {
                // Aggiungi animazione al pulsante
                const resetButton = document.querySelector('.reset-button');
                resetButton.classList.add('pulse');
                
                // Rimuovi l'animazione dopo che è completata
                setTimeout(() => {
                    resetButton.classList.remove('pulse');
                }, 500);
                
                applyConfiguration(DEFAULT_CONFIG);
                
                // Mostra notifica
                const notification = document.getElementById('saveNotification');
                notification.textContent = 'Valori reimpostati ai predefiniti!';
                notification.style.display = 'block';
                notification.classList.add('slide-in-right');
                
                setTimeout(() => {
                    notification.classList.remove('slide-in-right');
                    notification.style.display = 'none';
                    notification.textContent = 'Configurazione salvata!';
                }, 3000);
                
                // Aggiungi animazione alle colonne
                document.querySelectorAll('.column-base, .input-column, .prize-column, .finance-column').forEach(el => {
                    el.classList.add('fade-in');
                    setTimeout(() => {
                        el.classList.remove('fade-in');
                    }, 500);
                });
            }
        }
        
        // Funzione per applicare la configurazione caricata
        function applyConfiguration(config) {
            // Applica i valori agli input
            document.getElementById('participants').value = config.participants || DEFAULT_CONFIG.participants;
            document.getElementById('fee').value = config.fee || DEFAULT_CONFIG.fee;
            document.getElementById('boosterPrice').value = config.boosterPrice || DEFAULT_CONFIG.boosterPrice;
            document.getElementById('rareCards').value = config.rareCards || DEFAULT_CONFIG.rareCards;
            document.getElementById('includeParticipationBoosters').checked = config.includeParticipationBoosters !== undefined ? config.includeParticipationBoosters : DEFAULT_CONFIG.includeParticipationBoosters;
            document.getElementById('showProfit').checked = config.showProfit !== undefined ? config.showProfit : DEFAULT_CONFIG.showProfit;
            document.getElementById('showTargetProfit').checked = config.showTargetProfit !== undefined ? config.showTargetProfit : DEFAULT_CONFIG.showTargetProfit;
            document.getElementById('targetProfit').value = config.targetProfit || DEFAULT_CONFIG.targetProfit;
            document.getElementById('position1Percent').value = config.position1Percent || DEFAULT_CONFIG.position1Percent;
            document.getElementById('position2Percent').value = config.position2Percent || DEFAULT_CONFIG.position2Percent;
            document.getElementById('position3Percent').value = config.position3Percent || DEFAULT_CONFIG.position3Percent;
            document.getElementById('position4Boosters').value = config.position4Boosters || DEFAULT_CONFIG.position4Boosters;
            document.getElementById('position5Boosters').value = config.position5Boosters || DEFAULT_CONFIG.position5Boosters;
            document.getElementById('position6Boosters').value = config.position6Boosters || DEFAULT_CONFIG.position6Boosters;
            document.getElementById('position7Boosters').value = config.position7Boosters || DEFAULT_CONFIG.position7Boosters;
            document.getElementById('position8Boosters').value = config.position8Boosters || DEFAULT_CONFIG.position8Boosters;
            
            // Applica lo stato iniziale
            toggleProfitVisibility();
            toggleTargetProfitVisibility();
            
            // Ricalcola
            calculate();
        }
        
        // Aggiungiamo gli event listeners quando la pagina è caricata
        window.addEventListener('load', function() {
            // Imposta il tema salvato
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-mode');
                document.getElementById('themeToggle').textContent = '🌙';
            }
            
            // Event listener per il toggle del tema
            document.getElementById('themeToggle').addEventListener('click', toggleTheme);
            
            document.getElementById('showProfit').addEventListener('change', toggleProfitVisibility);
            document.getElementById('showTargetProfit').addEventListener('change', toggleTargetProfitVisibility);
            
            // Applica lo stato iniziale
            toggleProfitVisibility();
            toggleTargetProfitVisibility();
            
            // Configura il calcolo automatico
            setupAutoCalculate();
            
            // Esegui il calcolo iniziale
            calculate();
            
            // Aggiungi animazioni sequenziali agli elementi
            const header = document.querySelector('.header');
            header.classList.add('fade-in');
            
            setTimeout(() => {
                document.querySelector('.input-column').classList.add('slide-in-left');
            }, 200);
            
            setTimeout(() => {
                document.querySelector('.prize-column').classList.add('fade-in');
            }, 400);
            
            setTimeout(() => {
                document.querySelector('.finance-column').classList.add('slide-in-right');
            }, 600);
            
            // Aggiungi animazione al pulsante tema
            setTimeout(() => {
                document.getElementById('themeToggle').classList.add('pulse');
                setTimeout(() => {
                    document.getElementById('themeToggle').classList.remove('pulse');
                }, 500);
            }, 1000);
        });
        
        // Funzione per aggiungere feedback visivo ai pulsanti
        function addButtonFeedback() {
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
                button.addEventListener('click', function() {
                    this.classList.add('pulse');
                    setTimeout(() => {
                        this.classList.remove('pulse');
                    }, 500);
                });
            });
        }
        
        // Aggiungi feedback visivo ai pulsanti dopo il caricamento della pagina
        window.addEventListener('DOMContentLoaded', addButtonFeedback);
        
        function calculate() {
            // Input values
            const participants = parseInt(document.getElementById('participants').value) || 0;
            const fee = parseFloat(document.getElementById('fee').value) || 0;
            const boosterPrice = parseFloat(document.getElementById('boosterPrice').value) || 0;
            const rareCards = parseFloat(document.getElementById('rareCards').value) || 0;
            
            // Configurazione bustine extra
            const positionBoosters = [
                parseInt(document.getElementById('position4Boosters').value) || 0,
                parseInt(document.getElementById('position5Boosters').value) || 0,
                parseInt(document.getElementById('position6Boosters').value) || 0,
                parseInt(document.getElementById('position7Boosters').value) || 0,
                parseInt(document.getElementById('position8Boosters').value) || 0
            ];

            // Calcolo montepremi
            const prizePool = participants * fee;
            
            // Verifica se includere le bustine di partecipazione
            const includeParticipationBoosters = document.getElementById('includeParticipationBoosters').checked;
            
            // Calcolo bustine totali
            const participationBoosters = includeParticipationBoosters ? participants : 0;
            const extraBoosters = positionBoosters.reduce((a, b) => a + b, 0);
            const totalBoosters = participationBoosters + extraBoosters;

            // Suggerimento carte rare
            const targetProfit = parseFloat(document.getElementById('targetProfit').value) || 120;
            const actualBoosterCost = totalBoosters * boosterPrice;
            const availableForRares = prizePool - actualBoosterCost - targetProfit;
            const suggestedRare = Math.max(availableForRares, 0);
            
            // Aggiornamento del testo di suggerimento con dettaglio sulle bustine
            let boosterDetails = '';
            if (includeParticipationBoosters) {
                boosterDetails = `${participationBoosters} bustine partecipazione + ${extraBoosters} bustine premio`;
            } else {
                boosterDetails = `${extraBoosters} bustine premio`;
            }
            
            document.getElementById('rareCardsSuggestion').textContent = 
                `(suggerito: ${suggestedRare.toFixed(2)} € per ${targetProfit}€ profitto con ${totalBoosters} bustine totali [${boosterDetails}] a ${boosterPrice.toFixed(2)}€)`;

            // Calcolo costi bustine
            const participationBoostersCost = participationBoosters * boosterPrice;
            const extraBoostersCost = extraBoosters * boosterPrice;
            const totalBoostersCost = participationBoostersCost + extraBoostersCost;

            // Premi carte rare con percentuali personalizzate
            const position1Percent = parseInt(document.getElementById('position1Percent').value) || 60;
            const position2Percent = parseInt(document.getElementById('position2Percent').value) || 30;
            const position3Percent = parseInt(document.getElementById('position3Percent').value) || 10;
            
            // Verifica che la somma sia 100%
            const totalPercent = position1Percent + position2Percent + position3Percent;
            const validationMessage = document.getElementById('percentValidation');
            
            if (totalPercent !== 100) {
                validationMessage.style.display = 'block';
                validationMessage.textContent = `La somma attuale è ${totalPercent}%. Deve essere 100%.`;
            } else {
                validationMessage.style.display = 'none';
            }
            
            // Calcolo premi con percentuali corrette
            const rarePrizes = [
                rareCards * (position1Percent / 100),
                rareCards * (position2Percent / 100),
                rareCards * (position3Percent / 100)
            ];

            // Premi bustine
            const boosterPrizes = positionBoosters.map(b => b * boosterPrice);

            // Aggiornamento etichette premi
            // Aggiorna le etichette per i primi 3 posti con le percentuali personalizzate
            document.getElementById('prize1Label').textContent = `Carte rare (${position1Percent}%)`;
            document.getElementById('prize2Label').textContent = `Carte rare (${position2Percent}%)`;
            document.getElementById('prize3Label').textContent = `Carte rare (${position3Percent}%)`;
            
            // Aggiorna le etichette per i posti con bustine
            positionBoosters.forEach((b, i) => {
                document.getElementById(`prize${i+4}Label`).textContent = 
                    `${b} bustina${b !== 1 ? 'e' : ''} extra (${(b * boosterPrice).toFixed(2)}€)`;
            });

            // Aggiornamento valori tabella
            const prizes = [...rarePrizes, ...boosterPrizes];
            prizes.forEach((prize, index) => {
                document.getElementById(`prize${index + 1}`).textContent = '€' + prize.toFixed(2);
            });

            // Calcolo profitto
            const totalCost = totalBoostersCost + rareCards;
            const profit = prizePool - totalCost;
            
            // Calcolo statistiche aggiuntive
            const averageCostPerPlayer = totalCost / participants;
            const profitPercentage = (profit / prizePool) * 100;
            const prizeToFeeRatio = totalCost / prizePool;
            const totalPrizeValue = totalCost; // Valore totale dei premi (bustine + carte rare)
            const costEfficiency = totalCost > 0 ? prizePool / totalCost : 0; // Rapporto tra incassi e costi

            // Aggiornamento risultati
            document.getElementById('totalPrizePool').textContent = prizePool.toFixed(2);
            document.getElementById('revenue').textContent = '€' + prizePool.toFixed(2);
            document.getElementById('participationBoostersCost').textContent = participationBoostersCost.toFixed(2);
            document.getElementById('extraBoostersCost').textContent = extraBoostersCost.toFixed(2);
            document.getElementById('rareCardsCost').textContent = '€' + rareCards.toFixed(2);
            document.getElementById('totalCost').textContent = '€' + totalCost.toFixed(2);
            document.getElementById('totalBoostersCost').textContent = '€' + totalBoostersCost.toFixed(2);
            
            // Aggiornamento statistiche
            document.getElementById('averageCostPerPlayer').textContent = averageCostPerPlayer.toFixed(2);
            document.getElementById('profitPercentage').textContent = 
                profitPercentage.toFixed(2) + '% ' + (profitPercentage >= 0 ? '✅' : '❌');
            document.getElementById('prizeToFeeRatio').textContent = 
                (prizeToFeeRatio * 100).toFixed(2) + '% ' + (prizeToFeeRatio <= 1 ? '✅' : '⚠️');
            document.getElementById('totalPrizeValue').textContent = totalPrizeValue.toFixed(2);
            document.getElementById('costEfficiency').textContent = 
                costEfficiency.toFixed(2) + 'x ' + (costEfficiency >= 1 ? '✅' : '⚠️');
            
            // Gestione visibilità profitto/perdita
            const profitElement = document.getElementById('profit');
            const profitRow = profitElement.parentElement.parentElement;
            const showProfit = document.getElementById('showProfit').checked;
            
            profitElement.textContent = '€' + profit.toFixed(2);
            profitElement.className = profit >= 0 ? 'green' : 'red';
            profitRow.style.display = showProfit ? '' : 'none';
            
            // Aggiorna il grafico di distribuzione premi
            updatePrizeDistributionChart();
            
            // Aggiorna gli slider se sono stati modificati i campi numerici
            const position1Slider = document.getElementById('position1Slider');
            const position2Slider = document.getElementById('position2Slider');
            const position3Slider = document.getElementById('position3Slider');
            
            if (position1Slider && position1Slider.value != position1Percent) {
                position1Slider.value = position1Percent;
                document.getElementById('position1SliderValue').textContent = position1Percent;
            }
            
            if (position2Slider && position2Slider.value != position2Percent) {
                position2Slider.value = position2Percent;
                document.getElementById('position2SliderValue').textContent = position2Percent;
            }
            
            if (position3Slider && position3Slider.value != position3Percent) {
                position3Slider.value = position3Percent;
                document.getElementById('position3SliderValue').textContent = position3Percent;
            }
            
            // Aggiorna il totale percentuale
            if (document.getElementById('totalPercentage')) {
                document.getElementById('totalPercentage').textContent = totalPercent;
                document.getElementById('percentageStatus').textContent = totalPercent === 100 ? '✅' : '❌';
            }
        }
