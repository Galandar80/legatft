function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function safeURL(value, fallback = '#') {
    try {
        const url = new URL(String(value || ''), window.location.href);
        if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
            return url.href;
        }
    } catch (error) {
        return fallback;
    }
    return fallback;
}

window.escapeHTML = escapeHTML;
window.safeURL = safeURL;

// Funzione per caricare il footer
document.addEventListener('DOMContentLoaded', function () {
    // Seleziona tutti gli elementi con classe include-footer
    const footerElements = document.querySelectorAll('.include-footer');

    // Per ogni elemento trovato, inserisci il contenuto del footer direttamente
    if (footerElements.length > 0) {
        const footerHTML = `
        <div class="container">
            <div class="footer-shell">
                <div class="footer-brand">
                    <a href="index.html" class="footer-mark" aria-label="Lega TFT home">
                        <img src="assets/img/tft-league-emblem.svg" alt="" class="footer-logo-img" aria-hidden="true">
                        <span>
                            <strong>Lega TFT</strong>
                            <small>Competitive Community</small>
                        </span>
                    </a>
                    <p>La community competitiva di Teamfight Tactics: tornei, ranking stagionale e campioni della Convergenza.</p>
                    <div class="footer-socials" aria-label="Canali social">
                        <a href="https://www.instagram.com/redshift_gaming/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                        <a href="https://www.facebook.com/RedShiftGaming" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                        <a href="https://discord.gg/YHej49XbHn" target="_blank" rel="noopener noreferrer" aria-label="Discord"><i class="fab fa-discord"></i></a>
                        <a href="https://chat.whatsapp.com/HcZGGvsrMIKDpEnWZot6L2" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
                    </div>
                </div>
                <nav class="footer-links" aria-label="Navigazione footer">
                    <h4>Esplora</h4>
                    <ul>
                        <li><a href="index.html">Home</a></li>
                        <li><a href="tornei.html">Tornei</a></li>
                        <li><a href="classifica.html">Ranking</a></li>
                        <li><a href="hall-of-fame.html">Hall Of Fame</a></li>
                        <li><a href="regolamento.html">Regolamento</a></li>
                        <li><a href="contatti.html">Contatti</a></li>
                    </ul>
                </nav>
                <div class="footer-links">
                    <h4>Lega</h4>
                    <ul>
                        <li><a href="premi.html">Premi</a></li>
                        <li><a href="account.html">Area Utente</a></li>
                        <li><a href="eventi.html">Eventi</a></li>
                        <li><a href="contatti.html#privacy-note">Privacy</a></li>
                    </ul>
                </div>
                <div class="footer-newsletter">
                    <h4>Resta Aggiornato</h4>
                    <p>Ricevi promemoria sui prossimi tornei, aggiornamenti ranking e novità della Lega TFT.</p>
                    <form class="newsletter-form">
                        <label for="footerEmail" class="sr-only">Email newsletter</label>
                        <input id="footerEmail" type="email" placeholder="La tua email" required>
                        <button type="submit" class="btn btn-primary">Iscriviti</button>
                    </form>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 Lega TFT Messina</p>
                <span>Teamfight Tactics community tournament hub</span>
            </div>
        </div>`;

        footerElements.forEach(function (element) {
            element.innerHTML = footerHTML;
        });
    }

    // Mobile menu logic
    const mobileMenuBtn = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('mainNav');

    if (mobileMenuBtn && navMenu) {
        const setMobileMenuOpen = (isOpen) => {
            navMenu.classList.toggle('active', isOpen);
            mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            mobileMenuBtn.setAttribute(
                'aria-label',
                isOpen ? 'Chiudi menu di navigazione' : 'Apri menu di navigazione'
            );

            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars', !isOpen);
                icon.classList.toggle('fa-times', isOpen);
            }
        };

        mobileMenuBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            setMobileMenuOpen(!navMenu.classList.contains('active'));
        });

        navMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => setMobileMenuOpen(false));
        });

        document.addEventListener('click', (event) => {
            if (!navMenu.classList.contains('active')) {
                return;
            }

            const clickedInsideMenu = navMenu.contains(event.target);
            const clickedToggle = mobileMenuBtn.contains(event.target);
            if (!clickedInsideMenu && !clickedToggle) {
                setMobileMenuOpen(false);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                setMobileMenuOpen(false);
            }
        });
    }

    // Theme toggle logic
    const themeToggleBtn = document.getElementById('themeToggle');

    // Apply saved theme on load
    const savedTheme = localStorage.getItem('darkTheme');
    if (savedTheme === 'true') {
        document.body.classList.add('dark-theme');
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            if (document.body.classList.contains('dark-theme')) {
                themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
                localStorage.setItem('darkTheme', 'true');
            } else {
                themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
                localStorage.setItem('darkTheme', 'false');
            }
        });
    }
});
