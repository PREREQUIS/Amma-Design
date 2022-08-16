/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/log", "N/search", "N/record", "N/runtime"], (
  log,
  search,
  record,
  runtime
) => {
  /**
   * Defines the function definition that is executed before record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const beforeSubmit = (scriptContext) => {
    if (runtime.executionContext !== runtime.ContextType.USER_INTERFACE) {
      return;
    }

    log.debug("runtime", "Execution context " + runtime.executionContext);

    const oldRecord = scriptContext.oldRecord;
    const newRecord = scriptContext.newRecord;
    const hubSpotSyncRequired = isHubSpotSyncRequired(oldRecord, newRecord);

    log.debug("set hubspotSyncRequired", hubSpotSyncRequired);

    if (hubSpotSyncRequired) {
      newRecord.setValue({
        fieldId: "custbody_prq_hs_sync_required",
        value: hubSpotSyncRequired,
      });
    }
  };

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
    if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
      return;
    }

    log.debug("runtime", "Execution context " + runtime.executionContext);

    const oldRecord = scriptContext.oldRecord;

    const recordType = scriptContext.newRecord.type;
    const recordId = scriptContext.newRecord.id;
    const newRecord = record.load({
      type: recordType,
      id: recordId,
      isDynamic: false,
    });

    const hubSpotSyncRequired = isHubSpotSyncRequired(oldRecord, newRecord);

    log.debug("set hubspotSyncRequired", hubSpotSyncRequired);

    if (hubSpotSyncRequired) {
      record.submitFields({
        type: recordType,
        id: recordId,
        values: {
          custbody_prq_hs_sync_required: hubSpotSyncRequired,
        },
        options: {
          enableSourcing: true,
          ignoreMandatoryFields: false,
        },
      });
    }
  };

  /**
   * @returns {boolean} [true] if record type is supported or [false]
   */
  function recordTypeIsSupported(recordType) {
    const supportedRecordTypes = [
      record.Type.SALES_ORDER,
      record.Type.ITEM_FULFILLMENT,
    ];

    const isSupported = supportedRecordTypes.includes(recordType);

    log.debug(
      "Record type support",
      "record type " + recordType + " is supported " + isSupported
    );

    return isSupported;
  }

  function isHubSpotSyncRequired(oldRecord, newRecord) {
    log.debug("oldRecord", oldRecord);
    log.debug("newRecord", newRecord);

    const recordType = oldRecord?.type ?? newRecord?.type;
    const recordId = oldRecord?.id ?? newRecord?.id;

    log.audit(
      "Synchronisation requirement evaluation",
      "Context " + recordType + " " + recordId
    );

    if (!recordTypeIsSupported(recordType)) {
      return false;
    }

    if (recordType === record.Type.ITEM_FULFILLMENT) {
      const shipstatus = newRecord?.getValue({
        fieldId: "shipstatus",
      });

      if (shipstatus !== "C") {
        log.debug("Item Fulfillment not Shipped", shipstatus);
        return false;
      }
    }

    const isCreation = oldRecord == null && newRecord != null;
    if (isCreation) {
      return true;
    }

    const isDeletion = oldRecord != null && newRecord == null;
    if (isDeletion) {
      return false;
    }

    let hubSpotSyncRequired = newRecord.getValue({
      fieldId: "custbody_prq_hs_sync_required",
    });

    log.debug("hubSpotSyncRequired", hubSpotSyncRequired);

    if (hubSpotSyncRequired) {
      log.debug("Synchronisation already requested", hubSpotSyncRequired);
      return false;
    }

    hubSpotSyncRequired = !areRecordValuesEqual(oldRecord, newRecord);

    return hubSpotSyncRequired;
  }

  function areRecordValuesEqual(oldRecord, newRecord) {
    var triggerFieldsSearch = search.create({
      type: "customrecord_prq_hs_trigger_fields",
      filters: [
        ["custrecord_prq_hs_record_type", "startswith", newRecord.type],
      ],
      columns: [
        "custrecord_prq_hs_trigger_sublist",
        "custrecord_prq_hs_trigger_fields",
      ],
    });

    // Run throught trigger list fields
    var searchResultSet = triggerFieldsSearch.run();

    let valuesAreEquals = true;
    searchResultSet.each(function (searchResult) {
      const searchFieldId = searchResult.getValue(
        "custrecord_prq_hs_trigger_fields"
      );
      const searchSublistId = searchResult.getValue(
        "custrecord_prq_hs_trigger_sublist"
      );

      valuesAreEquals = searchSublistId
        ? areSublistFieldValuesEqual(
            oldRecord,
            newRecord,
            searchFieldId,
            searchSublistId
          )
        : areRecordFieldValuesEqual(oldRecord, newRecord, searchFieldId);

      const continueLoop = valuesAreEquals;

      return continueLoop;
    });

    return valuesAreEquals;
  }

  function areRecordFieldValuesEqual(oldRecord, newRecord, fieldId) {
    const options = {
      fieldId: fieldId,
    };

    log.debug("options", options);

    const oldValue = oldRecord.getValue(options);
    const newValue = newRecord.getValue(options);

    return areValuesEqual(oldValue, newValue);
  }

  function areSublistFieldValuesEqual(
    oldRecord,
    newRecord,
    fieldId,
    sublistId
  ) {
    const lineCount = getMaxLineCount(oldRecord, newRecord, sublistId);

    for (var line = 0; line < lineCount; line++) {
      const options = {
        fieldId: fieldId,
        sublistId: sublistId,
        line: line,
      };

      log.debug("options", options);

      const oldValue = oldRecord.getSublistValue(options);
      const newValue = newRecord.getSublistValue(options);

      if (!areValuesEqual(oldValue, newValue)) {
        return false;
      }
    }

    return true;
  }

  function getMaxLineCount(oldRecord, newRecord, sublistId) {
    const options = {
      sublistId: sublistId,
    };

    const newLineCount = newRecord.getLineCount(options);
    const oldLineCount = oldRecord.getLineCount(options);

    return newLineCount > oldLineCount ? newLineCount : oldLineCount;
  }

  function areValuesEqual(oldValue, newValue) {
    const oldValueComparable = comparableValue(oldValue);
    const newValueComparable = comparableValue(newValue);

    log.debug("oldValue", oldValueComparable);
    log.debug("newValue", newValueComparable);

    return oldValueComparable === newValueComparable;
  }

  function comparableValue(value) {
    return String(value)
      .replaceAll("\n", " ")
      .replaceAll("\r", "")
      .replaceAll("\x1F", "")
      .trim()
      .toString();
  }

  return { beforeSubmit, afterSubmit };
});
