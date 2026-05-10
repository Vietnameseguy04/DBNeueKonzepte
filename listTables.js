const { DynamoDBClient, ListTablesCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({
  region: "eu-central-1", // Frankfurt
});

async function listTables() {
  try {
    const response = await client.send(
      new ListTablesCommand({})
    );

    console.log("Gefundene Tabellen:");
    console.log(response.TableNames);
  } catch (err) {
    console.error("Fehler:");
    console.error(err);
  }
}

listTables();