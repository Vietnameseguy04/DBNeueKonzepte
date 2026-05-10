const express = require("express");
const router = express.Router();

const c = require("../controllers/controller");

// USERS
router.post("/users", c.createUser);

// AUTHORS
router.post("/authors", c.createAuthor);

// BOOKS – vollständiges CRUD
router.get("/books", c.scanBooks);
router.post("/books", c.createBook);
router.get("/books/:id", c.getBook);
router.put("/books/:id", c.updateBook);
router.delete("/books/:id", c.deleteBook);

// LOANS
router.post("/loans", c.createLoan);

// 4ER-KETTE
router.get("/chain/:loanId", c.getChain);

// AGGREGATION
router.get("/stats/loans", c.countBorrowedBooks);

module.exports = router;
