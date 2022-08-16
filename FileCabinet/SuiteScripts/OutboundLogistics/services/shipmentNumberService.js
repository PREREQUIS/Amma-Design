/**
 * shipmentNumberService.js
 *
 * Used to determine the Shipment Number into External Id & Shipment Number fields, in order to spread this identifier with cross external partner.
 *
 * @NApiVersion 2.1
 */
define([
  "N/log",
  "./itemFulfillmentFinder",
  "./outboundShipmentNumberGenerator",
  "./itemFulfillmentUpdater",
], (log, finder, generator, updater) => {
  /**
   * @param {string} itemFulfillmentId
   */
  function setShipmentNumberForItemFulfillmentId(itemFulfillmentId) {
    log.audit({
      title: "setShipmentNumber",
      details:
        "Set shipment number of '" + itemFulfillmentId + "' item fulfillment",
    });

    const itemFulfillmentDescription =
      finder.getItemFulfillmentDescription(itemFulfillmentId);

    log.audit({
      title: "itemFulfillmentDescription",
      details: itemFulfillmentDescription,
    });

    const salesOrderRelatedNumbers = finder.getSalesOrderRelatedNumbers(
      itemFulfillmentDescription
    );

    log.audit({
      title: "salesOrderRelatedNumbers",
      details: salesOrderRelatedNumbers,
    });

    const shipmentNumber = generator.generateForItemFulfillmentNumber(
      itemFulfillmentDescription.number,
      salesOrderRelatedNumbers
    );

    log.audit({
      title: "shipmentNumber",
      details: shipmentNumber,
    });

    updater.setShipmentNumber(itemFulfillmentId, shipmentNumber);
  }

  return { setShipmentNumberForItemFulfillmentId };
});
