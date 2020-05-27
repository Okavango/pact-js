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
  provider: 'IDS',
  dir: resolve(__dirname, 'pacts'),
  logLevel: 'DEBUG'
});

describe('Pact with IDS', () => {

  describe('getInfo', () => {
    beforeEach(() => {
      provider
        .given("i have a list of projects")
        .uponReceiving("a request for projects")
        .withRequest({
          method: 'POST',
          path: '/path',
          query: { from: "today" },
          headers: {
            'Content-Type': "application/xml",
            Accept: "application/xml"
          },
          body: new XmlBuilder("1.0", "UTF-8", "Message").build(el => {
            el.setAttributes({
              type: "Request"
            })
            el.appendElement('Head', {});
            el.appendElement('Body', {}, Body => {
              Body.appendElement('Call', {
                method: "getInfo",
                service: "ClinCheckRpcService"
              }, Call => {
                Call.appendElement('Param', {
                  name: regex(/exportId|mtpId/, "exportId")
                }, Param => {
                  Param.appendElement("ExportId", {}, regex(/\d+/, "1234567890"));
                })
              })
            });
          })
        }).willRespondWith({
          status: 200,
          headers: { "Content-Type": "application/xml" },
          body: eachLike({
            id: integer(1),
            name: string("Project 1"),
            due: timestamp(
              "yyyy-MM-dd'T'HH:mm:ss.SSSX",
              "2016-02-11T09:46:56.023Z"
            ),
            tasks: atLeastOneLike(
              {
                id: integer(),
                name: string("Do the laundry"),
                done: boolean(true)
              },
              4
            )
          })
      })
    });

    it('request to IDS', async () => {
        let response;
        //try {
          const result = provider.executeTest(
            async (mockserver) => fetch( mockserver.url + '/path?from=today', {
              method: 'POST',
              headers: {
                'Content-Type': "application/xml",
                Accept: "application/xml"
              },
              body: `<?xml version="1.0" encoding="UTF-8"?>
                <Message type="Request">
                  <Head/>
                  <Body>
                    <Call method="getInfo" service="ClinCheckRpcService">
                      <Param name="exportId">
                        <ExportId>123456789</ExportId>
                      </Param>
                    </Call>
                  </Body>
                </Message>
              `
            })
          );
          response = await result;
        // } catch (e) {
        //   console.error(e);
        // }
        expect(response).to.not.be.undefined;
        expect(response.status).to.be.equal(200);
    });
  });

});
