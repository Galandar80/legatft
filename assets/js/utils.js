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
            <div class="footer-content">
                <div class="footer-info">
                    <h3>Lega TFT</h3>
                    <p>La community ufficiale per gli appassionati di Teamfight Tactics.</p>
                </div>
                <div class="footer-links">
                    <h4>Link Rapidi</h4>
                    <ul>
                        <li><a href="index.html">Home</a></li>
                        <li><a href="tornei.html">Tornei</a></li>
                        <li><a href="classifica.html">Classifiche</a></li>
                        <li><a href="hall-of-fame.html">Hall Of Fame</a></li>
                        <li><a href="regolamento.html">Regolamento</a></li>
                        <li><a href="contatti.html">Contatti</a></li>
                    </ul>
                </div>
                <div class="footer-links">
                    <h4>Social</h4>
                    <div class="social-links">
                        <a href="https://discord.gg/YHej49XbHn" target="_blank" rel="noopener noreferrer" style="margin-right: 15px;"><i class="fab fa-discord"></i> Discord</a><br>
                        <a href="https://chat.whatsapp.com/HcZGGvsrMIKDpEnWZot6L2" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp"></i> WhatsApp</a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 Lega TFT. Tutti i diritti riservati.</p>
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
