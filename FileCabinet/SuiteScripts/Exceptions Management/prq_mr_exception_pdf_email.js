var RECORDMODULE, SEARCHMODULE, EMAILMODULE, RUNTIME, ERRORMODULE, RENDERMODULE, FILEMODULE;

/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/email', 'N/runtime', 'N/error', 'N/render','N/file'], runMapReduce);

//********************** MAIN FUNCTION **********************
function runMapReduce(record, search, email, runtime, error, render, file) {
    RECORDMODULE  = record;
    SEARCHMODULE  = search;
    EMAILMODULE   = email;
    RUNTIMEMODULE = runtime;
    ERRORMODULE   = error;
    RENDERMODULE  = render;
    FILEMODULE    = file;

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

    var mySearch = SEARCHMODULE.create({
        type: "customrecord_prq_exceptions_header",
        filters:
            [
                ["custrecord_prq_pdf_sent", "is", "F"],
                "AND",
                ["custrecord_prq_exc_status", "anyof","4"],
            ],
        columns:
            [
                SEARCHMODULE.createColumn({
                    name: "name", sort: SEARCHMODULE.Sort.ASC, label: "Name"
                })
            ]
    });

    return mySearch;
}
/**
 * Executes when the map entry point is triggered and applies to each key/value pair.
 *
 * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
 * @since 2015.1
 */
function _map(scriptContext) {

    var searchResult = JSON.parse(scriptContext.value);

    var myScript = RUNTIMEMODULE.getCurrentScript();
    var emailAdressRecipient = myScript.getParameter({
        name: 'custscript_prq_mr_exception_emailaddress'
    })

    try {
        var ExceptionId = ~~searchResult.id;

        scriptContext.write({
            // key   : emailAdressRecipient,
            key   : ~~ExceptionId,
            value :  ~~ExceptionId
        });
    } catch (e) {
        var mapError = ERRORMODULE.create({
            name: 'Map Error on Exception ID ' + searchResult.id,
            message: e,
            notifyOff: false
        });
        throw (mapError);
    }
}

/**
 * Executes when the reduce entry point is triggered and applies to each group.
 *
 * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
 * @since 2015.1
 */
function _reduce(context) {

    // THE FUNCTIONNALITY THAT SENDS AN EMAIL IS ON HOLD
    // THIS SCRIPT WILL ONLY GENERATE THE PDF FOR NEW EXCEPTIONS AND SAVE THEM ON THE FILE CABINET

    // var emailAdressRecipient = context.key;
    var exceptionIdArray = context.values;

    var errorInRender = false;
    // var errorInEmail = false;
    var arrayPdf      = [];

    var folderId = getFolder();
    // var totalSize = 0;

    for (var i = 0; i < exceptionIdArray.length; i++) {
        var exceptionId = exceptionIdArray[i];
        try {
            log.debug('Render PDF', 'Exception ID :' + exceptionId);

            var exceptionRecord = RECORDMODULE.load({
                type: 'customrecord_prq_exceptions_header',
                id: ~~exceptionId
            });

            var exceptionName = exceptionRecord.getValue({
                fieldId : 'name'
            }) + ' :';

            // Get the Exception items to create the name of the file
            var excLineSearch = SEARCHMODULE.create({
                type: "customrecord_prq_exceptions_items",
                filters:
                [
                    ["custrecord_prq_excitem","anyof",exceptionRecord.id]
                ],
                columns:
                [
                    SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_po_from", label: "Created PO"}),
                    SEARCHMODULE.createColumn({name: "custrecord_prq_excitem_po_vendor", label: "PO Vendor"})
                ]
            });
            var resultSet = excLineSearch.run();
            var resultRange = resultSet.getRange({
                start: 0,
                end: 100
            });
            
            for (var j = 0; j < resultRange.length; j++) {		
                var srchCreatedPO = resultRange[j].getText({
                    name: 'custrecord_prq_excitem_po_from'
                }) || ' ';
                var srchPOVendor = resultRange[j].getText({
                    name: 'custrecord_prq_excitem_po_vendor'
                }) || ' ';
                if (srchCreatedPO != ' ' && srchPOVendor != ' '){
                    exceptionName = exceptionName
                                    + " " 
                                    + srchCreatedPO.substring(srchCreatedPO.indexOf('#') + 1) 
                                    + " (" 
                                    + srchPOVendor.substring(srchPOVendor.indexOf(' ') + 1, srchPOVendor.indexOf(' ') + 4) 
                                    + ") -"
                }
                if (exceptionName.length > 190){
                    exceptionName = exceptionName.substring(0,190) + "...  ";
                    break
                }
            }
            exceptionName = exceptionName.substring(0, exceptionName.length - 2) + ".pdf";

            //Render the PDF file of the exception
            var exceptionPdfId = undefined;
            var myFile = RENDERMODULE.create();
            myFile.setTemplateById(111);
            myFile.addRecord('record', exceptionRecord);
            var exceptionPdf = myFile.renderAsPdf(); 
            exceptionPdf.folder =  folderId;     
            exceptionPdf.name = exceptionName;
            arrayPdf.push (exceptionPdf) 
            exceptionPdfId = exceptionPdf.save({
                ignoreMandatoryFields: true
            });

            // // CHECK THE SIZE OF THE FILE
            // var pdfFile = FILEMODULE.load({
            //     id: exceptionPdfId
            // })
            // totalSize = totalSize + pdfFile.size;
            // log.debug ("file size", pdfFile.size)
            // log.debug ("file size added", totalSize)

        } catch (e) {
            errorInRender = true
            var reduceError = ERRORMODULE.create({
                name: 'Reduce Error on Exception ID ' + exceptionId,
                message: e,
                notifyOff: false
            });
            throw (reduceError);
        }
    }

    // if (errorInRender == false){
    //     try{
    //         var emailSubject     = "New Exceptions"; 
    //         var emailBody        = "Please find attached the PDF for the new Exceptions."; 
    //         var emailAuthor      = 2819; // hello@plum-living.com
    //         var emailRecipients  = emailAdressRecipient
    //         EMAILMODULE.send({
    //             author         : ~~emailAuthor, 
    //             recipients     : emailRecipients, 
    //             subject        : emailSubject, 
    //             body           : emailBody, 
    //             attachments    : arrayPdf,
    //         })

    //     } catch (e){
    //         errorInEmail = true
    //         var reduceErrorEmail = ERRORMODULE.create({
    //             name: 'Reduce Error on email sending',
    //             message: e,
    //             notifyOff: false
    //         });
    //         throw (reduceErrorEmail);
    //     }
    // }

    // if (errorInEmail == false){
    if (errorInRender == false){
        try{
            for (var k = 0; k < exceptionIdArray.length; k++) {

                var exceptionId = exceptionIdArray[k];
                var idTemp = RECORDMODULE.submitFields({
                    type   : 'customrecord_prq_exceptions_header',
                    id     : ~~exceptionId,
                    values : {
                        'custrecord_prq_pdf_sent': true
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields : true
                    }
                });

            }
        } catch (e){
            var reduceErrorSubmit = ERRORMODULE.create({
                name: 'Reduce Error on field submitting for Exception id : ' + exceptionIdArray[k],
                message: e,
                notifyOff: false
            });
            throw (reduceErrorSubmit);
        }
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

    // Error management
    summary.mapSummary.errors.iterator().each(function (key, error) {
        log.error(JSON.parse(error).name, JSON.parse(error).message);
        return true;
    });
    summary.reduceSummary.errors.iterator().each(function (key, error) {
        log.error(JSON.parse(error).name, JSON.parse(error).message);
        return true;
    });
}

function getFolder(){
    var folderSearch = SEARCHMODULE.create({
        type: SEARCHMODULE.Type.FOLDER,
        filters:
        [
            ["predecessor","anyof","@NONE@"],
            'AND', 
            ['name',SEARCHMODULE.Operator.IS,'Exceptions PDF']
        ],
        columns:
        [
            'internalid'
        ]
    });
    var folderResultSet = folderSearch.run();
    var folderResultRange = folderResultSet.getRange({
        start: 0,
        end: 1
    });
    for (var i = 0; i < folderResultRange.length; i++) {
        return folderResultRange[i].id;
    }

    var tempFolder = RECORDMODULE.create({
        type: RECORDMODULE.Type.FOLDER        
    });

    tempFolder.setValue({
        fieldId:'name',
        value:'Exceptions PDF'
    });
    // tempFolder.setValue({
    //     fieldId:'parent',
    //     value:-20
    // });

    var tempFolderId = tempFolder.save({
        ignoreMandatoryFields: true
    });

    return tempFolderId;
}