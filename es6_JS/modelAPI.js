/*jshint esversion: 6 */ 
/**
 *  @classdesc This is essentially a facade into the model, and tries to encapsulate the operations required
*   to update the model. Dependencies are passed in during method calls in part to make testing easier,
*   and to make it easier to see side effects.
*   
*   @TODO refactor into a proper Angular service. 
*/

class ModelAPI {
	constructor(){
		this._idCounter = 0;//TODO is this needed?
		this._newRelations = [];
	}



	getAndClearNewRelations(){
		var result = this._newRelations;
		this._newRelations = [];
		return result;
    }
	/**
	 * @public
	 *	@param {Node} node
	 *	@param {Array[Nodes]} vertices
	 *  @param {Array[Nodes]} lookup table into vertices
	 *  @param {Array[Links]} array of links
	 *  @returns {list[node]} list of neighboring nodes
	 */
	getNeighborsOfNode(node, vertices, lookup, edges) {
		//TODO Test that this actually works
		var links = getLinksOfNode(node, edges);
		var neighbors = new Map();
		for(var link of links){
			var neighborId;
			if(link.source === node.id){
				neighborId = link.target;
			} else {
				neighborId = link.source;
			}
			neighbors.set(neighborId, vertices[lookup[neighborId]]);
		}
		return neighbors;
	}
	
	
	/**
	 * @public 
	 * @param {Node} node
	 * @param {Array[Links]} array of links
	 * @returns {list[links]} a list of links off node.
	 */
	getLinksOfNode(node, edges) {
		//TODO
		var result = new Array();
		var searchId = node.id;
		for(var edge of edges){
			if(edge.source === searchId || edge.target === searchId){
				result.push(edge);
			}
		}
		return result;
	}
	
	/**
	 * @public
	 * Adds a node to the model data structures and ensures it gets displayed.
	 * @param {Node} node to add
	 * @param {Array[Node]} array of nodes. This will be modified.
	 * @returns {Node} the node being added, or undefined on error.
	 * 
	 */
	addNode(node, items){
		//TODO
		//if(node == null || node == undefined){return undefined;}
		//if(node.id == undefined || node.id == null){return undefined;}
		node.id = node.id + "_" + this._idCounter++;
		

		items[node.id] = node;
        node.addedAtRuntime = true;
		return node;
	}
	
	/**
	 * @public
	 * Quick shortcut to pull a node with given id out of the vertices array.
	 */
	pulloutNode(id, vertices, lookup){ 
		return vertices[lookup[id]];
	}
	
	addLink(source, target, value, kind, relations){
		var link = {
			kind: kind,
			source: source.id,
			target: target.id,
            addedAtRuntime : true
		}
		relations.push(link);
		this._newRelations.push(link);
	}

	addServiceToFlexware(type, flexwareItem, items, relations){
        var serviceItem = new Service(flexwareItem.id + "-" + type ,type);
        flexwareItem.services[type] = true;
        this.addNode(serviceItem, items);
        this.addLink(serviceItem, flexwareItem, 5, 'serviceToFlexware', relations);
    }

    addServiceToAdiod(type, adiodItem, items, relations){
        var serviceItem = new Service2(adiodItem.id + "-" + type ,type);
        adiodItem.services2[type] = true;
        this.addNode(serviceItem, items);
        this.addLink(serviceItem, adiodItem, 5, 'serviceToAdiod', relations);
	}


	addPTPLinkToNodes(targets, vertices, lookup, relations, items, nodes){
        if(!this._hasOnlyTwoPorts(targets, vertices, lookup, relations)){return "Invalid targets list."}
	    //Add a PTP between the ports.
        var ptp = new PointToPointCenter(null, null, 'UnassignedPTP');
        ptp.addPort(targets[0]);
        ptp.addPort(targets[1]);
        this.addNode(ptp, items);
        this.addLink(ptp, targets[0], 5, 'portToCenter', relations);
        this.addLink(ptp, targets[1], 5, 'portToCenter', relations);
        return ptp;
	}
	/**
	 * @public
	 * @param {Array[Node]} 		Targets - Array of 2 or more nodes to link.
	 * @param {Array[link]} 		Vertices - Vertices array to add into. Will be modified.
	 * @param {Map[String,Number]}	Lookup table for vertices. Will be modified.
	 * @param {Array[links]}		Relations - Array of relations
     * @param {Array[items]}        items
     * @param                       nodes
     * @param {boolean}             mtpMode - Flag to set if we should create an MTP even if there are only two ports. If false while there are more than two ports, an MTP will still be created.
     *
	 * @returns: The MTP or PTP being added, or a string representing an error.
	 */
	addLinksToNodes(targets, vertices, lookup, relations, items, nodes, mtpMode){
		var newLinks = [];
		if(mtpMode === undefined){mtpMode = false;}

		if(mtpMode == false && this._hasOnlyTwoPorts(targets, vertices, lookup, relations)){
			return this.addPTPLinkToNodes(targets, vertices, lookup, relations, items, nodes);
		}
		else if(this._hasOnlyPorts(targets, vertices, lookup, relations)){
			//Add an MTP between the ports
			var mtp = new MultilinkHub(null, "UnassignedMTP");
			for(var i = 0; i < targets.length; i++){
				mtp.addPort(targets[i]);
				this.addLink(mtp, targets[i], 5, 'portToCenter', relations);
			}
			this.addNode(mtp, items);
			return mtp;
		}
		else {
			var mtpIndex = this._getMTPIndexIfValid(targets, vertices, lookup, relations);
			if(mtpIndex < 0){
				return "[ModelAPI.addLinksToNodes()]-MTP not present or nonport type - Code " + mtpIndex;
			}

			for(var i=0; i < targets.length; i++){
				if(i != mtpIndex){
				    targets[mtpIndex].addPort(targets[i]);
					this.addLink(targets[i], targets[mtpIndex], 5, 'multilink', relations);
				}
			}
			return targets[mtpIndex];
		}
	}
	
	_hasOnlyTwoPorts(targets, vertices, lookup, edges){
		if(targets.length != 2){return false;}
		return this._hasOnlyPorts(targets, vertices, lookup, edges);
	}
	
	_hasOnlyPorts(targets, vertices, lookup, edges){
		if(targets.length < 2){return false;}
		for(var node of targets){
			if(!node.kind.startsWith('Port')){
				return false;
			}
		}
		return true;
	}
	
	_getMTPIndexIfValid(targets, vertices, lookup, edges){
		if(targets.length < 2){return -1;}
		
		var mtpIndex = -1;
		for(var i = 0; i < targets.length; i++){
			if(targets[i].kind == 'Multilinkhub'){
				if(mtpIndex != -1){
					return -1;//more than one mtp
				}
				mtpIndex = i;
			} else if(!targets[i].kind.startsWith('Port')){
				if(targets[i].kind.startsWith('PointToPointCenter')){
					return -2
				}
				return -3;//nonport/nonmtp
			}
		}
		return mtpIndex;
	}
	
	removeAllAddedAtRuntime(items, relations){
        for(var item of items){
            if(item.addedAtRuntime != undefined && item.addedAtRuntime === true){
                items.delete(item.id);
            }
        }
    }
	
	
	/**
	 * @public
	 * This does just hide the node. 
	 * @param {Node} node to remove
	 * @param The graphical element to change
	 * @returns Node that was removed, or undefined on error.
	 */
	removeNode(datum, useTarget, vertices, lookup, edges){
		//I am become death, destroyer of nodes
		datum.item.remove = true;
		console.log("[ModelAPI] Removing node " + datum.item.id);
		
		this._cascadeRemove(datum.item, useTarget, vertices, lookup, edges);
		datum.item.kind = "_" + datum.item.kind;
		useTarget.style("visibility", "hidden");
	}
	
	/**
	 * @private
	 * @todo Refactor this!
	 */
	_cascadeRemove(item, useTarget, vertices, lookup, edges){
		//get list of neighbors
		//there has to be a better way.
		var neighborhoodSelection = this.findNodeGraphics(item, useTarget._groups[0][0], edges);
		//filter down to what we should remove.
		for(var node of neighborhoodSelection){
			if(this._shouldRemoveToKind(item.kind, node.__data__.item.kind)){
				node.__data__.item.kind = "_" + node.__data__.item.kind;
				node.style.visibility="hidden";
				if(node.__data__.item.kind.startsWith('_Port')){
					var portNeighbors = this.findNodeGraphics(node.__data__.item, node, edges);
					for(var innerNode of portNeighbors){
						if(innerNode.__data__.item.kind === 'PointToPointCenter'){
							innerNode.__data__.item.kind = "_" + innerNode.__data__.item.kind;
							innerNode.style.visibility="hidden";
						}
					}
				}
			}
		}
		
	}
	
	/**
	 * @private
	 */
	_shouldRemoveToKind(sourceKind, targetKind){
		
		
		if(sourceKind == 'Multilinkhub' || sourceKind == 'PointToPointCenter'){
			return false;
		}
		if(sourceKind.startsWith('Site') || sourceKind.startsWith('_Site')){
			return true;//but only to ports.
		}
		if(sourceKind.startsWith('Port') && targetKind == 'PointToPointCenter'){
			return true;
		}
		if(sourceKind.startsWith('_Port') && targetKind == 'PointToPointCenter'){
			return true;
		}
		return false;
	}
	
	/**
	 * @param {Link} Link to remove
	 * @returns Link removed, or undefined on error.
	 */
	removeLink(link){
		
	}
	
	convertSitePrequalifiedToSite(datum, useTarget){
		
		if(datum == undefined || datum.item == undefined || datum.item.kind != "Site_Prequalified"){return undefined};
		
		useTarget.attr("href", "#vertex-Site")
			.classed("Site_Prequalified", false)
			.classed("Site", true);
		datum.item.kind = "Site";
	}
	
	convertMTPToPTP(datum, useTarget){
		//TODO
		if(datum == undefined 
				|| datum.item == undefined 
				|| datum.item.kind != "Multilinkhub"){
			return undefined;
		}
		
		if(datum.item.ports.length > 2){
			var errDescription = "Too many ports.";
			console.log("[ModelAPI] " + errDescription);
			return errDescription;
		}
		
		useTarget.attr("href", "#vertex-PointToPointCenter")
			.classed("Multilinkhub", false)
			.classed("PointToPointCenter", true);
		datum.item.kind = "PointToPointCenter";
	}
	
	convertPTPToMTP(datum, useTarget){
		useTarget.attr("href", "#vertex-Multilinkhub")
			.classed("PointToPointCenter", false)
			.classed("Multilinkhub", true);
		datum.item.kind = "Multilinkhub";
	}
}

var modelAPI = new ModelAPI();


// /* The kubernetesUI component is quite loosely bound, define if it doesn't exist */
// try {
// 	angular.module("kubernetesUI");
// } catch (e) {
// 	angular.module("kubernetesUI", []);
// }
// angular.module("kubernetesUI").factory("ModelAPIService", [],  function(){
// 	return ModelAPI();
// });