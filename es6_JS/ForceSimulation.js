/*jshint esversion: 6 */ 
class ForceSimulation{
    /**
     * 
     * @param {Array[Nodes]} nodes - nodes array. Will not be modified
     * @param {Array[Links]} links - links array. Will not be modified
     * @param {Object} values - collection of simulation values to be used. See simulationValues in topology-graph.js
     */
    constructor(nodes, links, values){
        //will contain two diffrent node arrays to be applied to diffrent link relations
        this.shortLinks = [];
        this.longLinks = [];
        this.values = values;
        //used to delay force updates until after the changes have ceased for awhile
        this.timeout = null;
        /** Setting the initial values as given 
         * Most forces are added later, but gravity and collide aren't added anywhere else,
         * except in specfic cases for view updates
        */
        this.forceSimulation = d3.forceSimulation(nodes)
            .force("centeringX", d3.forceX(values.width/2).strength(values.gravity))
            .force("centeringY", d3.forceY(values.height/2).strength(values.gravity))
            .force("collide", d3.forceCollide(values.collide).strength(1))
            .force("charge", d3.forceManyBody())
            .force("chargePort", d3.forceManyBody())
            .alpha(values.startAlpha);
        
    }
    /** See D3 documentaion on simulation.restart()
     * alpha provides the starting value
     */
    restart(alpha) {
        this.forceSimulation.restart();
        if(alpha)
            this.forceSimulation.alpha(alpha);
    }
    /** rescale the distance between sites and ports as a factor of scale 
     *  The timeout reduces lag from multiple zoom events occuring in sequence.
     *  Force simulation and topology graph both have a refrence to values,
     *  though currently only topology graph modifies it.
    */
    updateLinkDis(scale){
        var closure = this;
        var zoomScale = scale;
        //this.values.staticLongStr = Math.min(.3, .3/zoomScale);

        window.clearTimeout(this.timeout);
        this.timeout = window.setTimeout(updateLinks, 10);
        
        /** closure for the ForceSimulation was needed for the callback */
        function updateLinks(){
            closure.forceSimulation.restart();
            closure.forceSimulation
                .force("shortLink").distance(closure.values.shortDistance/zoomScale);
            closure.forceSimulation
                .force("longLink").distance(closure.values.longDistance);
            if(closure.forceSimulation.alpha() < .1){
                closure.forceSimulation.alpha(.1);
            }
            window.setTimeout(function(){
                closure.timeout = null;
                    closure.forceSimulation.force("collide", d3.forceCollide(closure.values.collide/zoomScale).strength(1))},10);
        }
    }
    /** initializes forces on appropriate nodes
     *  implicitly removes hidden nodes (which digest removed from nodes) by not re-adding them
    * @param {Array[Nodes]} nodes - The nodes array. Will not be modified.  
     */
    resetNodes(nodes){
        this.forceSimulation.nodes(nodes);
        //exclude is also built incase of specfic forces being applied on them exclusively later
        var exclude = [], include = [];
        if(nodes.length != 0){
            for(var n of nodes)
                if((n.item.kind == 'Port') || (n.item.kind == 'Service'))
                    exclude.push(n);
                else 
                    include.push(n);
        }
        this.forceSimulation.force("charge").initialize(include);
        this.forceSimulation.force("chargePort").initialize(exclude);
        return nodes;
    }
    /**Handles setting forces for the two types of links 
     * @param {Array[Links]} links - The links array. Will not be modified.  
     * @param {bool} staticView - if the view should be Map (true) or Free (false)
     */
    setLinks(links, staticView){
        this.longLinks = [];
        this.shortLinks = [];
        var i, len = links.length;
        for(i = 0; i < len; i++) {
            if (links[i].relationValue === "portToSite" || links[i].relationValue === "flexwareToSite" ||
                links[i].relationValue === "serviceToFlexware" || links[i].relationValue === "serviceToAdiod" || links[i].relationValue === "adiodToSite") {
                this.shortLinks.push(links[i]);
            }
            else{
                this.longLinks.push(links[i]);
            }
        }
        /** Choses which linking forces depending on
         *  if the user is in map view (staticView == true) 
         *  or free view (staticView == false)
         */
        if(staticView){
            this.forceSimulation.force("longLink", 
                                       d3.forceLink(this.longLinks)
                                       .strength(this.values.staticLongStr)
                                       .iterations(this.values.staticLongItt));
            this.forceSimulation.force("shortLink", 
                                       d3.forceLink(this.shortLinks)
                                       .distance(this.values.shortDistance)
                                       .strength(this.values.staticShortStr)
                                       .iterations(this.values.staticShortItt));
        }else{
            this.forceSimulation.force("longLink", 
                                       d3.forceLink(this.longLinks)
                                       .distance(this.values.longDistance)
                                       .strength(this.values.longStrength));
            this.forceSimulation.force("shortLink", 
                                       d3.forceLink(this.shortLinks)
                                       .distance(this.values.shortDistance)
                                       .strength(this.values.shortStrength)
                                       .iterations(this.values.shortItt));
        }
    }
    /** Handles moving between map and free view.  Link forces will be
     * updated appropriatly by their standard call, but universal forces
     * need to be changed here.
     * @param {bool} staticView - if the view should be Map (true) or Free (false)
     */
    toggleView(staticView){
        if(staticView){
            this.forceSimulation.force("centeringX").strength(0);
            this.forceSimulation.force("centeringY").strength(0);
            this.forceSimulation.force("charge")
                   .strength(this.values.staticChargeStr)
                   .distanceMax(this.values.staticChargeDis);
            //currently staticly set here. stops odd behavior when graph isn't allowed to settle (i.e. during drag events)
            this.forceSimulation.force("chargePort").strength(-20).distanceMax(30);
            this.forceSimulation.alphaDecay(this.values.staticAlphaDecay);
        }else{
            this.forceSimulation.force("centeringX").strength(this.values.gravity);
            this.forceSimulation.force("centeringY").strength(this.values.gravity);
            this.forceSimulation.force("charge")
                   .strength(this.values.chargeStrength)
                   .distanceMax(this.values.chargeDistance);
            this.forceSimulation.force("chargePort").strength(-50).distanceMax(30);
            this.forceSimulation.alphaDecay(this.values.alphaDecay);
        }
        
    }
    /** adjust for window size.  Not espesially visible, but does improve view on
     *  some of the more extreme casses.
     * @param {number} width - new width of window
     * @param {number} height - new height of window
     */
    adjust(width, height){
        this.values.width = width;
        this.values.height = height;
    }
    /** See D3 documentation on simulation.alpha
     * @param {number} alpha - new alpha for the simulation
     * */
    alpha(alpha){
        if(!alpha)
            return this.forceSimulation.alpha();
        this.forceSimulation.alpha(alpha);
    }
    /** See D3 documentation on simulation.alphaTarget 
     * @param {number} alpha - new alphaTarget for the simulation
    */
    alphaTarget(alpha){
        this.forceSimulation.alphaTarget(alpha);
    }
    
    addTick(tickFoo){
        this.forceSimulation.on("tick", tickFoo);
    }
    tick(){
        this.forceSimulation.tick();
    }
    stop(){
        this.forceSimulation.stop();
    }
};
/** setting ForceSimulation up as singleton */
var simulation;
var makeSimulation = function(nodes, links, values) {
    if(!simulation)
        simulation = new ForceSimulation(nodes, links, values);
    return simulation;
};
function getSimSingleton(){
    return simulation;
}