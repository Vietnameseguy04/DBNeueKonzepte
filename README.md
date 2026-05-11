# DynamoDB Bibliothek – Projektdokumentation

**Autoren:** Anton Nguyen, Marieke Hekers  
**Technologien:** Node.js · Express · AWS DynamoDB · HTML/CSS/JavaScript

---

## Was macht dieses Projekt?

Dieses Projekt ist eine Bibliotheksverwaltung, die auf **Amazon DynamoDB** als Datenbank aufbaut.
Es zeigt alle grundlegenden CRUD-Operationen (Create, Read, Update, Delete) sowie
Dokumentverknüpfungen und eine Aggregation – komplett über ein Webfrontend bedienbar.

---

## Warum keine SQL-Befehle?

DynamoDB ist eine **NoSQL-Datenbank** von Amazon Web Services (AWS).
Im Gegensatz zu relationalen Datenbanken (MySQL, PostgreSQL etc.) verwendet DynamoDB
**keine SQL-Befehle**, sondern eigene API-Operationen:

| DynamoDB-Befehl  | SQL-Äquivalent                          |
|------------------|-----------------------------------------|
| `PutItem`        | `INSERT INTO ...`                       |
| `GetItem`        | `SELECT * FROM ... WHERE PK = ...`      |
| `Scan`           | `SELECT * FROM ...` (gesamte Tabelle)   |
| `UpdateItem`     | `UPDATE ... SET ...`                    |
| `DeleteItem`     | `DELETE FROM ... WHERE PK = ...`        |

Der Vorteil: DynamoDB ist extrem skalierbar, serverlos und ideal für Cloud-Anwendungen.
Der Nachteil gegenüber SQL: Kein JOIN, kein GROUP BY – komplexe Abfragen müssen
im Anwendungscode gelöst werden (wie z. B. die 4er-Kette in diesem Projekt).

---

## Voraussetzungen

Bevor das Projekt gestartet werden kann, müssen folgende Tools installiert sein:

### 1. AWS CLI installieren

Das AWS Command Line Interface wird benötigt, um sich mit der DynamoDB-Instanz zu verbinden.

- **Download:** https://aws.amazon.com/de/cli/
- Auf macOS alternativ: `brew install awscli`
- Installation prüfen: `aws --version`

### 2. AWS Zugangsdaten konfigurieren

```bash
aws configure
