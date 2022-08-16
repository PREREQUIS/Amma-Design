/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(["N/log"], (log) => {
  /**
   * Defines the WorkflowAction script trigger point.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.workflowId - Internal ID of workflow which triggered this action
   * @param {string} scriptContext.type - Event type
   * @param {Form} scriptContext.form - Current form that the script uses to interact with the record
   * @since 2016.1
   */
  const onAction = (scriptContext) => {
    log.debug({
      title: "Start Script",
    });

    const newRecord = scriptContext.newRecord;

    const itemCount = newRecord.getLineCount({
      sublistId: "item",
    });

    log.debug({
      title: "Item Count",
      details: itemCount,
    });

    for (let i = 0; i < itemCount; i++) {
      if (newRecord.isDynamic) {
        newRecord.selectLine({
          sublistId: "item",
          line: i,
        });

        newRecord.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "createpo",
          value: null,
        });

        newRecord.commitLine({
          sublistId: "item",
        });
      } else {
        newRecord.setSublistValue({
          sublistId: "item",
          fieldId: "createpo",
          line: i,
          value: null,
        });
      }

      log.debug({
        title: "Set Item " + i + " Create PO",
        details: null,
      });
    }

    log.debug({
      title: "End Script",
    });
  };

  return { onAction };
});
