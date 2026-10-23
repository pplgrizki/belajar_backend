
import { supabase } from "./supabase-client.js";

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginMessage = document.getElementById("loginMessage");
const togglePassword = document.getElementById("togglePassword");
const googleLoginBtn = document.getElementById("googleLoginBtn");

function showMessage(message, type = "error") {
    if (!loginMessage) return;

    loginMessage.textContent = message;
    loginMessage.style.color =
        type === "success" ? "#4dffb5" : "#ff829f";
}

// Tampilkan atau sembunyikan password
if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
        const showPassword = passwordInput.type === "password";

        passwordInput.type = showPassword ? "text" : "password";
        togglePassword.setAttribute(
            "aria-label",
            showPassword ? "Sembunyikan password" : "Tampilkan password"
        );
    });
}

// Login email dan password melalui Supabase
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = usernameInput.value.trim();
        const password = passwordInput.value;
        const submitButton = loginForm.querySelector(
            'button[type="submit"]'
        );

        if (!email || !password) {
            showMessage("Email dan password wajib diisi.");
            return;
        }

        if (submitButton) submitButton.disabled = true;
        showMessage("Sedang masuk...", "success");

        try {
            const { data, error } =
                await supabase.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) {
                console.error("Login gagal:", error.message);

                showMessage(
                    error.message === "Email not confirmed"
                        ? "Email kamu belum diverifikasi. Periksa kotak masuk email."
                        : "Login gagal. Periksa email dan password kamu."
                );
                return;
            }

            if (!data.session || !data.user) {
                showMessage("Sesi login tidak ditemukan. Silakan coba lagi.");
                return;
            }

            showMessage("Login berhasil! Membuka Pixel Vault...", "success");

            // Gunakan domain website yang sedang dibuka.
            window.location.replace(
                new URL("index.html", window.location.href).href
            );
        } catch (error) {
            console.error("Kesalahan login:", error);
            showMessage(
                "Tidak dapat menghubungi Supabase. Periksa koneksi internet."
            );
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

// Login Google melalui Supabase OAuth
if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", async () => {
        googleLoginBtn.disabled = true;
        showMessage("Menghubungkan ke Google...", "success");

        try {
            const redirectTo = new URL(
                "index.html",
                window.location.href
            ).href;

            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo
                }
            });

            if (error) {
                console.error("Login Google gagal:", error.message);
                showMessage("Login Google gagal. Silakan coba lagi.");
                googleLoginBtn.disabled = false;
            }
        } catch (error) {
            console.error("Kesalahan OAuth:", error);
            showMessage("Tidak dapat menghubungkan ke Google.");
            googleLoginBtn.disabled = false;
        }
    });
}
