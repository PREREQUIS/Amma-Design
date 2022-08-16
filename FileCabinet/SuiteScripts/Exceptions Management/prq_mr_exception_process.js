var RECORDMODULE, SEARCHMODULE, EMAILMODULE, RUNTIME;

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search','N/email','N/runtime'], runMapReduce);

//********************** MAIN FUNCTION **********************
function runMapReduce(record,search, email, runtime) {
    RECORDMODULE  = record;
    SEARCHMODULE  = search;   
    EMAILMODULE   = email;
    RUNTIMEMODULE = runtime;

    var returnObj = {};
    returnObj['getInputData'] = _getInputData;
    returnObj['map'] = _map;
    returnObj['reduce'] = _reduce;
    returnObj['summarize'] = _summarize;
    return returnObj;
}

/**
 * Marks the beginning of the Map/Reduce process and generates input data.
 *
 * @typedef {Object} ObjectRef
 * @property {number} id - Internal ID of the record instance
 * @property {string} type - Record type id
 *
 * @return {Array|Object|Search|RecordRef} inputSummary
 * @since 2015.1
 */
function _getInputData() {
    var exceptionSearch = SEARCHMODULE.create({
        type: "customrecord_prq_exceptions_header",
        filters:
        [
            ["custrecord_prq_exc_status","anyof","3"]
        ],
        columns:
        [
            'internalid','name'
        ]
        });
    
    return exceptionSearch;
}
/**
 * Executes when the map entry point is triggered and applies to each key/value pair.
 *
 * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
 * @since 2015.1
 */
function _map(scriptContext) {
    log.debug('Map Started');

    var searchResult = JSON.parse(scriptContext.value);

    try {
        var ExceptionId = ~~searchResult.id;
        var ExceptionName = searchResult.values.name;

        scriptContext.write({
            key   : ~~ExceptionId,
            value :  ExceptionName
        });
    } catch (e) {
        log.error("error in the map", e);
        log.error("search result is", searchResult);
    }
}

/**
 * Executes when the reduce entry point is triggered and applies to each group.
 *
 * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
 * @since 2015.1
 */
function _reduce(context) {
    log.debug('Reduce Started');

    var exceptionIdReduce = context.key;
    var exceptionNameReduce = context.values[0];

    var soRecord = undefined;
    var raRecord = undefined;
    var createTask = false;
    var tranTypeLine = [];
    log.audit('Exception Name processing:', exceptionNameReduce);
    //Load the exception Record
	exceptionRecord = RECORDMODULE.load({
		type: 'customrecord_prq_exceptions_header', 
		id: ~~exceptionIdReduce,
		isDynamic: true,
		
	});
	var actualStatus = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_status'
	});
	if (actualStatus != 3){ // TO BE PUT BACK
		return;
	}
		
	//Get the exception primary info   
    var excTotal = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_total'
	});	
	var excCustomer = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_customer'
	});	
	var excOriginator = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_created_by'
	});
	var excDateReported = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_date_reported'
	});
	var excComment = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_comment'
	});
    var internalComment = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_internal_comment'
	});
	var excId = exceptionRecord.getValue({
		fieldId: 'id'
	});
	var excName = exceptionRecord.getValue({
		fieldId: 'name'
	});
    var excOriginalSO = exceptionRecord.getText({
		fieldId: 'custrecord_prq_exc_originial_so'
	});
    var excOriginalSOId = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_originial_so'
	});
	var excSOFrom = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_created_from'
	});	
    var orderType = 6; // Reorder
    var excTask = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_task_related'
	});
    var starOrder = exceptionRecord.getValue({
		fieldId: 'custrecord_prq_exc_reprod_is_starorder'
	});	
    //Get the item line info
	var exceptionItemLinesCount  = exceptionRecord.getLineCount({
		sublistId: 'recmachcustrecord_prq_excitem'
	});
    //Load created from SO
    soFromRecord = RECORDMODULE.load({
        type: RECORDMODULE.Type.SALES_ORDER,
        id: excSOFrom,
        isDynamic: true,
        
    });        
    soOriginalRecord = RECORDMODULE.load({
        type: RECORDMODULE.Type.SALES_ORDER,
        id: excOriginalSOId,
        isDynamic: true,
        
    });
	for (var i = exceptionItemLinesCount-1;i >= 0;i--){
        let line = i + 1;
        log.debug('Get Exception line data:'+line);
        var excLine = exceptionRecord.selectLine({
            sublistId:'recmachcustrecord_prq_excitem',
            line: i
        });        
        tranTypeLine[i] = '';             
        var excLineData = {
            excLineId:undefined,
            excItem:undefined,
            excType:undefined,
            excDetails:undefined,
            caseIssueId:undefined,
            excOrigin:undefined,
            excResponsability:undefined,
            excRate:undefined,
            excQuantity:undefined,
            actionToDo:undefined,
            soRecord:undefined,
            caseId:undefined,
            taskId:undefined,
            actionToDoId:undefined,
            grossAmount : undefined,
            amtNewProduct : undefined,
            taxNewProduct: undefined
        };
        try{
            excLineData.excLineId = exceptionRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'id'
            });
            excLineData.excItem = exceptionRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_item'
            });
            excLineData.excType = exceptionRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_exc_type'
            });
            excLineData.excDetails = exceptionRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_exc_details'
            });
            excLineData.excOrigin = exceptionRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_origin'
            });
            excLineData.excResponsability = exceptionRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_responsability'
            });
            excLineData.excRate = exceptionRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_new_rate'
            });
            excLineData.excQuantity = exceptionRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_new_qty'
            });
            excLineData.actionToDo = exceptionRecord.getCurrentSublistText({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_act_todo'
            });
            excLineData.actionToDoId = exceptionRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_product_action'
            });
            excLineData.soRecord = exceptionRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_related_so'
            }); 
            excLineData.caseId = exceptionRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_case'
            }); 
            excLineData.taskId = exceptionRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_related_task'
            }); 
            excLineData.grossAmount = exceptionRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_new_amount'
            });
            excLineData.amtNewProduct = exceptionRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_new_amount'
            });  
            excLineData.taxNewProduct = exceptionRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_new_tax'
            });     
            log.audit('Get data from line:'+i+ ' finished',excLineData); 
        } catch (e){
            log.error(e);
        }
        
        try{
            var excDetailsMatrix = getDetailsMatrix(excLineData.excDetails,excLineData.actionToDoId);
        } catch(e){
            log.error('Function getDetailsMatrix fail',e);
        }
        if(excDetailsMatrix.createTask == true){
            createTask = true; 
        } 
        //---------------------------------------------------------------------------------------------------------------------
        //     ____     _     ____   _____ 
        //    / ___|   / \   / ___| | ____|
        //   | |      / _ \  \___ \ |  _|  
        //   | |___  / ___ \  ___) || |___ 
        //    \____|/_/   \_\|____/ |_____|
        //  
        //Create the case
        //The function will return nothing if the item is not supported by the standard case managemenet.
        //This function return the color of the item, to be set in the standard case record
        try{
            var itemData = getItemColorParent(excLineData.excItem);
        }
        catch (e){
            log.error('getItemColorParent function failed',e);
        }
        var caseId = undefined;
        if(itemData.item && !excLineData.caseId && excDetailsMatrix.createCase == true){            
            log.debug('Create case begin');
            //Lookup here
            var getCaseExceptionItemReturn = getCaseExceptionItem(excLineData.excLineId)
            if (getCaseExceptionItemReturn == null){
                try{
                    var caseRecord = RECORDMODULE.create({
                        type: RECORDMODULE.Type.SUPPORT_CASE
                        });
                    caseRecord.setValue({
                        fieldId: 'title',
                        value: excName+'-'+ excLineData.excLineId.toString().slice(-3)
                    });                
                    caseRecord.setValue({
                        fieldId: 'custevent_prq_exccase_from_exception',
                        value: excId
                    });
                    caseRecord.setValue({
                        fieldId: 'company',
                        value: excCustomer
                    });
                    caseRecord.setValue({
                        fieldId: 'status',
                        value: 2
                    });	
                    caseRecord.setValue({
                        fieldId: 'assigned',
                        value: 7 // FX Mangin
                    });	
                    caseRecord.setValue({
                        fieldId: 'startdate',
                        value: excDateReported
                    });
                    caseRecord.setValue({
                        fieldId: 'incomingmessage',
                        value: excComment
                    });
                    caseRecord.setValue({
                        fieldId: 'custevent_prq_exccase_from_item',
                        value: excLineData.excLineId
                    });
                    caseRecord.setValue({
                        fieldId: 'item',
                        value: itemData.item
                    });
                    if(excLineData.excType){
                        caseRecord.setValue({
                            fieldId: 'category',
                            value: excLineData.excType
                        });
                    }
                    if(excLineData.excDetails){
                        var correspondingCaseIssue = getCorrespondingCaseIssue(excLineData.excDetails)
                        if (correspondingCaseIssue != null){
                            caseRecord.setValue({
                                fieldId: 'issue',
                                value: correspondingCaseIssue
                            });
                        }   
                    }
                    if (itemData.color){
                        caseRecord.setValue({
                            fieldId: 'custevent_prq_exccase_color',
                            value: itemData.color
                        });	
                    }
                    if(excLineData.excResponsability){
                        caseRecord.setValue({
                            fieldId: 'custevent_prq_exccase_responsable',
                            value: excLineData.excResponsability
                        });
                    }
                    if(excLineData.excQuantity){
                        caseRecord.setValue({
                            fieldId: 'custevent_prq_exccase_quantity',
                            value: excLineData.excQuantity
                        });
                    }
                    if(excLineData.excOrigin){
                        caseRecord.setValue({
                            fieldId: 'origin',
                            value: excLineData.excOrigin
                        });                    
                    }
                    caseRecord.setValue({
                        fieldId: 'emailform',
                        value: false
                    });

                    //Saving the case
                    log.debug('Case record before save',caseRecord);
                    var caseId = caseRecord.save({
                        ignoreMandatoryFields: true
                    });
                    log.audit('Case created','Case Id: '+caseId);
                    var id = RECORDMODULE.attach({
                        record: {
                            type: RECORDMODULE.Type.SUPPORT_CASE,
                            id: caseId
                        },
                        to: {
                            type: 'transaction',
                            id: excSOFrom
                        }
                    });
                } catch (e){
                    log.error('Case Creation Error',e);
                    try{
                        if (itemData && itemData.offerSupport == false){
                            var emailAuthorId = ~~RUNTIMEMODULE.getCurrentUser().id;
                            var emailRecipients = 'fx.mangin@plum-kitchen.com';
                            var emailBody       = "Error when creating a case on exception " + excName + ". The item " + itemData.item + " does not offer support."
                            log.debug ("before sending email, author is " + emailAuthorId, emailRecipients)
                            EMAILMODULE.send({
                                author     : emailAuthorId,
                                recipients : emailRecipients,
                                subject    : 'Item does not offer support',
                                body       : emailBody,
                                attachments    : null,
                                relatedRecords : {
                                    customRecord:{
                                        id:~~exceptionIdReduce,
                                        recordType: '318'
                                    }
                                }
                            });
                        }   
                    } catch(e){
                        log.error('Email Creation Error',e);
                    } 
                }
            } else {
                log.debug ("case already exists, caseId = ", getCaseExceptionItemReturn)
            }
        }
        //     _____   ____  
        //    / ____| / __ \ 
        //   | (___  | |  | |
        //    \___ \ | |  | |
        //    ____) || |__| |
        //   |_____/  \____/ 
        //                   
        //
        if((excLineData.actionToDo == 'CREATE_SO_REPROD' || excLineData.actionToDo == 'CREATE_SO' || excLineData.actionToDo == 'CREATE_SO_NEW') && !excLineData.soRecord){
            log.debug('Create SO begin');
            try{
                if(soRecord == undefined){
                    soRecord = RECORDMODULE.create({
                        type: RECORDMODULE.Type.SALES_ORDER,
                        isDynamic: true                       
                    });
                    var newSoTranId = getSOName(excSOFrom);
                    soRecord.setValue({		
                        fieldId: 'tranid',
                        value: newSoTranId
                    });   
                    soRecord.setValue({		
                        fieldId: 'custbodymailingworkflowtype',
                        value: soFromRecord.getValue({fieldId:'custbodymailingworkflowtype'})
                    });
                    soRecord.setValue({		
                        fieldId: 'entity',
                        value: excCustomer
                    });                    
                    soRecord.setValue({		
                        fieldId: 'subsidiary',
                        value: soFromRecord.getValue({fieldId:'subsidiary'})
                    });
                    var memoNewSo = undefined
                    if (excComment == null || excComment == ""){
                        memoNewSo = excName
                    } else {
                        memoNewSo = excName + ": " + excComment
                    }
                    if (memoNewSo.length > 299){
                        memoNewSo = memoNewSo.substring(0,299)
                    }
                    soRecord.setValue({		
                        fieldId: 'memo',
                        value: memoNewSo
                    });
                    soRecord.setValue({
                        fieldId:'custbody_prq_previous_order_number',
                        value: excOriginalSO
                    }); 
                    soRecord.setValue({
                        fieldId:'custbody_prq_order_type',
                        value: orderType
                    });  
                    soRecord.setValue({
                        fieldId:'shippingaddress_key',
                        value: soOriginalRecord.getValue({fieldId:'shippingaddress_key'})
                    })              
                    soRecord.setValue({
                        fieldId:'custbody1',
                        value: soFromRecord.getValue({fieldId:'custbody1'})
                    });
                    soRecord.setValue({
                        fieldId:'custbody_prq_shippingmethod',
                        value: soFromRecord.getValue({fieldId:'custbody_prq_shippingmethod'})
                    });
                    soRecord.setValue({
                        fieldId:'shipaddress',
                        value: soFromRecord.getValue({fieldId:'shipaddress'})
                    });
                    soRecord.setValue({
                        fieldId:'custbody_prq_urgent',
                        value: true
                    });
                    //Date Calculation minimum and max date shipping
                    var today = Date.now();
                    var soFromDate = soFromRecord.getValue({
                        fieldId:'trandate'
                    });
                    var soFromMinDateShip = soFromRecord.getValue({
                        fieldId:'custbody_prq_min_expected_ship_date'
                    });
                    var soFromMaxDateShip = soFromRecord.getValue({
                        fieldId:'custbody_prq_max_expected_ship_date'
                    });
                    if(soFromMinDateShip){
                        let delta = soFromMinDateShip.getTime() - soFromDate.getTime();
                        var newMinShipDate = new Date(today);
                        newMinShipDate = newMinShipDate.setTime(newMinShipDate.getTime()+delta);
                        newMinShipDate = new Date(newMinShipDate);                    
                        soRecord.setValue({
                            fieldId:'custbody_prq_min_expected_ship_date',
                            value: newMinShipDate
                        });
                    }
                    if(soFromMaxDateShip){
                        let delta = soFromMaxDateShip.getTime() - soFromDate.getTime();
                        var newMaxShipDate = new Date(today);
                        newMaxShipDate = newMaxShipDate.setTime(newMaxShipDate.getTime()+delta);
                        newMaxShipDate = new Date(newMaxShipDate);                    
                        soRecord.setValue({
                            fieldId:'custbody_prq_max_expected_ship_date',
                            value: newMaxShipDate
                        });
                    }
                }
                //Operation if reprod
                if(excLineData.actionToDo == 'CREATE_SO_REPROD'){
                    orderType = 7; // Reprod SR
                    soRecord.setValue({
                        fieldId:'custbody_prq_order_type',
                        value: orderType
                    }); 
                }
                if(starOrder == true){
                    soRecord.setValue({
                        fieldId:'custbodycust_plum_star_order',
                        value: true
                    });  
                }
                var lineNum = soRecord.selectNewLine({
                    sublistId: 'item'
                });
                soRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: excLineData.excItem
                });
                soRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    value: excLineData.excQuantity
                });                
                soRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    value: excLineData.excRate
                });                
                soRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    value: excLineData.amtNewProduct
                });  
                soRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'tax1amt',
                    value: excLineData.taxNewProduct
                });  
                soRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'grossamt',
                    value: (excLineData.amtNewProduct + excLineData.taxNewProduct)
                });
                if (excLineData.excResponsability && excLineData.excResponsability == 4){
                    soRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_at_cost_for_vendor_line',
                        value: true
                    });
                }                   
                soRecord.commitLine({
                    sublistId: 'item'
                });
                tranTypeLine[i] = 'SO';
            } catch (e){
                log.error('SO Creation Error',e);
            }
        }
        //    _____            
        //   |  __ \     /\    
        //   | |__) |   /  \   
        //   |  _  /   / /\ \  
        //   | | \ \  / ____ \ 
        //   |_|  \_\/_/    \_\
        //                     
        //
        if(excLineData.actionToDo == 'CREATE_RETURN_AUTHORIZATION' && !excLineData.soRecord){
            try{
                log.debug('Create RA begin');
                if(raRecord == undefined){
                    raRecord = RECORDMODULE.create({
                        type: RECORDMODULE.Type.RETURN_AUTHORIZATION,
                        isDynamic: true,
                    });            
                    raRecord.setValue({		
                        fieldId: 'entity',
                        value: excCustomer
                    });	
                    raRecord.setValue({		
                        fieldId: 'subsidiary',
                        value: soFromRecord.getValue({fieldId:'subsidiary'})
                    });        
                    raRecord.setValue({		
                        fieldId: 'createdfrom',
                        value: excSOFrom
                    });
                }
                var lineNum = raRecord.selectNewLine({
                    sublistId: 'item'
                });
                raRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: excLineData.excItem
                });
                raRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    value: excLineData.excQuantity
                });
                raRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    value: excLineData.excRate
                });
                raRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    value: excLineData.grossAmount
                });
                raRecord.commitLine({
                    sublistId: 'item'
                });
                tranTypeLine[i] = 'RA';
            }catch(e){
                log.error('ra error',e);
            } 		
        }
        if(caseId != undefined){
            exceptionRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_case',
                value: caseId,
                ignoreFieldChange: true
            });        
        }        
		//Update the exception line	
        var lineCommited = exceptionRecord.commitLine({
            sublistId: 'recmachcustrecord_prq_excitem'
        });
        log.audit('Commit Exception Line is a Success',lineCommited);
	}    
    var raRecordId =undefined;
	if(raRecord != undefined){
        log.audit('Save raRecord started',raRecord);
        raRecordId = raRecord.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
        log.audit('raRecordId',raRecordId);
    }
    var soRecordid =undefined;
    if(soRecord !=undefined){
        log.audit('Save soRecord started',soRecord);
        try{
            soRecordid = soRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
        } catch (e){
            log.error('Error to save SO',e);
        }
        log.audit('soRecordid',soRecordid);
    }
    for (var i = exceptionItemLinesCount-1;i >= 0;i--){
        var excLine = exceptionRecord.selectLine({
            sublistId:'recmachcustrecord_prq_excitem',
            line: i
        });        
        if(tranTypeLine[i] == 'SO' && soRecordid !=undefined){
            log.debug('Set SO on line '+i,soRecordid);
            exceptionRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_related_so',
                value:soRecordid,
                ignoreFieldChange: true
            });  
        }
        if(tranTypeLine[i] == 'RA' && raRecordId !=undefined){
            log.debug('Set RA on line '+i,raRecordId);
            exceptionRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_prq_excitem',
                fieldId: 'custrecord_prq_excitem_related_so',
                value:raRecordId,
                ignoreFieldChange: true
            });
        }
        exceptionRecord.commitLine({
            sublistId: 'recmachcustrecord_prq_excitem'
        });	
    }
    exceptionRecord.setValue({
		fieldId: 'custrecord_prq_exc_status',
		value: 4
	});


    //    _______           _    
    //   |__   __|         | |   
    //      | |  __ _  ___ | | __
    //      | | / _` |/ __|| |/ /
    //      | || (_| |\__ \|   < 
    //      |_| \__,_||___/|_|\_\
    //                           
    //
    //Create the task   
    var soTask = undefined;
    if(createTask == true && !excTask ){
        try{
            log.debug('Create task for exception begin');
            var taskRecord = RECORDMODULE.create({
                type: RECORDMODULE.Type.TASK,
                isDynamic: true                       
            });
            var newTaskName = exceptionNameReduce
            var lastIndex = newTaskName.lastIndexOf('E');
            if (lastIndex != -1){
                newTaskName = newTaskName.substring(0, lastIndex) + 'T' + newTaskName.substring(lastIndex + 1);
            }
            taskRecord.setValue({
                fieldId:'title',
                value: newTaskName
            });            
            taskRecord.setValue({
                fieldId:'assigned',
                value: ~~excOriginator
            });
            var taskMessage = "";
            for (var i = exceptionItemLinesCount-1;i >= 0;i--){
                var excLine = exceptionRecord.selectLine({
                    sublistId:'recmachcustrecord_prq_excitem',
                    line: i
                }); 
                var actionToDo = undefined;               
                try{
                    actionToDo = exceptionRecord.getCurrentSublistText({
                        sublistId: 'recmachcustrecord_prq_excitem',
                        fieldId: 'custrecord_prq_excitem_act_todo'
                    }); 
                    if (actionToDo == 'CREATE_TASK'){
                        var excItem = undefined;
                        var excDescription = undefined;
                        var excType = undefined;
                        var excDetails = undefined;
                        excItem = exceptionRecord.getCurrentSublistText({
                        sublistId: 'recmachcustrecord_prq_excitem',
                        fieldId: 'custrecord_prq_excitem_item'
                        });
                        excDescription = exceptionRecord.getCurrentSublistValue({
                            sublistId: 'recmachcustrecord_prq_excitem',
                            fieldId: 'custrecord_prq_excitem_item_dsc'
                        }); 
                        excType = exceptionRecord.getCurrentSublistText({
                            sublistId: 'recmachcustrecord_prq_excitem',
                            fieldId: 'custrecord_prq_excitem_exc_type'
                        });
                        excDetails = exceptionRecord.getCurrentSublistText({
                            sublistId: 'recmachcustrecord_prq_excitem',
                            fieldId: 'custrecord_prq_excitem_exc_details'
                        });
                        taskMessage = "Line " + (i + 1) + " - " + excItem + " - " + excDescription + " - " + excType + " - " + excDetails + "\n" 
                    }
                } catch (e){
                    log.error(e);
                }
            }
            taskMessage = taskMessage + internalComment
            taskRecord.setValue({
                fieldId:'message',
                value: taskMessage
            });
            soTaskId = taskRecord.save();
            log.audit('soTask Id',soTaskId);
            exceptionRecord.setValue({
                fieldId: 'custrecord_prq_exc_task_related',
                value: soTaskId
            });
        } catch (e){
            log.error('Task creation error',e);
        }
    }
    try{
        var excRecordId = exceptionRecord.save();
        log.audit('exceptionRecord saved',excRecordId);
    } catch(e){
        log.error('Exception saving failed',e)
    }
}

/**
 * Executes when the summarize entry point is triggered and applies to the result set.
 *
 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
 * @since 2015.1
 */
function _summarize(summary) {
        // Log details about the script's execution.
        log.audit({
            title: 'Usage units consumed',
            details: summary.usage
        });
        log.audit({
            title: 'Concurrency',
            details: summary.concurrency
        });
        log.audit({
            title: 'Number of yields',
            details: summary.yields
        });
}
function getItemColorParent(item){
	var itemFieldLookUp = SEARCHMODULE.lookupFields({
		type: SEARCHMODULE.Type.ITEM,
		id: item,
		columns: ['parent', 'custitem_prq_couleur_matrix_options','offersupport']
	});
	
	var itemData = {};
	
	if(!itemFieldLookUp.offersupport){
        itemData.offerSupport = false;			
		if(itemFieldLookUp.parent.length>0){
			itemData.item =  itemFieldLookUp.parent[0].value;
		}			
	} else {
        itemData.offerSupport = true;
		itemData.item = item;			
	}
	if(itemFieldLookUp.custitem_prq_couleur_matrix_options[0] && itemData.item){
		itemData.color =  itemFieldLookUp.custitem_prq_couleur_matrix_options[0].value;
	} 	
	return itemData;
}
function getDetailsMatrix(detailsId,action){
    log.debug('Get Details Matrix','Parameters:'+detailsId+'-'+action);
    let exceptionDetailsSearch = SEARCHMODULE.create({
        type: "customrecord_prq_exceptions_details",
        filters:
        [
            ["internalidnumber","equalto",detailsId], 
            "AND", 
            ["custrecord_prq_excact_parent.custrecord_prq_excact_actiontype","anyof",action]
        ],
        columns:
        [
            SEARCHMODULE.createColumn({
                name: "custrecord_prq_excact_create_case",
                join: "CUSTRECORD_PRQ_EXCACT_PARENT"                
            }),
            SEARCHMODULE.createColumn({
                name: "custrecord_prq_excact_create_task",
                join: "CUSTRECORD_PRQ_EXCACT_PARENT",
            }),
            "custrecord_prq_excdet_details",
            "custrecord_prq_excdet_type", 
            "custrecord_prq_excdet_prod_cat"
        ]
    });
    var myResultSet = exceptionDetailsSearch.run();
    var resultRange = myResultSet.getRange({
        start: 0,
        end: 1
    });
    var excDetailsMatrix = {};
    for (var i = 0; i < resultRange.length; i++) {
        var resultLine = {};
        excDetailsMatrix.createTask = resultRange[i].getValue({
            name: "custrecord_prq_excact_create_task",
            join: "CUSTRECORD_PRQ_EXCACT_PARENT"
        });
        excDetailsMatrix.createCase = resultRange[i].getValue({
            name: "custrecord_prq_excact_create_case",
            join: "CUSTRECORD_PRQ_EXCACT_PARENT"
        });
    }    
    log.debug('excDetailsMatrix',excDetailsMatrix)
    return excDetailsMatrix;
}

//Function to return the new SO Name
//Input SO Created From
function getSOName(soFrom){
    //Look if SO is related to existing Exception.
    var nextSO = soFrom;
    var originalSO = soFrom;
    var parentFound = true;
    try{
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
    log.debug('Final originalSO',originalSO);
    var soLookUp = SEARCHMODULE.lookupFields({
        type: SEARCHMODULE.Type.SALES_ORDER,
        id: originalSO,
        columns: ['tranid']
    });    
    var soTranId = soLookUp.tranid;
    var newSOName = soTranId +'-R1';
    soTranIdReprod = soTranId + '-R';
    var salesorderSearchObj = SEARCHMODULE.create({
        type: SEARCHMODULE.Type.SALES_ORDER,
        filters:
        [
            ["type","anyof","SalesOrd"], 
            "AND", 
            ["transactionnumbertext","haskeywords",soTranIdReprod], 
            "AND", 
            ["mainline","is","T"]
        ],
        columns:
        [
            SEARCHMODULE.createColumn({
                name: "tranid",
                sort: SEARCHMODULE.Sort.DESC,
                label: "Document Number"
            })
        ]
    });
    var searchResultCount = salesorderSearchObj.runPaged().count;
    if(searchResultCount>0){
        var resultSet = salesorderSearchObj.run();
        var resultRange = resultSet.getRange({
            start: 0,
            end: 1
        });
        var lastReprodSO = resultRange[i].getValue('tranid');        
        var index = lastReprodSO.indexOf("-R");
        var lastReprodNumber = lastReprodSO.substr(index+2, lastReprodSO.length);
        lastReprodNumber = ~~lastReprodNumber;
        newSOName = lastReprodSO.substr(0,index+2) + (lastReprodNumber+1);
    }
    log.debug('New SO Name',newSOName); 
    return newSOName;
    }
    catch (e){
        log.error('Fail to execute getSOName',e);
    }
    return false;
}

function getCorrespondingCaseIssue(excDetail){
    var correspCaseIssueSearch = SEARCHMODULE.create({
        type: "customrecord_prq_exceptions_details",
        filters:
        [
            ["internalid","anyof",~~excDetail]
        ],
        columns:
        [
            SEARCHMODULE.createColumn({name: "custrecord_prq_corresponding_case_issue", label: "PRQ Corresponding Case issue"})
        ]
    });
    var resultRange = correspCaseIssueSearch.run().getRange({
        start: 0,
        end: 1
    });
    if (resultRange.length == 1){
        return resultRange[0].getValue({
            name: 'custrecord_prq_corresponding_case_issue',
        });
    } else {
        return null
    }
}

function getCaseExceptionItem(excItemId) {
    var getCaseExceptionItemSearch = SEARCHMODULE.create({
       type: "supportcase",
       filters:
       [
          ["custevent_prq_exccase_from_item","anyof",~~excItemId]
       ],
       columns:
       [
        SEARCHMODULE.createColumn({name: "internalid", label: "Internal ID"})
       ]
    });
    var resultRange = getCaseExceptionItemSearch.run().getRange({
        start: 0,
        end: 1
    });
    if (resultRange.length == 1){
        return resultRange[0].getValue({
            name: 'internalid',
        });
    } else {
        return null
    }
}