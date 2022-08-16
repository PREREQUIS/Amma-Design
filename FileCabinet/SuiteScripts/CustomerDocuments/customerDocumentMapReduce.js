/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(["N/log", "N/runtime", "./customerDocument"], (
  log,
  runtime,
  CustomerDocument
) => {
  /**
   * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
   * @param {Object} inputContext
   * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {Object} inputContext.ObjectRef - Object that references the input data
   * @typedef {Object} ObjectRef
   * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
   * @property {string} ObjectRef.type - Type of the record instance that contains the input data
   * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
   * @since 2015.2
   */
  const getInputData = (inputContext) => {
    const script = runtime.getCurrentScript();
    const notCreatedBeforeDate = script.getParameter({
      name: "custscript_cust_doc_not_created_before",
    });

    return CustomerDocument.getGenerationRequested(notCreatedBeforeDate);
  };

  /**
   * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
   * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
   * context.
   * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
   *     is provided automatically based on the results of the getInputData stage.
   * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
   *     function on the current key-value pair
   * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
   *     pair
   * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {string} mapContext.key - Key to be processed during the map stage
   * @param {string} mapContext.value - Value to be processed during the map stage
   * @since 2015.2
   */
  const map = (mapContext) => {
    log.debug({
      title: "mapContext.key",
      details: mapContext.key,
    });

    log.debug({
      title: "mapContext.value",
      details: mapContext.value,
    });

    log.debug({
      title: "mapContext.executionNo",
      details: mapContext.executionNo,
    });

    log.debug({
      title: "mapContext.isRestarted",
      details: mapContext.isRestarted,
    });

    log.debug({
      title: "mapContext.errors",
      details: mapContext.errors,
    });

    const customerDocument =
      CustomerDocument.buildFromGenerationRequestRespresentation(
        mapContext.value
      );
    if (!customerDocument.isUploaded) {
      try {
        customerDocument.render();
      } catch (error) {
        log.error({
          title: "customerDocument.render.error",
          details: error,
        });
        throw error;
      }

      try {
        customerDocument.upload();
      } catch (error) {
        log.error({
          title: "customerDocument.upload.error",
          details: error,
        });
        throw error;
      }

      try {
        customerDocument.saveChanges();
      } catch (error) {
        log.error({
          title: "customerDocument.saveChanges.error",
          details: error,
        });
        throw error;
      }
    }

    mapContext.write({
      key: customerDocument.recordType,
      value: customerDocument.recordId,
    });
  };

  /**
   * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
   * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
   * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
   *     provided automatically based on the results of the map stage.
   * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
   *     reduce function on the current group
   * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
   * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {string} reduceContext.key - Key to be processed during the reduce stage
   * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
   *     for processing
   * @since 2015.2
   */
  const reduce = (reduceContext) => {
    reduceContext.write({
      key: reduceContext.key,
      value: reduceContext.values.length,
    });
  };

  /**
   * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
   * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
   * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
   * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
   *     script
   * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
   * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
   * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
   * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
   *     script
   * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
   * @param {Object} summaryContext.inputSummary - Statistics about the input stage
   * @param {Object} summaryContext.mapSummary - Statistics about the map stage
   * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
   * @since 2015.2
   */
  const summarize = (summaryContext) => {
    // If an error was thrown during the input stage, log the error.
    if (summaryContext.inputSummary.error) {
      log.error({
        title: "Input Error",
        details: summary.inputSummary.error,
      });
    }

    // For each error thrown during the map stage, log the error, the corresponding key,
    // and the execution number. The execution number indicates whether the error was
    // thrown during the the first attempt to process the key, or during a
    // subsequent attempt.
    summaryContext.mapSummary.errors
      .iterator()
      .each(function (key, error, executionNo) {
        log.error({
          title:
            "Map error for key: " + key + ", execution no.  " + executionNo,
          details: error,
        });
        return true;
      });

    // For each error thrown during the reduce stage, log the error, the corresponding
    // key, and the execution number. The execution number indicates whether the error was
    // thrown during the the first attempt to process the key, or during a
    // subsequent attempt.
    summaryContext.reduceSummary.errors
      .iterator()
      .each(function (key, error, executionNo) {
        log.error({
          title:
            "Reduce error for key: " + key + ", execution no. " + executionNo,
          details: error,
        });
        return true;
      });

    if (summaryContext.isRestarted) {
      log.audit({ details: "Summary stage is being restarted!" });
    }

    var totalRecordsUpdated = 0;
    summaryContext.output.iterator().each(function (key, value) {
      log.audit({
        title: key + " records updated",
        details: value,
      });
      totalRecordsUpdated += parseInt(value);
      return true;
    });

    log.audit({
      title: "Total records updated",
      details: totalRecordsUpdated,
    });
  };

  return {
    config: {
      exitOnError: true,
    },
    getInputData,
    map,
    reduce,
    summarize,
  };
});
