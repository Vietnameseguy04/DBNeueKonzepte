const AWS = require("aws-sdk");

AWS.config.update({
  region: "eu-north-1"
});

module.exports = new AWS.DynamoDB.DocumentClient();