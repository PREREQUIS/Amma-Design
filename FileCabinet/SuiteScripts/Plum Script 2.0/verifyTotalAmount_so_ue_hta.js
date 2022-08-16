/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search'],

function(record,search) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
    	if (scriptContext.type == 'create' || scriptContext.type == 'edit') {
    		var sid = scriptContext.newRecord.id;
        	var so = record.load({
    			type: record.Type.SALES_ORDER,
    			id: sid,
    			isdynamic: true
    		});
        	
        	var numLines = so.getLineCount({
        	    sublistId: 'item'
        	});
        	
        	for(var i = 0;i < numLines;i++){
        		var amount = so.getSublistValue({
    			    sublistId: 'item',
    			    fieldId: 'amount',
    			    line: i
    			});
        		
        		var qty = so.getSublistValue({
    			    sublistId: 'item',
    			    fieldId: 'quantity',
    			    line: i
    			});
        		
        		var rate = amount / qty;
        		
        		so.setSublistValue({
        				sublistId:'item',
        				fieldId: 'rate',
    				    line: i,
    				    value: rate
    				  });
        	}
        	
        	var syliusTotal = so.getValue({ fieldId: "custbody_prq_sylius_total"});
        	var nsTotal = so.getValue({ fieldId: "total"});
        	
        	if(syliusTotal!=nsTotal){
        		so.setValue({ 
    				fieldId: 'custbody_prq_is_total_different',
    				value: true
    			});
        	}	
        	
        	so.save();
    	}
    	
    }

    return {
        afterSubmit: afterSubmit
    };
    
});
