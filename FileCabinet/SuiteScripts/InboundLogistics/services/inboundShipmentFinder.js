/**
 * inboundShipmentFinder.js
 *
 * Find module on inbound shipment record.
 *
 * @NApiVersion 2.1
 * @see https://system.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2021_2/script/record/inboundshipment.html
 */
define(["N/log", "N/search"], (log, search) => {
  /**
   * @constant {string}
   */
  const InboundShipmentIdNotFound = "-1";

  /**
   * Find an inbound shipment id for a given inbound shipment number.
   *
   * @param {string} inboundShipmentNumber
   * @returns {string} inbound shipment id found or {@link InboundShipmentIdNotFound}
   */
  function findInboundShipmentIdByNumber(inboundShipmentNumber) {
    log.audit({
      title: "Inbound shipment finding",
      details: "Inbound shipment " + inboundShipmentNumber + " id finding",
    });

    const inboundShipmentIdSearch = search.create({
      type: search.Type.INBOUND_SHIPMENT,
      columns: ["internalid", "shipmentnumber"],
      filters: ["shipmentnumber", search.Operator.IS, inboundShipmentNumber],
    });

    log.audit({
      title: "Inbound shipment finding",
      details: inboundShipmentIdSearch,
    });

    const inboundShipmentIdSearchResults = inboundShipmentIdSearch
      .run()
      .getRange({
        start: 0,
        end: 1,
      });

    log.audit({
      title: "Inbound shipment finding",
      details: inboundShipmentIdSearchResults,
    });

    if (inboundShipmentIdSearchResults.length !== 1) {
      log.audit({
        title: "Inbound shipment finding",
        details: "Inbound shipment " + inboundShipmentNumber + " not found",
      });

      return InboundShipmentIdNotFound;
    }

    const inboundShipmentId = inboundShipmentIdSearchResults[0].id;

    log.audit({
      title: "Inbound shipment finding",
      details:
        "Inbound shipment " +
        inboundShipmentNumber +
        " id found: " +
        inboundShipmentId,
    });

    return inboundShipmentId;
  }

  return {
    findInboundShipmentIdByNumber,
    InboundShipmentIdNotFound,
  };
});
