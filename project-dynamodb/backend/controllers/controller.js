

/* Anton Nguyen (CRUD-Operationen und einfache Dokumentenverknüpfung) */


const dynamo = require("../db/dynamo");

const USERS = "Users";
const AUTHORS = "Authors";
const BOOKS = "Books";
const LOANS = "Loans";

const ok       = (res, data)         => res.json({ success: true, data });
const fail     = (res, e, status=500) => res.status(status).json({ success: false, error: e.message || String(e) });
const notFound = (res, msg)          => res.status(404).json({ success: false, error: msg });
const badReq   = (res, msg)          => res.status(400).json({ success: false, error: msg });

async function fetchItem(table, key) {
  const result = await dynamo.get({ TableName: table, Key: key }).promise();
  return result.Item || null;
}

/*User*/
exports.createUser = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) return badReq(res, "Feld 'name' darf nicht leer sein.");

    const item = { UserId: Date.now().toString(), name };
    await dynamo.put({ TableName: USERS, Item: item }).promise();
    ok(res, item);
  } catch (e) { fail(res, e); }
};

/*Author*/
exports.createAuthor = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    if (!name) return badReq(res, "Feld 'name' darf nicht leer sein.");

    const item = { AuthorId: Date.now().toString(), name };
    await dynamo.put({ TableName: AUTHORS, Item: item }).promise();
    ok(res, item);
  } catch (e) { fail(res, e); }
};

/*Books*/

// PutItem
exports.createBook = async (req, res) => {
  try {
    const title    = (req.body.title    || "").trim();
    const authorId = (req.body.authorId || "").trim();

    if (!title)    return badReq(res, "Feld 'title' darf nicht leer sein.");
    if (!authorId) return badReq(res, "Feld 'authorId' darf nicht leer sein.");
    //document linking ()
    const author = await fetchItem(AUTHORS, { AuthorId: authorId });
    if (!author) return notFound(res, `Autor mit AuthorId "${authorId}" existiert nicht in der Tabelle Authors.`);

    const item = { BookId: Date.now().toString(), title, AuthorId: authorId, status: "available" };
    await dynamo.put({ TableName: BOOKS, Item: item }).promise();
    ok(res, item);
  } catch (e) { fail(res, e); }
};

// GetItem
exports.getBook = async (req, res) => {
  try {
    const item = await fetchItem(BOOKS, { BookId: req.params.id });
    if (!item) return notFound(res, `Buch mit BookId "${req.params.id}" nicht gefunden.`);
    ok(res, item);
  } catch (e) { fail(res, e); }
};

exports.scanBooks = async (req, res) => {
  try {
    const result = await dynamo.scan({ TableName: BOOKS }).promise();
    ok(res, result.Items);
  } catch (e) { fail(res, e); }
};


exports.updateBook = async (req, res) => {
  try {
    const title = (req.body.title || "").trim();
    if (!title) return badReq(res, "Feld 'title' darf nicht leer sein.");

    const existing = await fetchItem(BOOKS, { BookId: req.params.id });
    if (!existing) return notFound(res, `Buch mit BookId "${req.params.id}" nicht gefunden.`);

    const result = await dynamo.update({
      TableName: BOOKS,
      Key: { BookId: req.params.id },
      UpdateExpression: "set title = :t",
      ExpressionAttributeValues: { ":t": title },
      ReturnValues: "ALL_NEW"
    }).promise();
    ok(res, result.Attributes);
  } catch (e) { fail(res, e); }
};


exports.deleteBook = async (req, res) => {
  try {
    const existing = await fetchItem(BOOKS, { BookId: req.params.id });
    if (!existing) return notFound(res, `Buch mit BookId "${req.params.id}" nicht gefunden.`);

    await dynamo.delete({ TableName: BOOKS, Key: { BookId: req.params.id } }).promise();
    ok(res, { deleted: req.params.id });
  } catch (e) { fail(res, e); }
};

/* LOANS*/
exports.createLoan = async (req, res) => {
  try {
    const userId = (req.body.userId || "").trim();
    const bookId = (req.body.bookId || "").trim();

    if (!userId) return badReq(res, "Feld 'userId' darf nicht leer sein.");
    if (!bookId) return badReq(res, "Feld 'bookId' darf nicht leer sein.");

    const user = await fetchItem(USERS, { UserId: userId });
    if (!user) return notFound(res, `Benutzer mit UserId "${userId}" existiert nicht in der Tabelle Users.`);
    //document linking ()
    const book = await fetchItem(BOOKS, { BookId: bookId });
    if (!book) return notFound(res, `Buch mit BookId "${bookId}" existiert nicht in der Tabelle Books.`);

    const item = { LoanId: Date.now().toString(), UserId: userId, BookId: bookId, status: "borrowed" };
    await dynamo.put({ TableName: LOANS, Item: item }).promise();
    ok(res, item);
  } catch (e) { fail(res, e); }
};




/* ================================================================
   4ER-KETTE Marieke Hekers
   Benutzer → Ausleihe → Buch → Autor – 4 × GetItem
   ================================================================ */
exports.getChain = async (req, res) => {
  try {
    const loan = await fetchItem(LOANS, { LoanId: req.params.loanId });
    if (!loan) return notFound(res, `Ausleihe mit LoanId "${req.params.loanId}" nicht gefunden.`);

    const book = await fetchItem(BOOKS, { BookId: loan.BookId });
    if (!book) return notFound(res, `Buch mit BookId "${loan.BookId}" nicht gefunden (Verweis in Ausleihe ungültig).`);

    const author = await fetchItem(AUTHORS, { AuthorId: book.AuthorId });
    if (!author) return notFound(res, `Autor mit AuthorId "${book.AuthorId}" nicht gefunden (Verweis in Buch ungültig).`);

    const user = await fetchItem(USERS, { UserId: loan.UserId });
    if (!user) return notFound(res, `Benutzer mit UserId "${loan.UserId}" nicht gefunden (Verweis in Ausleihe ungültig).`);

    ok(res, { user, loan, book, author });
  } catch (e) { fail(res, e); }
};

/* ================================================================
   AGGREGATION – Scan mit FilterExpression
   "status" ist reserviertes Wort → ExpressionAttributeNames nötig
   ================================================================ */
exports.countBorrowedBooks = async (req, res) => {
  try {
    const result = await dynamo.scan({
      TableName: LOANS,
      FilterExpression: "#st = :s",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: { ":s": "borrowed" }
    }).promise();

    ok(res, { borrowedCount: result.Items.length, loans: result.Items });
  } catch (e) { fail(res, e); }
};
