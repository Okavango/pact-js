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
  timestamp
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
          headers: { 'Content-Type': "application/xml" },
          body: new XmlBuilder("1.0", "UTF-8", "ns1:projects").build(el => {
            el.setAttributes({
              id: "1234",
              "xmlns:ns1": "http://some.namespace/and/more/stuff",
            })
            el.eachLike(
              "ns1:project",
              {
                id: integer(1),
                type: "activity",
                name: string("Project 1"),
                // TODO: implement XML generators
                // due: timestamp(
                //   "yyyy-MM-dd'T'HH:mm:ss.SZ",
                //   "2016-02-11T09:46:56.023Z"
                // ),
              },
              project => {
                project.appendElement("ns1:tasks", {}, task => {
                  task.eachLike(
                    "ns1:task",
                    {
                      id: integer(1),
                      name: string("Task 1"),
                      done: boolean(true),
                    },
                    null,
                    { examples: 5 }
                  )
                })
              },
              { examples: 2 }
            )
          })
        }).willRespondWith({
          status: 200,
          headers: { "Content-Type": "application/json" },
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
              headers: { "Content-Type": "application/xml" },
              body: `<?xml version="1.0" encoding="UTF-8"?>
                <projects foo="bar">
                  <project id="1" name="Project 1" due="2016-02-11T09:46:56.023Z">
                    <tasks>
                      <task id="1" name="Do the laundry" done="true"/>
                      <task id="2" name="Do the dishes" done="false"/>
                      <task id="3" name="Do the backyard" done="false"/>
                      <task id="4" name="Do nothing" done="false"/>
                    </tasks>
                  </project>
                  <project/>
                </projects>
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
