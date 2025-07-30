import type { PopulationBuilder, ScenarioBuilder } from "@gatling.io/core";
import {
  atOnceUsers,
  csv,
  feed,
  getParameter,
  global,
  rampUsers,
  regex,
  scenario,
  simulation
} from "@gatling.io/core";
import { http, status } from "@gatling.io/http";

const backendUrl = "http://localhost:4004";
const metadataUrls = {
  admin: "/odata/v4/admin/$metadata",
  catalog: "/odata/v4/catalog/$metadata"
};
export default simulation((setUp) => {
  // Load credentials from CSV
  const credentialsFeeder = csv("credentials.csv").circular();
  // Load VU count from system properties. Reference: https://docs.gatling.io/guides/passing-parameters/
  const vu = parseInt(getParameter("vu", "10"));
  // Define HTTP configuration. Reference: https://docs.gatling.io/reference/script/protocols/http/protocol/
  const httpProtocol = http
    .baseUrl(backendUrl)
    .basicAuth("#{username}", "#{password}")
    .userAgentHeader(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
    );
  function metadataScenarioBuilder(locale: string): ScenarioBuilder {
    // Define scenario. Reference: https://docs.gatling.io/reference/script/core/scenario/
    return scenario(`get $metadata (${locale})`)
      .exec(feed(credentialsFeeder))
      .exec(
        http(`get 'admin' metadata (${locale})`)
          .get(metadataUrls.admin)
          .check(status().in(200, 304), regex(`Namespace="AdminService"`))
      )
      .exec(
        http(`get 'catalog' metadata (${locale})`)
          .get(metadataUrls.catalog)
          .check(status().in(200, 304), regex(`Namespace="CatalogService"`))
      );
  }

  function populationBuilder(scenarioBuilder: ScenarioBuilder, locale = "en"): PopulationBuilder {
    return scenarioBuilder
      .injectOpen(
        atOnceUsers(vu), // Start with a number of users as specified by 'vu' parameter
        rampUsers(100).during({ amount: 30, unit: "seconds" }) // Ramp up users over time period specified by 'amount' and 'unit'
      )
      .protocols(httpProtocol.acceptLanguageHeader(locale));
  }

  // Define assertions. Reference: https://docs.gatling.io/reference/script/core/assertions/
  const assertion = global().failedRequests().count().lt(1.0);

  function sequentialLocaleInjection(locales: string[]): PopulationBuilder {
    let population = scenario("warm up by sending $metadata requests")
      .exec(feed(credentialsFeeder))
      .exec(
        http(`warm up - get 'admin' metadata`)
          .get(metadataUrls.admin)
          .check(status().in(200, 304), regex(`Namespace="AdminService"`))
      )
      .exec(
        http(`warm up - get 'catalog' metadata`)
          .get(metadataUrls.catalog)
          .check(status().in(200, 304), regex(`Namespace="CatalogService"`))
      )
      .injectOpen(atOnceUsers(1))
      .protocols(httpProtocol.acceptLanguageHeader("en;q=0.9"));
    for (let i = 0; i < locales.length; i++) {
      population = population.andThen(
        populationBuilder(metadataScenarioBuilder(locales[i]), locales[i])
      );
    }

    return population;
  }

  const locales = [...Array(1).keys()]
    .map((i) => ["de", "en", "fr", "it"].map((locale) => `${locale};q=0.9${i}`))
    .flat();
  // Define injection profile and execute the test. Reference: https://docs.gatling.io/reference/script/core/injection/
  setUp(sequentialLocaleInjection(locales)).assertions(assertion);
});
