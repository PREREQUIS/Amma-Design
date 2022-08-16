/**
 * itemFulfillmentFinder.js
 *
 * @NApiVersion 2.1
 */
define(["N/log", "N/search"], (log, search) => {
  /**
   * Find sales order related numbers for a given item fulfillment.
   *
   * @param {ItemFulfillmentDescription} itemFulfillmentDescription
   * @returns {SalesOrderRelatedNumbers} sales order related numbers
   */
  function getSalesOrderRelatedNumbers(itemFulfillmentDescription) {
    var itemFulfillmentNumbers = getItemFulfillmentNumbersBySalesOrderId(
      itemFulfillmentDescription.salesOrderId
    );

    return {
      salesOrderNumber: itemFulfillmentDescription.salesOrderNumber,
      itemFulfillmentNumbers: itemFulfillmentNumbers,
    };
  }

  /**
   * Find item fulfillment description for a given item fulfillment id.
   *
   * @param {string} itemFulfillmentId
   * @returns {ItemFulfillmentDescription} item fulfillment description or {@link Error} when not found
   *
   * @see {@link https://system.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2021_2/script/record/itemfulfillment.html} Item fulfillment record catalog.
   * @see {@link https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4345764122.html} Search module documentation.
   */
  function getItemFulfillmentDescription(itemFulfillmentId) {
    const savedSearch = search.create({
      type: search.Type.ITEM_FULFILLMENT,
      columns: [
        search.createColumn({
          label: "Item fulfillment number",
          name: "tranid",
          summary: "GROUP",
        }),
        search.createColumn({
          label: "Sales order id",
          name: "createdfrom",
          summary: "GROUP",
        }),
        search.createColumn({
          label: "Sales order number",
          name: "tranid",
          join: "createdFrom",
          summary: "GROUP",
        }),
      ],
      filters: ["internalid", search.Operator.IS, itemFulfillmentId],
    });

    const results = savedSearch.run().getRange({
      start: 0,
      end: 1,
    });

    if (results.length !== 1) {
      log.error({
        title: "getItemFulfillmentInformation",
        details: "item fulfillment '" + itemFulfillmentId + "' not found",
      });

      throw new Error(
        "Item fulfillment not found with id " + itemFulfillmentId
      );
    }

    const result = results[0];

    const itemFulfillmentNumber = result.getValue({
      name: "tranid",
      summary: "GROUP",
    });

    const salesOrderId = result.getValue({
      name: "createdfrom",
      summary: "GROUP",
    });

    const salesOrderNumber = result.getValue({
      name: "tranid",
      join: "createdFrom",
      summary: "GROUP",
    });

    return {
      id: itemFulfillmentId,
      number: itemFulfillmentNumber,
      salesOrderId: salesOrderId,
      salesOrderNumber: salesOrderNumber,
    };
  }

  /**
   * @param {string} salesOrderId sales order id
   * @returns {string[]} item fulfimment numbers
   *
   * @see {@link https://system.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2021_2/script/record/itemfulfillment.html} Item fulfillment record catalog.
   * @see {@link https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4345764122.html} Search module documentation.
   */
  function getItemFulfillmentNumbersBySalesOrderId(salesOrderId) {
    const savedSearch = search.create({
      type: search.Type.ITEM_FULFILLMENT,
      columns: [
        search.createColumn({
          name: "tranid",
          summary: "GROUP",
        }),
      ],
      filters: [
        ["createdfrom", search.Operator.IS, salesOrderId],
        "and",
        ["mainline", search.Operator.IS, "F"],
        "and",
        ["shipping", search.Operator.IS, "F"],
        "and",
        ["taxline", search.Operator.IS, "F"],
      ],
    });

    const results = savedSearch.run().getRange({
      start: 0,
      end: 1000,
    });

    const itemFulfillmentNumbers = new Set();

    for (const result of results) {
      const itemFulfillmentNumber = result.getValue({
        name: "tranid",
        summary: "GROUP",
      });

      itemFulfillmentNumbers.add(itemFulfillmentNumber);
    }

    return Array.from(itemFulfillmentNumbers);
  }

  return {
    getSalesOrderRelatedNumbers,
    getItemFulfillmentDescription,
  };
});
