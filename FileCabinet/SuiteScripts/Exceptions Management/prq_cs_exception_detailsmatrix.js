var CURRENTRECORDMODULE,RECORDMODULE, RUNTIMEMODULE,SEARCHMODULE;
var DEFAULTTAXCODE;
/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord',"N/record",'N/runtime','N/search'],runClientScript);
function runClientScript(currentRecord,record,runtime,search) {
	RECORDMODULE = record;
	RUNTIMEMODULE = runtime;
	SEARCHMODULE = search;
	CURRENTRECORDMODULE = currentRecord
	
	
    return {
        pageInit: _pageInit,
        fieldChanged: _fieldChanged,
        //postSourcing: _postSourcing,
        //sublistChanged: _sublistChanged,
        //lineInit: _lineInit,
        //validateField: _validateField,
        //validateLine: _validateLine,
        //validateInsert: _validateInsert,
        //validateDelete: _validateDelete,
        //saveRecord: _saveRecord
    };    
}

/**
 * Function to be executed after page is initialized.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
 *
 * @since 2015.2
 */
function _pageInit(scriptContext) {
	var record = CURRENTRECORDMODULE.get();
	var field = record.getField({ fieldId: 'name' });
	field.isDisabled = true;
	
}

/**
 * Function to be executed when field is changed.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 * @param {string} scriptContext.fieldId - Field name
 * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
 * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
 *
 * @since 2015.2
 */
function _fieldChanged(scriptContext) {	
	var fieldId =  scriptContext.fieldId ;
	console.log(scriptContext)
	if(fieldId == 'custrecord_prq_excdet_type') {
		scriptContext.currentRecord.setValue({
				fieldId: 'name',
			    value: scriptContext.currentRecord.getText({ fieldId: 'custrecord_prq_excdet_type' })
			    })
	}
	
}

/**
 * Function to be executed when field is slaved.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 * @param {string} scriptContext.fieldId - Field name
 *
 * @since 2015.2
 */
function _postSourcing(scriptContext) {

}

/**
 * Function to be executed after sublist is inserted, removed, or edited.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 *
 * @since 2015.2
 */
function _sublistChanged(scriptContext) {

}

/**
 * Function to be executed after line is selected.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 *
 * @since 2015.2
 */
function _lineInit(scriptContext) {

}

/**
 * Validation function to be executed when field is changed.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 * @param {string} scriptContext.fieldId - Field name
 * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
 * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
 *
 * @returns {boolean} Return true if field is valid
 *
 * @since 2015.2
 */
function _validateField(scriptContext) {

}

/**
 * Validation function to be executed when sublist line is committed.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 *
 * @returns {boolean} Return true if sublist line is valid
 *
 * @since 2015.2
 */
function _validateLine(scriptContext) {

}

/**
 * Validation function to be executed when sublist line is inserted.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 *
 * @returns {boolean} Return true if sublist line is valid
 *
 * @since 2015.2
 */
function _validateInsert(scriptContext) {

}

/**
 * Validation function to be executed when record is deleted.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @param {string} scriptContext.sublistId - Sublist name
 *
 * @returns {boolean} Return true if sublist line is valid
 *
 * @since 2015.2
 */
function _validateDelete(scriptContext) {

}

/**
 * Validation function to be executed when record is saved.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.currentRecord - Current form record
 * @returns {boolean} Return true if record is valid
 *
 * @since 2015.2
 */
function _saveRecord(scriptContext) {

}