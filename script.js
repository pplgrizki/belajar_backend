
import { supabase } from "./supabase-client.js";

const $ = (selector) => document.querySelector(selector);

let books = [];
let authors = [];
let currentUser = null;

// ==============================
// PESAN DAN UTILITAS
// ==============================

function showMessage(selector, text) {
    const element = $(selector);
    if (element) element.textContent = text;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// ==============================
// NAVIGASI
// ==============================

function showPage(page) {
    document.querySelectorAll(".page-section").forEach((section) => {
        section.classList.toggle("active", section.id === `${page}Page`);
    });

    document.querySelectorAll(".nav-item").forEach((button) => {
        button.classList.toggle("active", button.dataset.page === page);
    });
}

document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

$("#exploreBtn")?.addEventListener("click", () => showPage("books"));
$("#viewBooksBtn")?.addEventListener("click", () => showPage("books"));

// ==============================
// AUTENTIKASI SUPABASE
// ==============================

async function getUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
        window.location.replace("login.html");
        throw new Error("Sesi login berakhir. Silakan login kembali.");
    }

    currentUser = data.user;
    return currentUser;
}

async function getAccessToken() {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.access_token) {
        window.location.replace("login.html");
        throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
    }

    return data.session.access_token;
}

// ==============================
// FETCH KE BACKEND EXPRESS
// ==============================

async function apiRequest(endpoint, options = {}) {
    const token = await getAccessToken();

    const response = await fetch(endpoint, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
            Authorization: `Bearer ${token}`
        }
    });

    const text = await response.text();
    let result = {};

    if (text) {
        try {
            result = JSON.parse(text);
        } catch {
            result = { message: text };
        }
    }

    if (!response.ok) {
        if (response.status === 401) {
            await supabase.auth.signOut();
            window.location.replace("login.html");
        }

        throw new Error(
            result.message ||
            result.error ||
            `Permintaan gagal (${response.status})`
        );
    }

    return result;
}

// ==============================
// MEMUAT DATA
// ==============================

async function loadData() {
    await getUser();

    const [bookResult, authorResult] = await Promise.all([
        apiRequest("/api/books"),
        apiRequest("/api/authors")
    ]);

    books = Array.isArray(bookResult.data)
        ? bookResult.data
        : Array.isArray(bookResult.books)
            ? bookResult.books
            : [];

    authors = Array.isArray(authorResult.data)
        ? authorResult.data
        : Array.isArray(authorResult.authors)
            ? authorResult.authors
            : [];

    renderBooks();
    renderAuthors();
}

// ==============================
// MENAMPILKAN BUKU
// ==============================

function renderBooks() {
    if ($("#totalBooks")) {
        $("#totalBooks").textContent = books.length;
    }

    if ($("#bookList")) {
        $("#bookList").innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Judul Buku</th>
                        <th>Slug</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${books.length ? books.map((book) => `
                        <tr>
                            <td>${escapeHTML(book.id)}</td>
                            <td>${escapeHTML(book.title)}</td>
                            <td>${escapeHTML(book.slug || "—")}</td>
                            <td>
                                <button
                                    type="button"
                                    class="action-btn"
                                    data-action="edit-book"
                                    data-id="${escapeHTML(book.id)}">
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    class="action-btn delete"
                                    data-action="delete-book"
                                    data-id="${escapeHTML(book.id)}">
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    `).join("") : `
                        <tr>
                            <td colspan="4">Belum ada data buku.</td>
                        </tr>
                    `}
                </tbody>
            </table>
        `;
    }

    if ($("#recentList")) {
        $("#recentList").innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Judul Buku</th>
                        <th>Slug</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${books.length ? books.slice(0, 4).map((book) => `
                        <tr>
                            <td>${escapeHTML(book.title)}</td>
                            <td>${escapeHTML(book.slug || "—")}</td>
                            <td><span class="live-badge">ACTIVE</span></td>
                        </tr>
                    `).join("") : `
                        <tr>
                            <td colspan="3">Belum ada data buku.</td>
                        </tr>
                    `}
                </tbody>
            </table>
        `;
    }
}

// ==============================
// MENAMPILKAN PENULIS
// ==============================

function renderAuthors() {
    if ($("#totalAuthors")) {
        $("#totalAuthors").textContent = authors.length;
    }

    if ($("#authorList")) {
        $("#authorList").innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nama Penulis</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${authors.length ? authors.map((author) => `
                        <tr>
                            <td>${escapeHTML(author.id)}</td>
                            <td>${escapeHTML(author.name)}</td>
                            <td>
                                <button
                                    type="button"
                                    class="action-btn"
                                    data-action="edit-author"
                                    data-id="${escapeHTML(author.id)}">
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    class="action-btn delete"
                                    data-action="delete-author"
                                    data-id="${escapeHTML(author.id)}">
                                    Hapus
                                </button>
                            </td>
                        </tr>
                    `).join("") : `
                        <tr>
                            <td colspan="3">Belum ada data penulis.</td>
                        </tr>
                    `}
                </tbody>
            </table>
        `;
    }
}

// ==============================
// RESET FORM
// ==============================

function resetBookForm() {
    $("#bookForm")?.reset();

    if ($("#bookId")) $("#bookId").value = "";
    if ($("#bookSubmit")) $("#bookSubmit").textContent = "+ Simpan Buku";
    if ($("#cancelBookEdit")) $("#cancelBookEdit").hidden = true;

    showMessage("#bookMessage", "");
}

function resetAuthorForm() {
    $("#authorForm")?.reset();

    if ($("#authorId")) $("#authorId").value = "";
    if ($("#authorSubmit")) $("#authorSubmit").textContent = "+ Simpan Penulis";
    if ($("#cancelAuthorEdit")) $("#cancelAuthorEdit").hidden = true;

    showMessage("#authorMessage", "");
}

// ==============================
// CREATE DAN UPDATE BUKU
// ==============================

$("#bookForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = $("#bookId").value;
    const title = $("#bookTitle").value.trim();
    const slug = $("#bookSlug").value.trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

    if (!title || !slug) {
        showMessage("#bookMessage", "Judul dan slug wajib diisi.");
        return;
    }

    const duplicate = books.some((book) =>
        String(book.id) !== String(id) &&
        book.slug?.toLowerCase() === slug
    );

    if (duplicate) {
        showMessage("#bookMessage", "Slug tersebut sudah digunakan.");
        return;
    }

    const submitButton = $("#bookSubmit");
    if (submitButton) submitButton.disabled = true;

    try {
        await apiRequest(
            id
                ? `/api/books/${encodeURIComponent(id)}`
                : "/api/books",
            {
                method: id ? "PUT" : "POST",
                body: JSON.stringify({ title, slug })
            }
        );

        showMessage(
            "#bookMessage",
            id ? "Buku berhasil diperbarui!" : "Buku berhasil ditambahkan!"
        );

        resetBookForm();
        await loadData();
    } catch (error) {
        console.error("Gagal menyimpan buku:", error);
        showMessage("#bookMessage", `Gagal menyimpan buku: ${error.message}`);
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
});

// ==============================
// CREATE DAN UPDATE PENULIS
// ==============================

$("#authorForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = $("#authorId").value;
    const name = $("#authorName").value.trim();

    if (!name) {
        showMessage("#authorMessage", "Nama penulis wajib diisi.");
        return;
    }

    const submitButton = $("#authorSubmit");
    if (submitButton) submitButton.disabled = true;

    try {
        await apiRequest(
            id
                ? `/api/authors/${encodeURIComponent(id)}`
                : "/api/authors",
            {
                method: id ? "PUT" : "POST",
                body: JSON.stringify({ name })
            }
        );

        showMessage(
            "#authorMessage",
            id ? "Penulis berhasil diperbarui!" : "Penulis berhasil ditambahkan!"
        );

        resetAuthorForm();
        await loadData();
    } catch (error) {
        console.error("Gagal menyimpan penulis:", error);
        showMessage("#authorMessage", `Gagal menyimpan penulis: ${error.message}`);
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
});

// ==============================
// EDIT DAN DELETE BUKU/PENULIS
// ==============================

document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit-book") {
        const book = books.find((item) => String(item.id) === String(id));
        if (!book) return;

        showPage("books");
        $("#bookId").value = book.id;
        $("#bookTitle").value = book.title;
        $("#bookSlug").value = book.slug || "";
        $("#bookSubmit").textContent = "Simpan Perubahan";
        $("#cancelBookEdit").hidden = false;
        $("#bookTitle").focus();
        return;
    }

    if (action === "edit-author") {
        const author = authors.find((item) => String(item.id) === String(id));
        if (!author) return;

        showPage("authors");
        $("#authorId").value = author.id;
        $("#authorName").value = author.name;
        $("#authorSubmit").textContent = "Simpan Perubahan";
        $("#cancelAuthorEdit").hidden = false;
        $("#authorName").focus();
        return;
    }

    if (action === "delete-book") {
        const book = books.find((item) => String(item.id) === String(id));

        if (!book || !confirm(`Yakin hapus buku "${book.title}"?`)) return;

        button.disabled = true;

        try {
            await apiRequest(`/api/books/${encodeURIComponent(id)}`, {
                method: "DELETE"
            });

            showMessage("#bookMessage", "Buku berhasil dihapus!");
            await loadData();
        } catch (error) {
            console.error("Gagal menghapus buku:", error);
            showMessage("#bookMessage", `Gagal menghapus buku: ${error.message}`);
        } finally {
            button.disabled = false;
        }

        return;
    }

    if (action === "delete-author") {
        const author = authors.find((item) => String(item.id) === String(id));

        if (!author || !confirm(`Yakin hapus penulis "${author.name}"?`)) return;

        button.disabled = true;

        try {
            await apiRequest(`/api/authors/${encodeURIComponent(id)}`, {
                method: "DELETE"
            });

            showMessage("#authorMessage", "Penulis berhasil dihapus!");
            await loadData();
        } catch (error) {
            console.error("Gagal menghapus penulis:", error);
            showMessage("#authorMessage", `Gagal menghapus penulis: ${error.message}`);
        } finally {
            button.disabled = false;
        }
    }
});

// ==============================
// BATAL EDIT
// ==============================

$("#cancelBookEdit")?.addEventListener("click", resetBookForm);
$("#cancelAuthorEdit")?.addEventListener("click", resetAuthorForm);

// ==============================
// LOGOUT
// ==============================

$("#logoutBtn")?.addEventListener("click", async () => {
    const button = $("#logoutBtn");
    if (button) button.disabled = true;

    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        window.location.replace("login.html");
    } catch (error) {
        console.error("Logout gagal:", error);
        alert("Logout gagal: " + error.message);

        if (button) button.disabled = false;
    }
});

// ==============================
// JALANKAN DASHBOARD
// ==============================

async function startApp() {
    try {
        const user = await getUser();

        if ($("#profileUsername")) {
            $("#profileUsername").textContent =
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email ||
                "Pengguna";
        }

        await loadData();
        showPage("dashboard");
    } catch (error) {
        console.error("Dashboard gagal dimuat:", error);
    }
}

startApp();
