
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

const provider = new PactV3({
  consumer: 'ClinCheck',
  provider: 'TPData',
  dir: resolve(__dirname, 'pacts'),
  logLevel: 'DEBUG'
});
debugger
provider.given('the application was started')
.uponReceiving('Start')
.withRequest({
  method: 'GET',
  path: '/clinical-api/1.0/ajax-home'
})
.willRespondWith({
  status: 200,
  headers: { 'Content-Type': 'application/json' },
  body: {
    links: eachLike({
      href: string('https://shub-usw2.ppr.invisalign.com/clinical-api/1.0/home/doctor/rmolis'),
      rel: eachLike(string('doctor'))
    })
  }
})
.uponReceiving('Step 2')
.withRequest({
  method: 'GET',
  path: '/clinical-api/1.0/home/doctor/rmolis'
})
.willRespondWith({
  status: 200,
  headers: { 'Content-Type': 'application/json' },
  body: {
    links: eachLike({
      href: string('https://shub-usw2.ppr.invisalign.com/clinical-api/1.0/doctors/rmolis'),
      rel: eachLike(string('doctor'))
    })
  }
})

describe('TP API', () => {
  it('getProducts', async () => {
    const result = await provider.executeTest(async ({ url }) => {
      await fetch( url + '/clinical-api/1.0/ajax-home', {
        method: 'GET'
      })
      return fetch( url + '/clinical-api/1.0/home/doctor/rmolis', {
        method: 'GET'
      })
    });
    //const json = await(result.json())
    //console.log(json)
    //expect(json).to.not.be.undefined;
  });
});
