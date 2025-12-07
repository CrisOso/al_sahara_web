// src/transbank.js
import pkg from 'transbank-sdk';

const {
  WebpayPlus,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
  Options,
  Environment,
} = pkg;

const commerceCode = IntegrationCommerceCodes.WEBPAY_PLUS;
const apiKey       = IntegrationApiKeys.WEBPAY;
const environment  = Environment.Integration;

const webpayTx = new WebpayPlus.Transaction(
  new Options(commerceCode, apiKey, environment)
);

export { webpayTx };