import { supabase } from "./supabase-client.js";

const $ = (selector) => document.querySelector(selector);

let books = [];
let authors = [];
let currentUser = null;

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

// Navigasi dashboard, buku, dan penulis
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

// Pastikan pengguna sudah login
async function getUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
        window.location.replace("login.html");
        throw new Error("Sesi login berakhir. Silakan login kembali.");
    }

    currentUser = data.user;
    return currentUser;
}

// Ambil data buku dan penulis milik akun yang login
async function loadData() {
    const user = await getUser();

    const [bookResult, authorResult] = await Promise.all([
        supabase
            .from("books")
            .select("id, title, slug")
            .eq("user_id", user.id)
            .order("id", { ascending: false }),

        supabase
            .from("authors")
            .select("id, name")
            .eq("user_id", user.id)
            .order("id", { ascending: false })
    ]);

    if (bookResult.error) throw bookResult.error;
    if (authorResult.error) throw authorResult.error;

    books = bookResult.data || [];
    authors = authorResult.data || [];

    renderBooks();
    renderAuthors();
}

// Tampilkan daftar buku
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
                            <td>${book.id}</td>
                            <td>${escapeHTML(book.title)}</td>
                            <td>${escapeHTML(book.slug || "—")}</td>
                            <td>
                                <button type="button" class="action-btn"
                                    data-action="edit-book" data-id="${book.id}">
                                    Edit
                                </button>
                                <button type="button" class="action-btn delete"
                                    data-action="delete-book" data-id="${book.id}">
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

// Tampilkan daftar penulis
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
                            <td>${author.id}</td>
                            <td>${escapeHTML(author.name)}</td>
                            <td>
                                <button type="button" class="action-btn"
                                    data-action="edit-author" data-id="${author.id}">
                                    Edit
                                </button>
                                <button type="button" class="action-btn delete"
                                    data-action="delete-author" data-id="${author.id}">
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

// Reset form buku
function resetBookForm() {
    $("#bookForm")?.reset();
    $("#bookId").value = "";
    $("#bookSubmit").textContent = "+ Simpan Buku";
    $("#cancelBookEdit").hidden = true;
}

// Reset form penulis
function resetAuthorForm() {
    $("#authorForm")?.reset();
    $("#authorId").value = "";
    $("#authorSubmit").textContent = "+ Simpan Penulis";
    $("#cancelAuthorEdit").hidden = true;
}

// Tambah atau edit buku
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
        String(book.id) !== id &&
        book.slug?.toLowerCase() === slug
    );

    if (duplicate) {
        showMessage("#bookMessage", "Slug tersebut sudah digunakan.");
        return;
    }

    const submitButton = $("#bookSubmit");
    submitButton.disabled = true;

    try {
        const user = await getUser();
        let result;

        if (id) {
            result = await supabase
                .from("books")
                .update({ title, slug })
                .eq("id", Number(id))
                .eq("user_id", user.id);
        } else {
            result = await supabase
                .from("books")
                .insert({
                    title,
                    slug,
                    user_id: user.id
                });
        }

        if (result.error) throw result.error;

        showMessage("#bookMessage", id
            ? "Buku berhasil diperbarui!"
            : "Buku berhasil ditambahkan!");

        resetBookForm();
        await loadData();
    } catch (error) {
        console.error("Gagal menyimpan buku:", error);
        showMessage("#bookMessage", "Gagal menyimpan buku: " + error.message);
    } finally {
        submitButton.disabled = false;
    }
});

// Tambah atau edit penulis
$("#authorForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = $("#authorId").value;
    const name = $("#authorName").value.trim();

    if (!name) {
        showMessage("#authorMessage", "Nama penulis wajib diisi.");
        return;
    }

    const submitButton = $("#authorSubmit");
    submitButton.disabled = true;

    try {
        const user = await getUser();
        let result;

        if (id) {
            result = await supabase
                .from("authors")
                .update({ name })
                .eq("id", Number(id))
                .eq("user_id", user.id);
        } else {
            result = await supabase
                .from("authors")
                .insert({
                    name,
                    user_id: user.id
                });
        }

        if (result.error) throw result.error;

        showMessage("#authorMessage", id
            ? "Penulis berhasil diperbarui!"
            : "Penulis berhasil ditambahkan!");

        resetAuthorForm();
        await loadData();
    } catch (error) {
        console.error("Gagal menyimpan penulis:", error);
        showMessage("#authorMessage", "Gagal menyimpan penulis: " + error.message);
    } finally {
        submitButton.disabled = false;
    }
});

// Tombol edit dan hapus pada daftar
document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "edit-book") {
        const book = books.find((item) => item.id === id);
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
        const author = authors.find((item) => item.id === id);
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
        const book = books.find((item) => item.id === id);
        if (!book || !confirm(`Yakin hapus buku "${book.title}"?`)) return;

        try {
            const user = await getUser();

            const { error } = await supabase
                .from("books")
                .delete()
                .eq("id", id)
                .eq("user_id", user.id);

            if (error) throw error;

            showMessage("#bookMessage", "Buku berhasil dihapus!");
            await loadData();
        } catch (error) {
            console.error("Gagal menghapus buku:", error);
            showMessage("#bookMessage", "Gagal menghapus buku: " + error.message);
        }
        return;
    }

    if (action === "delete-author") {
        const author = authors.find((item) => item.id === id);
        if (!author || !confirm(`Yakin hapus penulis "${author.name}"?`)) return;

        try {
            const user = await getUser();

            const { error } = await supabase
                .from("authors")
                .delete()
                .eq("id", id)
                .eq("user_id", user.id);

            if (error) throw error;

            showMessage("#authorMessage", "Penulis berhasil dihapus!");
            await loadData();
        } catch (error) {
            console.error("Gagal menghapus penulis:", error);
            showMessage("#authorMessage", "Gagal menghapus penulis: " + error.message);
        }
    }
});

// Batalkan proses edit
$("#cancelBookEdit")?.addEventListener("click", resetBookForm);
$("#cancelAuthorEdit")?.addEventListener("click", resetAuthorForm);

// Logout
$("#logoutBtn")?.addEventListener("click", async () => {
    const button = $("#logoutBtn");
    button.disabled = true;

    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        window.location.replace("login.html");
    } catch (error) {
        console.error("Logout gagal:", error);
        alert("Logout gagal: " + error.message);
        button.disabled = false;
    }
});

// Jalankan dashboard
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
