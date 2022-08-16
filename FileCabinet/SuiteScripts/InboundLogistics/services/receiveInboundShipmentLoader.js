/**
 * receiveInboundShipmentLoader.js
 *
 * Load receive inbound shipment record.
 *
 * @NApiVersion 2.1
 * @see https://system.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2021_2/script/record/receiveinboundshipment.html
 */
define(["N/log", "N/record"], (log, record) => {
  /**
   * Load an receive inbound shipment record in dynamic mode for a given inbound shipment id.
   * Dynamic mode respect the NetSuite UI user flow.
   *
   * @param {string} inboundShipmentId
   * @returns {Record} inbound shipment record.
   * @throws {ReceiveInboundShipmentLoadingError} Ieceive inbound shipment loading error.
   * @see https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1524156901.html
   */
  function loadReceiveInboundShipmentWithId(inboundShipmentId) {
    let receiveInboundShipment;

    log.audit({
      title: "Receive inbound shipment loading",
      details: "Receive inbound shipment loading with id " + inboundShipmentId,
    });

    try {
      receiveInboundShipment = record.load({
        type: record.Type.RECEIVE_INBOUND_SHIPMENT,
        id: inboundShipmentId,
        isDynamic: true,
      });
    } catch (e) {
      log.error(e.type, e.message);

      throw new ReceiveInboundShipmentLoadingError(inboundShipmentId);
    }

    log.audit({
      title: "Receive inbound shipment loading",
      details: receiveInboundShipment,
    });

    return receiveInboundShipment;
  }

  class ReceiveInboundShipmentLoadingError extends Error {
    constructor(inboundShipmentId) {
      super(
        "Receive inbound shipment with id " +
          inboundShipmentId +
          " cannot be loaded"
      );
      this.name = "RECEIVE_INBOUND_SHIPMENT_LOADING_ERROR";
    }
  }

  return {
    loadReceiveInboundShipmentWithId,
    ReceiveInboundShipmentLoadingError,
  };
});
