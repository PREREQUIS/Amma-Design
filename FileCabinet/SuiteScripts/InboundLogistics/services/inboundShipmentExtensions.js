/**
 * inboundShipmentExtensions.js
 *
 * Inbound shipment extensions provide usefull extension capability.
 * All functions are pure, so testable without mocks.
 *
 * @NApiVersion 2.1
 * @see https://system.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2021_2/script/record/inboundshipment.html
 */
define(["N/log"], (log) => {
  /**
   * @constant {number}
   */
  const InboundShipmentItemIdNotFound = -1;

  /**
   * Provide an inbound shipment snapshot for an inbound shipment record.
   * The inbound shipment snapshot is an javascript object that can be manipulated as well as any javascript object.
   * We can access property and inspect the object content.
   *
   * @param {record} inboundShipment
   * @returns {object} inbound shipment snapshot
   */
  function getSnapshot(inboundShipment) {
    return JSON.parse(JSON.stringify(inboundShipment));
  }

  /**
   * Provide the receive possibilty on a given inbound shipment.
   * An inbound shipment can receive items when its status is partiallyReceived or inTransit.
   *
   * @param {object} inboundShipmentSnapshot
   * @returns {boolean} can receive inbound shipment
   */
  function canReceiveItems(inboundShipmentSnapshot) {
    log.audit({
      title: "Inbound shipment receiving evaluation",
      details:
        "Inbound shipment " +
        inboundShipmentSnapshot.id +
        " receiving evaluation",
    });

    const inboundShipmentStatus = inboundShipmentSnapshot.fields.shipmentstatus;

    log.audit({
      title: "Inbound shipment receiving evaluation",
      details:
        "Inbound shipment " +
        inboundShipmentSnapshot.id +
        " is in status " +
        inboundShipmentStatus,
    });

    let canReceive;
    if (
      inboundShipmentStatus !== "partiallyReceived" &&
      inboundShipmentStatus !== "inTransit"
    ) {
      canReceive = false;

      log.audit({
        title: "Inbound shipment receiving evaluation",
        details:
          "Inbound shipment " +
          inboundShipmentSnapshot.id +
          " cannot be received",
      });
    } else {
      canReceive = true;

      log.audit({
        title: "Inbound shipment receiving evaluation",
        details:
          "Inbound shipment " + inboundShipmentSnapshot.id + " can be received",
      });
    }

    return canReceive;
  }

  /**
   * Find an inbound shipment item id in a given inbound shipment snapshot.
   *
   * @param {object} inboundShipmentSnapshot
   * @param {string} itemSku
   * @param {string} purchaseOrderNumber
   * @returns {number} Inbound shipment item id or {@link InboundShipmentItemIdNotFound}
   * @see InboundShipmentItemIdNotFound
   */
  function findInboundShipmentItemId(
    inboundShipmentSnapshot,
    itemSku,
    purchaseOrderNumber
  ) {
    log.audit({
      title: "Inbound shipment item finding",
      details:
        "Find inbound shipment item for item " +
        itemSku +
        " and purchase order number " +
        purchaseOrderNumber,
    });

    const inboundShipmentItemIds = Object.values(
      inboundShipmentSnapshot.sublists.items
    )
      .filter(
        (item) =>
          item.purchaseorder_display?.toUpperCase() === "PO#" + purchaseOrderNumber.toUpperCase() &&
          item.shipmentitem_display?.toUpperCase() === itemSku.toUpperCase()
      )
      .map((item) => item.id);

    let inboundShipmentItemId;
    if (inboundShipmentItemIds.length !== 1) {
      inboundShipmentItemId = InboundShipmentItemIdNotFound;

      log.audit({
        title: "Inbound shipment item finding",
        details:
          "Inbound shipment item for item " +
          itemSku +
          " and purchase order number " +
          purchaseOrderNumber +
          " not found",
      });
    } else {
      inboundShipmentItemId = inboundShipmentItemIds[0];

      log.audit({
        title: "Inbound shipment item finding",
        details:
          "Inbound shipment item for item " +
          itemSku +
          " and purchase order number " +
          purchaseOrderNumber +
          "found: " +
          inboundShipmentItemId,
      });
    }

    return inboundShipmentItemId;
  }

  return {
    getSnapshot,
    canReceiveItems,
    findInboundShipmentItemId,
    InboundShipmentItemIdNotFound,
  };
});
