/**
 * Product SKU synchronization fields in order to let machine and human use the same shared value.
 *
 * Product SKU field: itemid
 *
 * See confluence documentation: https://plum-kitchen.atlassian.net/l/cp/BqBUorDX
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record", "N/log"], (record, log) => {
  /**
   * Defines the function definition that is executed after record is submitted.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const afterSubmit = (scriptContext) => {
    if (scriptContext.type === scriptContext.UserEventType.DELETE) {
      return;
    }

    const recordType = scriptContext.newRecord.type;
    const recordId = scriptContext.newRecord.id;

    const transactionRecord = record.load({
      type: recordType,
      id: recordId,
      isDynamic: false,
    });

    const itemId = transactionRecord.getValue("itemid");
    const externalId = transactionRecord.getValue("externalid");

    // Except for Stripe bundle items (for accounting purpose)
    if (
      externalId === "stripe_customer_balance_credit_item" ||
      externalId === "stripe_partial_refund_non_item" ||
      externalId === "stripe-unallocated-invoice-item"
    ) {
      return;
    }

    if (itemId !== externalId) {
      transactionRecord.setValue({
        fieldId: "externalid",
        value: itemId,
      });

      transactionRecord.save({
        enableSourcing: true,
        ignoreMandatoryFields: true,
      });
    }
  };

  return { afterSubmit };
});
