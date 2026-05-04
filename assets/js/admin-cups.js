(function () {
    "use strict";

    const REST_URL = "https://legatft-7ba5e-default-rtdb.firebaseio.com/cups.json";
    const NONE_OPTION = '<option value="">Nessuna Coppa</option>';
    const state = {
        cups: {},
        loading: false
    };

    function byId(id) {
        return document.getElementById(id);
    }

    function cupsRef() {
        if (typeof database === "undefined" || !database) return null;
        return database.ref("cups");
    }

    function cupName(cup) {
        return (cup && (cup.name || cup.nome)) || "Coppa senza nome";
    }

    function sortedEntries(cups) {
        return Object.entries(cups || {})
            .sort((a, b) => cupName(a[1]).localeCompare(cupName(b[1]), "it"));
    }

    function setSummary(count) {
        const summary = byId("coppeSummary");
        if (summary) summary.textContent = `Coppe caricate: ${count}`;
    }

    function status(message, type) {
        const list = byId("coppeList");
        if (!list) return;
        list.innerHTML = "";
        const box = document.createElement("div");
        box.className = `admin-cups-state ${type || ""}`.trim();
        box.innerHTML = message;
        list.appendChild(box);
    }

    function syncCupSelects(entries) {
        const options = entries
            .map(([id, cup]) => `<option value="${id}">${escapeHtml(cupName(cup))}</option>`)
            .join("");

        ["nuovoTorneoCoppa", "editTorneoCoppa"].forEach(id => {
            const select = byId(id);
            if (select) select.innerHTML = NONE_OPTION + options;
        });
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function render(cups) {
        state.cups = cups || {};
        const list = byId("coppeList");
        if (!list) return;

        const entries = sortedEntries(state.cups);
        syncCupSelects(entries);
        setSummary(entries.length);
        list.innerHTML = "";

        if (entries.length === 0) {
            status("Nessuna coppa creata", "empty");
            return;
        }

        entries.forEach(([id, cup]) => {
            const row = document.createElement("div");
            row.className = "admin-cup-row";
            row.dataset.cupId = id;

            const info = document.createElement("div");
            const title = document.createElement("div");
            title.className = "admin-cup-title";
            title.textContent = cupName(cup);
            info.appendChild(title);

            if (cup && cup.creatoIl) {
                const meta = document.createElement("div");
                meta.className = "admin-cup-meta";
                meta.textContent = `Creata il ${formatDate(cup.creatoIl)}`;
                info.appendChild(meta);
            }

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "admin-cup-delete";
            remove.title = "Elimina coppa";
            remove.setAttribute("aria-label", `Elimina ${cupName(cup)}`);
            remove.innerHTML = '<i class="fas fa-trash"></i>';
            remove.addEventListener("click", () => deleteCup(id));

            row.appendChild(info);
            row.appendChild(remove);
            list.appendChild(row);
        });
    }

    function formatDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString("it-IT");
    }

    function loadFromFirebaseSdk() {
        const ref = cupsRef();
        if (!ref) return Promise.reject(new Error("Database Firebase non disponibile"));
        return ref.once("value").then(snapshot => snapshot.val() || {});
    }

    function loadFromRest() {
        return fetch(`${REST_URL}?t=${Date.now()}`, { cache: "no-store" })
            .then(response => {
                if (!response.ok) throw new Error(`Firebase REST ${response.status}`);
                return response.json();
            })
            .then(data => data || {});
    }

    function load() {
        if (state.loading) return Promise.resolve(state.cups);
        state.loading = true;
        status('<i class="fas fa-spinner"></i> Caricamento coppe...', "loading");

        return loadFromFirebaseSdk()
            .catch(() => loadFromRest())
            .then(cups => {
                render(cups);
                return cups;
            })
            .catch(error => {
                setSummary(0);
                syncCupSelects([]);
                status(`Errore nel caricamento delle coppe: ${escapeHtml(error.message)}`, "error");
                return {};
            })
            .finally(() => {
                state.loading = false;
            });
    }

    function createCup() {
        const input = byId("nuovaCoppaNome");
        const name = input ? input.value.trim() : "";
        const ref = cupsRef();

        if (!name) {
            if (typeof showAlert === "function") showAlert("Inserisci un nome per la coppa", "error");
            return Promise.resolve();
        }
        if (!ref) {
            status("Database Firebase non disponibile", "error");
            return Promise.resolve();
        }

        return ref.push({ name, creatoIl: new Date().toISOString() })
            .then(() => {
                if (input) input.value = "";
                if (typeof showAlert === "function") showAlert("Coppa creata!");
                return load();
            })
            .catch(error => {
                status(`Errore creazione coppa: ${escapeHtml(error.message)}`, "error");
            });
    }

    function deleteCup(id) {
        const ref = cupsRef();
        if (!ref) {
            status("Database Firebase non disponibile", "error");
            return Promise.resolve();
        }
        if (!window.confirm("Eliminare questa coppa? I tornei associati non verranno eliminati ma non saranno più collegati.")) {
            return Promise.resolve();
        }

        return ref.child(id).remove()
            .then(() => {
                if (typeof showAlert === "function") showAlert("Coppa eliminata");
                return load();
            })
            .catch(error => {
                status(`Errore eliminazione coppa: ${escapeHtml(error.message)}`, "error");
            });
    }

    function open() {
        document.querySelectorAll(".sidebar-menu a").forEach(link => link.classList.remove("active"));
        const menu = byId("menuCoppe");
        if (menu) menu.classList.add("active");

        ["sezioneTornei", "sezioneStatistiche", "gestioneTorneo", "sezioneEventi", "sezioneHOF"].forEach(id => {
            const section = byId(id);
            if (section) section.style.display = "none";
        });

        const section = byId("sezioneCoppe");
        if (section) section.style.display = "block";
        return load();
    }

    function bind() {
        const menu = byId("menuCoppe");
        const refresh = byId("btnAggiornaCoppe");
        const create = byId("btnCreaCoppa");
        const input = byId("nuovaCoppaNome");

        if (menu) {
            menu.onclick = event => {
                event.preventDefault();
                open();
            };
        }
        if (refresh) {
            refresh.onclick = event => {
                event.preventDefault();
                load();
            };
        }
        if (create) {
            create.onclick = event => {
                event.preventDefault();
                createCup();
            };
        }
        if (input) {
            input.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    createCup();
                }
            });
        }

        load();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bind);
    } else {
        bind();
    }

    window.AdminCupsManager = {
        open,
        load,
        render,
        create: createCup,
        delete: deleteCup
    };
})();
