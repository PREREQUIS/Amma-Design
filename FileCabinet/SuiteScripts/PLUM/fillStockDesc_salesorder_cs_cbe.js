/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],

function(record, search) {
    

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
    function validateLine(scriptContext) {
    	
    	var rec = scriptContext.currentRecord;
    	
    	if(scriptContext.sublistId == "item"){
    		
    		var item = rec.getCurrentSublistValue({
    			sublistId: "item",
    			fieldId: "item"
    		});
    		
    		log.debug('item', item);
    		
    		var stockdesc = search.lookupFields({
    			type: search.Type.INVENTORY_ITEM,
	    		id: item,
	    		columns: ['stockdescription']
    		});
    		
    		if(stockdesc != null){
    			var s_desc = stockdesc.stockdescription;
    			log.debug('s_desc', s_desc);
    			
    			if(s_desc != ""){
    				
    				rec.setCurrentSublistValue({
            			sublistId: "item",
            			fieldId: "custcol_prq_item_stockdescription",
            			value: s_desc
            		});
        			
        			log.debug('s_desc', rec.getCurrentSublistValue({
            			sublistId: "item",
            			fieldId: "custcol_prq_item_stockdescription"
            		}));
        			
        			return true;
    				
    			}
    			
    			
    		}
    		
    	}
    	
    	//return true;

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
    function saveRecord(scriptContext) {
    	return true;
    }

    return {
        validateLine: validateLine,
        saveRecord: saveRecord
    };
    
});
