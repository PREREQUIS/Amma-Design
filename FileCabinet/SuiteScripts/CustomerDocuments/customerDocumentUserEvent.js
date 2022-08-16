/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["./customerDocument", "N/runtime"], (CustomerDocument, runtime) => {
  /**
   * Defines the function definition that is executed before record is submitted.
   *
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

    if (scriptContext.type === scriptContext.UserEventType.DELETE) {
      return;
    }

    if (!CustomerDocument.isSupport(scriptContext.newRecord)) {
      return;
    }

    const customerDocument = CustomerDocument.buildFromRecord(
      scriptContext.newRecord
    );

    if (!customerDocument.isRequiredGeneration(scriptContext.oldRecord)) {
      return;
    }

    customerDocument.requestGeneration();
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

    if (scriptContext.type === scriptContext.UserEventType.DELETE) {
      return;
    }

    if (!CustomerDocument.isSupport(scriptContext.newRecord)) {
      return;
    }

    const customerDocument = CustomerDocument.buildAndLoadFromRecord(
      scriptContext.newRecord
    );

    if (!customerDocument.isRequiredGeneration(scriptContext.oldRecord)) {
      return;
    }

    customerDocument.requestGeneration();
    customerDocument.saveChanges();
  };

  return { beforeSubmit, afterSubmit };
});
