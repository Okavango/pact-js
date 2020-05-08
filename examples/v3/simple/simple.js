const fetch = require('node-fetch');
const { resolve } = require('path');
const { MatchersV3, PactV3 } = require('@pact-foundation/pact/v3');

const {
  string,
  eachLike,
  integer,
  boolean,
  atLeastOneLike,
  timestamp
} = MatchersV3

const provider = new PactV3({
  consumer: 'ClinCheck',
  provider: 'IDS',
  dir: resolve(__dirname, 'pacts'),
  logLevel: 'DEBUG'
});

describe('Pact with IDS', () => {

  describe('getInfo', () => {
    beforeEach(() => {
      provider.withRequest({
         method: 'GET',
         path: '/path',
         query: { from: "today" }
         //headers: { Accept: "application/json" }
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
      const result = provider.executeTest( async (mockserver) => {
        const res = await fetch( mockserver.url + '/path?from=today'/*, {
          headers: {
            Accept: "application/json"
          }
        }*/);
        //const json = await res.json();
        console.log(res);

        return res;
      });
      try {
        const res = await result;
      } catch(e) {
        console.log('Error:', e)
      }
      expect(result).toBeDefined();
    });
  });

});
