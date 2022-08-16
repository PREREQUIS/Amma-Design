/**
 * outboundShipmentNumberGenerator.js
 *
 * Outbound shipment number is used to identify a shipment across all external partners and Plum.
 *
 * @NApiVersion 2.1
 */
define(() => {
  const MaxNumberLength = 15;
  const NumberSeparator = "-";

  /**
   * Generate an outbound shipment number based on sales order related numbers, for a given item fulfillment number.
   *
   * @example
   * // returns "PL0033921-1"
   * generateFor("IF13151", {salesOrderNumber: "PL0033921", itemFulfillmentNumbers: ["IF13151", "IF13152"]});
   *
   * @example
   * // returns "PL0033921-2"
   * generateFor("IF13152", {salesOrderNumber: "PL0033921", itemFulfillmentNumbers: ["IF13151", "IF13152"]});
   *
   * @example
   * // returns "PL0033921-3152"
   * generateFor("IF13152", {salesOrderNumber: "PL0033921-R-R-R-R", itemFulfillmentNumbers: ["IF13151", "IF13152"]});
   *
   *
   * @param {string} itemFulfillmentNumber
   * @param {SalesOrderRelatedNumbers} salesOrderRelatedNumbers
   * @returns {string} Outbound shipment number
   *
   * @see {@link https://plum-kitchen.atlassian.net/wiki/spaces/TE/pages/666174049/Outbound+shipment+identifier} Outbound shipment number documentation
   */
  function generateForItemFulfillmentNumber(
    itemFulfillmentNumber,
    salesOrderRelatedNumbers
  ) {
    let shipmentNumber = generateWithItemFulfillmentNumberIndex(
      itemFulfillmentNumber,
      salesOrderRelatedNumbers
    );

    if (isValid(shipmentNumber) === false) {
      shipmentNumber =
        generateWithCustomerOrderNumberAndLatestItemFulfillmentNumber(
          itemFulfillmentNumber,
          salesOrderRelatedNumbers
        );
    }

    return shipmentNumber;
  }

  /**
   * Generate an outbound shipment number based on sales order related numbers, for the latest item fulfillment number.
   *
   * @example
   * // returns "PL0033921-2"
   * generateFor({salesOrderNumber: "PL0033921", itemFulfillmentNumbers: ["IF13151", "IF13152"]});
   *
   * @example
   * // returns "PL0033921-3159"
   * generateFor({salesOrderNumber: "PL0033921", itemFulfillmentNumbers: ["IF13159", "IF13158"]});
   *
   * @param {SalesOrderRelatedNumbers} salesOrderRelatedNumbers
   * @returns {string} Outbound shipment number
   *
   * @see {@link generateForItemFulfillmentNumber}
   * @see {@link https://plum-kitchen.atlassian.net/wiki/spaces/TE/pages/666174049/Outbound+shipment+identifier} Outbound shipment number documentation
   */
  function generateForLatestItemFulfillmentNumber(salesOrderRelatedNumbers) {
    const latestItemFulfillmentNumber = getLatestItemFulfillmentNumber(
      salesOrderRelatedNumbers.itemFulfillmentNumbers
    );

    return generateForItemFulfillmentNumber(
      latestItemFulfillmentNumber,
      salesOrderRelatedNumbers
    );
  }

  /**
   * @param {SalesOrderRelatedNumbers} salesOrderRelatedNumbers
   * @returns {string} Outbound shipment number
   */
  function generateWithItemFulfillmentNumberIndex(
    itemFulfillmentNumber,
    salesOrderRelatedNumbers
  ) {
    const itemFulfillmentNumberIndex = getItemFulfillmentNumberIndex(
      itemFulfillmentNumber,
      salesOrderRelatedNumbers.itemFulfillmentNumbers
    );
    return generateWith(
      salesOrderRelatedNumbers.salesOrderNumber,
      itemFulfillmentNumberIndex
    );
  }

  function getItemFulfillmentNumberIndex(
    itemFulfillmentNumber,
    itemFulfillmentNumbers
  ) {
    const sortedItemFulfillmentNumbers = sortItemFulfillmentNumbers(
      itemFulfillmentNumbers
    );

    const itemFulfillmentNumberIndex = sortedItemFulfillmentNumbers.indexOf(
      itemFulfillmentNumber
    );

    return itemFulfillmentNumberIndex + 1;
  }

  /**
   * @param {SalesOrderRelatedNumbers} salesOrderRelatedNumbers
   * @returns {string} Outbound shipment number
   */
  function generateWithCustomerOrderNumberAndLatestItemFulfillmentNumber(
    itemFulfillmentNumber,
    salesOrderRelatedNumbers
  ) {
    const customerOrderNumber = extractCustomerOrderNumber(
      salesOrderRelatedNumbers.salesOrderNumber
    );

    const numberPart = removeItemFulfillmentNumberPrefix(itemFulfillmentNumber);

    const endOfItemFulfillmentNumber = numberPart.slice(-4);

    return generateWith(customerOrderNumber, endOfItemFulfillmentNumber);
  }

  /**
   * @example
   * // returns "IF13159"
   * getLatestItemFulfillmentNumberPart(["IF13158", "IF13159"]);
   *
   * @example
   * // returns "IF13159"
   * getLatestItemFulfillmentNumberPart(["IF13159", "IF13158"]);
   *
   * @example
   * // returns ""IF002""
   * getLatestItemFulfillmentNumberPart(["IF01", "IF002"]);
   *
   * @param {string[]} itemFulfillmentNumbers
   * @returns {string} Latest item fulfillment number
   */
  function getLatestItemFulfillmentNumber(itemFulfillmentNumbers) {
    return sortItemFulfillmentNumbers([...itemFulfillmentNumbers]).pop();
  }

  /**
   * @example
   * // returns ["IF13158", "IF13159"]
   * getLatestItemFulfillmentNumberPart(["IF13158", "IF13159"]);
   *
   * @example
   * // returns ["IF13158", "IF13159"]
   * getLatestItemFulfillmentNumberPart(["IF13159", "IF13158"]);
   *
   * @example
   * // returns ["IF01", "IF002"]
   * getLatestItemFulfillmentNumberPart(["IF002", "IF01"]);
   *
   * @param {string[]} itemFulfillmentNumbers
   * @returns {string[]} Item fulfillment numbers sorted
   */
  function sortItemFulfillmentNumbers(itemFulfillmentNumbers) {
    return itemFulfillmentNumbers.sort(
      (a, b) =>
        extractItemFulfillmentNumberPart(a) -
        extractItemFulfillmentNumberPart(b)
    );
  }

  /**
   * @example
   * // returns "PL0033921-R-1"
   * generateWith("PL0033921-R","1");
   *
   * @example
   * // returns "PL0033921-1234"
   * generateWith("PL0033924","1234");
   *
   * @param {string} firstPart
   * @param {string} secondPart
   * @returns {string} Outbound shipment number
   */
  function generateWith(firstPart, secondPart) {
    return firstPart.concat(NumberSeparator, secondPart);
  }

  /**
   * @example
   * // returns true
   * isValid("PL0033921-1");
   *
   * @example
   * // returns false
   * isValid("PL0033924-R-R-R-1");
   *
   * @param {string} shipmentNumber
   * @returns {boolean} is valid
   */
  function isValid(shipmentNumber) {
    return shipmentNumber.length <= MaxNumberLength;
  }

  /**
   * Extract the customer order number of sales order number.
   *
   * @example
   * // returns "PL0033921"
   * extractCustomerOrderNumber("PL0033921-R-R-R");
   *
   * @example
   * // returns "PL0033924"
   * extractCustomerOrderNumber("PL0033924-R-R-R");
   *
   * @param {string} salesOrderNumber
   * @returns {string} customer order number
   */
  function extractCustomerOrderNumber(salesOrderNumber) {
    return salesOrderNumber.slice(0, 9);
  }

  /**
   * Extract the number part of item fulfillment number by removing IF prefix.
   *
   * @example
   * // returns 12025
   * extractItemFulfillmentNumberPart("IF12025");
   *
   * @example
   * // returns 1
   * extractItemFulfillmentNumberPart("IF00001");
   *
   * @param {string} itemFulfillmentNumber
   * @returns {number} item fulfillment number part
   */
  function extractItemFulfillmentNumberPart(itemFulfillmentNumber) {
    return parseInt(removeItemFulfillmentNumberPrefix(itemFulfillmentNumber));
  }

  /**
   * Remove the prefix of the item fulfillment number.
   *
   * @example
   * // returns "12025"
   * extractItemFulfillmentNumberPart("IF12025");
   *
   * @example
   * // returns "00001"
   * extractItemFulfillmentNumberPart("IF00001");
   *
   * @example
   * // returns "1"
   * extractItemFulfillmentNumberPart("IF1");
   *
   * @param {string} itemFulfillmentNumber
   * @returns {number} item fulfillment number part
   */
  function removeItemFulfillmentNumberPrefix(itemFulfillmentNumber) {
    return itemFulfillmentNumber.slice(2);
  }

  return {
    generateForItemFulfillmentNumber,
    generateForLatestItemFulfillmentNumber,
  };
});
