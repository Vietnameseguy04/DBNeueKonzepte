const API = "http://localhost:3000/api";

/* ---------- Helpers ---------- */

function show(id, data, isError) {
  const el = document.getElementById(id);
  el.textContent = JSON.stringify(data, null, 2);
  el.className = "output " + (isError ? "error" : "success");
  el.style.display = "";
}

function showErr(outputId, message) {
  show(outputId, { success: false, error: message }, true);
}

function val(inputId, label, outputId) {
  const v = document.getElementById(inputId).value.trim();
  if (!v) { showErr(outputId, `"${label}" darf nicht leer sein.`); return null; }
  return v;
}

async function request(path, options = {}) {
  try {
    const res = await fetch(`${API}${path}`, options);
    return res.json();
  } catch (e) {
    return { success: false, error: "Server nicht erreichbar – läuft der Backend-Server? (node server.js)" };
  }
}

async function post(path, body) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function put(path, body) {
  return request(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function del(path) {
  return request(path, { method: "DELETE" });
}

async function get(path) {
  return request(path);
}

function setIdBox(boxId, spanId, value) {
  document.getElementById(spanId).textContent = value;
  document.getElementById(boxId).style.display = "";
}

/* ---------- Users ---------- */

async function createUser() {
  const name = val("userName", "Name", "userOutput");
  if (!name) return;

  const data = await post("/users", { name });
  show("userOutput", data, !data.success);
  if (data.success) setIdBox("userIdBox", "lastUserId", data.data.UserId);
}

/* ---------- Authors ---------- */

async function createAuthor() {
  const name = val("authorName", "Name", "authorOutput");
  if (!name) return;

  const data = await post("/authors", { name });
  show("authorOutput", data, !data.success);
  if (data.success) setIdBox("authorIdBox", "lastAuthorId", data.data.AuthorId);
}

/* ---------- Books – CRUD ---------- */

async function createBook() {
  const title    = val("bookTitle",    "Titel",    "createBookOutput");
  const authorId = val("bookAuthorId", "AuthorId", "createBookOutput");
  if (!title || !authorId) return;

  const data = await post("/books", { title, authorId });
  show("createBookOutput", data, !data.success);
  if (data.success) setIdBox("bookIdBox", "lastBookId", data.data.BookId);
}

async function getBook() {
  const id = val("getBookId", "BookId", "getBookOutput");
  if (!id) return;

  const data = await get(`/books/${id}`);
  show("getBookOutput", data, !data.success);
}

async function updateBook() {
  const id    = val("updateBookId",    "BookId",     "updateBookOutput");
  const title = val("updateBookTitle", "Neuer Titel","updateBookOutput");
  if (!id || !title) return;

  const data = await put(`/books/${id}`, { title });
  show("updateBookOutput", data, !data.success);
}

async function deleteBook() {
  const id = val("deleteBookId", "BookId", "deleteBookOutput");
  if (!id) return;

  if (!confirm(`Buch "${id}" wirklich löschen?`)) return;

  const data = await del(`/books/${id}`);
  show("deleteBookOutput", data, !data.success);
}

async function loadBooks() {
  const data = await get("/books");
  const wrap = document.getElementById("bookTableWrap");

  if (!data.success) {
    wrap.innerHTML = `<p style="color:#cc3300;margin-top:8px;font-size:0.85em">${data.error}</p>`;
    return;
  }

  if (!data.data || data.data.length === 0) {
    wrap.innerHTML = "<p style='margin-top:8px;color:#888;font-size:0.85em'>Keine Bücher vorhanden.</p>";
    return;
  }

  let html = `<table style="margin-top:10px">
    <thead><tr><th>BookId</th><th>Titel</th><th>AuthorId</th><th>Status</th></tr></thead><tbody>`;
  data.data.forEach(b => {
    html += `<tr>
      <td style="font-family:monospace;font-size:0.8em">${b.BookId || "–"}</td>
      <td>${b.title || "–"}</td>
      <td style="font-family:monospace;font-size:0.8em">${b.AuthorId || "–"}</td>
      <td>${b.status || "–"}</td>
    </tr>`;
  });
  html += "</tbody></table>";
  wrap.innerHTML = html;
}

/* ---------- Loans ---------- */

async function createLoan() {
  const userId = val("loanUserId", "UserId", "loanOutput");
  const bookId = val("loanBookId", "BookId", "loanOutput");
  if (!userId || !bookId) return;

  const data = await post("/loans", { userId, bookId });
  show("loanOutput", data, !data.success);
  if (data.success) setIdBox("loanIdBox", "lastLoanId", data.data.LoanId);
}

/* ---------- 4er-Kette ---------- */

async function getChain() {
  const id = val("chainLoanId", "LoanId", "chainOutput");
  if (!id) return;

  const data = await get(`/chain/${id}`);
  show("chainOutput", data, !data.success);
}

/* ---------- Aggregation ---------- */

async function countBorrowed() {
  const data = await get("/stats/loans");
  const display = document.getElementById("statDisplay");

  if (data.success) {
    display.innerHTML = `
      <div class="stat-box">
        <div class="stat-num">${data.data.borrowedCount}</div>
        <div class="stat-label">Bücher aktuell ausgeliehen (status = "borrowed")</div>
      </div>`;
    show("statsOutput", data, false);
  } else {
    display.innerHTML = "";
    show("statsOutput", data, true);
  }
}
