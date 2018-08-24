
 /** Handles finding the neighboring graphics of node 
 * with object of evc. 
 * @param {string} 	ev - the id of the center node.
 * @param {use}		 	eventTarget - the use element of the center node
 * @param {Array[Links]} links - The links array. Will not be modified.  
 */
function findNodeGraphics(ev, eventTarget, links) {
    //the array to be returned
    var newSelection = [eventTarget];

    //the object containing all g.vertices (use.node --> g.vertices --> svg.graph-area)
    var currentNodes = eventTarget.parentElement.parentElement;
    //now a selection of all g.vertices
    currentNodes = d3.select(currentNodes).selectAll("g");
    //now an array on all g.vertices elements
    currentNodes = currentNodes._groups[0];

    //using links, find all items that have a relation to target
    for(var i = 0; i < links.length; i++){

        if(ev == links[i].source.item){
            newSelection.push(links[i].target);}
        if(ev == links[i].target.item){
            newSelection.push(links[i].source);}
    }

    //using the item, find the g.vertice assosiated with it. Then add it's use.node element
    for(var i = 0;i < newSelection.length;i++){
        for(var j = 0;j < currentNodes.length;j++)
            if(newSelection[i] == currentNodes[j].__data__)
                newSelection[i] = currentNodes[j].firstChild;
                                             }
    //return array of all use elements. Index 0 is always the orginal target.
    return newSelection;
}

/**
* Indicates if the given string can be eligible for link.
* @param {string} kind
* @returns {boolean} whether the kind is eligible for link.
*/
function isKindEligibleForLink(kind){
    //issues using MTP mode, exclude for now
    return (kind.startsWith("Port") /**   */  );  //*/|| kind.startsWith("Multilinkhub"));
}
function getAttachedSite(source, items, relations){
    //Todo: add capablity for multipoint EVC connections
    if(source.kind == "Multilinkhub"){
        return source;
    }
    var site = null;
    var i = 0;
    while(site == null){
        if(source.id == relations[i].source)
            if(relations[i].kind.indexOf("ToSite") != -1)
                site = items[relations[i].target];
        i++;
    }
    return site;
}