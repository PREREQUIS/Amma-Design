/**
 * @NApiVersion 2.1
 */
define(["N/https", "N/log", "N/record", "N/search", "N/render", "N/format"], (
  https,
  log,
  record,
  search,
  render,
  format
) => {
  const documentUrlFielId = "custbody_prq_azure_url";
  const documentUploadedFlagFieldId = "custbody_prq_sent_toazure";

  const apiKeySecretId = "custsecret_cust_doc_api_key";
  const apiUploadEndpointSecretId = "custsecret_cust_doc_api_upload_endpoint";
  /**
   * Customer document
   */
  class CustomerDocument {
    /**
     *
     * @param {record} transactionRecord
     */
    constructor(transactionRecord) {
      this.transactionRecord = transactionRecord;

      this.recordId = transactionRecord.getValue({
        fieldId: "id",
      });

      this.recordTranId = transactionRecord.getValue({
        fieldId: "tranid",
      });

      this.recordType = transactionRecord.type;

      this.documentUrl = transactionRecord.getValue({
        fieldId: documentUrlFielId,
      });

      this.isUploaded = transactionRecord.getValue({
        fieldId: documentUploadedFlagFieldId,
      });

      this.documentCategory = this.#getDocumentCategory(this.recordType);

      this.documentName = this.recordTranId + ".pdf";

      this.documentContent = null;
    }

    static get #supportedRecords() {
      return [
        { type: record.Type.INVOICE, abbreviateType: "CustInvc" },
        { type: record.Type.SALES_ORDER, abbreviateType: "SalesOrd" },
        { type: record.Type.CUSTOMER_PAYMENT, abbreviateType: "CustPymt" },
        { type: record.Type.ITEM_FULFILLMENT, abbreviateType: "ItemShip" },
      ];
    }

    static get #supportedRecordTypes() {
      return CustomerDocument.#supportedRecords.map((r) => r.type);
    }

    static get #supportedRecordAbbreviateTypes() {
      return CustomerDocument.#supportedRecords.map((r) => r.abbreviateType);
    }

    /**
     *
     * @param {Date} [notBeforeDate] - not before creation date filtering
     * @returns
     */
    static getGenerationRequested(notBeforeDate) {
      const filters = [];

      const documentNotUploaded = search.createFilter({
        name: documentUploadedFlagFieldId,
        operator: search.Operator.IS,
        values: false,
      });
      filters.push(documentNotUploaded);

      const requireCustomerDocument = search.createFilter({
        name: "type",
        operator: search.Operator.ANYOF,
        values: CustomerDocument.#supportedRecordAbbreviateTypes,
      });
      filters.push(requireCustomerDocument);

      const accountingPeriodNotClosed = search.createFilter({
        name: "closed",
        join: search.Type.ACCOUNTING_PERIOD,
        operator: search.Operator.IS,
        values: false,
      });
      filters.push(accountingPeriodNotClosed);

      if (notBeforeDate) {
        log.audit("Document generation requested not before", notBeforeDate);

        const notBeforeDateFormatted = format.format({
          value: notBeforeDate,
          type: format.Type.DATE,
        });

        const notBefore = search.createFilter({
          name: "datecreated",
          operator: search.Operator.NOTBEFORE,
          values: notBeforeDateFormatted,
        });

        filters.push(notBefore);
      }

      const internalId = search.createColumn({
        name: "internalid",
        summary: search.Summary.GROUP,
      });

      const type = search.createColumn({
        name: "type",
        summary: search.Summary.GROUP,
      });

      return search.create({
        type: search.Type.TRANSACTION,
        filters: filters,
        columns: [internalId, type],
      });
    }

    static #getRecordTypeFromAbbreviateType(abbreviateType) {
      return CustomerDocument.#supportedRecords.find(
        (r) => r.abbreviateType === abbreviateType
      )?.type;
    }

    /**
     *
     * @param {Record} transactionRecord
     * @returns {boolean} [true] if customer document support the record type or [false]
     */
    static isSupport(transactionRecord) {
      if (transactionRecord === null || transactionRecord === undefined) {
        return false;
      }

      return CustomerDocument.#supportedRecordTypes.includes(
        transactionRecord.type
      );
    }

    /**
     * @param {Object} scriptContext
     * @returns
     */
    isRequiredGeneration(oldRecord) {
      log.debug("oldRecord", oldRecord);
      log.debug("newRecord", this.transactionRecord);

      const isNewRecord = oldRecord === undefined || oldRecord === null;
      if (isNewRecord) {
        return true;
      }

      log.audit(
        "Customer document generation requirement evaluation",
        "Context " +
          this.transactionRecord.type +
          " " +
          this.transactionRecord.id
      );

      const documentGenerationAlreadyRequested = !this.isUploaded;
      if (documentGenerationAlreadyRequested) {
        log.debug(
          "Generation already requested",
          documentGenerationAlreadyRequested
        );
        return false;
      }

      const documentRequireGeneration = !CustomerDocument.#areRecordValuesEqual(
        oldRecord,
        this.transactionRecord
      );

      log.audit(
        "Customer document generation required",
        documentRequireGeneration
      );

      return documentRequireGeneration;
    }

    static #areRecordValuesEqual(oldRecord, newRecord) {
      var triggerFieldsSearch = search.create({
        type: "customrecord_cust_doc_trigger_fields",
        filters: [
          ["custrecord_cust_doc_record_type", "startswith", newRecord.type],
        ],
        columns: [
          "custrecord_cust_doc_trigger_sublist",
          "custrecord_cust_doc_trigger_fields",
        ],
      });

      // Run throught trigger list fields
      var searchResultSet = triggerFieldsSearch.run();

      let valuesAreEquals = true;
      searchResultSet.each(function (searchResult) {
        const searchFieldId = searchResult.getValue(
          "custrecord_cust_doc_trigger_fields"
        );
        const searchSublistId = searchResult.getValue(
          "custrecord_cust_doc_trigger_sublist"
        );

        valuesAreEquals = searchSublistId
          ? CustomerDocument.#areSublistFieldValuesEqual(
              oldRecord,
              newRecord,
              searchFieldId,
              searchSublistId
            )
          : CustomerDocument.#areRecordFieldValuesEqual(
              oldRecord,
              newRecord,
              searchFieldId
            );

        const continueLoop = valuesAreEquals;

        return continueLoop;
      });

      return valuesAreEquals;
    }

    static #areRecordFieldValuesEqual(oldRecord, newRecord, fieldId) {
      const options = {
        fieldId: fieldId,
      };

      log.debug("Field value equality evaluation", options);

      const oldValue = oldRecord.getValue(options);
      const newValue = newRecord.getValue(options);

      return CustomerDocument.#areValuesEqual(oldValue, newValue);
    }

    static #areSublistFieldValuesEqual(
      oldRecord,
      newRecord,
      fieldId,
      sublistId
    ) {
      const lineCount = CustomerDocument.#getMaxLineCount(
        oldRecord,
        newRecord,
        sublistId
      );

      for (var line = 0; line < lineCount; line++) {
        const options = {
          fieldId: fieldId,
          sublistId: sublistId,
          line: line,
        };

        log.debug("Sublist field value equality evaluation", options);

        const oldValue = oldRecord.getSublistValue(options);
        const newValue = newRecord.getSublistValue(options);

        if (!CustomerDocument.#areValuesEqual(oldValue, newValue)) {
          return false;
        }
      }

      return true;
    }

    static #getMaxLineCount(oldRecord, newRecord, sublistId) {
      const options = {
        sublistId: sublistId,
      };

      const newLineCount = newRecord.getLineCount(options);
      const oldLineCount = oldRecord.getLineCount(options);

      return newLineCount > oldLineCount ? newLineCount : oldLineCount;
    }

    static #areValuesEqual(oldValue, newValue) {
      const oldValueComparable = CustomerDocument.#comparableValue(oldValue);
      const newValueComparable = CustomerDocument.#comparableValue(newValue);

      log.debug("oldValue", oldValueComparable);
      log.debug("newValue", newValueComparable);

      return oldValueComparable === newValueComparable;
    }

    static #comparableValue(value) {
      return String(value)
        .replaceAll("\n", " ")
        .replaceAll("\r", "")
        .replaceAll("\x1F", "")
        .trim()
        .toString();
    }

    /**
     *
     * @param {record} transactionRecord
     * @returns {CustomerDocument} a customer document
     */
    static buildFromRecord(transactionRecord) {
      return new CustomerDocument(transactionRecord);
    }

    /**
     *
     * @param {record} transactionRecord
     * @returns {CustomerDocument} a customer document
     */
    static buildAndLoadFromRecord(transactionRecord) {
      const recordType = transactionRecord.type;
      const recordId = transactionRecord.id;
      return CustomerDocument.#buildWithRecordLoading(recordId, recordType);
    }

    /**
     *
     * @param {string} generationRequestRespresentation a result of `generationRequested`
     * @returns {CustomerDocument} a customer document
     */
    static buildFromGenerationRequestRespresentation(
      generationRequestRespresentation
    ) {
      const transactionEntry = JSON.parse(generationRequestRespresentation);

      const recordId = transactionEntry.values["GROUP(internalid)"].value;
      const recordAbbreviateType = transactionEntry.values["GROUP(type)"].value;

      const recordType =
        CustomerDocument.#getRecordTypeFromAbbreviateType(recordAbbreviateType);

      return CustomerDocument.#buildWithRecordLoading(recordId, recordType);
    }

    /**
     *
     * @param {number} recordId
     * @param {string} recordType
     * @returns {CustomerDocument} a customer document
     */
    static #buildWithRecordLoading(recordId, recordType) {
      var transactionRecord = record.load({
        type: recordType,
        id: recordId,
        isDynamic: false,
      });

      return new CustomerDocument(transactionRecord);
    }

    requestGeneration() {
      this.transactionRecord.setValue({
        fieldId: documentUploadedFlagFieldId,
        value: false,
      });
    }

    saveChanges() {
      this.transactionRecord.save({
        enableSourcing: true,
        ignoreMandatoryFields: true,
      });
    }

    render() {
      const renderingStart = new Date().getTime();
      log.debug({
        title: "Render Start",
        details: renderingStart,
      });

      const document = render.transaction({
        entityId: ~~this.recordId,
        printMode: render.PrintMode.PDF,
      });

      const renderingEnd = new Date().getTime();
      log.debug({
        title: "Render End",
        details: renderingEnd,
      });

      log.debug({
        title: "Render time",
        details: renderingEnd - renderingStart,
      });

      log.audit("Document rendered", document.name);

      this.documentContent = document.getContents();
    }

    upload() {
      const apiKey = https.createSecureString({
        input: "{" + apiKeySecretId + "}",
      });

      const apiUploadEndpoint = https.createSecureString({
        input: "{" + apiUploadEndpointSecretId + "}",
      });

      const requestHeaders = {
        "x-functions-key": apiKey,
        "Content-Type": "application/json",
      };

      const requestBody = JSON.stringify({
        fileName: this.documentName,
        contentType: "application/pdf",
        fileCategory: this.documentCategory,
        base64FileContent: this.documentContent,
      });

      log.debug("HTTPS requestBody", requestBody);

      const response = https.post({
        url: apiUploadEndpoint,
        headers: requestHeaders,
        body: requestBody,
      });

      log.debug("HTTPS postResponse : " + response.code, response);
      if (response.code !== 200) {
        return;
      }

      const responseBody = JSON.parse(response.body);

      log.debug("post Body", responseBody);

      this.documentUrl = responseBody.documentUrl;

      log.audit("Document uploaded", this.documentUrl);

      this.#markAsUploaded();
    }

    #markAsUploaded() {
      this.transactionRecord.setValue({
        fieldId: documentUploadedFlagFieldId,
        value: true,
      });

      this.transactionRecord.setValue({
        fieldId: documentUrlFielId,
        value: this.documentUrl,
      });
    }

    #getDocumentCategory(recordType) {
      switch (recordType) {
        case record.Type.INVOICE:
          return "invoice";

        case record.Type.SALES_ORDER:
          return "order";

        case record.Type.CUSTOMER_PAYMENT:
          return "payment";

        case record.Type.ITEM_FULFILLMENT:
          return "fulfillment";

        default:
          return "unknowType";
      }
    }
  }

  return CustomerDocument;
});
