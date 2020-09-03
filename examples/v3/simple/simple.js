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

describe('IDS GetInfo', () => {

  describe('STP', () => {
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
          body: new XmlBuilder("1.0", "UTF-8", "Message").build(Message => {
            Message.setAttributes({
              type: "Request"
            })
            Message.appendElement('Head', {}, Head => {
              Head.appendElement('Client', {name: "WebClinCheck"}, Client => {
                Client.appendElement('Version', {}, regex(/.+/, "2.2.8.2"));
              })
              Head.appendElement('Server', {}, Server => {
                Server.appendElement('Name', {}, "ClinCheck");
                Server.appendElement('Version', {}, "3.0");
              })
              Head.appendElement('Authentication', {}, Authentication => {
                Authentication.appendElement('User', {}, regex(/.+/, "user_name"));
                Authentication.appendElement('Password', {}, regex(/.+/, "password"));
              });
              Head.appendElement('Token', {}, "1234567323211242144")
            });
            Message.appendElement('Body', {}, Body => {
              Body.appendElement('Call', {
                method: "getInfo",
                service: "ClinCheckRpcService"
              }, Call => {
                Call.appendElement('Param', {
                  name: regex(/exportId|mtpId/, "exportId")
                }, Param => {
                  Param.appendElement("ExportId", {}, regex(/.+/, "1234567890"));
                })
              })
            });
          })
        }).willRespondWith({
          status: 200,
          headers: { "Content-Type": "application/xml" },
          body: new XmlBuilder("1.0", "UTF-8", "Message").build(Message => {
            Message.appendElement('Head', {}, Head => {
              Head.appendElement('Server', {}, Server => {
                Server.appendElement('Name', {}, regex(/.+/, "server_name"));
                Server.appendElement('Version', {}, regex(/.+/, "server_version"));
                Server.appendElement('Timestamp', {}, regex(/.+/, "server_timestamp"));
              });
              Head.appendElement('Authentication', {}, Authentication => {
                Authentication.appendElement('User', {}, regex(/.+/, "user_name"));
                Authentication.appendElement('Password', {}, regex(/.+/, "password"));
              });
              Head.appendElement('Token', {age: regex(/\d+/, "28800")}, regex(/.+/, "user_name"));
              Head.appendElement('RefreshTokenURL', {}, regex(/.+/, "refresh_token_url"));
            });
            Message.appendElement('Body', {}, Body => {
              Body.appendElement('Result', {state:'SUCCESS'}, Result => {
                Result.eachLike("Export", {
                  id: integer(1234567)
                }, Export => {
                  Export.appendElement('Preferences', {}, Preferences => {
                    Preferences.appendElement('ToothNumberingSystem', {}, regex(/Universal|Palmer|FDI/, "Universal"))
                  });
                });
                Result.eachLike("CommentsGroup", {
                  id: integer(1234567),
                  doctorComment: regex(/true|false/, "true")
                });
                Result.appendElement("Doctor", {}, Doctor => {
                  Doctor.appendElement("ClinicianID", {}, regex(/.+/, "doctor_id"));
                  Doctor.appendElement("LastName", {}, regex(/.+/, "doctor_last_name"));
                  Doctor.appendElement("FirstName", {}, regex(/.+/, "doctor_first_name"));
                  Doctor.appendElement("SmileViewProEnabled", {}, regex(/true|false/, "true"));
                })
              })
            })
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
                  <Head>
                    <Client name="WebClinCheck">
                      <Version>2.2.8.3</Version>
                    </Client>
                    <Server>
                      <Name>ClinCheck</Name>
                      <Version>3.0</Version>
                    </Server>
                    <Authentication>
                      <User>rmolis</User>
                      <Password>token_placeholder</Password>
                    </Authentication>
                    <Token>1234567323211242144</Token>
                  </Head>
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
        console.log(await response.text());
    });
  });

});
