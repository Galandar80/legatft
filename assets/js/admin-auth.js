(function () {
    "use strict";

    const LOGIN_PAGE = "admin-login.html";
    const DASHBOARD_PAGE = "admin-dashboard.html";
    const ADMIN_EMAILS = ["calisma@gmail.com"];

    function hasFirebaseAuth() {
        return typeof firebase !== "undefined" && typeof firebase.auth === "function";
    }

    function redirectToLogin() {
        const current = encodeURIComponent(window.location.pathname.split("/").pop() || "admin-dashboard.html");
        window.location.href = `${LOGIN_PAGE}?next=${current}`;
    }

    function nextUrl() {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get("next");
        if (requested && /^[a-z0-9._-]+\.html$/i.test(requested)) {
            return requested;
        }
        return DASHBOARD_PAGE;
    }

    function isAllowedAdminEmail(user) {
        return Boolean(user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
    }

    function isAuthorizedAdmin(user) {
        if (!user) {
            return Promise.resolve(false);
        }
        return user.getIdTokenResult(true)
            .then(result => result.claims.admin === true || isAllowedAdminEmail(user))
            .catch(() => isAllowedAdminEmail(user));
    }

    function rejectUnauthorized() {
        return firebase.auth().signOut()
            .then(() => Promise.reject(new Error("Account non autorizzato")));
    }

    window.AdminAuth = {
        requireAuth() {
            if (!hasFirebaseAuth()) {
                console.error("Firebase Auth non caricato.");
                redirectToLogin();
                return;
            }

            firebase.auth().onAuthStateChanged(user => {
                if (!user) {
                    redirectToLogin();
                    return;
                }
                isAuthorizedAdmin(user).then(isAuthorized => {
                    if (!isAuthorized) {
                        redirectToLogin();
                    }
                });
            });
        },

        login(email, password) {
            if (!hasFirebaseAuth()) {
                return Promise.reject(new Error("Firebase Auth non disponibile"));
            }
            return firebase.auth().signInWithEmailAndPassword(email, password)
                .then(cred => isAuthorizedAdmin(cred.user).then(isAuthorized => {
                    if (!isAuthorized) {
                        return rejectUnauthorized();
                    }
                    window.location.href = nextUrl();
                    return null;
                }));
        },

        loginWithGoogle() {
            if (!hasFirebaseAuth() || typeof firebase.auth.GoogleAuthProvider !== "function") {
                return Promise.reject(new Error("Google Auth non disponibile"));
            }
            const provider = new firebase.auth.GoogleAuthProvider();
            return firebase.auth().signInWithPopup(provider)
                .then(cred => isAuthorizedAdmin(cred.user).then(isAuthorized => {
                    if (!isAuthorized) {
                        return rejectUnauthorized();
                    }
                    window.location.href = nextUrl();
                    return null;
                }));
        },

        logout() {
            if (!hasFirebaseAuth()) {
                window.location.href = LOGIN_PAGE;
                return;
            }
            firebase.auth().signOut().finally(() => {
                window.location.href = LOGIN_PAGE;
            });
        }
    };
})();
