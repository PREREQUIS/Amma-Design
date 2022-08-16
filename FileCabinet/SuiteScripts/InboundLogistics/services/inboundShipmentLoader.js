/**
 * inboundShipmentLoader.js
 *
 * Load inbound shipment record.
 *
 * @NApiVersion 2.1
 * @see https://system.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2021_2/script/record/inboundshipment.html
 */
define(["N/log", "N/record"], (log, record) => {
  /**
   * Load an inbound shipment record in standard mode for a given inbound shipment id.
   *
   * @param {string} inboundShipmentId
   * @returns {Record} inbound shipment record.
   * @throws {InboundShipmentLoadingError} Inbound shipment loading error.
   * @see https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1524156901.html
   */
  function loadInboundShipmentWithId(inboundShipmentId) {
    let inboundShipment;

    log.audit({
      title: "Inbound shipment loading",
      details: "Inbound shipment loading with id " + inboundShipmentId,
    });

    try {
      inboundShipment = record.load({
        type: record.Type.INBOUND_SHIPMENT,
        id: inboundShipmentId,
        isDynamic: false,
      });
    } catch (e) {
      log.error(e.type, e.message);

      throw new InboundShipmentLoadingError(inboundShipmentId);
    }

    log.audit({
      title: "Inbound shipment loading",
      details: inboundShipment,
    });

    return inboundShipment;
  }

  class InboundShipmentLoadingError extends Error {
    constructor(inboundShipmentId) {
      super(
        "Inbound shipment with id " + inboundShipmentId + " cannot be loaded"
      );
      this.name = "INBOUND_SHIPMENT_LOADING_ERROR";
    }
  }

  return { loadInboundShipmentWithId, InboundShipmentLoadingError };
});
