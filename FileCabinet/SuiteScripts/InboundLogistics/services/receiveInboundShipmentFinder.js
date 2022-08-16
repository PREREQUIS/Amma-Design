/**
 * receiveinboundShipmentFinder.js
 *
 * Find module on receive inbound shipment record.
 *
 * @NApiVersion 2.1
 * @see https://system.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2021_2/script/record/receiveinboundshipment.html
 */
define(["N/log"], (log) => {
  /**
   * @constant {number}
   */
  const ReceiveInboundShipmentLineNotFound = -1;

  /**
   * Find a receive inbound shipment item line number in a given receive inbound shipment record corresponding to a given inbound shipment item id.
   *
   * @param {Record} receiveInboundShipment
   * @param {number} inboundShipmentItemId
   * @returns {number} receiving item line number or {@link ReceiveInboundShipmentLineNotFound}
   * @see ReceiveInboundShipmentLineNotFound
   */
  function findReceiveInboundShipmentItemLineNumber(
    receiveInboundShipment,
    inboundShipmentItemId
  ) {
    log.audit({
      title: "Receive inbound shipment item line finding",
      details: "Receiving of item " + inboundShipmentItemId + " line finding",
    });

    const receivingItemLineNumber =
      receiveInboundShipment.findSublistLineWithValue({
        sublistId: "receiveitems",
        fieldId: "id",
        value: inboundShipmentItemId,
      });

    if (receivingItemLineNumber === ReceiveInboundShipmentLineNotFound) {
      log.audit({
        title: "Receive inbound shipment item line",
        details:
          "Receiving of item " + inboundShipmentItemId + " line not found",
      });
    } else {
      log.audit({
        title: "Receive inbound shipment item line",
        details:
          "Receiving of item " +
          inboundShipmentItemId +
          " line " +
          receivingItemLineNumber +
          " found",
      });
    }

    return receivingItemLineNumber;
  }

  return {
    findReceiveInboundShipmentItemLineNumber,
    ReceiveInboundShipmentLineNotFound,
  };
});
