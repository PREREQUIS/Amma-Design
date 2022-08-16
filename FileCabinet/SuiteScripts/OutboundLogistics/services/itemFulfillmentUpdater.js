/**
 * itemFulfillmentUpdater.js
 *
 * @NApiVersion 2.1
 */
define(["N/log", "N/record"], (log, record) => {
  /**
   * Set shipment number on a given item fulfillment.
   *
   * @example
   * setShipmentNumber("548906","PL0034286-2");
   *
   * @param {string} itemFulfillmentId
   * @param {string} value
   *
   * @see {@link https://system.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2021_2/script/record/itemfulfillment.html} Item Fulfillment record catalog.
   * @see {@link https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4267283788.html} record.submitFields documentation.
   */
  function setShipmentNumber(itemFulfillmentId, value) {
    log.audit({
      title: "itemFulfillmentUpdater.setShipmentNumber",
      details:
        "Set '" + value + "' to '" + itemFulfillmentId + "' item fulfillment",
    });

    record.submitFields({
      type: record.Type.ITEM_FULFILLMENT,
      id: itemFulfillmentId,
      values: {
        externalid: value,
        custbody_shipment_number: value,
      },
      options: {
        enableSourcing: true,
        ignoreMandatoryFields: true,
      },
    });
  }

  return { setShipmentNumber };
});
