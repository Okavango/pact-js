
const fetch = require('node-fetch');
const { resolve } = require('path');
const { MatchersV3, PactV3, XmlBuilder } = require('@pact-foundation/pact/v3');
const chai = require("chai")

const {
  string,
  eachLike,
  integer,
  boolean,
  atLeastOneLike,
  timestamp,
  regex
} = MatchersV3

const expect = chai.expect


const PACT = new PactV3({
  consumer: 'ClinCheck',
  provider: 'IDS_API',
  dir: resolve(__dirname, 'pacts')
});

PACT.given('the application was started')
  .uponReceiving('')
  .withRequest({
    method: 'GET',
    path: `/products`
  })
  .willRespondWith({
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      eligibleProducts: eachLike({
        deliverableType: string('ASSIST'),
        orderType: string('ASSIST'),
        partNumber: integer(7805),
        label: string('Invisalign Assist'),
        treatmentOption: string('ASSIST')
      })
    }
  });

describe('Eligible API', () => {
  it('getProducts', async () => {
    const result = await PACT.executeTest(async ({ url }) => {
      return fetch( url + '/products', {
        method: 'GET'
      })
    });
    const json = await(result.json())
    expect(json.eligibleProducts).to.not.be.undefined;
    expect(json.eligibleProducts.length).to.not.be.undefined;
  });
});
