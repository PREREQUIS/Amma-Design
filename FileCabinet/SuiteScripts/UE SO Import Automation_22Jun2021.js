/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */

 define([ 'N/record', 'N/search', 'N/format', 'N/runtime'],

 function(record, search, format, runtime) {
          
    function isFirstSalesOrder(entity, orderid) {
        var soSearch = search.create({
            type: search.Type.CUSTOMER,
            filters: [
                {name: 'entity', operator: 'is', join:'transaction', values: [entity]},
                {name: 'type', operator: 'anyof', join:'transaction', values: ['SalesOrd']},
                {name: 'internalid', operator: 'noneof', join:'transaction', values: [orderid]}
            ],
            columns: []
        });

        var resultSet = soSearch.run();
        var resultRange = resultSet.getRange({start:0, end: 100});
        log.debug('resultRange', JSON.stringify(resultRange));
        return !resultRange.length;
    }

    
    function getPreferredVendor(itemid) {
        try {
            if(itemid) {
                var itemRec = record.load({type: record.Type.ASSEMBLY_ITEM, id: itemid});
                for(var i=0; i<itemRec.getLineCount({sublistId: 'itemvendor'}); i++) {
                    var preferredvendor = itemRec.getSublistValue({sublistId: 'itemvendor', fieldId: 'preferredvendor', line: i});
                    var vendor = itemRec.getSublistValue({sublistId: 'itemvendor', fieldId: 'vendor', line: i});
                    if(preferredvendor) {
                        return vendor;
                    }
                }  
            }
        }
        catch(e) {
            log.debug('getPreferredVendor', e);
        }
        return null;
    }

    function getWelcomeItemLocation(itemid) {
        try {
            if(itemid) {
                var sch = search.lookupFields({type:search.Type.ASSEMBLY_ITEM, id: itemid, columns: ['custitem_prq_plum_prefered_location']});
                if(sch && sch.custitem_prq_plum_prefered_location) return sch.custitem_prq_plum_prefered_location[0].value;
            }
        }
        catch(e) {
            log.debug('getPreferredVendor', e);
        }
        return null;
    }
    

    function beforeSubmit(context) {
        if(context.type !== context.UserEventType.CREATE) return;
        var soRec = context.newRecord;
        log.debug('soRec', soRec);

        try {
            log.debug('SCRIPT', 'Automation Started..');
            
            var PREFERRED_VENDOR_ID = runtime.getCurrentScript().getParameter({name: 'custscript_import_auto_prefvendor'});
            var WELCOME_ITEM_ID = runtime.getCurrentScript().getParameter({name: 'custscript_import_auto_welcomeitem'});
            
            if(!WELCOME_ITEM_ID || !PREFERRED_VENDOR_ID) {
                log.debug('SCRIPT', 'Invalid Script Parameters, WELCOME_ITEM_ID='+WELCOME_ITEM_ID+'PREFERRED_VENDOR_ID='+PREFERRED_VENDOR_ID);
                return;
            }

            var WELCOME_ITEM_LOCATION = getWelcomeItemLocation(WELCOME_ITEM_ID);
            log.debug('WELCOME_ITEM_LOCATION', WELCOME_ITEM_LOCATION);

            var WELCOMITEM_PREFERREDVENDOR = getPreferredVendor(WELCOME_ITEM_ID);
            log.debug('WELCOMITEM_PREFERREDVENDOR', WELCOMITEM_PREFERREDVENDOR);

            if(!WELCOMITEM_PREFERREDVENDOR) {
                log.debug('SCRIPT', 'Welcom Item has no preferred vendor.');
                return;
            }
            //** Adding Special Item
            
            //customer id
            var entity = soRec.getValue({fieldId:'entity'});

            //check if it has Previous Order Number (PRQ)
            if(soRec.getValue({fieldId:'custbody_prq_previous_order_number'})) {
                log.debug('SCRIPT', 'This order has PRQ');
                return;
            }

            //check if order conteains special item
            var quantitySpecials = 0;            
            var welcomeitem_exist = false;

            var ispreferredvendor = false;
            for(var itemline = 0; itemline < soRec.getLineCount({sublistId: 'item'}); itemline++) {
                
                var isspecialorderline = soRec.getSublistValue({sublistId: 'item', fieldId: 'isspecialorderline', line: itemline});
                var createpo = soRec.getSublistValue({sublistId: 'item', fieldId: 'createpo', line: itemline});
                
                var itemid = soRec.getSublistValue({sublistId: 'item', fieldId: 'item', line: itemline});
                var itemtype = soRec.getSublistValue({sublistId: 'item', fieldId: 'itemtype', line: itemline});
                var quantity = soRec.getSublistValue({sublistId: 'item', fieldId: 'quantity', line: itemline});                

                if(WELCOME_ITEM_ID && WELCOME_ITEM_ID == itemid) welcomeitem_exist = true;

                log.debug('itemline='+itemline, 'itemid='+itemid+', isspecialorderline='+isspecialorderline+', itemtype='+itemtype + ', createpo='+createpo);
                
                if(itemtype != 'InvtPart') continue;
                if(createpo != 'SpecOrd') continue;

                var itemRec = record.load({type: record.Type.INVENTORY_ITEM, id: itemid});
                
                for(var i=0; i<itemRec.getLineCount({sublistId: 'itemvendor'}); i++) {
                    var preferredvendor = itemRec.getSublistValue({sublistId: 'itemvendor', fieldId: 'preferredvendor', line: i});
                    var vendor = itemRec.getSublistValue({sublistId: 'itemvendor', fieldId: 'vendor', line: i});
                    log.debug('vendor', vendor);
                    if(preferredvendor && vendor == PREFERRED_VENDOR_ID) {
                        ispreferredvendor = true;
                        break;
                    }
                }  
                
                quantitySpecials += parseFloat(quantity+"");
                
            }

            
            log.debug('welcomeitem_exist', welcomeitem_exist);
            log.debug('quantitySpecials', quantitySpecials);
            
            
            // if(!welcomeitem_exist && poid_selected && quantitySpecials >= 3) {
            if(!welcomeitem_exist && ispreferredvendor) {
                
                log.debug('SCRIPT', 'Adding Items to Sales Order');
                var linenum = soRec.getLineCount({sublistId: 'item'});
                soRec.insertLine({sublistId:'item', line: linenum});
                
                soRec.setSublistValue({sublistId: 'item', fieldId: 'item', value: WELCOME_ITEM_ID, line: linenum});
                soRec.setSublistValue({sublistId: 'item', fieldId: 'quantity', value: 1, line: linenum});
                //soRec.setSublistValue({sublistId: 'item', fieldId: 'location', value: WELCOME_ITEM_LOCATION, line: linenum});
                
            }


            log.debug('SCRIPT', 'Automation End..');
        }
        catch(e) {
            log.debug('ERR', e);
        }
    }

    function afterSubmit(context) {
        
        // if(context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.COPY && context.type !== context.UserEventType.EDIT) return;
        if(context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) return;
        // if(context.type !== context.UserEventType.CREATE) return;
        
        try {
            log.debug('SCRIPT', 'Automation Started..');
            
            var PREFERRED_VENDOR_ID = runtime.getCurrentScript().getParameter({name: 'custscript_import_auto_prefvendor'});
            var WELCOME_ITEM_ID = runtime.getCurrentScript().getParameter({name: 'custscript_import_auto_welcomeitem'});
            
            if(!WELCOME_ITEM_ID || !PREFERRED_VENDOR_ID) {
                log.debug('SCRIPT', 'Invalid Script Parameters, WELCOME_ITEM_ID='+WELCOME_ITEM_ID+'PREFERRED_VENDOR_ID='+PREFERRED_VENDOR_ID);
                return;
            }

            var WELCOME_ITEM_LOCATION = getWelcomeItemLocation(WELCOME_ITEM_ID);
            log.debug('WELCOME_ITEM_LOCATION', WELCOME_ITEM_LOCATION);

            var WELCOMITEM_PREFERREDVENDOR = getPreferredVendor(WELCOME_ITEM_ID);
            log.debug('WELCOMITEM_PREFERREDVENDOR', WELCOMITEM_PREFERREDVENDOR);

            if(!WELCOMITEM_PREFERREDVENDOR) {
                log.debug('SCRIPT', 'Welcom Item has no preferred vendor.');
                return;
            }
            //** Adding Special Item

            //load sales order record
            var soRec = record.load({type: record.Type.SALES_ORDER, id: context.newRecord.id, isDynamic: true });
            //customer id
            var entity = soRec.getValue({fieldId:'entity'});

            //check if it has Previous Order Number (PRQ)
            if(soRec.getValue({fieldId:'custbody_prq_previous_order_number'})) {
                log.debug('SCRIPT', 'This order has PRQ');
                return;
            }

            //check if order conteains special item
            var quantitySpecials = 0;
            var polist = [];
            var perferredvendorlinelist = [];
            var poid_selected = null;
            var welcomeitem_exist = false;

            for(var itemline = 0; itemline < soRec.getLineCount({sublistId: 'item'}); itemline++) {

                soRec.selectLine({sublistId: 'item', line: itemline});
                
                var isspecialorderline = soRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'isspecialorderline'});
                var itemid = soRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'item'});
                var itemtype = soRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'itemtype'});
                var quantity = soRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'quantity'});
                var poid = soRec.getCurrentSublistValue({sublistId: 'item', fieldId: 'poid'});

                if(WELCOME_ITEM_ID && WELCOME_ITEM_ID == itemid) welcomeitem_exist = true;

                if(!poid) continue;
                if(itemtype != 'InvtPart') continue;
                if(isspecialorderline != 'T') continue;

                log.debug('itemline='+itemline, 'itemid='+itemid+', poid='+poid+', isspecialorderline='+isspecialorderline+', itemtype='+itemtype);

                var itemRec = record.load({type: record.Type.INVENTORY_ITEM, id: itemid});

                var ispreferredvendor = false;
                for(var i=0; i<itemRec.getLineCount({sublistId: 'itemvendor'}); i++) {
                    var preferredvendor = itemRec.getSublistValue({sublistId: 'itemvendor', fieldId: 'preferredvendor', line: i});
                    var vendor = itemRec.getSublistValue({sublistId: 'itemvendor', fieldId: 'vendor', line: i});
                    if(preferredvendor && vendor == PREFERRED_VENDOR_ID) {
                        ispreferredvendor = true;
                        break;
                    }
                }  

                var line = {
                    poid: poid,
                    itemid: itemid,
                    quantity: quantity,
                    ispreferredvendor: ispreferredvendor
                };
                quantitySpecials += parseFloat(line.quantity+"");

                log.debug('line', JSON.stringify(line));
                if(ispreferredvendor) perferredvendorlinelist.push(line);
                else polist.push(line);
            }

            log.debug('perferredvendorline', JSON.stringify(perferredvendorlinelist));
            log.debug('polist', JSON.stringify(polist));
            
            // continue;

            if(perferredvendorlinelist.length) {
                var perferredvendorlinelist_sort = perferredvendorlinelist.sort(function(a, b) {
                    return b.quantity - a.quantity;
                });
                log.debug('perferredvendorlinelist_sort', JSON.stringify(perferredvendorlinelist_sort));
                poid_selected = perferredvendorlinelist_sort[0].poid;
            }

            log.debug('welcomeitem_exist', welcomeitem_exist);
            log.debug('quantitySpecials', quantitySpecials);
            
            
            // if(!welcomeitem_exist && poid_selected && quantitySpecials >= 3) {
            if(!welcomeitem_exist && poid_selected) {
                log.debug('SCRIPT', 'Adding Items to Purchase Order');
                var poRec = record.load({type: record.Type.PURCHASE_ORDER, id: poid_selected, isDynamic: true });
                poRec.selectNewLine({sublistId:'item'});
                poRec.setCurrentSublistValue({sublistId: 'item', fieldId: 'item', value: WELCOME_ITEM_ID});
                poRec.setCurrentSublistValue({sublistId: 'item', fieldId: 'quantity', value: 1});
               // poRec.setCurrentSublistValue({sublistId: 'item', fieldId: 'location', value: WELCOME_ITEM_LOCATION});
                
                poRec.commitLine({sublistId:'item'});
                var poidSaved = poRec.save();
                log.debug('SCRIPT', 'poidSaved='+poidSaved);
                
                log.debug('SCRIPT', 'Adding Items to Sales Order');
                soRec.selectNewLine({sublistId:'item'});
                soRec.setCurrentSublistValue({sublistId: 'item', fieldId: 'item', value: WELCOME_ITEM_ID});
                soRec.setCurrentSublistValue({sublistId: 'item', fieldId: 'quantity', value: 1});
                //soRec.setCurrentSublistValue({sublistId: 'item', fieldId: 'location', value: WELCOME_ITEM_LOCATION});
                soRec.commitLine({sublistId:'item'});
                var soidSaved = soRec.save();
                log.debug('SCRIPT', 'soidSaved='+soidSaved);
                // log.debug('SCRIPT', 'Adding Items to Sales Order');
                // soRec.selectNewLine({sublistId:'item'});
                // soRec.setCurrentSublistValue({sublistId: 'item', fieldId: 'item', value: WELCOME_ITEM_ID});
                // soRec.setCurrentSublistValue({sublistId: 'item', fieldId: 'quantity', value: 1});
                // if(WELCOME_ITEM_LOCATION) soRec.setCurrentSublistValue({sublistId: 'item', fieldId: 'location', value: WELCOME_ITEM_LOCATION});
                // soRec.setCurrentSublistValue({sublistId: 'item', fieldId: 'createpo', value: 'SpecOrd'});
                // soRec.setCurrentSublistValue({sublistId: 'item', fieldId: 'isspecialorderline', value: true});
                
                // soRec.commitLine({sublistId:'item'});
                // var soidSaved = soRec.save({enableSourcing: true});
                // log.debug('SCRIPT', 'soidSaved='+soidSaved);
                

                // log.debug('SCRIPT', 'Creating Purchase Order');
                // var poRec = record.create ({
                //     type: record.Type.PURCHASE_ORDER,
                //     isDynamic: true,
                //     defaultValues: {
                //         recordmode: 'dynamic',
                //         soid: context.newRecord.id,
                //         specord: true, 
                //         custid: entity,
                //         entity: WELCOMITEM_PREFERREDVENDOR,
                //         poentity: WELCOMITEM_PREFERREDVENDOR,                        
                //     }
                // });

                // poRec.setValue({fieldId: 'createdfrom', value: context.newRecord.id});
                // var poId = poRec.save({enableSourcing: true});
                // log.debug('SCRIPT', 'poId='+poId);
            }

            log.debug('poid_selected', poid_selected);

            log.debug('SCRIPT', 'Automation End..');
        }
        catch(e) {
            log.debug(e);
        }
    }

    return {
        // afterSubmit: afterSubmit,
        beforeSubmit: beforeSubmit
    };
 }); 