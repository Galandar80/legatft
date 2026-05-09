(function () {
    "use strict";

    const html = window.escapeHTML || (value => String(value ?? ''));

    function hasAuth() {
        return typeof auth !== 'undefined' && auth;
    }

    function hasDatabase() {
        return typeof database !== 'undefined' && database;
    }

    function nextUrl() {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get('next');
        if (requested && /^[a-z0-9._-]+\.html$/i.test(requested)) {
            return requested;
        }
        return 'tornei.html';
    }

    function fallbackNickname(user) {
        return user.displayName || (user.email ? user.email.split('@')[0] : 'Giocatore');
    }

    function fullNameFromProfile(profile) {
        return [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    }

    function displayNameFromProfile(profile, user) {
        return profile.nickname || fullNameFromProfile(profile) || fallbackNickname(user);
    }

    function profileFromUser(user, data = {}) {
        const firstName = String(data.firstName || '').trim();
        const lastName = String(data.lastName || '').trim();
        const nickname = String(data.nickname || data.displayName || fallbackNickname(user)).trim();
        const riotId = String(data.riotId || '').trim();
        const profile = {
            firstName,
            lastName,
            nickname,
            riotId,
            displayName: nickname || [firstName, lastName].filter(Boolean).join(' ') || fallbackNickname(user),
            email: user.email || '',
            updatedAt: new Date().toISOString()
        };
        if (data.createdAt) profile.createdAt = data.createdAt;
        return profile;
    }

    async function saveUserProfile(user, data = {}) {
        if (!user || !hasDatabase()) return null;
        const ref = database.ref(`users/${user.uid}`);
        const snapshot = await ref.once('value');
        const existing = snapshot.val() || {};
        const profile = profileFromUser(user, { ...existing, ...data });
        if (!snapshot.exists()) {
            profile.createdAt = new Date().toISOString();
        }
        await ref.update(profile);
        if (profile.displayName && user.updateProfile) {
            await user.updateProfile({ displayName: profile.displayName });
        }
        return profile;
    }

    async function ensureUserProfile(user, data = {}) {
        if (!user || !hasDatabase()) return null;
        const snapshot = await database.ref(`users/${user.uid}`).once('value');
        if (snapshot.exists() && Object.keys(data).length === 0) {
            return snapshot.val();
        }
        return saveUserProfile(user, data);
    }

    async function getCurrentProfile() {
        const user = hasAuth() ? auth.currentUser : null;
        if (!user) return null;
        if (!hasDatabase()) return profileFromUser(user);
        const snapshot = await database.ref(`users/${user.uid}`).once('value');
        return snapshot.val() || profileFromUser(user);
    }

    function renderAuthStatus(containerId = 'userAuthStatus') {
        const container = document.getElementById(containerId);
        if (!container || !hasAuth()) return;

        auth.onAuthStateChanged(async user => {
            if (!user) {
                container.innerHTML = `
                    <a href="account.html?next=${encodeURIComponent(window.location.pathname.split('/').pop() || 'tornei.html')}" class="btn btn-secondary">
                        Accedi o registrati
                    </a>`;
                return;
            }

            const profile = await ensureUserProfile(user);
            container.innerHTML = `
                <span class="user-auth-name"><i class="fas fa-user-circle"></i> ${html(displayNameFromProfile(profile || {}, user))}</span>
                <a href="account.html" class="btn btn-secondary">Profilo</a>
                <button type="button" class="btn btn-secondary" id="logoutUserButton">Esci</button>`;

            const logoutButton = document.getElementById('logoutUserButton');
            if (logoutButton) {
                logoutButton.addEventListener('click', () => auth.signOut());
            }
        });
    }

    function setupAccountPage() {
        const form = document.getElementById('accountForm');
        if (!form || !hasAuth()) return;

        const message = document.getElementById('accountMessage');
        const profileMessage = document.getElementById('profileMessage');
        const modeInput = document.getElementById('accountMode');
        const title = document.getElementById('accountTitle');
        const profileFields = document.getElementById('profileFields');
        const toggleMode = document.getElementById('toggleAccountMode');
        const googleLoginButton = document.getElementById('googleLoginButton');
        const profileEditor = document.getElementById('profileEditor');
        const profileForm = document.getElementById('profileForm');
        const logoutButton = document.getElementById('accountLogoutButton');

        function setMessage(target, text, type = 'info') {
            if (!target) return;
            target.className = `auth-message ${type}`;
            target.textContent = text;
        }

        function setMode(mode) {
            modeInput.value = mode;
            const isRegister = mode === 'register';
            title.textContent = isRegister ? 'Crea account' : 'Accedi';
            profileFields.style.display = isRegister ? 'block' : 'none';
            document.getElementById('firstName').required = isRegister;
            document.getElementById('lastName').required = isRegister;
            document.getElementById('nickname').required = isRegister;
            document.getElementById('riotId').required = isRegister;
            form.querySelector('button[type="submit"]').textContent = isRegister ? 'Registrati' : 'Accedi';
            toggleMode.textContent = isRegister ? 'Hai gia un account? Accedi' : 'Non hai un account? Registrati';
            setMessage(message, '');
        }

        function fillProfileForm(profile) {
            document.getElementById('profileFirstName').value = profile.firstName || '';
            document.getElementById('profileLastName').value = profile.lastName || '';
            document.getElementById('profileNickname').value = profile.nickname || profile.displayName || '';
            document.getElementById('profileRiotId').value = profile.riotId || '';
        }

        function showLoggedIn(profile) {
            form.style.display = 'none';
            profileEditor.style.display = 'block';
            title.textContent = 'Area utente';
            fillProfileForm(profile);
        }

        function showLoggedOut() {
            form.style.display = 'grid';
            profileEditor.style.display = 'none';
            setMode(modeInput.value || 'login');
        }

        toggleMode.addEventListener('click', () => {
            setMode(modeInput.value === 'register' ? 'login' : 'register');
        });

        form.addEventListener('submit', event => {
            event.preventDefault();
            const mode = modeInput.value;
            const profileData = {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                nickname: document.getElementById('nickname').value.trim(),
                riotId: document.getElementById('riotId').value.trim()
            };
            const email = document.getElementById('accountEmail').value.trim();
            const password = document.getElementById('accountPassword').value;

            setMessage(message, 'Operazione in corso...');

            const operation = mode === 'register'
                ? auth.createUserWithEmailAndPassword(email, password)
                : auth.signInWithEmailAndPassword(email, password);

            operation
                .then(cred => mode === 'register' ? saveUserProfile(cred.user, profileData) : ensureUserProfile(cred.user))
                .then(() => {
                    window.location.href = nextUrl();
                })
                .catch(error => {
                    setMessage(message, error.message || 'Operazione non riuscita.', 'error');
                });
        });

        if (googleLoginButton) {
            googleLoginButton.addEventListener('click', () => {
                if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth.GoogleAuthProvider) {
                    setMessage(message, 'Accesso Google non disponibile.', 'error');
                    return;
                }

                setMessage(message, 'Accesso con Google in corso...');
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithPopup(provider)
                    .then(cred => ensureUserProfile(cred.user))
                    .then(() => {
                        window.location.href = nextUrl();
                    })
                    .catch(error => {
                        setMessage(message, error.message || 'Accesso Google non riuscito.', 'error');
                    });
            });
        }

        if (profileForm) {
            profileForm.addEventListener('submit', event => {
                event.preventDefault();
                const user = auth.currentUser;
                if (!user) return;
                setMessage(profileMessage, 'Salvataggio in corso...');
                saveUserProfile(user, {
                    firstName: document.getElementById('profileFirstName').value.trim(),
                    lastName: document.getElementById('profileLastName').value.trim(),
                    nickname: document.getElementById('profileNickname').value.trim(),
                    riotId: document.getElementById('profileRiotId').value.trim()
                })
                    .then(profile => {
                        fillProfileForm(profile);
                        setMessage(profileMessage, 'Dati aggiornati.');
                    })
                    .catch(error => {
                        setMessage(profileMessage, error.message || 'Salvataggio non riuscito.', 'error');
                    });
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', () => auth.signOut());
        }

        auth.onAuthStateChanged(user => {
            if (!user) {
                showLoggedOut();
                return;
            }
            ensureUserProfile(user)
                .then(profile => showLoggedIn(profile || profileFromUser(user)))
                .catch(error => setMessage(profileMessage, error.message || 'Profilo non disponibile.', 'error'));
        });

        setMode('login');
    }

    async function signupToTournament(torneoId) {
        if (!hasAuth() || !auth.currentUser) {
            throw new Error('Devi accedere o registrarti prima di iscriverti.');
        }
        if (!hasDatabase()) {
            throw new Error('Database non disponibile.');
        }

        const user = auth.currentUser;
        const profile = await ensureUserProfile(user);

        await database.ref(`iscrizioni/${torneoId}/${user.uid}`).set({
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            nickname: profile.nickname || profile.displayName || fallbackNickname(user),
            riotId: profile.riotId || '',
            displayName: displayNameFromProfile(profile, user),
            email: user.email || '',
            status: 'confirmed',
            createdAt: new Date().toISOString()
        });
    }

    async function unsubscribeFromTournament(torneoId) {
        if (!hasAuth() || !auth.currentUser) {
            throw new Error('Devi accedere per disiscriverti.');
        }
        if (!hasDatabase()) {
            throw new Error('Database non disponibile.');
        }
        await database.ref(`iscrizioni/${torneoId}/${auth.currentUser.uid}`).remove();
    }

    window.UserAuth = {
        currentUser: () => hasAuth() ? auth.currentUser : null,
        ensureUserProfile,
        getCurrentProfile,
        renderAuthStatus,
        saveUserProfile,
        setupAccountPage,
        signupToTournament,
        unsubscribeFromTournament
    };
})();
