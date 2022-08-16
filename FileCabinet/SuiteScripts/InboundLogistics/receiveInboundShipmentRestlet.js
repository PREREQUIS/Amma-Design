/**
 * receiveInboundShipmentRestlet.js
 *
 * @NScriptName Receive inbound shipment - Inbound shipment - Restlet
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define([
  "N/log",
  "./services/inboundShipmentFinder",
  "./services/inboundShipmentLoader",
  "./services/receiveInboundShipmentFinder",
  "./services/receiveInboundShipmentLoader",
  "./services/receiveInboundShipmentUpdater",
  "./services/inboundShipmentExtensions",
], /**
 * @param{log} log
 * @param{inboundShipmentFinder} inboundShipmentFinder
 * @param{inboundShipmentLoader} inboundShipmentLoader
 * @param{receiveInboundShipmentFinder} receiveInboundShipmentFinder
 * @param{receiveInboundShipmentLoader} receiveInboundShipmentLoader
 * @param{receiveInboundShipmentUpdater} receiveInboundShipmentUpdater
 * @param{inboundShipmentExtensions} inboundShipmentExtensions
 */ (
  log,
  inboundShipmentFinder,
  inboundShipmentLoader,
  receiveInboundShipmentFinder,
  receiveInboundShipmentLoader,
  receiveInboundShipmentUpdater,
  inboundShipmentExtensions
) => {
  /**
   * Receive inbound shipment is a native NetSuite record corresponding of the UI when we click on "Receive" button on an Inbound shipment page.
   * This service act as user receiving automation workflow.
   *
   * Request target the inbound shipment and all purchase order items we want to receive.
   *
   * Orchestration of the workflow steps:
   * 1. Search the inbound shipment (Like if we search in NetSuite search bar)
   * 2. Load the inbound shipment (Like if we browse an Inbound Shipment page)
   * 3. Verify Receiving possibility (Like if we check the presence of the "Receive" button on an Inbound Shipment page)
   * 4. Load the receive inbound shipment (Like if we click on the "Receive" button on an Inbound Shipment page)
   * 5. Uncheck all receiving purchase order items (Like if we click on the "Unmark All" button on a Receive inbound shipment page)
   * 6. Fulfill selected items quantity received (Like if we fulfill "Quantity to be received" field on a Receive inbound shipment page)
   * 6.1. Find the inbound shipment item id corresponding to a couple item sku / purchase order
   * 6.2. Find the receive inbound shipment item line corresponding to previous found item
   * 6.3. Fulfill the quantity to be received field of the to previous found item line
   * 7. Launch a bulk receive inbound shipment process for selected items (Like if we click on "Save" button on a Receive inbound shipment page)
   *
   * After execution a "Receive Inbound Shipment" bulk process is created and processed by NetSuite:
   * @see https://6725929-sb1.app.netsuite.com/app/accounting/bulkprocessing/bulkprocessingstatus.nl?bulkproctype=RECEIVEINBOUNDSHIPMENT
   *
   * Check assets folders for materials describing each steps.
   *
   * @example example of request
   * {
   *   "inboundShipmentNumber": "INBSHIP101",
   *   "receivingItems": [
   *       {
   *           "itemSku": "2208-08S-P07",
   *           "purchaseOrderNumber": "PO4159",
   *           "quantityReceived": 2
   *       },
   *       {
   *           "itemSku": "4060-01F-P07",
   *           "purchaseOrderNumber": "PO4159",
   *           "quantityReceived": 1
   *       }
   *   ]
   * }
   * @param {string | Object} request - The HTTP request body; request body are passed as a string when request
   *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
   *     the body must be a valid JSON)
   * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
   *     Object when request Content-Type is 'application/json' or 'application/xml'
   * @since 2015.2
   */
  const put = (request) => {
    log.audit({
      title: "Receive inbound shipment",
      details: "Receive inbound shipment starting",
    });

    log.audit({
      title: "Receive inbound shipment",
      details: request,
    });

    const inboundShipmentNumber = request.inboundShipmentNumber;

    /**
     * 1. Search the inbound shipment (Like if we search in NetSuite search bar)
     */
    const inboundShipmentId =
      inboundShipmentFinder.findInboundShipmentIdByNumber(
        inboundShipmentNumber
      );
    if (inboundShipmentId === inboundShipmentFinder.InboundShipmentIdNotFound) {
      throw new InboundShipmentNotFoundError(inboundShipmentNumber);
    }

    /**
     * 2. Load the inbound shipment (Like if we browse an Inbound Shipment page)
     */
    const inboundShipment =
      inboundShipmentLoader.loadInboundShipmentWithId(inboundShipmentId);

    /**
     * 3. Verify Receiving possibility (Like if we check the presence of the "Receive" button on an Inbound Shipment page)
     */
    const inboundShipmentSnapshot =
      inboundShipmentExtensions.getSnapshot(inboundShipment);
    if (
      inboundShipmentExtensions.canReceiveItems(inboundShipmentSnapshot) ===
      false
    ) {
      return inboundShipment;
    }

    /**
     * 4. Load the receive inbound shipment (Like if we click on the "Receive" button on an Inbound Shipment page)
     */
    const receiveInboundShipment =
      receiveInboundShipmentLoader.loadReceiveInboundShipmentWithId(
        inboundShipmentId
      );

    /**
     * 5. Uncheck all receiving purchase order items (Like if we click on the "Unmark All" button on a Receive inbound shipment page)
     */
    receiveInboundShipmentUpdater.preventAutomaticReceivingForAllItems(
      receiveInboundShipment
    );

    /**
     * 6. Fulfill selected items quantity received (Like if we fulfill "Quantity to be received" field on a Receive inbound shipment page)
     */
    for (const receivingItem of request.receivingItems) {
      log.audit({
        title: "Receive item",
        details: receivingItem,
      });

      /**
       * 6.1. Find the inbound shipment item id corresponding to a couple item sku / purchase order
       */
      const inboundShipmentItemId =
        inboundShipmentExtensions.findInboundShipmentItemId(
          inboundShipmentSnapshot,
          receivingItem.itemSku,
          receivingItem.purchaseOrderNumber
        );
      if (
        inboundShipmentItemId ===
        inboundShipmentExtensions.InboundShipmentItemIdNotFound
      )
        continue;

      /**
       * 6.2. Find the receive inbound shipment item line corresponding to previous found item
       */
      const receiveInboundShipmentItemLineNumber =
        receiveInboundShipmentFinder.findReceiveInboundShipmentItemLineNumber(
          receiveInboundShipment,
          inboundShipmentItemId
        );
      if (
        receiveInboundShipmentItemLineNumber ===
        receiveInboundShipmentFinder.ReceiveInboundShipmentLineNotFound
      )
        continue;

      /**
       * 6.3. Fulfill the quantity to be received field of the to previous found item line
       */
      receiveInboundShipmentUpdater.setReceiveInboundShipmentItemQuantityToBeReceived(
        receiveInboundShipment,
        receiveInboundShipmentItemLineNumber,
        receivingItem.quantityReceived
      );
    }

    /**
     * 7. Launch a bulk receive inbound shipment process for selected items (Like if we click on "Save" button on a Receive inbound shipment page)
     */
    receiveInboundShipment.save();

    log.audit({
      title: "Receive inbound shipment",
      details: "Receive inbound shipment ended",
    });

    log.audit({
      title: "Receive inbound shipment",
      details: receiveInboundShipment,
    });

    return receiveInboundShipment;
  };

  class InboundShipmentNotFoundError extends Error {
    constructor(inboundShipmentNumber) {
      super("Inbound shipment " + inboundShipmentNumber + " not found");
      this.name = "INBOUND_SHIPMENT_NOT_FOUND";
    }
  }

  return { put, InboundShipmentNotFoundError };
});
