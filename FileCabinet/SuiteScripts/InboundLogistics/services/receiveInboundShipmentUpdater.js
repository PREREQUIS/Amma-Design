/**
 * receiveInboundShipmentUpdater.js
 *
 * Receive inbound shipment record update module.
 *
 * @NApiVersion 2.1
 * @see https://system.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2021_2/script/record/receiveinboundshipment.html
 */
define(["N/log"], (log) => {
  const ReceiveItemsListName = "receiveitems";
  const ReceiveCheckbox = "receiveitem";

  /**
   * Prevent automatic receiving for all items.
   *
   * By default, when the receiving is loaded in the UI, all lines have the "Receive" checkbox checked
   * with the "Quantity to be received" fulfilled with the maximum quantity letting to be received.
   *
   * To prevent automatic receiving for all items, we uncheck all "Receive" checkbox, like if use the button "Unmark All" in the UI.
   *
   * Unchecking of "Receive" checkbox put the "Quantity to be received" empty.
   *
   * When all "Receive" checkbox are unchecked during saving, no receiving bulk process will be triggered.
   *
   * @param {record} receiveInboundShipment
   * @return {void}
   */
  function preventAutomaticReceivingForAllItems(receiveInboundShipment) {
    const receiveItemCount = receiveInboundShipment.getLineCount({
      sublistId: ReceiveItemsListName,
    });

    log.audit({
      title: "Receive inbound shipment item count",
      details: receiveItemCount,
    });

    for (let i = 0; i < receiveItemCount; i++) {
      receiveInboundShipment.selectLine({
        sublistId: ReceiveItemsListName,
        line: i,
      });

      receiveInboundShipment.setCurrentSublistValue({
        sublistId: ReceiveItemsListName,
        fieldId: ReceiveCheckbox,
        value: false,
      });

      receiveInboundShipment.commitLine({
        sublistId: ReceiveItemsListName,
      });
    }
  }

  /**
   * Fulfill the "quantity to be received" field on a given receive inbound shipment item line
   *
   * For a receive inbound shipment record is in dynamic mode:
   * - The "receive" checkbox is checked when a quantity is set.
   * - An INVALID_FLD_VALUE error is throwed when a quantity <= 0 is set.
   *   This is checked by a guard to prevent error throwing.
   *
   * @param {record} receiveInboundShipment
   * @param {number} receivingItemLineNumber
   * @param {number} quantityReceived
   * @returns {void}
   */
  function setReceiveInboundShipmentItemQuantityToBeReceived(
    receiveInboundShipment,
    receivingItemLineNumber,
    quantityReceived
  ) {
    log.audit({
      title: "Receive item quantity",
      details:
        "Set quantity to be received " +
        quantityReceived +
        " on line " +
        receivingItemLineNumber,
    });

    if (quantityReceived <= 0) {
      log.audit({
        title: "Receive item quantity",
        details:
          "Cannot received quantity " +
          quantityReceived +
          " on line " +
          receivingItemLineNumber,
      });

      return;
    }

    receiveInboundShipment.selectLine({
      sublistId: "receiveitems",
      line: receivingItemLineNumber,
    });

    receiveInboundShipment.setCurrentSublistValue({
      sublistId: "receiveitems",
      fieldId: "quantitytobereceived",
      value: quantityReceived,
    });

    receiveInboundShipment.commitLine({
      sublistId: "receiveitems",
    });
  }

  return {
    preventAutomaticReceivingForAllItems,
    setReceiveInboundShipmentItemQuantityToBeReceived,
  };
});
