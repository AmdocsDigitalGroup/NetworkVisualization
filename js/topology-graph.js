/*jshint esversion: 6 */ 
/*
* This file contains different functions to handle the layout, tooltip, animation 
* and other UI related handlers.
* @author/editor Jay Buddhdev
* @author/editor Zoe Jones
* @author/editor Nick Ferrell
* @author/editor Yasheshkumar Mistry
*/
/* A cache to prevent jumping when rapidly toggling views */
var cache = {};
/**
 * This function handles creation of nodes and links, and brings together the map, simulation and other functionality form various files
 * @param {<topology-graph>} selector - the topology-graph html div object
 * @param {function} notify - Deprecated. Tells the angular directive that an object has been selected.
 * @param {Array[option]} options - allows passing in custom options for the simulation, currently unused
 * @param {Array[function]} popup  - contains the functions that open the popup menus. Cannot be called until after start-up
 * @param {Object} passedKinds - key-value of (item kind: graphic template id) for each included kind
 * @param {Object} passedClickable - key-value of (item kind: boolean) for each included kind that determines pointer event css property
 * @param {function} linkZoom - contains the function to emit the linkZoom event to sync the zoomSlider using angular
 */
function topology_graph(selector, notify, options, passedKinds, passedClickable, popup, linkZoom) {

    /****** Graph Attributes ******/

    var outer = d3.select(selector);
    var map = getMap([50,-110], 9, {minZoom:3, maxZoom:13, zoomSnap:0.6}).setMaxBounds([[90, -185], [-90, 200]]);
    /** Array containing various global conditions for the graph to handle branching */
    var state = {controlActive:false, connectionMode:false, fwView:false, staticView:true, viewToggled: false, dragging: false,
                mtpMode: false, selectedBox: null, nodeLinkingSet: [], datasetIndex: 0, centerSet: false, allowCluster: true,
                isZoomed: null, zoomScale: 1, portView: true, dashinAllowed: true, firstRender: true, geoDataLoaded: false, recommendationView: true};
    //the boundries for the graph in free view
    var graphViewbox = [0, 0, 960, 600];
    var rerender = 0; //used to call update on tick to make sure the graphic render catches up to the simulation logic

    /**used to have smooth scaling in increments for the zoom slider.  The number is the 10th root of 2
     * This means a increase of 10 on the slider doubles the current zoom level. This zoom is only used in free view
    */
    var increment = 1.07177346;
    var baseChange = Math.log(increment);
    var zoomMax = Math.pow(increment, 20);//32;//scalar, not the exponetial value of the Bing map zoom
    var numIncrements = 20;//Math.round(Math.log(zoomMax)/baseChange);


    //Will be changed. will represent the upper left and bottom right corners of the map view, based off the coordinate data
    var minPoint = {lat: 90, lng: -180};
    var maxPoint = {lat: -90, lng: 180};
    var midPoint = {};
    var startingZoom = 9; //higher values may make high zoom levels more stable
    


    /* Kinds of objects to show */
    var kinds = passedKinds;
    var clickable = passedClickable;

    /* Data we've been fed */
    var items = {};
    var storedItems = {};
    var clusterTree;
    var relations = [];
    
    /* Data after parsing, what graph directly uses*/
    var nodes = [];
    var links = [];
    var lookup = {};

    var sites = [];

    /* Graph information, width and height only placeholders*/
    var width = 1600;
    var height = 1200;
    var radius = 20;
    if (options["radius"]) {
        radius = options["radius"];
    }
    var timeout;
    var selection = null;

    var forceSimulation = options["force"];

    /**Settings for the various forces and settings
     * in the d3 simulation
     */
    var simulationValues = {
        startAlpha: .5,
        refreshAlpha: .7,
        alphaDecay: .0288,
        chargeStrength: -800,
        chargeDistance: 400,
        shortDistance: 15,
        shortStrength:3,
        shortItt: 1,
        longDistance: 0,
        longStrength: .3,
        gravity: 5.95,
        collide: 20,
        width: 960,
        height: 594,
        staticChargeDis: 300,
        forceLink: 40,
        //need to find a level appropriate for keeping EVCs apart
        staticChargeStr: 0,
        staticShortItt: 3,
        staticShortStr: .7,
        staticLongStr: .1,
        staticLongItt: 1,
        staticAlphaDecay: .05
    };

    /* Allow the simulation to be passed in, default if not */
    if (!forceSimulation) {
         forceSimulation = makeSimulation(nodes, links, simulationValues);
    }
    
    var transition;

    //zoom behavior is only used during free view
    var zoom = d3.zoom();
    zoom.scaleExtent([1, zoomMax])
        .on("zoom", zoomed);

    /* Defining the svg viewboxes
     * zoom applied to the outermost element so it cascades to all children properly
     * Currently these only apply during free view, since div#bing-map covers this object during map view
     */
    var svg = outer.call(zoom)
        .on("dblclick.zoom", null)
        .append("svg").attr("viewBox", "0 0 2000 2000")
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("class", "kube-topology")
        .on("dblclick", function(){ //temporary way to turn the contol panel on/off
            if(state["controlActive"]){
                d3.select("body").select("#debug-panel").attr("class", "controls-inactive");
                state["controlActive"]=false;
            }
            else{

                //debuggin control panel is inaccesiable when the following is ommited
                d3.select("body").select("#debug-panel").attr("class", "active controls-active");

                state["controlActive"]=true;
            }
            $("#zoom-panel").toggleClass("controls-open");
        });


    /** Defining the viewbox for the graph graphics */
    //added .append("g") back to fix zoom.  Not sure if it will remain fully compatable: Nick 9-11-17
    var freeGraphBox = svg.append("g");
    var freeGraph = freeGraphBox.append("svg").classed("graph-area", true)
            .attr("viewBox", graphViewbox[0]+" "+graphViewbox[1] +" "+graphViewbox[2] +" "+graphViewbox[3])
            .attr("preserveAspectRatio", "xMidYMid meet").append("g").attr("id", "graph-area");
    var mapGraph;
    //svg2 is assigned a selection depending on free (freeGraph) or map (sel) view in the setTick function
    var svg2;



     // var graphButtons = outer.append("div").attr("id", "graph-buttons").append("svg").attr("width", 1); //original
     var graphButtons = d3.select("#mapToggleView"); //added by Shreya
    var graphButtons2 = d3.select("#mapFreeToggleView"); //added by Shreya


    /** Defining the view control buttons */
    var viewButton = graphButtons.append("use").attr("xlink:href", "#button-loading").attr("id", "view-button")
        .attr("x",16).attr("y",16).on("geo-data-loaded", geoDataLoadDone);

    var portButton = graphButtons.append("use").attr("xlink:href", "#port-button")
        .attr("x",16).attr("y",64).on("click", togglePortView);
    
    var recommendationsButton = graphButtons.append("use").attr("xlink:href", "#recommendations-button")
        .attr("x",16).attr("y",105).on("click", toggleRecommendationsView);



    /* drag is applied to the vertices themselves, so only they can be manipulated by user
    ** This is done in the update function when the vertices are bound to the data and 
    ** intialized*/
    var drag = d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);

    //will contain the d3 selection for the use and line objects
    var vertices = d3.select();
    var edges = d3.select();

    window.addEventListener('resize', resized);
    var normalTransition;
    var clusterTime;
    //Sets up the forceSimulation tick behavior. See LeafletD3SvgOverlay for information on the paramaters
    var setTick = function setTick(sel, proj){
        forceSimulation.alpha(simulationValues.refreshAlpha);
        if(proj){
            /**should be loaded asap, because will be needed as soon as toggle occurs,
             * even before overlay has time to finish it's first callback after toggle.
             */
            var _layer = this; //because this is a callback, 'this' is the overlay layer
            mapGraph = sel.classed("graph-area", true);
            if(state.staticView){

                if(state.zoomScale != _layer._scale){
                    //if zoom level changes, update simulation forces
                    state.zoomScale = _layer._scale;
                    forceSimulation.updateLinkDis(state.zoomScale);
                    edges.style("stroke-width", 2/_layer._scale);

                    //implment as timeout to handle repeated zoom firings
                    if(clusterTree){
                        window.clearTimeout(clusterTime);
                        clusterTime = window.setTimeout(function(){
                            var compare = Object.keys(items).length;
                            var depth = Math.ceil(Math.log(_layer._scale*Math.pow(2, 19-startingZoom))/Math.log(2));

                            applyCluster(depth);


                            if(compare != Object.keys(items).length){
                                render(data(items, relations));
                            }
                        }, 20);
                    }
                }
            }
        }else{
            //restore to default for free view
            //since this isn't a callback in this context, it is only called once.
            forceSimulation.updateLinkDis(1);
            edges.style("stroke-width", 2);
            svg2 = freeGraph;
        }
        forceSimulation.addTick( function() {
            /** handles moving the lines and nodes */
            if(state.staticView){
                transition = d3.transition("tick").ease(d3.easeCubicOut).duration(1000);
            }
            else{
                transition = d3.transition("tick").ease(d3.easeCubicOut).duration(500);
            }
            window.requestAnimationFrame(function(){
                if(!state.dragging){
                    edges.transition(transition);
                    vertices.transition(transition);
                }else{
                    transition.selection().interrupt();
                }
                edges.attr("x1", function(d) {
                            return d.source.x;
                            console.log("d.source.x " + d.source.x);
                        })
                    .attr("y1", function(d) {
                            return d.source.y;
                        console.log("d.source.y " + d.source.y);
                        })
                    .attr("x2", function(d) {
                            return d.target.x;
                        console.log("d.target.x " + d.target.x);
                        })
                    .attr("y2", function(d) {
                            return d.target.y;
                        console.log("d.target.x " + d.target.y);
                        });

                vertices.attr("transform", function(d) {
                    if(proj != undefined && state.staticView){//map view
                        if(d.latlong){
                            d3.interrupt(this, "tick");
                            d.fx = proj.latLngToLayerPoint(d.latlong).x;
                            d.fy = proj.latLngToLayerPoint(d.latlong).y;
                        }
                        // else{
                        //    d.fy = d.item.ownerSite.y;
                        //
                        // }
                        return "translate(" + d.x + "," + d.y + ")scale("+1/_layer._scale+")";
                    }//impliceit else: free view
                    if(d.x > graphViewbox[2]+50)
                        d.x = graphViewbox[2]+50;
                    if(d.x < graphViewbox[0]-50)
                        d.x = graphViewbox[0]-50;
                    if(d.y > graphViewbox[3]+50)
                        d.y = graphViewbox[3]+50;
                    if(d.y < graphViewbox[1]-50)
                        d.y = graphViewbox[1]-50;
                        
                    return "translate(" + d.x + "," + d.y + ")";
                });
            });
            if(rerender < 2){//issues reloading graphics on some cases, repeating update forces the infomation to refresh
                rerender++;
                update();
            }
        });
    };

    
    //re-initialize Overlay note to self: this could be a root cause of the node duplication bug.  Investigate later
    var overlay = L.d3SvgOverlay(setTick);
            overlay.addTo(map);
    //set graph initial state
    state.staticView = !state.staticView; //since the orginal setting is the one we should be loading
    toggleStaticView();
    adjust();
    resized();

    /*****************************************************************************/

    /****** Graph functions ******/

    //-----------------------------------------------------------------------------------------------
    //CONTROLS
    //-----------------------------------------------------------------------------------------------
    
    /*Function controling the zoom and panning*/
    var dZoomScale;
    function zoomed() {
        console.log("inside zoomed function");
        state.zoomScale = d3.event.transform.k;
        var transform = d3.event.transform;
        window.requestAnimationFrame(function(){
            freeGraphBox.attr("transform", transform);
            freeGraph.selectAll("line").style("stroke-width", 2/state.zoomScale);
        });
        dZoomScale = Math.round(Math.log(state.zoomScale)/baseChange);
        linkZoom(dZoomScale);

    }
    function zoomTo(scale){
        if(scale != dZoomScale){
            state.zoomScale = Math.pow(increment, scale);
            zoom.scaleTo(outer, state.zoomScale);

        }

    }

    /*Drag control functions*/
    function dragstarted() {
        state.dragging = true;
        forceSimulation.restart();//re-heat on drag
        if (!d3.event.active){
            if(!d3.event.subject.fixed)
                forceSimulation.alphaTarget(0.05); //this makes it so the simulation will not stop during drag
        }

    }

    function dragged() {
        /**Sites are fixed only in static view
        ** No other nodes currently have true values for fixed*/
        if(!state.staticView){ //free view has bounds, but no fixed nodes
            if(d3.event.x > graphViewbox[2]+50)
                d3.event.subject.fx = graphViewbox[2]+50;
            else if(d3.event.x < graphViewbox[0]-50)
                d3.event.subject.fx = graphViewbox[0]-50;
            else
                d3.event.subject.fx = d3.event.x;
                
            if(d3.event.y > graphViewbox[3]+50)
                d3.event.subject.fy = graphViewbox[3]+50;
            else if(d3.event.y < graphViewbox[1]-50)
                d3.event.subject.fy = graphViewbox[1]-50;
            else
                d3.event.subject.fy = d3.event.y;
        }else if(!d3.event.subject.fixed){ //map has no bounds, but fixed nodes
            d3.event.subject.fx = d3.event.x;
            d3.event.subject.fy = d3.event.y;
        }
    }

    function dragended() {
        state.dragging = false;
        /**allows evc nodes to be nudged out from other nodes after drag.
         * sites will always be on top, so they don't need this, and ports
         * have a release ablity when a site is clicked to recover them*/
        if(d3.event.subject.item.kind == ("PointToPointCenter" || "MultilinkHub")){
            var node = d3.event.subject;
            /**Not a great solution to stoping EVCs from moving when opening a display, but it works well enough for now */
            window.setTimeout(function(){
                if(!displayAPI.networkDisplayOpen){
                    node.fy = null;
                    node.fx = null;
                    
                    var lockTime;
                    window.clearTimeout(lockTime);
                    lockTime = window.setTimeout(function(){
                        node.fx = node.x;
                        node.fy = node.y;
                    }, 50/state.zoomScale);
                }
            }, 10);
        }
        forceSimulation.alphaTarget(0); //resets target to 0 so the simulation stops after a few seconds
        if (forceSimulation.alpha() > 0.3) //stops sudden jaring on drag stop, but lets the simulation resettle
            forceSimulation.alpha(0.3);
    }

    function select(item) { //currently unused, but may want to be implemented when convieninet 
        if (item !== undefined)
            selection = item;
        svg2.selectAll("g").classed("selected", function(d) {
            return d.item === selection;
        });
    }

    /**NOT IMPLEMENTED */
    function graphicReset(){
        //a possible soft reset option that moves all (present) nodes back to a initial state.
        //restart tick
        forceSimulation.restart(.3);
        //set alpha high enough to quickly rearrange the graph
        forceSimulation.alpha(.3);
        //free all non-fixed nodes for movement
        releasePlacedNodes();
    }
    function softReset(){
        nodes = [];
        links = [];
        lookup = {};
        digest();
    }
    //////UNFINISHED!!
    function hardReset(){
        return state.datasetIndex;
    }
    function geoDataLoadDone(){
        state.geoDataLoaded = true;
        viewButton.on("geo-data-loaded", null);
       // viewButton.attr("xlink:href", "#free-button").on("click", toggleStaticView); //original
        graphButtons.attr("a:href", "#mapToggleView").on("click", toggleStaticView); //added by Shreya
        graphButtons2.attr("a:href", "#mapFreeToggleView").on("click", toggleStaticView); //added by Shreya
        if(links.length < 1){
            render(data(items, relations));
        }
    }

    /** moves the sites to their determined positions on the Map.  Currently only
    **  set up for TestDataFull, since it is the only data with accurate geocoords*/
    function toggleStaticView(){

        d3.select("#mapToggleView").style('display', 'block'); //added by Shreya
        //toggle staticView boolean
        state.staticView = !(state.staticView);
        state.viewToggled = true;
        //remove graphics from view. will be added back after svg2 set the the new selection
        edges.remove();
        vertices.remove();

        if(!state.staticView){//free view

            d3.select("#mapToggleView").style('display', 'none'); //added by Shreya
            d3.select('#mapFreeToggleView').style('display', 'block'); //added by Shreya
            //no fixed nodes, all are allowed to move
            clearTimeout(clusterTime);
            releaseFixedNodes();
            //set toggle button apperance
            //d3.select("#graph-buttons").classed("free-view", true);
            if(state.geoDataLoaded){
                console.log("inside if if statement");
                viewButton.attr("xlink:href", "#static-button");

            }
            //hide map
            d3.select("#bing-map").style("display", "none");
            //set view to initial position
            outer.transition(750).call(zoom.transform, d3.zoomIdentity);
            //set zoom bounds. may be Deprecated since map uses it's own zoom logic
            zoom.scaleExtent([1, zoomMax]).translateExtent([[-width/2, -height/2], [width*1.5, height*1.5]]);
            //set tick logic, update svg2 selection, reset simulation link forces
            if(clusterTree){
                applyCluster(20);
                clusterTree.swithToFreeView();
            }
            setTick();

        }else{

            d3.select('#mapFreeToggleView').style('display', 'none'); //added by Shreya
            d3.select("#mapToggleView").style('display', 'block'); //added by Shreya

            graphButtons.attr("a:href", "#mapToggleView").style("color", "white");
            //sites become fixed, nodes placed by user are freed
            releasePlacedNodes();
            //set toggle button apperance
            d3.select("#graph-buttons").classed("free-view", false);
            viewButton.attr("xlink:href", "#free-button");
            //bring map to front
            d3.select("#bing-map").style("display", "initial");
            //kinda hacky, but prevents map from dragging when moving nodes.
            var container = d3.select("div.leaflet-overlay-pane");
            container.on('mouseenter', function () {
                map.dragging.disable();
            });
            container.on('touch', function () {
                map.dragging.disable();
            });
            svg2 = mapGraph;
            // Re-enable dragging when user's cursor leaves the element
            container.on('mouseleave', function () {
                map.dragging.enable();
            });
            container.on('touchend', function () {
                map.dragging.enable();
            });
            //slight pause befor moving to initail map view
            if(midPoint.lat)
                map.setView(midPoint, startingZoom);
            var tOut;
            window.clearTimeout(tOut);
            tOut = window.setTimeout(setMap, 500);
            function setMap(){map.flyToBounds([minPoint, maxPoint]);}


        }
        //set global simulation forces
        forceSimulation.toggleView(state.staticView);
        //show/hide zoom slider
        d3.select("#zoom-panel").classed("inactive", state.staticView);
        //re-render. not called during initial start-up.
        if(!state.firstRender){
            render(data(items, relations));
        }
        state.firstRender = false;
    }





    /**Allows hiding of any ports that don't have a EVC connected to them. */
    function togglePortView(){
        state.portView = !state.portView;
        forceSimulation.restart(.2);
        if(state.portView){//show hidden
            for(item in items){
                if(items[item].kind.startsWith('-hidden-')){
                    items[item].kind = items[item].kind.substring(8);
                }
            }
        }else{//hide unused
            for(item in items){
                if(items[item].kind == 'Port'){
                    if(!items[item].hasEVC){
                        items[item].kind = '-hidden-' + items[item].kind;
                    }
                }
            }
        }

        /**issues found with animation sync  
        * a somewhat costly solution, but since the nodes 
        * and lines have seperate timers, it's the only one we have atm 
        * not without it's own issues, most noteably a flicker
        */
        state.dashinAllowed = false;
        edges.remove();
        vertices.remove();

        render(data(items, relations));
        if(!state.staticView)
            zoom.scaleTo(outer, state.zoomScale);
        
    }
    
    /*Show or hide recommendations */
    function toggleRecommendationsView(){
        state.recommendationView = !state.recommendationView;
        forceSimulation.restart(.2);
        if(state.recommendationView){//show hidden
            for(item in items){
                if(items[item].kind.startsWith('-hidden-')){
                    items[item].kind = items[item].kind.substring(8);
                }
            }
        }else{//hide unused
            for(item in items){
                if(!items[item].recommendMessage){
                    items[item].kind = '-hidden-' + items[item].kind;
                }
            }
        }

        state.dashinAllowed = false;
        edges.remove();
        vertices.remove();

        render(data(items, relations));
        if(!state.recommendationView) {
            zoom.scaleTo(outer, state.zoomScale);
        }
    }

    //-----------------------------------------------------------------------------------------------
    //REACTIONS
    //-----------------------------------------------------------------------------------------------
    /*called when window is resized */
    function resized() {
        window.clearTimeout(timeout);
        timeout = window.setTimeout(adjust, 150);
    }
    
    /* Adjusting the sizes based on the client's width and height*/
    function adjust() {
        timeout = null;
        width = outer.node().clientWidth;
        height = outer.node().clientHeight;
        forceSimulation.adjust(simulationValues.width, simulationValues.height);
        zoom.translateExtent([[-width/2, -height/2], [width*1.5, height*1.5]]);
        svg.attr("viewBox", "0 0 "+width+" "+height);
    }
    

    //-----------------------------------------------------------------------------------------------
    //OPERATIONS
    //-----------------------------------------------------------------------------------------------

    //frees all nodes and sets fixed to false
    function releaseFixedNodes() {
        nodes.forEach(function(node){
            node.fx = null;
            node.fy = null;
            node.fixed = false;
        });
    }
    //frees all un-fixed nodes
    function releasePlacedNodes(){
        nodes.forEach(function(node){
            if(!node.fixed){
                node.fx = null;
                node.fy = null;
            }
        });
    }

    //function to add and EVC
    function addEVC(e, evc){
        console.log("addEVC called");
        var result = modelAPI.addLinksToNodes(state.nodeLinkingSet, vertices, lookup,
            relations, items, nodes, state.mtpMode, evc);
        render(data(items, relations));
        if(!state.staticView)
            zoom.scaleTo(outer, state.zoomScale);
    }
    //function to add a flexware service
    function addFWService(e, order){
        console.log("addFWService called");
        if(order.services.FWfirewall && !state.selectedBox.services.FWfirewall){
            modelAPI.addServiceToFlexware("FWfirewall", state.selectedBox, items, relations);
            state.selectedBox.services.FWfirewall = true;
        }
        if(order.services.FWwanX && !state.selectedBox.services.FWwanX){
            modelAPI.addServiceToFlexware("FWwanX", state.selectedBox, items, relations);
            state.selectedBox.services.FWwanX = true;
        }
        for(var i = 0;i < order.services.FWrouter; i++){
            modelAPI.addServiceToFlexware("FWrouter", state.selectedBox, items, relations);
            
        }
        state.selectedBox.services.FWrouter+= order.services.FWrouter;
        clusterTree = Quadtree.buildTree(sites, items, relations, clusterTree, null, null);
        render(data(items, relations));
        state.selectedBox = null;
        if(!state.staticView)
            zoom.scaleTo(outer, state.zoomScale);
    }

    //function to add a Adiod Service
    function addAdiodService(e,order){
        console.log("addAdiod called");
        if(order.services2.adiodInternet && !state.selectedBox.services2.adiodInternet){
            modelAPI.addServiceToAdiod("adiodInternet", state.selectedBox, items, relations);
            state.selectedBox.services2.Internet = true;
        }

        clusterTree = Quadtree.buildTree(sites, items, relations, clusterTree, null, null);
        render(data(items, relations));
        state.selectedBox = null;
        if(!state.staticView)
            zoom.scaleTo(outer, state.zoomScale);

    }

    //TODO this is just a test
    function addCluster(e, type){
        console.log("Clustering test");
        var self = this;
        var cluster = new Cluster();
        cluster.absorb({items:items, links:links, nodes:nodes, relations:relations}, [{uniqueId : "0001FYPA38"}, {uniqueId : "0001G18O65"}]);
        items[cluster.uniqueId] = cluster;
        digest();
    }


    //-----------------------------------------------------------------------------------------------
    //PROCESSING
    //-----------------------------------------------------------------------------------------------

    /** Handles reseting state after the popups close */
    function updateState() {

        /** State Handling */
        if(state.connectionMode){
            svg2.selectAll("use.selected-connection-point").classed("selected-connection-point", false);
            state.nodeLinkingSet = [];
            state.connectionMode = false;
        }
        if(state.fwView){
            state.fwView = false;
        }
    }

    /* Updating the UI based graphics */
    function update() {

        updateState();
        //default case because the overlay layer sets mapGraph = sel asyncronously 
        if(!svg2){
            svg2 = mapGraph;
        }
        edges = svg2.selectAll("line").data(links);//binding links to lines
        var lines = edges.enter().insert("line", "g");

        vertices = svg2.selectAll("g").data(nodes, function(d) {
                    if(!d){
                        return;
                    }
                    return d.id;
                });
        var added = vertices.enter().append("g");

        //first attempt to smooth animation in firefox 9-1-17
        window.requestAnimationFrame(function(){
            edges.exit().remove();

            if(state.dashinAllowed){
                lines.attr("class", "edges dashin");
            }else{
                lines.attr("class", "edges standard");
                state.dashinAllowed = true;
            }
            
            /** line glow animation now synchs regardless of when it is loaded in.
             * Linking new dashin to correct line is still an issue
            */
            var tOut;
            svg2.select("line.dashin").on("animationend", function(d){
                d3.select(this).on("animationend", null);
                edges.classed("dashin", false).classed("standard", false);
                
                
                window.clearTimeout(tOut);
                tOut = window.setTimeout(reclassLines, 0);
                function reclassLines(){
                    edges.classed("newEvc", function(d){
                        return d.source.item.addedAtRuntime == true || d.target.item.addedAtRuntime == true;
                    });
                    edges.classed("standard", function(d){
                        return !d.source.item.addedAtRuntime && !d.target.item.addedAtRuntime && allowAnimations;
                    });
                }
            });//*/
            
            edges.style("stroke-width", 2/state.zoomScale);

            vertices.exit().remove();


            added.call(drag);

            displayAPI.setGraphListeners(added, state, popup, links, items, relations);

        });

        select(selection);

        /*Simulation re-intialization*/

        forceSimulation.resetNodes(nodes);
        forceSimulation.setLinks(links, state.staticView);
        forceSimulation.toggleView(state.staticView);

        //forceSimulation.restart(simulationValues.startAlpha);

        displayAPI.issueAlerts(document.getElementsByClassName("PointToPointCenter"));
        displayAPI.provideRecommendations(document.getElementsByClassName("Port"));

        return added;
    }

    function applyCluster(depth){
        var clusterList = clusterTree.list(depth);
        var pItems = items;
        for(item in storedItems){
            pItems[item] = storedItems[item];
        }
        items = {};
        for(item in clusterList){
            items[item] = clusterList[item];
        }
        for(item in pItems){
            if(pItems[item].kind == "PointToPointCenter" || pItems[item].kind == "Multilinkhub"){
                var add = false;
                var ports = pItems[item].ports;
                for(var i = 0;i < ports.length;i++){
                    for(var j = i+1;j < ports.length;j++){
                        var temp1 = clusterTree.resolve(ports[i], clusterTree.lastDepthChecked);
                        var temp2 = clusterTree.resolve(ports[j], clusterTree.lastDepthChecked);
                        if(temp1 !== temp2){
                            add = true;

                        }
                    }
                }
                if(add){
                    items[item] = pItems[item];
                }else{
                    storedItems[item] = pItems[item];
                }
            }
        }

    }

    function applyClusterElements(){

        console.log("inside applyClusterElements function ");

        var clusterInfo = document.querySelectorAll(".Cluster-node.use-node");

            for (var i = 0; i < clusterInfo.length; i++) {
                var clusterData = clusterInfo[i].__data__.item.items;

                var totalSites=0;
                var totalPorts=0;
                var totalAdiod=0;
                var totalFlexware=0;
                for (item in clusterData) {
                    if(clusterData[item].kind == "Site"){
                        totalSites++;

                    }
                    if(clusterData[item].kind == "Port"){
                        totalPorts++;

                    }
                    if(clusterData[item].kind == "Adiod"){
                        totalAdiod++;

                    }
                    if(clusterData[item].kind == "Flexware"){
                        totalFlexware++;

                    }

                }
                console.log("Total Sites" + totalSites);
                console.log("Total Ports" + totalPorts);
                console.log("Total Adiod" + totalAdiod);
                console.log("Total Flexware" + totalFlexware);
            }


        }








    //handles creating nodes and links based off the items and realations provided 
    function digest(alpha) {
        if(!alpha) {alpha = simulationValues.startAlpha;}
        // if(forceSimulation.alpha() >= .1){
        //     alpha = forceSimulation.alpha();
        // }

        var pnodes = nodes;
        var plookup = lookup;

        /* The actual data for the graph */
        nodes = [];
        links = [];
        lookup = {};
        sites = [];

        var item, id, kind, node;
        for (id in items) {
            item = items[id];
            kind = item.kind;
            if(kind == "Service")
                kind = item.type;
            if(kind == "Service2")
                kind = item.type;

            //checking kind isn't hidden.
            if (kinds && !kinds[kind]) {
                console.log("Item named " + id + " of kind " + kind + " is being hidden");
                continue;
            }

            /* Prevents flicker */
            node = pnodes[plookup[id]];
            if (!node) {
                node = cache[id];
                delete cache[id];
                if (!node)
                    node = {};
            }

            node.id = id;
            node.item = item;
            //assigns sites a latlong value, calculates the min and max points for the initial map view
            if(node.item.coordinates != undefined){
                if(state.staticView)
                    node.fixed = true;

                node.latlong = node.item.coordinates;
                if(minPoint.lat > node.latlong.lat)
                    minPoint.lat = node.latlong.lat;
                if(minPoint.lng < node.latlong.lng)
                    minPoint.lng = node.latlong.lng;
                if(maxPoint.lat < node.latlong.lat)
                    maxPoint.lat = node.latlong.lat;
                if(maxPoint.lng > node.latlong.lng)
                    maxPoint.lng = node.latlong.lng;
                midPoint.lat = (maxPoint.lat+minPoint.lat)/2;
                midPoint.lng = (maxPoint.lng+minPoint.lng)/2;
            }

            /** Defer sites to the end of the nodes list so 
            ** their labels will be drawn on top of other elements*/
            if(item.kind == 'Site' || item.kind == 'Site_Prequalified'){
                sites.push(node);
            }
            else{
                lookup[id] = nodes.length;
                nodes.push(node);
            }
        }
        if(midPoint.lat && !state.centerSet){
            state.centerSet = true;
            map.setView(midPoint, startingZoom);
            if(state.allowCluster){
                clusterTree = Quadtree.buildTree(sites, items, relations,null, {lat: 90, lng: -180}, {lat: -90, lng: 180});//maxPoint, minPoint);
            }else{
                clusterTree = undefined;
            }
        }
        for(var site in sites){
                lookup[sites[site].id] = nodes.length;
                nodes.push(sites[site]);
        }

        var i, len, relation, s, t, relationVal;
        for (i = 0, len = relations.length; i < len; i++) {
            relation = relations[i];

            if(clusterTree){
                var as = clusterTree.resolve(relation.source, clusterTree.lastDepthChecked);
                var at = clusterTree.resolve(relation.target, clusterTree.lastDepthChecked);
                s = lookup[as];

                t = lookup[at];
            }else{
                s = lookup[relation.source];
                t = lookup[relation.target];
            }
            relationVal = relation.kind;

            //don't include links to nodes that are hidden, or connections whithin same cluster
            if (s === undefined || t === undefined || s === t)
                continue;

            //check if port has at least 1 evc
            if(nodes[s].item.kind == 'Port'){
                if(relationVal == 'portToSite')
                    nodes[s].item.ownerSite = nodes[t];
                else
                    nodes[s].item.hasEVC = true;
            }
            if(nodes[t].item.kind == 'Port'){
                if(relationVal == 'portToSite')
                    nodes[t].item.ownerSite = nodes[s];
                else
                    nodes[t].item.hasEVC = true;
            }

          //  add link to links array
            links.push({
                source : s,
                target : t,
                kinds : nodes[s].item.kind + nodes[t].item.kind,
                relationValue : relationVal
            });



        }

        forceSimulation.restart(alpha); //slight re-heat on digest to allow nodes to settle into correct position

        //quick fix for update lagging on graphic rendering, makes update be called twice on tick
        rerender = 0;
        if (width && height)
            return update();
        else
            return d3.select();
    }

    function kindsFoo(value) {
        kinds = value;
        var added = digest();
        return [ vertices, added ];
    }
    function setClickable(value) {
        clickable = value;
    }

    //handles tieing graphics to nodes through svg use tags
    function render(args) {
        console.log("Testing render");

        var vertices = args[0];
        var added = args[1];
        added.attr("class", function (d) {
            if (d.item.kind == "Service")
                return d.item.type;
            return d.item.kind;
        });
        added.append("use").attr("class", function (d) {
            if (d.item.kind == "Service")
                return d.item.type;
            return d.item.kind + "-node";
        })
            .classed("use-node", true)
            .classed("clickable", function (d) {
                return clickable[d.item.kind];
            })
            .attr("xlink:href", icon);

        var clusters = added.filter("g.Cluster");
        clusters.append("text").classed("cluster-text", true).text(function (d) {
            return d.item.numSites;
           // return d.item.numPorts;

        }).attr("y", -14).attr("x", 2).style("opacity", 1);

        //.style opacity may be changed later, but currently is to prevent the fade-out-full class from removeing the number on hover


        //WORKING PORT DISPLAY

        clusters.append("use").attr("xlink:href", "#vertex-Port").attr("y", 14).attr("x",6)

        clusters.append("text").classed("portcluster-text", true).text(function (d) {
            // return d.item.numSites;
            // if(d.item.numAdiod > 0){
            return d.item.numPorts;
            // }
        }).attr("y", 24).attr("x",12).style("opacity", 1);



        //WORKING ADIOD DISPLAY

        clusters.append("use").attr("xlink:href", "#vertex-cloud").style("display", function (d){
            if(d.item.numAdiod > 0){
                return "";
            }
            else{
                return "none";
            }}).attr("y", 11).attr("x",-29);

        clusters.append("text").classed("portcluster-text", true).text(function (d) {
            if(d.item.numAdiod > 0){
                return d.item.numAdiod;
             }
        }).attr("y", 9).attr("x",-31);


        var sites = added.filter("g.Site");
        sites.append("text").classed("SiteName", true).text(function (d) {
            console.log("printing d.item1" + d.item);
            return d.item.siteAlias;
        }).attr("x", 15).attr("y", -10);
        sites.append("path").classed("SiteLabel", true).attr("d", "M -40 -34.6 L -20 -34.6 L -10 -17.3");




        var ports = added.filter("g.Port");
        ports.append("text").classed("PortName",true).text(function (d){
           // console.log("printing d.item" + JSON.stringify(d.item.id));
            return d.item.id;
        }).attr("x", 15).attr("y", -10).style('display', 'none');

        //acessiblity title?
        added.append("title").text(function (d) {
            return d.kind;
        });

        added.classed("vertices", true);

        if(document.getElementById("PTPToggleView").checked == true){

            togglealertsdefault();
            checkLabelToggle();
            //labelToggle();
            checkTogglePTPAndLines();
            checkTogglePort();
       // toggleclick();
           // checkToggleMTP();


        }
        else{

            checkTogglePTP();
            //labelToggle();
            checkLabelToggle();
            checkTogglePTPAndLines();
            checkTogglePort();
           // toggleclick();
           // checkToggleMTP();

           // checkalertlines();

        }

       // applyClusterElements();
    }
    function icon(d) {
        var text;
        if (kinds){
            if (d.item.kind == "Service"){//all services share a kind, type determines graphic
                text = kinds[d.item.type];
            }
            else{
                text = kinds[d.item.kind];
            }
        }
        if(!allowAnimations){
            text += "-static"
        }
        return text || "";
    }

    function data(new_items, new_relations) {
        items = new_items || {};
        relations = new_relations || [];
        var added = digest();
        return [ vertices, added ];
    }
    function switchDataset(dataset){
        minPoint = {lat: 90, lng: -180};
        maxPoint = {lat: -90, lng: 180};
        midPoint = {};

        //figure out dataset swapping
        items = dataset.items;
        relations = dataset.relations;
        clusterTree = undefined;
        state.centerSet = false;
        storedItems = {};
        render(data(items, relations));
    }

    function fitBoundedMap(latlong){
        map.flyToBounds([L.latLng(latlong.lat, latlong.lng)],[10,10]);
    }


    /** The return acts an interface for the caller; in this
     *  case it allows the buildGraph directive the ablity to
     *  interact with the graph
     */
    return {
        addEVC : addEVC,
        addFWService : addFWService,
        addAdiodService: addAdiodService,
        stateChange: updateState,
        switchDataset: switchDataset,
        addCluster: addCluster,
        toggleSV: toggleStaticView,
        zoomTo: zoomTo,
        select : select,
        kinds : kindsFoo,
        data: data,
        fitBoundedMap: fitBoundedMap,
        numIncrements: numIncrements,
        digest: digest,
        render: function(new_items, new_relations){
            console.log("page rendered first time")
            render(data(new_items, new_relations));
        },
        close : function() {
            window.removeEventListener('resize', resized);
            window.clearTimeout(timeout);

            /*
             * Keep the positions of these items cached, in
             * case we are asked to make the same graph
             * again.
             */
            var id, node;
            cache = {};
            for (id in lookup) {
                node = nodes[lookup[id]];
                delete node.item;
                cache[id] = node;
            }

            nodes = [];
            lookup = {};
        }
    };
}