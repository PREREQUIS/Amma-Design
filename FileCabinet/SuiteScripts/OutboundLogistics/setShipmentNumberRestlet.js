/**
 * XXX.js
 *
 * @NScriptName TODO
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(["N/log", "./services/shipmentNumberService"], (
  log,
  shipmentNumberService
) => {
  /**
   * Defines the function that is executed when a PUT request is sent to a RESTlet.
   * @param {string | Object} requestBody - The HTTP request body; request body are passed as a string when request
   *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
   *     the body must be a valid JSON)
   * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
   *     Object when request Content-Type is 'application/json' or 'application/xml'
   * @since 2015.2
   */
  function put(requestBody) {
    log.audit({
      title: "put",
      details: requestBody,
    });

    const itemFulfillmentId = requestBody.itemFulfillmentId;

    shipmentNumberService.setShipmentNumberForItemFulfillmentId(
      itemFulfillmentId
    );
  }

  return { put };
});
