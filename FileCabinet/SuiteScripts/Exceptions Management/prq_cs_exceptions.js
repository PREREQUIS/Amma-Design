var CURRENTRECORDMODULE,DIALOGMODULE,RECORDMODULE, RUNTIMEMODULE,SEARCHMODULE;
var DEFAULTTAXCODE;
/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord','N/ui/dialog','N/record','N/runtime','N/search'],runClientScript);
function runClientScript(currentRecord,dialog,record,runtime,search) {
	DIALOGMODULE = dialog;
	RECORDMODULE = record;
	RUNTIMEMODULE = runtime;
	SEARCHMODULE = search;
	CURRENTRECORDMODULE = currentRecord;
	DEFAULTTAXCODE = 40;
	
	return {
		pageInit: _pageInit,
		fieldChanged: _fieldChanged,
		//postSourcing: _postSourcing,
		sublistChanged: _sublistChanged,
		//lineInit: _lineInit,
		//validateField: _validateField,
		//validateLine: _validateLine,
		//validateInsert: _validateInsert,
		//validateDelete: _validateDelete,
		//saveRecord: _saveRecord
		duplicateLine:duplicateLine,
		addSOLine:addSOLine,
		validateExceptionCC:validateExceptionCC,
		validateExceptionOPS:validateExceptionOPS,
		addMultiple:addMultiple,
		clearAllLines:clearAllLines,
		fillAllLines:fillAllLines,
		updateAllLines:updateAllLines,
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
	
	getOriginalSO(scriptContext.currentRecord)
	
	if(scriptContext.mode == 'create'){		
		if(scriptContext.currentRecord.getValue({ fieldId: 'custrecord_prq_exc_created_from' })){
			var exceptionName = getExceptionName(scriptContext.currentRecord.getValue({ fieldId: 'custrecord_prq_exc_created_from' }));
			addSOLine(scriptContext.currentRecord);
			totalCalculation(scriptContext.currentRecord);
			scriptContext.currentRecord.setValue({
				fieldId: 'name',
				value: exceptionName
				});
	
		}
	}		
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
	var currentRecord = scriptContext.currentRecord;
	var fieldId =  scriptContext.fieldId ;
	
	if(fieldId == 'custrecord_prq_excitem_new_qty' || fieldId ==  'custrecord_prq_excitem_new_rate'){
		lineCalculation(currentRecord);
		totalCalculation(currentRecord);
	}

	if(fieldId == 'custrecord_prq_excitem_item'){
		setItemData(currentRecord);
		lineCalculation(currentRecord);
		totalCalculation(currentRecord);
	}	
	
	if(fieldId == 'custrecord_prq_excitem_origin'){		
		var itemExcOrigin = currentRecord.getCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_origin'
		});		
		currentRecord.setCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_responsability',
			value: itemExcOrigin,
			ignoreFieldChange: true
		});	
	}
	if(fieldId == 'custrecord_prq_exc_compensation_amount'){
		totalCalculation(currentRecord);
	}
	if (fieldId == 'custrecord_prq_excitem_exc_type' || fieldId ==  'custrecord_prq_excitem_exc_details' ){
		getExcCategory(currentRecord);		
	}
	if (fieldId == 'custrecord_prq_excitem_exc_type'){
		currentRecord.setCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_exc_details',
			value: '',
			ignoreFieldChange: true
		});	
		currentRecord.setCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_product_action',
			value: '',
			ignoreFieldChange: true
		});
		currentRecord.setCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_act_ontotal',
			value: '',
			ignoreFieldChange: true
		});
		currentRecord.setCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_act_todo',
			value: '',
			ignoreFieldChange: true
		});	
		lineCalculation(currentRecord);
		totalCalculation(currentRecord);
	}
	if(fieldId == 'custrecord_prq_excitem_product_action' || fieldId ==  'custrecord_prq_excitem_exc_details'){
		var result = getActions(currentRecord);
		if (result == false){
			currentRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: fieldId,
				value: ''
			});	
		}
		lineCalculation(currentRecord);
		totalCalculation(currentRecord);
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
	if(scriptContext.operation == 'remove'){
		totalCalculation(scriptContext.currentRecord);
	}
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

/**
 * Function that add the Sales Order Line to the exception if they are not already includes
 * 
 * Load a Sales Order Array with an Object of values from all SO Lines
 * Load in Array all the SO Line field value from the Exception Lines
 * 
 * Compare this two array, if one SO Line from the Sales Order Array is not in the Exception then
 * add the SO Line in the Exception
 *  
 * @param {*} scriptContext 
 */
function addSOLine(scriptContext){
	var exceptionRecord = scriptContext;
//	Field that link Exception and SO
	var soID = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_created_from'
	});
	var soRecord = RECORDMODULE.load({
		type: RECORDMODULE.Type.SALES_ORDER, 
		id: soID,
		isDynamic: true,
	});
	var soItemLinesCount = soRecord.getLineCount({
		sublistId: 'item'
	});  
	soCurrency = soRecord.getValue({
		fieldId: 'currency'
	});
	//Load the array of SO Lines data
	var soLines = [];
	for (var i = 0;i < soItemLinesCount;i++){
		var soCurrentLine = {};
		soCurrentLine.item = soRecord.getSublistValue({
			sublistId: 'item',
			fieldId: 'item',
			line: i
		});
		soCurrentLine.line = soRecord.getSublistValue({
			sublistId:'item',
			fieldId: 'line',
			line: i
		});	
		soCurrentLine.description = soRecord.getSublistValue({
			sublistId: 'item',
			fieldId: 'description',
			line: i
		});
		soCurrentLine.quantity = soRecord.getSublistValue({
			sublistId: 'item',
			fieldId: 'quantity',
			line: i
		});
		soCurrentLine.oldVersion = soRecord.getSublistValue({
			sublistId: 'item',
			fieldId: 'custcolcust_item_is_old_version',
			line: i
		});
		soCurrentLine.itemRate = soRecord.getSublistValue({
			sublistId: 'item',
			fieldId: 'rate',
			line: i
		});
		soCurrentLine.amount = soRecord.getSublistValue({
			sublistId: 'item',
			fieldId: 'amount',
			line: i
		});
		soCurrentLine.taxCode = soRecord.getSublistValue({
			sublistId: 'item',
			fieldId: 'taxcode',
			line: i
		});
		soCurrentLine.taxAmount = soRecord.getSublistValue({
			sublistId: 'item',
			fieldId: 'tax1amt',
			line: i
		});
		soCurrentLine.shipVia = soRecord.getSublistValue({
			sublistId: 'item',
			fieldId: 'custcol_prq_ship_via_line_plum',
			line: i
		});
		soCurrentLine.locationItem = soRecord.getSublistValue({
			sublistId: 'item',
			fieldId: 'location',
			line: i
		});
		soCurrentLine.createPO = soRecord.getSublistValue({
			sublistId: 'item',
			fieldId: 'createdpo',
			line: i
		});
		soCurrentLine.poVendor = soRecord.getSublistValue({
			sublistId: 'item',
			fieldId: 'povendor',
			line: i
		});
		soLines.push(soCurrentLine);
	}
	
	//Build an array of the field SO Line Number for all lines in the Exception
	var exceptionItemLinesCount = exceptionRecord.getLineCount({
		sublistId: 'recmachcustrecord_prq_excitem'
	});
	
	var excExistingSOLine = [];
	for (var j = 0;j < exceptionItemLinesCount;j++){
		let excSOLineNumber = exceptionRecord.getSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_order_line',
			line: j
		});
		excExistingSOLine.push(excSOLineNumber.toString());
	}
	//The code read all line from the SO Lines array
	for (var i=0; i<soLines.length;i++){
		//If the SO Line Number is already in the Exception it isn't add otherwise we add the values from the SO
		if(!excExistingSOLine.includes(soLines[i].line)){
			var newLineNumber = exceptionRecord.selectNewLine({
				sublistId: 'recmachcustrecord_prq_excitem'
			});
			//SO Item
			exceptionRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_item',
				line: newLineNumber,
				value: soLines[i].item,
				ignoreFieldChange: true
			});
			//SO Line Number
			exceptionRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_order_line',
				line: newLineNumber,
				value: soLines[i].line,
				ignoreFieldChange: true
			});
			//Item product category
			var itemInfo = getItemInfo(soLines[i].item);
			exceptionRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_item_cat',
				line: newLineNumber,
				value: itemInfo.itemCategory,
				ignoreFieldChange: true
			});
			if(!soLines[i].description){
				soLines[i].description = itemInfo.itemDescription;
			}
			//SO Item description
			exceptionRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_item_dsc',
				line: newLineNumber,
				value: soLines[i].description,
				ignoreFieldChange: true
			});
			//SO Older Version
			exceptionRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_order_oldvers',
				line: newLineNumber,
				value: soLines[i].oldVersion,
				ignoreFieldChange: true
			});
			//SO Qauntity
			exceptionRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_order_qty',
				line: newLineNumber,
				value: soLines[i].quantity,
				ignoreFieldChange: true
			});
			//SO Quantity on New Qty field
			exceptionRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_new_qty',
				line: newLineNumber,
				value: soLines[i].quantity,
				ignoreFieldChange: true
			});
			
			if(soLines[i].taxCode){
				//SO Tax code
				exceptionRecord.setCurrentSublistValue({
					sublistId: 'recmachcustrecord_prq_excitem',
					fieldId: 'custrecord_prq_excitem_item_tax',
					line: newLineNumber,
					value: soLines[i].taxCode,
					ignoreFieldChange: true
				});
			}
			if(soLines[i].itemRate){
				//SO Rate
				exceptionRecord.setCurrentSublistValue({
					sublistId: 'recmachcustrecord_prq_excitem',
					fieldId: 'custrecord_prq_excitem_order_rate',
					line: newLineNumber,
					value: soLines[i].itemRate,
					ignoreFieldChange: true
				});
				//SO Rate on New Rate field
				exceptionRecord.setCurrentSublistValue({
					sublistId: 'recmachcustrecord_prq_excitem',
					fieldId: 'custrecord_prq_excitem_new_rate',
					line: newLineNumber,
					value: soLines[i].itemRate,
					ignoreFieldChange: true
				});
			}else{
				//if no rate on SO get it from Netsuite item pricing list
				var itemRate = getItemRate(soLines[i].item,soCurrency);
				exceptionRecord.setCurrentSublistValue({
					sublistId: 'recmachcustrecord_prq_excitem',
					fieldId: 'custrecord_prq_excitem_new_rate',
					value:itemRate,
					ignoreFieldChange: true
				});
			}
			//SO Amount
			exceptionRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_order_amout',
				line: newLineNumber,
				value: soLines[i].amount,
				ignoreFieldChange: true
			});
			//SO Amount on New Amount field
			exceptionRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_new_amount',
				line: newLineNumber,
				value: soLines[i].amount,
				ignoreFieldChange: true
			});
			//SO Tax Amount on New Tax Amount field
			exceptionRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_new_tax',
				line: newLineNumber,
				value: soLines[i].taxAmount,
				ignoreFieldChange: true
			});
			exceptionRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_ship_via',
				line: newLineNumber,
				value: soLines[i].shipVia,
				ignoreFieldChange: true
			});
			exceptionRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_location',
				line: newLineNumber,
				value: soLines[i].locationItem,
				ignoreFieldChange: true
			});
			exceptionRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_po_from',
				line: newLineNumber,
				value: soLines[i].createPO,
				ignoreFieldChange: true
			});
			exceptionRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_po_vendor',
				line: newLineNumber,
				value: soLines[i].poVendor,
				ignoreFieldChange: true
			});			
			exceptionRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_order_reprodvers',
				line: newLineNumber,
				value: soLines[i].oldVersion,
				ignoreFieldChange: true
			});
			exceptionRecord.commitLine({
				sublistId: 'recmachcustrecord_prq_excitem'});
		}	
	}	
}

//This function is executed when user push the button on the Exception Record 'Validate CC'
function validateExceptionCC() {
	var exceptionReadRecord = CURRENTRECORDMODULE.get();
	exceptionRecord = RECORDMODULE.load({
		type: 'customrecord_prq_exceptions_header', 
		id: exceptionReadRecord.id,
		isDynamic: true,
		
	});	
	var actualStatus = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_status'
	});	
	if (actualStatus != 1){
		return;
	}	
	var exceptionItemLinesCount  = exceptionRecord.getLineCount({
		sublistId: 'recmachcustrecord_prq_excitem'
	}); 	
	//Get the item line info
	for (var i = exceptionItemLinesCount-1;i >= 0;i--){
		var excLineData = {}					
		excLineData.excType = exceptionRecord.getSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_exc_type',
			line: i
		});			
		excLineData.excQuantity = exceptionRecord.getSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_new_qty',
			line: i
		});
		if(!excLineData.excQuantity || excLineData.excQuantity == 0 || !excLineData.excType){
			exceptionRecord.removeLine({
				sublistId: 'recmachcustrecord_prq_excitem',
				line: i
			});
			continue;
		}				
	}
	exceptionRecord.setValue({
		fieldId: 'custrecord_prq_exc_status',
		value: 2
	});
	totalCalculation(exceptionRecord);
	exceptionRecord.save();
	
	location.reload();
}

function validateExceptionOPS() {
	var exceptionReadRecord = CURRENTRECORDMODULE.get();
	//load the current Exception record
	exceptionRecord = RECORDMODULE.load({
		type: 'customrecord_prq_exceptions_header', 
		id: exceptionReadRecord.id,
		isDynamic: true,
		
	});	
	var actualStatus = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_status'
	});
	//Status already OPS
	if (actualStatus != 2){
		return;
	}	
	var actualStatus = exceptionRecord.setValue({
		fieldId: 'custrecord_prq_exc_status',
		value: 3
	});
	exceptionRecord.save();
	location.reload();
}

function addMultiple() {
	var exceptionRecord = CURRENTRECORDMODULE.get();
	addSOLine(exceptionRecord);
}

function clearAllLines(scriptContext) {
	var exceptionRecord = CURRENTRECORDMODULE.get();
	
	var exceptionItemLinesCount  = exceptionRecord.getLineCount({
		sublistId: 'recmachcustrecord_prq_excitem'
	});
	
	for (var i = 0;i < exceptionItemLinesCount;i++){
		exceptionRecord.removeLine({
			sublistId: 'recmachcustrecord_prq_excitem',
			line: 0
		});
	}
}
	
function fillAllLines(scriptContext) {
	var exceptionRecord = CURRENTRECORDMODULE.get();
	var excType = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_exception_type',
	});
	var excDetails = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_exception_details',
	});
	var excOrigin = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_exception_origin',
	});
	var excResponsable = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_exception_responsable',
	});
	var excAction = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_product_action',
	});
	var exceptionItemLinesCount  = exceptionRecord.getLineCount({
		sublistId: 'recmachcustrecord_prq_excitem'
	}); 
	
	for (var i = 0;i < exceptionItemLinesCount;i++){
		exceptionRecord.selectLine({
			sublistId: 'recmachcustrecord_prq_excitem',
			line: i
		});
		exceptionCurrentItem = exceptionRecord.getCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_item'
		});
		exceptionOrderQty = exceptionRecord.getCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_order_qty'
		});
		exceptionRecord.setCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_exc_type',
			value: excType,
			forceSyncSourcing :true
		});
		exceptionRecord.setCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_exc_details',
			value: excDetails
		});
		exceptionRecord.setCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_new_qty',
			value: exceptionOrderQty
		});
		
		exceptionRecord.setCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_origin',
			value: excOrigin
		});
		exceptionRecord.setCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_responsability',
			value: excResponsable
		});
		exceptionRecord.setCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_product_action',
			value: excAction
		});
		getExcCategory(exceptionRecord)
		exceptionRecord.commitLine({
			sublistId: 'recmachcustrecord_prq_excitem',
			line: i
		});
	}
}

function updateAllLines() {
	var exceptionRecord = CURRENTRECORDMODULE.get();
	var createdSoId = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_created_from',
	});
	var createdSoRecord = RECORDMODULE.load({
		type: RECORDMODULE.Type.SALES_ORDER, 
		id: ~~createdSoId,
		isDynamic: true,
	});

	var nbLineException = exceptionRecord.getLineCount({
		sublistId : 'recmachcustrecord_prq_excitem'
	})

	try{
		for (var i = 0; i < nbLineException; i++){
			exceptionRecord.selectLine({
				sublistId: 'recmachcustrecord_prq_excitem',
				line: i
			});
			var itemInException = exceptionRecord.getCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_item'
			});
			var exceptionCurrentItemSoLine = exceptionRecord.getCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_order_line'
			});
			
			if (exceptionCurrentItemSoLine){
				
				var lineNumberInSo = createdSoRecord.findSublistLineWithValue({
					sublistId: 'item',
					fieldId: 'line',
					value: ~~exceptionCurrentItemSoLine
				});
				
				if (lineNumberInSo >= 0) {
					createdSoRecord.selectLine({
						sublistId: 'item',
						line: ~~lineNumberInSo
					});
					var itemInSo = createdSoRecord.getCurrentSublistValue({
						sublistId: 'item',
						fieldId: 'item'
					});
					
					if (itemInSo == itemInException){
						var createdSoOldVersion = createdSoRecord.getCurrentSublistValue({
							sublistId: 'item',
							fieldId: 'olditemid'
						});
						var createdSoQty = createdSoRecord.getCurrentSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_qty_ordered'
						});
						var createdSoRate = createdSoRecord.getCurrentSublistValue({
							sublistId: 'item',
							fieldId: 'rate'
						});
						var createdSoAmount = createdSoRecord.getCurrentSublistValue({
							sublistId: 'item',
							fieldId: 'amount'
						});
						var createdSoPoVendor = createdSoRecord.getCurrentSublistValue({
							sublistId: 'item',
							fieldId: 'povendor'
						});
						var createdSoShipVia = createdSoRecord.getCurrentSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_prq_ship_via_line_plum'
						});
						var createdSoLocationItem = createdSoRecord.getCurrentSublistValue({
							sublistId: 'item',
							fieldId: 'location'
						});
						var createdSoCreatedPo = createdSoRecord.getCurrentSublistValue({
							sublistId: 'item',
							fieldId: 'createdpo'
						});
						// log.debug ('old version', createdSoOldVersion)
						// log.debug ('qty', createdSoQty)
						// log.debug ('rate', createdSoRate)
						// log.debug ('amt', createdSoAmount)
						// log.debug ('po vendor', createdSoPoVendor)
						// log.debug ('ship via', createdSoShipVia)
						// log.debug ('location', createdSoLocationItem)
						// log.debug ('createdpo', createdSoCreatedPo)
						
						exceptionRecord.selectLine({
							sublistId : 'recmachcustrecord_prq_excitem',
							line      : i
						});
						exceptionRecord.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_prq_excitem',
							fieldId   : 'custrecord_prq_excitem_order_oldvers',
							value     : createdSoOldVersion,
							ignoreFieldChange: true
						});
						exceptionRecord.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_prq_excitem',
							fieldId   : 'custrecord_prq_excitem_order_qty',
							value     : createdSoQty,
							ignoreFieldChange: true
						});
						exceptionRecord.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_prq_excitem',
							fieldId   : 'custrecord_prq_excitem_order_rate',
							value     : createdSoRate,
							ignoreFieldChange: true
						});
						exceptionRecord.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_prq_excitem',
							fieldId   : 'custrecord_prq_excitem_order_amout',
							value     : createdSoAmount,
							ignoreFieldChange: true
						});
						exceptionRecord.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_prq_excitem',
							fieldId   : 'custrecord_prq_excitem_po_vendor',
							value     : createdSoPoVendor,
							ignoreFieldChange: true
						});
						exceptionRecord.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_prq_excitem',
							fieldId   : 'custrecord_prq_excitem_ship_via',
							value     : createdSoShipVia,
							ignoreFieldChange: true
						});
						exceptionRecord.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_prq_excitem',
							fieldId   : 'custrecord_prq_excitem_location',
							value     : createdSoLocationItem,
							ignoreFieldChange: true
						});
						exceptionRecord.setCurrentSublistValue({
							sublistId : 'recmachcustrecord_prq_excitem',
							fieldId   : 'custrecord_prq_excitem_po_from',
							value     : createdSoCreatedPo,
							ignoreFieldChange: true
						});	
						exceptionRecord.commitLine({
							sublistId: 'recmachcustrecord_prq_excitem',
							line: i
						});				
					}
				}
			}
		}
	}catch(e){
		log.error("error in the update of the line", e)
	}
}

// WIP - 
function duplicateLine() {
	console.log('StartDuplicate');
	var exceptionRecord = CURRENTRECORDMODULE.get();
	
	console.log(exceptionRecord);
	var copyFields = [
					'custrecord_prq_excitem_item',
					'custrecord_prq_excitem_item_dsc',
					'custrecord_prq_excitem_order_oldvers',
					'custrecord_prq_excitem_order_qty',
					'custrecord_prq_excitem_order_rate',
					'custrecord_prq_excitem_order_amout',
					'custrecord_prq_excitem_item_tax',
					'custrecord_prq_excitem_exc_type',
					'custrecord_prq_excitem_exc_details',
					'custrecord_prq_excitem_origin',
					'custrecord_prq_excitem_responsability',
					'custrecord_prq_excitem_product_action',
					'custrecord_prq_excitem_new_qty',
					'custrecord_prq_excitem_new_rate',
					'custrecord_prq_excitem_new_amount',
					'custrecord_prq_excitem_case'
					];
	console.log(exceptionRecord.line);
	
	if (!exceptionRecord.line){
		return;
	}
	for (i=0;i<copyFields.length;i++){
		var fromValue = exceptionRecord.getCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: copyFields[i]
		});
		console.log(fromValue)
	}
}

function totalCalculation(exceptionRecord){
	console.log('totalCalculation started');
	
	var subTotal = 0;
	var discountAmount = 0;
	var taxTotal = 0;
	var total = 0;	
	console.log('subTotal 1 ' + typeof subTotal);
	//Discount Item
	discountAmount = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_compensation_amount'
	});
	
	var exceptionItemLinesCount  = exceptionRecord.getLineCount({
		sublistId: 'recmachcustrecord_prq_excitem'
	});  
	
	var currIndex = exceptionRecord.getCurrentSublistIndex({
		sublistId: 'recmachcustrecord_prq_excitem'
	});	
	
	//Manage the calcul on line not commit yet	
	var calculateTotal = true;

	var lineAmount = exceptionRecord.getCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_new_amount'
	});
	var lineTax = exceptionRecord.getCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_new_tax'
	});

	if(!lineAmount || !lineTax){
		calculateTotal = false;
	};

	if (calculateTotal){			
		//SUBTOTAL
		console.log('line amount ' + lineAmount);
		subTotal += lineAmount;
		console.log('subTotal 2' + typeof subTotal);
		//Tax total
		taxTotal += lineTax;	
		total +=  lineAmount + lineTax;	
	}	
	//Manage the calcul on line already commmitted
	for (var j = 0;j < exceptionItemLinesCount;j++){		
		//To skip the current line previously calculated
		if(j == currIndex){
			continue;
		}			
		var lineAmount = exceptionRecord.getSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_new_amount',
			line:j
		});
		var lineTax = exceptionRecord.getSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_new_tax',
			line:j
		});
		if(!lineAmount || !lineTax){
			calculateTotal = false;
		};
		//SUBTOTAL		
		subTotal += lineAmount;
		//Tax total
		taxTotal += lineTax;	
		total +=  lineAmount + lineTax;				
	}	
	//Set totals Header Value
	subTotal =  parseFloat(subTotal).toFixed(2);	
	
	exceptionRecord.setValue({			
		fieldId: 'custrecord_prq_exc_subtotal',
		value: subTotal
	});

	var discountTaxRate = searchTaxRate(DEFAULTTAXCODE);
	discountTaxRate = 1 + discountTaxRate;
	var discountAmountNoTax = Math.abs(discountAmount) / discountTaxRate;
	discountAmountNoTax = discountAmountNoTax.toFixed(2);

	//Force the discount amount to be positive
	exceptionRecord.setValue({			
		fieldId: 'custrecord_prq_exc_discount_item',
		value: Math.abs(discountAmountNoTax)
	});

	discountTax = Math.abs(discountAmount) - discountAmountNoTax;
	taxTotal = taxTotal - discountTax
	taxTotal = taxTotal.toFixed(2);
	/*discountTax = Math.abs(discountAmount) * discountTaxRate;
	discountTax = discountTax.toFixed(2);
	taxTotal = taxTotal - discountTax
	taxTotal = taxTotal.toFixed(2);*/	
	exceptionRecord.setValue({
		fieldId: 'custrecord_prq_exc_tax_total',
		value: taxTotal
	});	
	total = total - Math.abs(discountAmount);
	total = total.toFixed(2);	
	exceptionRecord.setValue({
		fieldId: 'custrecord_prq_exc_total',
		value: total
	});	

	console.log('totalCalculation ended');
}

function searchTaxRate(taxId){
	if(!taxId)
	{
		taxId = DEFAULTTAXCODE;
	}
	var taxItemSearch = SEARCHMODULE.create({
			type: 'salestaxitem',
			filters:
			[
				['internalid','anyof',taxId]
			],
			columns:
			[
				'rate'
			]
		});
	var taxItemSearchResults = taxItemSearch.run().getRange({ start: 0, end: 1 });	
	for(var i = 0; i < taxItemSearchResults.length; i++) {
		taxRate = taxItemSearchResults[i].getValue('rate');		
	}
	var taxRate = parseFloat(taxRate) / 100.0;
	return taxRate;		
}

function lineCalculation(exceptionRecord){	
	console.log('lineCalculation started.');
	var excNewQty = exceptionRecord.getCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_new_qty'
	});	
	var excNewRate = exceptionRecord.getCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_new_rate'
	});

	var excItemTax = exceptionRecord.getCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_item_tax'
	});

	var excActionOnTotal = exceptionRecord.getCurrentSublistText({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_act_ontotal'
	});

	var itemTaxRate = searchTaxRate(excItemTax);

	if(excNewRate && excNewQty ){
		var finalAmount = excNewRate * excNewQty;	
		var finalTax = finalAmount * itemTaxRate;		
	} else {
		var finalAmount = 0;	
		var finalTax = 0;
	}
	if (excActionOnTotal == 'POSITIVE_LINE'){
		finalAmount = Math.abs(finalAmount);		
		finalTax = Math.abs(finalTax);
	} else if(excActionOnTotal == 'NEGATIVE_LINE'){
		finalAmount = Math.abs(finalAmount)*-1;		
		finalTax = Math.abs(finalTax)*-1;
	} else if(excActionOnTotal == 'NO_ACTION'){
		finalAmount = 0;		
		finalTax = 0;
	}
	exceptionRecord.setCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_new_amount',
		value:finalAmount,
		ignoreFieldChange: true
	});
	exceptionRecord.setCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_new_tax',
		value:finalTax,
		ignoreFieldChange: true
	});	
	console.log('lineCalculation ended.');
}

/**
 * This function get the value in the sublist action from the matrix record details
 * @param {*} currentRecord 
 * @returns 
 */
function getActions(currentRecord){	
	var functionResponse = true;
	var excProductAction = currentRecord.getCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_product_action',
	});
	var excType = currentRecord.getCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_exc_type',
	});
	var excDetails = currentRecord.getCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_exc_details',
	});
	
	var filterList = []; 
	if(excProductAction){
		filterList.push(['custrecord_prq_excact_parent.custrecord_prq_excact_actiontype','anyof',excProductAction]);
		filterList.push('AND');
		if(excDetails){
			filterList.push(['internalidnumber','equalto',excDetails])
		} else if (excType){
			filterList.push(['custrecord_prq_excdet_type','anyof',excType]);
			filterList.push('AND');
			filterList.push(['custrecord_prq_excdet_details','anyof','@NONE@'])
		} else {
			var filterList = [];
		}
	}
	var action = {
		actionOnTotal:'',
		actionToDo:''
	};
	if (filterList.length > 0){		
		var actionSearchObj = SEARCHMODULE.create({
			type: 'customrecord_prq_exceptions_details',
			filters: 	
				filterList,
			columns:
				[
					SEARCHMODULE.createColumn({
						name: 'custrecord_prq_excact_ontotal',
						join: 'CUSTRECORD_PRQ_EXCACT_PARENT'
					}),
					SEARCHMODULE.createColumn({
						name: 'custrecord_prq_excact_todo',
						join: 'CUSTRECORD_PRQ_EXCACT_PARENT'
					})
				]
			});
		var actionSearchObjResults = actionSearchObj.run().getRange({ start: 0, end: 1 });
		for(var i = 0; i < actionSearchObjResults.length; i++) {
			var allValues = actionSearchObjResults[i].getAllValues();			
			action.actionOnTotal = allValues['CUSTRECORD_PRQ_EXCACT_PARENT.custrecord_prq_excact_ontotal'][0]['value'];
			action.actionToDo = allValues['CUSTRECORD_PRQ_EXCACT_PARENT.custrecord_prq_excact_todo'][0]['value'];
			if(allValues['CUSTRECORD_PRQ_EXCACT_PARENT.custrecord_prq_excact_ontotal'][0]['text'] =='ERROR'||
			allValues['CUSTRECORD_PRQ_EXCACT_PARENT.custrecord_prq_excact_todo'][0]['text'] =='ERROR') {
				function success(result) { console.log('Success with value: ' + result) } 
				function failure(reason) { console.log('Failure: ' + reason) } 
		
				DIALOGMODULE.alert({ 
					title: 'Click OK pour continuer.', 
					message: 'L\'association de cette Action avec l\'exception details sélectionné n\'est pas autorise' 
				}).then(success).catch(failure);
				action.actionOnTotal = '';
				action.actionToDo = '';
				functionResponse = false
			}
			var soOrderLine = currentRecord.getCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: '	custrecord_prq_excitem_order_line'
			});
			if (allValues['CUSTRECORD_PRQ_EXCACT_PARENT.custrecord_prq_excact_ontotal'][0]['text'] == 'CREATE_RETURN_AUTHORIZATION' && !soOrderLine){
				function success(result) { console.log('Success with value: ' + result) } 
				function failure(reason) { console.log('Failure: ' + reason) } 
		
				DIALOGMODULE.alert({ 
					title: 'Click OK pour continuer.', 
					message: 'L\'association de cette Action avec l\'exception details sélectionné n\'est pas autorise, cette ligne n\'est pas issue de la SO.' 
				}).then(success).catch(failure);
				action.actionOnTotal = '';
				action.actionToDo = '';
				functionResponse =  false;
			}
		}
		if(actionSearchObjResults.length <= 0){
			function success(result) { console.log('Success with value: ' + result) } 
					function failure(reason) { console.log('Failure: ' + reason) } 
			
					DIALOGMODULE.alert({ 
						title: 'Click OK pour continuer.', 
						message: 'Cette action n\'existe pas pour la combination de l\'action et de  l\'exception details sélectionné.' 
					}).then(success).catch(failure);
					action.actionOnTotal = '';
					action.actionToDo = '';
					functionResponse = false;
		}
	}
	
	currentRecord.setCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_act_ontotal',
		value: action.actionOnTotal
	});
	currentRecord.setCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_act_todo',
		value: action.actionToDo
	});
	
	
	return functionResponse;
}

function getExcCategory(currentRecord){
	try {		
		var excType = currentRecord.getCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_exc_type',
		});
		var excDetails = currentRecord.getCurrentSublistValue({
			sublistId: 'recmachcustrecord_prq_excitem',
			fieldId: 'custrecord_prq_excitem_exc_details',
		});console.log(excType);console.log(excDetails)
		var filterList = []; 
		if(excDetails){			
			filterList.push(['internalidnumber','equalto',excDetails])
		} else if (excType){
			filterList.push(['custrecord_prq_excdet_type','anyof',excType]);
			filterList.push('AND');
			filterList.push(['custrecord_prq_excdet_details','anyof','@NONE@'])
		}	
		if (filterList.length > 0){		
			var excCategorySearch = SEARCHMODULE.create({
				type: 'customrecord_prq_exceptions_details',
				filters: 	
					filterList,
				columns:
					[
						'custrecord_prq_excdet_exc_category'
					]
			});console.log(excCategorySearch);
			var excCategorySearchResults = excCategorySearch.run().getRange({ start: 0, end: 1 });
			for(var i = 0; i < excCategorySearchResults.length; i++) {
				console.log(excCategorySearchResults[i]);
				var excCategory = excCategorySearchResults[i].getValue('custrecord_prq_excdet_exc_category')
			}
			currentRecord.setCurrentSublistValue({
				sublistId: 'recmachcustrecord_prq_excitem',
				fieldId: 'custrecord_prq_excitem_exc_cat',
				value: excCategory
			});
		}
	} catch(e){
		console.log('Error:'+e);
	}
}
function getItemColorParent(item){
	var itemFieldLookUp = SEARCHMODULE.lookupFields({
		type: SEARCHMODULE.Type.ITEM,
		id: item,
		columns: ['parent', 'custitem_prq_couleur_matrix_options','offersupport']
	});
	
	var itemData = {};
	
	if(!itemFieldLookUp.offersupport){		
		if(itemFieldLookUp.parent.length>0){
			itemData.item =  itemFieldLookUp.parent[0].value;
		}			
	} else {
		itemData.item = item;			
	}
	if(itemFieldLookUp.custitem_prq_couleur_matrix_options && itemData.item){
		itemData.color =  itemFieldLookUp.custitem_prq_couleur_matrix_options[0].value;
	} 	
	return itemData;
}

function setItemData(exceptionRecord){
	var excCurrentItem = exceptionRecord.getCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_item'
	});
	var excCurrency = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_so_currency'
	});

	var excCurrentItemRate = getItemRate(excCurrentItem,excCurrency);
	exceptionRecord.setCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_new_rate',
		value: excCurrentItemRate,
		ignoreFieldChange: true
	});	
	var itemInfo = getItemInfo(excCurrentItem);
	exceptionRecord.setCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_item_dsc',
		value:itemInfo.itemDescription,
		ignoreFieldChange: true
	});
	exceptionRecord.setCurrentSublistValue({
		sublistId: 'recmachcustrecord_prq_excitem',
		fieldId: 'custrecord_prq_excitem_item_cat',
		value:itemInfo.itemCategory,
		ignoreFieldChange: true
	});

}
/**
 * This function return the item rate pricing of the current selected line based on the exception currency
 * @param {*} exceptionRecord 
 * @returns 
 */
function getItemRate(item, currency){	
	if(!item || !currency){
		return;
	}
	var itemRate = 0;
	var pricingSearch = SEARCHMODULE.create({
			type: SEARCHMODULE.Type.PRICING,
			filters:
			[
				['item',SEARCHMODULE.Operator.IS,item], 
				'AND', 
				['currency',SEARCHMODULE.Operator.IS,currency]
			],
			columns:
			[
				'unitprice'				
			]
		});
	var pricingSearchResults = pricingSearch.run().getRange({ start: 0, end: 1 });	
	for(var i = 0; i < pricingSearchResults.length; i++) {
		itemRate = pricingSearchResults[i].getValue('unitprice');		
	}
	return itemRate;
}

/**
 * This function return the item description and category of the item
 * @param {*} item 
 * @returns 
 */
function getItemInfo(item){	
	if(!item){
		return;
	}
	var itemSearch = SEARCHMODULE.create({
			type: SEARCHMODULE.Type.ITEM,
			filters:
			[
				['internalidnumber',SEARCHMODULE.Operator.EQUALTO,item]
			],
			columns:
			[
				'salesdescription','custitem_plum_product_category'				
			]
		});
	var itemSearchResults = itemSearch.run().getRange({ start: 0, end: 1 });
	var itemInfo = {
		itemDescription:'',
		itemCategory:''
	};
	for(var i = 0; i < itemSearchResults.length; i++) {		
		itemInfo.itemDescription = itemSearchResults[i].getValue('salesdescription');
		itemInfo.itemCategory = itemSearchResults[i].getValue('custitem_plum_product_category');
	}	
	return itemInfo;
}

function getExceptionName(soFrom){	
	var fieldLookUp = SEARCHMODULE.lookupFields({
		type: SEARCHMODULE.Type.SALES_ORDER,
		id: soFrom,
		columns: ['tranid']
	});
	
	if (fieldLookUp.tranid){
		var soId = fieldLookUp.tranid;		
	}
	
	var exceptionSearchObj = SEARCHMODULE.create({
			type: 'customrecord_prq_exceptions_header',
			filters:
			[
				['custrecord_prq_exc_created_from','anyof',soFrom]
			],
			columns:
			[
				'internalid'
			]
		});
	var searchResultCount = exceptionSearchObj.runPaged().count;
	searchResultCount = searchResultCount+1;
	var exceptionName = soId + '-E' + searchResultCount;
	return exceptionName;
}

function getOriginalSO(exceptionRecord){
	var originalSO = exceptionRecord.getValue({
		fieldId:'custrecord_prq_exc_originial_so'
	});
	if(originalSO){
		return false;
	}
	var soFrom = exceptionRecord.getValue('custrecord_prq_exc_created_from');	
	var nextSO = soFrom;
    var originalSO = soFrom;
    var parentFound = true;
	while(parentFound){
		parentFound = false;
		var excItemSearch = SEARCHMODULE.create({
			type: "customrecord_prq_exceptions_items",
			filters:
			[
				["custrecord_prq_excitem_related_so","anyof",nextSO]
			],
			columns:
			[
				SEARCHMODULE.createColumn({
					name: "custrecord_prq_exc_created_from",
					join: "CUSTRECORD_PRQ_EXCITEM"
				})                    
			]
		});
		var excItemRecordResults = excItemSearch.run().getRange({
			start: 0,
			end: 1
		});
		for (var i = 0; i < excItemRecordResults.length; i++) {                
			var originalSO = excItemRecordResults[i].getValue({
				name: 'custrecord_prq_exc_created_from',
				join: 'CUSTRECORD_PRQ_EXCITEM'
			});
			nextSO = originalSO;
			parentFound = true;
		}
	}
	exceptionRecord.setValue({
		fieldId:'custrecord_prq_exc_originial_so',
		value:originalSO
	});
	return true;
}