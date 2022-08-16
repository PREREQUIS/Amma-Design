var RECORDMODULE, RUNTIMEMODULE,SEARCHMODULE,URLMODULE,WIDGETMODULE,FILEMODULE;


/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/record",'N/runtime',"N/search","N/url",'N/ui/serverWidget','N/file'], runUserEventScript);


function runUserEventScript(record,runtime,search,url,serverwidget, file) {
	RECORDMODULE = record;
	RUNTIMEMODULE = runtime;
	SEARCHMODULE = search;
	URLMODULE = url;
	WIDGETMODULE = serverwidget;
	FILEMODULE = file
	return {
        beforeLoad: _beforeLoad,
        //beforeSubmit: _beforeSubmit,
        //afterSubmit: _afterSubmit
    };    
}

/**
 * Function definition to be triggered before record is loaded.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.newRecord - New record
 * @param {string} scriptContext.type - Trigger type
 * @param {Form} scriptContext.form - Current form
 * @Since 2015.2
 */
function _beforeLoad(scriptContext) {
	scriptContext.form.clientScriptModulePath = 'SuiteScripts/Exceptions Management/prq_cs_exceptions.js';				
	
	var exceptionRecord     = scriptContext.newRecord;
	var exceptionStatus     = exceptionRecord.getValue('custrecord_prq_exc_status');
	var exceptionName       = exceptionRecord.getValue({fieldId: 'name'});
	var imgNameFormat       = exceptionName + " - img"
	var lengthImgNameFormat = imgNameFormat.length
	
	//This section generate the sublist for printing RC document
	if (scriptContext.type === 'print' || RUNTIMEMODULE.executionContext === 'MAPREDUCE') {
		//Create Sublist Items
      
		var sublist = scriptContext.form.addSublist({
			id : 'custpage_sublist_to_print',
			type : WIDGETMODULE.SublistType.INLINEEDITOR,
			label : 'Inline Editor Sublist'
		});	
		var reprodSO = scriptContext.form.addField({
			id : 'custpage_reprodso',
			type : WIDGETMODULE.FieldType.TEXT,
			label : 'Reprod SO'
		});	
		sublist.addField({
			id: 'sku',
			type: WIDGETMODULE.FieldType.TEXT,
			label: 'SKU'
		});
		sublist.addField({
			id: 'createdpo',
			type: WIDGETMODULE.FieldType.TEXT,
			label: 'PO'
		});
		sublist.addField({
			id: 'description',
			type: WIDGETMODULE.FieldType.TEXT,
			label: 'Description (EN)'
		});
		sublist.addField({
			id: 'quantity',
			type: WIDGETMODULE.FieldType.TEXT,
			label: 'Quantity'
		});
		sublist.addField({
			id: 'exccat',
			type: WIDGETMODULE.FieldType.TEXT,
			label: 'Exc. Cat'
		});
		sublist.addField({
			id: 'exctype',
			type: WIDGETMODULE.FieldType.TEXT,
			label: 'Exc. Type'
		});
		sublist.addField({
			id: 'excdetails',
			type: WIDGETMODULE.FieldType.TEXT,
			label: 'Exc. Details'
		});
		sublist.addField({
			id: 'origin',
			type: WIDGETMODULE.FieldType.TEXT,
			label: 'Orig. & Resp.'
		});
		sublist.addField({
			id: 'action',
			type: WIDGETMODULE.FieldType.TEXT,
			label: 'Action'
		});
		sublist.addField({
			id: 'vendor',
			type: WIDGETMODULE.FieldType.TEXT,
			label: 'Vendor'
		});
		sublist.addField({
			id: 'transporter',
			type: WIDGETMODULE.FieldType.TEXT,
			label: 'Transporter'
		});
		sublist.addField({
			id: 'locationitem',
			type: WIDGETMODULE.FieldType.TEXT,
			label: 'Location'
		});
		
		if (!exceptionRecord.id)
		{
			return;
		}
		//Set the sublist item values
		var excLineSearch = SEARCHMODULE.create({
			type: "customrecord_prq_exceptions_items",
			filters:
			[
				["custrecord_prq_excitem","anyof",exceptionRecord.id]
			],
			columns:
			[
				SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_item", label: "Item"}),
				SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_item_dsc", label: "Description"}),
				SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_new_qty", label: "Quantity"}),
				SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_exc_cat", label: "Exception Category"}),
				SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_exc_type", label: "Exception Type"}),
				SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_exc_details", label: "Exception details"}),
				SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_origin", label: "Exception Origin"}),
				SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_responsability", label: "Exception Responsability"}),
				SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_product_action", label: "Product Action"}),
				SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_act_todo", label: "Action To Do"}),
				SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_related_so", label: "Related SO"}),
				SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_ship_via", label: "Ship Via"}),
				SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_location", label: "Location"}),
				SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_po_from", label: "Created PO"}),
				SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_po_vendor", label: "PO Vendor"})
			]
		});
		var searchResultCount = excLineSearch.runPaged().count;
		var resultSet = excLineSearch.run();
		var resultRange = resultSet.getRange({
			start: 0,
			end: 100
		});
		for (var i = 0; i < resultRange.length; i++) {		
			var srchSKU = resultRange[i].getText({
				name: 'custrecord_prq_excitem_item'
			}) || ' ';
			var srchDsc = resultRange[i].getValue({
				name: 'custrecord_prq_excitem_item_dsc'
			}) || ' ';
			var srchQty = resultRange[i].getValue({
				name: 'custrecord_prq_excitem_new_qty'
			}) || ' ';
			var srchExcCat = resultRange[i].getText({
				name: 'custrecord_prq_excitem_exc_cat'
			}) || ' ';
			var srchExcType = resultRange[i].getText({
				name: 'custrecord_prq_excitem_exc_type'
			}) || ' ';
			var srchExcDetails = resultRange[i].getText({
				name: 'custrecord_prq_excitem_exc_details'
			}) || ' ';
			var srchOrigin = resultRange[i].getText({
				name: 'custrecord_prq_excitem_origin'
			}) || ' ';
			var srchResp = resultRange[i].getText({
				name: 'custrecord_prq_excitem_responsability'
			}) || ' ';
			var srchActToDo = resultRange[i].getText({
				name: 'custrecord_prq_excitem_act_todo'
			}) || ' ';
			var srchRelSO = resultRange[i].getText({
				name: 'custrecord_prq_excitem_related_so'
			}) || ' ';
			if(srchActToDo == 'CREATE_SO' || srchActToDo == 'CREATE_SO_REPROD'){
				reprodSO.defaultValue = srchRelSO
			}
			var originAndResp = srchOrigin;
			if (srchResp & srchOrigin){
				originAndResp +=  +' & '+  srchResp;
			} else if ( srchResp & !srchOrigin){
				originAndResp = srchResp;
			}
			var srchAction = resultRange[i].getText({
				name: 'custrecord_prq_excitem_product_action'
			}) || ' ';			
			var srchShipVia = resultRange[i].getText({
				name: 'custrecord_prq_excitem_ship_via'
			}) || ' ';
			var srchLocation = resultRange[i].getText({
				name: 'custrecord_prq_excitem_location'
			}) || ' ';
			var srchCreatedPO = resultRange[i].getText({
				name: 'custrecord_prq_excitem_po_from'
			}) || ' ';
			var srchPOVendor = resultRange[i].getText({
				name: 'custrecord_prq_excitem_po_vendor'
			}) || ' ';
			//set Sublist Value
			sublist.setSublistValue({
				id: 'sku',
				line: i,
				value: srchSKU
			});	
			sublist.setSublistValue({
				id: 'description',
				line: i,
				value: srchDsc
			});
			sublist.setSublistValue({
				id: 'quantity',
				line: i,
				value: srchQty
			});			
			sublist.setSublistValue({
				id: 'exccat',
				line: i,
				value: srchExcCat
			});
			sublist.setSublistValue({
				id: 'exctype',
				line: i,
				value: srchExcType
			});
			sublist.setSublistValue({
				id: 'excdetails',
				line: i,
				value: srchExcDetails
			});
			sublist.setSublistValue({
				id: 'origin',
				line: i,
				value: originAndResp 
			});
			sublist.setSublistValue({
				id: 'action',
				line: i,
				value: srchAction
			});
			sublist.setSublistValue({
				id: 'vendor',
				line: i,
				value: srchPOVendor
			});
			sublist.setSublistValue({
				id: 'transporter',
				line: i,
				value: srchShipVia
			});
			sublist.setSublistValue({
				id: 'locationitem',
				line: i,
				value: srchLocation
			});
			sublist.setSublistValue({
				id: 'createdpo',
				line: i,
				value: srchCreatedPO
			});
		}
		//Create Sublist IMG
		var sublistImage = scriptContext.form.addSublist({
			id : 'custpage_sublist_image',
			type : WIDGETMODULE.SublistType.INLINEEDITOR,
			label : 'Sublist Image'
		});
		sublistImage.addField({
			id: 'imgurl',
			type: WIDGETMODULE.FieldType.TEXT,
			label: 'URL'
		});
		sublistImage.addField({
			id: 'imgname',
			type: WIDGETMODULE.FieldType.TEXT,
			label: 'Name'
		});
		//Set File Img Sublist
		var excImgSearch = SEARCHMODULE.create({
			type: "customrecord_prq_exceptions_header",
			filters:
			[
				["internalidnumber","equalto",exceptionRecord.id]
			],
			columns:
			[	
				SEARCHMODULE.createColumn({
				name: "internalid",
				join: "file",
				label: "Internal ID"
			 	}),			
				SEARCHMODULE.createColumn({
					name: "url",
					join: "file",
					label: "URL"
				}),
				SEARCHMODULE.createColumn({
					name: "name",
					join: "file",
					label: "Name"
				})
			]
		});
		var resultSetImg = excImgSearch.run();
		var resultRangeImg = resultSetImg.getRange({
			start: 0,
			end: 100
		});
		for (var i = 0; i < resultRangeImg.length; i++) {
			var srchImgURL = resultRangeImg[i].getValue({
				name: "url",
				join: "file"
			}) || ' ';
			var srchImgName = resultRangeImg[i].getValue({
				name: "Name",
				join: "file"
			}) || ' ';
			var srchImgId = resultRangeImg[i].getValue({
				name: "internalid",
				join: "file"
			}) || ' ';

			if (srchImgId != ' '){
				var fileObj = FILEMODULE.load({
					id: ~~srchImgId
				});
				fileObj.isOnline = true;
				if (srchImgName.substring(0,lengthImgNameFormat) != imgNameFormat){
					var myImgName = imgNameFormat + (i+1).toString()
					fileObj.name = myImgName
					srchImgName = myImgName
				}
				var fileId = fileObj.save();
			}
			
			//set Sublist Value
			srchImgURL = 'https://' + URLMODULE.resolveDomain({hostType: URLMODULE.HostType.APPLICATION}) + srchImgURL;
			sublistImage.setSublistValue({
				id: 'imgurl',
				line: i,
				value: srchImgURL
			});	
			sublistImage.setSublistValue({
				id: 'imgname',
				line: i,
				value: srchImgName
			});	
		}
	}
	// End of the printing condition

	//Hide Button
	//create an inline html field
	var hideField = scriptContext.form.addField({
		id:'custpage_hide_fields',
		label:'Hidden',
		type: WIDGETMODULE.FieldType.INLINEHTML
	});
	var src = "";
	if(scriptContext.type == scriptContext.UserEventType.VIEW){
		src += 'jQuery("#recmachcustrecord_prq_excitem_main_form").hide();';
	}
	if(scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT){
		src += 'jQuery("#tbl_newrec307").hide();';
		src += 'jQuery("#tbl_custpage_dad_button_recmachcustrecord_prq_excitem").hide();';	
		src += 'jQuery("#tdbody_custpage_dad_button_recmachcustrecord_prq_excitem").hide();';			
	}
	hideField.defaultValue = "<script>jQuery(function($){require([], function(){" + src + ";})})</script>"
	
	
	//Show button Validation CC if Exception status is New
	if(scriptContext.type == scriptContext.UserEventType.VIEW && RUNTIMEMODULE.executionContext === RUNTIMEMODULE.ContextType.USER_INTERFACE && exceptionStatus == 1) {
		scriptContext.form.addButton({
			id : 'custpage_button_validate',
			label : 'Validation CC',
			functionName : 'validateExceptionCC()'
		});			
	}
	//Show button Validation CC if Exception status is Validation CC	
	if(scriptContext.type == scriptContext.UserEventType.VIEW && RUNTIMEMODULE.executionContext === RUNTIMEMODULE.ContextType.USER_INTERFACE && exceptionStatus == 2) {
		scriptContext.form.addButton({
			id : 'custpage_button_validate',
			label : 'Validated OPS',
			functionName : 'validateExceptionOPS()'
		});			
	}
	//Show button add multiple / Clear All Lines / Fill to All Lines / Duplicate Lines when EDIT MODE
	if((scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT) && RUNTIMEMODULE.executionContext === RUNTIMEMODULE.ContextType.USER_INTERFACE) {
		scriptContext.form.addButton({
			id : 'custpage_button_add',
			label : 'Add multiple',
			functionName : 'addMultiple()'
		});
		scriptContext.form.addButton({
			id : 'custpage_button_clear',
			label : 'Clear All Lines',
			functionName : 'clearAllLines()'
		});
		scriptContext.form.addButton({
			id : 'custpage_button_fill',
			label : 'Fill to All Lines',
			functionName : 'fillAllLines()'
		});
		scriptContext.form.addButton({
			id : 'custpage_button_update',
			label : 'Update Lines',
			functionName : 'updateAllLines()'
		});
//		scriptContext.form.addButton({
//			id : 'custpage_button_duplicate',
//		    label : 'Duplicate Line',
//		    functionName : 'duplicateLine()'
//		});
	}
}

/**
 * Function definition to be triggered before record is loaded.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.newRecord - New record
 * @param {Record} scriptContext.oldRecord - Old record
 * @param {string} scriptContext.type - Trigger type
 * @Since 2015.2
 */
function _beforeSubmit(scriptContext) {
	
}

/**
 * Function definition to be triggered before record is loaded.
 *
 * @param {Object} scriptContext
 * @param {Record} scriptContext.newRecord - New record
 * @param {Record} scriptContext.oldRecord - Old record
 * @param {string} scriptContext.type - Trigger type
 * @Since 2015.2
 */
function _afterSubmit(scriptContext) {
}
