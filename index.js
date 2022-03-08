const express = require("express");
const app = express();
const axios = require("axios");
const fs = require("fs");
const util = require("util");

const PORT = 3000;

// @TODO Login to developer.paypal.com, create (or select an existing)
// developer application, and copy your client ID and secret here
const CLIENT_ID = "PASTE_YOUR_CLIENT_ID_HERE";
const SECRET = "PASTE_YOUR_SECRET_HERE";

const readFile = util.promisify(fs.readFile);

async function getAccessToken() {
  const token = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString("base64");

  const { data } = await axios({
    url: "https://api.sandbox.paypal.com/v1/oauth2/token",
    method: "post",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${token}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    data: "grant_type=client_credentials"
  });

  return data;
}

async function getClientToken(accessToken) {
  const token = Buffer.from(accessToken).toString("base64");

  const { data } = await axios({
    url: "https://api.sandbox.paypal.com/v1/identity/generate-token",
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en_US"
    }
  });

  return data;
}

async function captureOrder(orderId) {
  const token = Buffer.from(accessToken).toString("base64");

  const { data } = await axios({
    url: "https://api.sandbox.paypal.com/v1/identity/generate-token",
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en_US"
    }
  });

  return data;
}

app.get("/", async (req, res) => {
  const { access_token } = await getAccessToken();
  const { client_token } = await getClientToken(access_token);

  let html = await readFile(`${process.cwd()}/public/index.html`, "utf8");

  html = html.replace("{{CLIENT_TOKEN}}", client_token);
  html = html.replace("{{CLIENT_ID}}", CLIENT_ID);

  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(html);
  res.end();
});

app.post("/create-order", async (req, res) => {
  try {
    const { access_token } = await getAccessToken();

    // For more details on /v2/checkout/orders,
    // see https://developer.paypal.com/docs/api/orders/v2/#orders_create
    const { data } = await axios({
      url: "https://api.sandbox.paypal.com/v2/checkout/orders",
      method: "post",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`
      },
      data: {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: "1.00"
            }
          }
        ]
      }
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    throw error;
  }
});

app.post("/capture-order/:orderId", async (req, res) => {
  try {
    const { access_token } = await getAccessToken();
    const orderId = req.params.orderId;

    // For more details on /v2/checkout/orders,
    // see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
    const { data } = await axios({
      url: `https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`
      }
    });

    // https://developer.paypal.com/docs/api/orders/v2/#definition-processor_response
    res.json(data);
  } catch (error) {
    console.error(error);
    throw error;
  }
});

app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`);
});
