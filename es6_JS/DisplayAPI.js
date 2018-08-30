/*jshint esversion: 6 */
class DisplayAPI {
    /** Note for .removable:
     * This class has no style settings, and is used only to act
     * as a selector by the releaseNodeInfo to remove any graphics
     * added by these functions.  It removes regardless of orgin
     * of the graphic and on EVERY mouseout from ANY node.
     */
    constructor() {
        this.flexData = null;
        this.networkData = false;
        this.networkDisplayOpen = false;
        this.addDisplay;
        this.removeDisplay;
        this.links;
        this.recommendationsData = false;
    }
    /**Called by the flexware controller to pass the diskUtilization.json */
    parseFlexwareJson(data) {
        this.flexData = data;
    }
    /**Called by the network controller to pass the networkIssues.json */
    parseNetworkHealth(data) {
        this.networkData = data;
    }

    parseTargetRecommendations(data) {
        this.recommendationsData = data;
    }
    /** on digest, scan network data to determine if alerts need to be issued 
     * @param {Array[Node]}evcs - array of evcs to be checked for corresponding data in networkData.
     */
    issueAlerts(evcs) {

        console.log("printing evcs" + evcs);
        if (this.networkData) {
            console.log("inside issueAlerts function");
            var len1 = this.networkData.length;
            var len2 = evcs.length - 1;
            for (var i = 0; i < len1; i++) {
                for (var j = 0; j < len2; j++) {
                    if (evcs[j].__data__.item.linkName == this.networkData[i].id) {
                        //add clickable if evc has data
                        d3.select(evcs[j]).select("use").classed("clickable", true);
                        //alert if 10% loss or more
                        if (this.networkData[i].pktloss > 10) {
                            if (!evcs[j].hasAlert) {
                                d3.select(evcs[j]).append("use")
                                    .attr("xlink:href", "#alert-icon")
                                    .attr("width", 10)
                                    .attr("height", 10)
                                    .attr("x", 10)
                                    .attr("y", -15);
                                evcs[j].hasAlert = true

                            }
                        }
                    }
                }
            }
        }
    }


    /** applied on EVCs to display network data if we have any for it
     * functions simiarlly to all other information popups
     * @param {use} useTarget - the use object at the center of the node being clicked.
     */
    displayNetworkHealth(useTarget) {
        //boolean used to prevent stacking multiple display windows
        //will be cleared by releaseNodeInfo on mouseout
        this.networkDisplayOpen = true;

        var netData;
        var len = this.networkData.length;
        //grab the data for specfic EVC
        for (var i = 0; i < len; i++) {
            if (useTarget.__data__.item.linkName == this.networkData[i].id)
                netData = this.networkData[i];
        }
        if (netData == undefined) {
            console.log("no network data found");
            return -1;
        }

        //g element containing the vertice
        var g = d3.select(useTarget.parentElement);
        //svg element containing the graph
        var svg = d3.select(useTarget.ownerSVGElement);

        //reorder render model to make sure display is the last one drawn
        //note that sites have next highest priority after target
        svg.selectAll("g.vertices").sort(function (x, y) {
            if (x == useTarget.__data__)
                return 1;
            if (y == useTarget.__data__)
                return -1;
            if (x.item.kind == "Site") {
                if (y.item.kind == "Site")
                    return 0;
                return 1;
            }
            if (y.item.kind == "Site") {
                return -1;
            }
            return 0;
        });
        /** recolors the connecting lines red */
        displayAPI.drawEVCLines(useTarget, "alert-line", true);

        //location window opens relative to EVC node center
        //x, y represent the top left corner of the display
        var x = -120;
        var y = -150;
        window.requestAnimationFrame(function () {
            g.append("rect").classed("removable network-box", true)
                .attr("x", x).attr("y", y).attr("width", 240).attr("height", 130);
            g.append("text").classed("removable network-title", true)
                .attr("x", x + 125).attr("y", y + 15).text("NETWORK HEALTH");

            g.append("text").classed("removable network-label", true)
                .attr("x", x + 125).attr("y", y + 38).text("Network Latency");
            g.append("text").classed("removable network-metric", true)
                .attr("x", x + 40).attr("y", y + 38).text(netData.latency);
            g.append("text").classed("removable network-unit", true)
                .attr("x", x + 40).attr("y", y + 48).text("ms roundtrip");

            g.append("text").classed("removable network-label", true)
                .attr("x", x + 125).attr("y", y + 75).text("Packet Loss");
            g.append("text").classed("removable network-metric", true)
                .attr("x", x + 40).attr("y", y + 78).text(netData.pktloss + "%");

            g.append("text").classed("removable network-label", true)
                .attr("x", x + 125).attr("y", y + 110).text("Throughput");
            g.append("text").classed("removable network-metric", true)
                .attr("x", x + 40).attr("y", y + 110).text(netData.throughput);
            g.append("text").classed("removable network-unit", true)
                .attr("x", x + 40).attr("y", y + 123).text("Mbps");


            var use = d3.select(useTarget).classed("portOnEVCAlert", true);
            g.selectAll(".removable").attr("transform", use.attr("transform"));
        });
    }
    /**halts animation so the redlines can be kept in sync with the ongoing 
     * animation on mouseout
     * @param {use} useTarget - the use object at the center of the node being clicked.
     */
    drawEVCLines(useTarget, className, alert) {
        console.log("inside drawEVCLines function");
        var evc = useTarget.__data__;
        var svg = d3.select(useTarget.ownerSVGElement);
        var lines = svg.selectAll("line");

        /**the keyframes involve setting stroke color and will overwrite
         *  changing to alert-line. All of them are stoped so the graph
         *  keeps in sync with all it's elements
         */
        lines.classed("stop-animation", true).classed(className, function (d) {
            if (evc == d.source)
                return true;

            if (evc == d.target)
                return true;
            return false;
        });
        svg.selectAll(".portOnEVC").classed("portOnEVCAlert", alert);
        console.log("printing portonEVC" + svg.selectAll(".portOnEVC"));
    }
    /**
     * Opens the display for the flexware statistics
     * @param {use} useTarget - the flexware node being hovered over
     */
    displayFlexwareHealth(useTarget) {

        var g = d3.select(useTarget.parentElement);
        //rgb values for the green-yellow-red transition. Blue is always 0
        var red = [],
            green = [],
            blue = 0;
        var percentages = [this.flexData[0].cpu, this.flexData[0].memory.percentage, this.flexData[0].disk.percentage];
        var titles = ["CPU", "Memory", "Storage"];
        //size of the circles, will need updating index to full change apperance.
        var radius = 18;
        //spacing between circles
        var spacing = 80;
        //upper left corner of the display box
        var startAt = {
            x: -80,
            y: -110
        };
        var len = percentages.length;
        for (var i = 0; i < len; i++) {
            /**Math for the green-red shifting. Examples:
             * 0%: 0 255 0
             * 25%: 127 255 0
             * 50%: 255 255 0
             * 75%: 255 127 0
             * 100%: 255 0 0
             */

            if (percentages[i] < .5) {
                green.push(255);
                red.push(Math.floor(510 * percentages[i]));
            } else {
                green.push(Math.floor(510 * (1 - percentages[i])));
                red.push(255);
            }
        }

        requestAnimationFrame(function () {
            g.append("rect").classed("removable flexware-health-box", true)
                .attr("x", startAt.x - 10).attr("y", startAt.y - 25).attr("width", 220).attr("height", 70);
            for (i = 0; i < len; i++) {
                g.append("use").attr("xlink:href", "#percentage-circle").classed("fw-health-circle", true).classed("removable", true)
                    .attr("x", (startAt.x + i * spacing)).attr("y", startAt.y).attr("stroke-dasharray", function () {
                        var percentage = percentages[i];
                        var total = 3.1416 * radius * 2;
                        return "" + total * percentage + ", " + total * (1 - percentage);
                    })
                    .attr("stroke", "rgb(" + red[i] + ", " + green[i] + ", " + blue + ")");
                g.append("text").classed("percentage-circle-text", true).classed("removable", true)
                    .attr("x", startAt.x + radius / 2 + i * spacing).attr("y", startAt.y + radius + 5).text(Math.floor(percentages[i] * 100) + "%");
                g.append("text").classed("percentage-circle-title", true).classed("removable", true)
                    .attr("x", startAt.x + radius + i * spacing).attr("y", startAt.y - 6).text(titles[i]);
            }
        });

        /**Shifting the size of the display to match the current transformation of the use element. Needed for adding on non-1 zoom levels */
        // var use = d3.select(useTarget);
        // g.selectAll("text").attr("transform", use.attr("transform"));
        // g.selectAll("use").attr("transform", use.attr("transform"));
        // g.selectAll("rect").attr("transform", use.attr("transform"));

    }
    /**Infomaiton display on hover. Currently implmented by:
     *  Sites
     *  Prequalified Sites
     *  Ports
     *  Flexware
     *  Services
     * @param {item} ev - the node's item data
     * @param {use} useTarget - the use object at the center of the node being hovered over
     */
    displayNodeInfo(ev, useTarget) {
        //needed to prevent opacity from returning when quickly switching hover targets
        cancelAnimationFrame(this.removeDisplay);
        //reduces overhead by redrawing the same thing repeatedily
        cancelAnimationFrame(this.addDisplay);

        var subject, line1, line2, titlePanel, infoPanel, path;
        var radius = (ev.item.kind == 'Site') ? 20 : 15;


        /** Grab the svg object with all the node graphics*/
        var svg = d3.select(useTarget.ownerSVGElement);
        /** Grab the g object for the target node */
        var g = d3.select(useTarget.parentElement);
        this.addDisplay = requestAnimationFrame(function () {
            /**Fade out everyting not in focus */
            svg.selectAll("use").classed("fade-out", true);
            svg.selectAll("line").classed("fade-out", true);
            svg.selectAll("text").classed("fade-out-full", true);
            d3.select(useTarget).classed("fade-out", false);

            /** Bring target to the top of the draw stack, so it can be easilly read */
            svg.selectAll("g.vertices").sort(function (x, y) {
                if (x == useTarget.__data__)
                    return 1;
                if (y == useTarget.__data__)
                    return -1;
                if (x.item.kind == "Site") {
                    if (y.item.kind == "Site")
                        return 0;
                    return 1;
                }
                if (y.item.kind == "Site") {
                    return -1;
                }
                return 0;
            });

            /** Insert the path and Panels into the same view as the 
             ** node so we can use realitive x,y values easier*/
            line1 = g.append("path").classed("infoLine removable", true);
            line2 = g.append("path").classed("infoLine removable", true);
            titlePanel = g.append("g").classed("titleBox removable", true);
            infoPanel = g.append("g").classed("infoBox removable", true);

            /**Various logic to handle drawing the lines and text */
            line1.attr("d", "M" + (-radius - 20) + " " + (-(2 * radius * 0.866)) +
                " L" + (-(radius)) + " " + (-(2 * radius * 0.866)) +
                " L" + (-(radius / 2)) + " " + (-(radius * 0.866)));
            line2.attr("d", "M" + ((radius / 2)) + " " + ((radius * 0.866)) +
                " L" + ((radius)) + " " + ((2 * radius * 0.866)) +
                " L" + (radius + 20) + " " + ((2 * radius * 0.866)));

            var name;
            if ((ev.item.kind == 'Site') || (ev.item.kind == "Site_Prequalified"))
                name = ev.item.siteAlias; //allows displaying site Alias over unique id
            else
                name = ev.item.kind + ": " + ev.id;
            titlePanel.append("text").text(name)
                .attr("x", (-radius - 60))
                .attr("y", (-(2 * radius * 0.866) - 10))
                .classed("text-heading titleBox", true);


            var spacing = 20;
            var numAttr = 0;
            /** Site Text*/
            if (ev.item.kind == 'Site' || ev.item.kind == "Site_Prequalified") {
                infoPanel.append("text").text("Site Information").classed("text-heading", true)
                    .attr("y", ((2 * radius * 0.866) + 5)).attr("x", (radius + 20)).classed("infoBox", true);
                infoPanel.append("text").text("Site Id: " + ev.item.siteId)
                    .attr("y", ((2 * radius * 0.866) + 5 + 1 * spacing)).attr("x", (radius + 25)).classed("infoBox", true);
                infoPanel.append("text").text("Location id: " + ev.item.locationId)
                    .attr("y", ((2 * radius * 0.866) + 2 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                infoPanel.append("text").text("Address: " + ev.item.siteAddress)
                    .attr("y", ((2 * radius * 0.866) + 3 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                infoPanel.append("text").text("SDN Capable: " + ev.item.sdnCapable)
                    .attr("y", ((2 * radius * 0.866) + 4 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                numAttr = 4;

            }
            /** Port Text */
            if (ev.item.kind == 'Port') {
                if (ev.item.recommendMessage) {
                    infoPanel.append("text").text("Port Information").classed("text-heading", true)
                        .attr("y", ((2 * radius * 0.866) + 5)).attr("x", (radius + 20)).classed("infoBox", true);
                    infoPanel.append("text").text("Recommendation: " + ev.item.recommendMessage)
                        .attr("y", ((2 * radius * 0.866) + 1 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                    infoPanel.append("text").text("Reason: " + ev.item.recommendReason)
                        .attr("y", ((2 * radius * 0.866) + 2 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);                
                    infoPanel.append("text").text("Circuit ID: " + ev.item.id)
                        .attr("y", ((2 * radius * 0.866) + 3 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                    infoPanel.append("text").text("Port Interface: " + ev.item.portInterface)
                        .attr("y", ((2 * radius * 0.866) + 4 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                    infoPanel.append("text").text("Class of Service: " + ev.item.classOfService)
                        .attr("y", ((2 * radius * 0.866) + 5 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                    infoPanel.append("text").text("Speed: " + ev.item.speedOrCir + "Mbs")
                        .attr("y", ((2 * radius * 0.866) + 6 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                    numAttr = 6;
                } else {
                    infoPanel.append("text").text("Port Information").classed("text-heading", true)
                        .attr("y", ((2 * radius * 0.866) + 5)).attr("x", (radius + 20)).classed("infoBox", true);
                    infoPanel.append("text").text("Circuit ID: " + ev.item.id)
                        .attr("y", ((2 * radius * 0.866) + 5 + 1 * spacing)).attr("x", (radius + 25)).classed("infoBox", true);
                    infoPanel.append("text").text("Port Interface: " + ev.item.portInterface)
                        .attr("y", ((2 * radius * 0.866) + 2 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                    infoPanel.append("text").text("Class of Service: " + ev.item.classOfService)
                        .attr("y", ((2 * radius * 0.866) + 3 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                    infoPanel.append("text").text("Speed: " + ev.item.speedOrCir + "Mbs")
                        .attr("y", ((2 * radius * 0.866) + 4 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                    numAttr = 4;
                }
            }
            /** Flexware box text */
            if (ev.item.kind == "Flexware") {
                infoPanel.append("text").text("Flexware Specs").classed("text-heading", true)
                    .attr("y", ((2 * radius * 0.866) + 5)).attr("x", (radius + 20)).classed("infoBox", true);
                infoPanel.append("text").text("Part Number: ATT- U401")
                    .attr("y", ((2 * radius * 0.866) + 5 + 1 * spacing)).attr("x", (radius + 25)).classed("infoBox", true);
                infoPanel.append("text").text("Make and Model: ATT- U401")
                    .attr("y", ((2 * radius * 0.866) + 2 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                infoPanel.append("text").text("WAN1: Electrical")
                    .attr("y", ((2 * radius * 0.866) + 3 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                infoPanel.append("text").text("Modem: LTE")
                    .attr("y", ((2 * radius * 0.866) + 4 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                numAttr = 4;

            }
            /** Flexware firewall text */
            if (ev.item.type == "FWfirewall") {
                infoPanel.append("text").text("Firewall").classed("text-heading", true)
                    .attr("y", ((2 * radius * 0.866) + 5)).attr("x", (radius + 20)).classed("infoBox", true);
                infoPanel.append("text").text("Part Number: FortiGate- VM00")
                    .attr("y", ((2 * radius * 0.866) + 5 + 1 * spacing)).attr("x", (radius + 25)).classed("infoBox", true);
                infoPanel.append("text").text("Software: Fortinet FortiGate – VM00")
                    .attr("y", ((2 * radius * 0.866) + 2 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                infoPanel.append("text").text("Software Version: 5.25")
                    .attr("y", ((2 * radius * 0.866) + 3 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                numAttr = 3;

            }
            /** Flexware router text */
            if (ev.item.type == "FWrouter") {
                infoPanel.append("text").text("Router").classed("text-heading", true)
                    .attr("y", ((2 * radius * 0.866) + 5)).attr("x", (radius + 20)).classed("infoBox", true);
                infoPanel.append("text").text("Part Number: VSRX-1G-STD")
                    .attr("y", ((2 * radius * 0.866) + 5 + 1 * spacing)).attr("x", (radius + 25)).classed("infoBox", true);
                infoPanel.append("text").text("Make and Model: Juniper VSRX")
                    .attr("y", ((2 * radius * 0.866) + 2 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                infoPanel.append("text").text("Software Version: 15.1X49-D40.6")
                    .attr("y", ((2 * radius * 0.866) + 3 * spacing + 5)).attr("x", (radius + 25)).classed("infoBox", true);
                numAttr = 3;
            }
            /** Since All displays currently have the same number of fields, all of them 
             * are created here with only radius and spacing as variable fields.
             * The loop keeps it generic for more or less fields later
             */
            for (var i = 0; i < numAttr; i++) {
                g.append("path").classed("infoField removable", true)
                    .attr("d", "M" + (radius / 2) + " " + (radius * 0.866) +
                        " L" + radius + " " + ((2 * radius * 0.866)) +
                        " L" + radius + " " + ((2 * radius * 0.866) + (i * spacing)) +
                        " q 0 20 25 20");
            }
            //apply use object's current scale on the display info transform
            var use = d3.select(useTarget);
            g.selectAll("text").attr("transform", use.attr("transform"));
            g.selectAll("path").attr("transform", use.attr("transform"));
        });

    }
    /** Function called on mouseout from any node. Clears ALL hover and click info displays 
     * @param {item} ev - the node's item data
     * @param {use} useTarget - the use object at the center of the node being hovered over*/
    releaseNodeInfo(ev, useTarget) {

        /** Grab the object with all the node graphics*/
        var svg = d3.select(useTarget.ownerSVGElement);
        //removes all .removable regardless of orgin
        //see top of document for info about .removable
        svg.selectAll(".removable").remove();
        var fadeIn;
        this.removeDisplay = requestAnimationFrame(function () {

            //restore standard opacity
            svg.selectAll("use").classed("fade-out", false).classed("fade-in", true);
            svg.selectAll("text").classed("fade-out-full", false).classed("fade-in", true);
            svg.selectAll("line")
                .classed("fade-out alert-line stop-animation", false) //restore animation on all lines at once to keep in sync
                .classed("fade-in", true);
            clearTimeout(fadeIn);
            fadeIn = setTimeout(function () {
                svg.selectAll(".fade-in").classed("fade-in", false);
            }, 500);
        });

        this.networkDisplayOpen = false;

    }
    
    showRecommendationPopup(itemData) {
        $('#recommendationMsg').text(itemData.recommendMessage);
        if(itemData.recommendReason) {
            $('#recommendationReason').text(itemData.recommendReason);
            $('#recommendationReason').show();
        }
        var recomendAct = itemData.recommendAction || 'OKAY';
        $( "#dialog-confirm" ).dialog({
            show: {
                effect: "scale",
                duration: 600
            },
            hide: {
                effect: "puff",
                duration: 600
            },
            resizable: false,
            height: "auto",
            width: 600,
            modal: true,
            draggable: false,
            buttons: [
                {
                    text: recomendAct.toUpperCase(),
                    icon: "ui-icon-check",
                    click: function() {
                        $( this ).dialog( "close" );
                        window.location.pathname = 'order.html';
                    }
                },
                {
                    text: "CANCEL",
                    icon: "ui-icon-close",
                    click: function() {
                        $( this ).dialog( "close" );
                    }
                }
            ]
        });
    }
    
    /** Adds the mouse event listeners for the nodes
     * On Click:
     *  Sites pull in nodes connected directly to them
     *  Ports are selected for connections
     *  MTP are selected for connections
     *  PTP display network data (if aplicable)
     *  Flexware box opens the add Service menu
     * On Mouseover:
     *  Sites, ports, and flexware box and services display information
     *  MTP and PTP have a rotate animation and color their connected ports
     * On Mouseout:
     *  Remove all info displays, remove focus highlights (i.e. return to pre-hover state) 
     * @param {Array[Node]} added - array of nodes comming into the graph. passed as D3 selection
     * @param {Object} state - collection of state values (of the graph) to handle branching
     * @param {Array[function]} popup - the functions to open the popup menus (passed to topology-graph from the buildGraph directive)
     * @param {Array[Link]} links - array of links in the graph. Only need to be passed to other function calls.
     */


    setGraphListeners(added, state, popup, links, itemsArray, relationsArray) {
        var closure = this;
        this.links = links;
        var items = itemsArray;
        var relations = relationsArray;
        added
            .on("mouseover", function (d) {
                /** handles extra events for an EVC */
                if ((d.item.kind == 'Multilinkhub') || (d.item.kind == 'PointToPointCenter')) {
                    /** adds highlight to ports connected to a EVC */
                    var neighbors = findNodeGraphics(d.item, d3.event.target, closure.links);
                    for (var i = 1; i < neighbors.length; i++) {
                        d3.select(neighbors[i]).classed("portOnEVC", true);
                        console.log("portonEVC on mouseover in displayAPI" + d3.select(neighbors[i]).classed("portOnEVC", true));

                    }


                    displayAPI.drawEVCLines(d3.event.target, "connection-line", false);
                } else { /** EVC no longer display info, only highlight ports connected*/
                    if (d3.event.target.localName != "text")
                        displayAPI.displayNodeInfo(d, d3.event.target);
                    if (d.item.kind == "Flexware")
                        displayAPI.displayFlexwareHealth(d3.event.target);
                }
            })
            /** removes hover affects*/
            .on("mouseout", function (d) {
                /** removes neghboring highlight rings, if any */
                if ((d.item.kind == 'Multilinkhub') || (d.item.kind == 'PointToPointCenter')) {
                    var neighbors = findNodeGraphics(d.item, d3.event.target, closure.links);
                    for (var i = 0; i < neighbors.length; i++) {
                        d3.select(neighbors[i]).classed("portOnEVC portOnEVCAlert", false);
                    }
                }
                /**removes the infomation lines and frees node for movement*/
                displayAPI.releaseNodeInfo(d, d3.event.target);
            })
            /** place holder for focus events.  Also haveing them here stops focus from being default prevented
             ** so that the reader can traverse them.*/
            .on("focusin focusout", function () {})

            .on("click", function (ev) { // case for new selection
                if (ev.item.kind == 'Flexware') {
                    state.fwView = true;
                    state.selectedBox = ev.item;
                    popup["flexware"](state.selectedBox, getAttachedSite(ev.item, items, relations));
                } else if (ev.item.kind == 'PointToPointCenter') {
                    if(ev.item.recommendMessage) {
                         popup["recommendation"](ev.item);
                        /*displayAPI.showRecommendationPopup(ev.item);*/
                    } else if (!closure.networkDisplayOpen) {
                        displayAPI.displayNetworkHealth(d3.event.target);
                    }
                } else if (ev.item.kind == 'Site') {
                    var neighbors = findNodeGraphics(ev.item, d3.event.target, closure.links);
                    for (var i = 1; i < neighbors.length; i++) {
                        if (neighbors[i].__data__.item.kind == 'Flexware') {
                            var flexNeighbors = findNodeGraphics(neighbors[i].__data__.item, neighbors[i], closure.links);
                            for (var j = 1; j < flexNeighbors.length; j++) {
                                if (!flexNeighbors[j].__data__.fixed) {
                                    flexNeighbors[j].__data__.fx = null;
                                    flexNeighbors[j].__data__.fy = null;
                                }
                            }
                        }
                        if (!neighbors[i].__data__.fixed) {
                            neighbors[i].__data__.fx = null;
                            neighbors[i].__data__.fy = null;
                        }
                    }
                    //kicks the simulation to allow ports to move back to site
                    var sim = getSimSingleton();
                    if (sim.alpha() < .1) {
                        sim.restart(.1);
                    }
                } else if (ev.item.kind == 'Port' || ev.item.kind == 'Multilinkhub') {
                    if(ev.item.recommendMessage) {
                        popup["recommendation"](ev.item);
                        /*displayAPI.showRecommendationPopup(ev.item);*/
                    } else {
                         var index = state.nodeLinkingSet.indexOf(ev.item);
                        /** Remove selection on second click*/
                        if (index != -1) {
                            d3.select(d3.event.target).classed("selected-connection-point", false);
                            state.nodeLinkingSet.splice(index, 1);
                        } else {
                            //if port enter (or stay in) connection mode
                            if (isKindEligibleForLink(ev.item.kind)) {

                                //state.nodeLinker.passthrough(ev.item, this, vertices, lookup, relations, items, nodes);
                                state.nodeLinkingSet.push(ev.item);
                                d3.select(d3.event.target).classed("selected-connection-point", true);
                                if (state.nodeLinkingSet.length == 2) {
                                    state.connectionMode = true;
                                    var portSiteLinkingSet = [];
                                    for (var i = 0; i < state.nodeLinkingSet.length; i++) {
                                        portSiteLinkingSet.push({
                                            port: state.nodeLinkingSet[i],
                                            site: getAttachedSite(state.nodeLinkingSet[i], items, relations)
                                        });
                                    }
                                    popup["connection"](portSiteLinkingSet);
                                    state.mtpMode = false; //mtpMode controls whether an mtp will be created instead of a ptp.
                                }
                            };
                        }
                    }  
                } else {
                    var index = state.nodeLinkingSet.indexOf(ev.item);
                    /** Remove selection on second click*/
                    if (index != -1) {
                        d3.select(d3.event.target).classed("selected-connection-point", false);
                        state.nodeLinkingSet.splice(index, 1);
                    } else {
                        //if port enter (or stay in) connection mode
                        if (isKindEligibleForLink(ev.item.kind)) {

                            //state.nodeLinker.passthrough(ev.item, this, vertices, lookup, relations, items, nodes);
                            state.nodeLinkingSet.push(ev.item);
                            d3.select(d3.event.target).classed("selected-connection-point", true);
                            if (state.nodeLinkingSet.length == 2) {
                                state.connectionMode = true;
                                var portSiteLinkingSet = [];
                                for (var i = 0; i < state.nodeLinkingSet.length; i++) {
                                    portSiteLinkingSet.push({
                                        port: state.nodeLinkingSet[i],
                                        site: getAttachedSite(state.nodeLinkingSet[i], items, relations)
                                    });
                                }
                                popup["connection"](portSiteLinkingSet);
                                state.mtpMode = false; //mtpMode controls whether an mtp will be created instead of a ptp.
                            }
                        };
                    }
                }
            });
    }
    
    setRecomendationDisplay(rec, ele) {
        if (rec.recommendMessage) {
            if (!ele.hasRecommendation) {
                d3.select(ele).select("use")
                    .style("stroke", "yellow")
                    .style("stroke-width", 5)
                    .style("stroke-opacity", 0.4);
                if(rec.recommendSeverity.toUpperCase() == 'H') {
                    d3.select(ele).select("use")
                    .style("stroke", "red")
                } else if(rec.recommendSeverity.toUpperCase() == 'M') {
                    d3.select(ele).select("use")
                    .style("stroke", "yellow")
                } else {
                    d3.select(ele).select("use")
                    .style("stroke", "blue")
                }
                d3.select(ele).append("use")
                    .attr("xlink:href", "#recommendation-icon")
                    .attr("width", 15)
                    .attr("height", 15)
                    .attr("x", 10)
                    .attr("y", -15);
                ele.hasRecommendation = true;
            }
        }
    }

    provideRecommendations(ports) {
        if (this.recommendationsData) {
            var recLen = this.recommendationsData.length;
            var linksLen = this.links ? this.links.length : 0;
            var portsLen = ports.length - 1;
            var pointToPoint = document.getElementsByClassName("PointToPointCenter");
            var multilink = document.getElementsByClassName("Multilinkhub");
            var ptpLen = pointToPoint.length;
            var mtpLen = multilink.length;
            for (var i = 0; i < recLen; i++) {
                if(this.recommendationsData[i].assetType.toUpperCase() == 'PORT') {  
                    for (var j = 0; j < portsLen; j++) {
                        if (ports[j].__data__ && ports[j].__data__.id && ports[j].__data__.id == this.recommendationsData[i].assetId) {
                            d3.select(ports[j]).select("use").classed("clickable", true);
                            displayAPI.setRecomendationDisplay(this.recommendationsData[i], ports[j]);
                        }
                    }
                } else if(this.recommendationsData[i].assetType.toUpperCase() == 'EVC') {
                    for (var k = 0; k < ptpLen; k++) {
                        if (pointToPoint[k].__data__.item.assetId == this.recommendationsData[i].assetId) {
                            d3.select(pointToPoint[k]).select("use").classed("clickable", true);
                            displayAPI.setRecomendationDisplay(this.recommendationsData[i], pointToPoint[k]);
                        }
                    }
                    for(var l = 0; l < mtpLen; l++) {
                        if (multilink[l].__data__.item.assetId == this.recommendationsData[i].assetId) {
                            d3.select(multilink[l]).select("use").classed("clickable", true);
                            displayAPI.setRecomendationDisplay(this.recommendationsData[i], multilink[l]);
                        }
                    }
                }
                
                for (var p = 0; p < linksLen; p++) {
                    if((this.links[p].source.item.assetId && this.links[p].source.item.assetId == this.recommendationsData[i].assetId)
                        || this.links[p].source.item.id == this.recommendationsData[i].assetId) {
                        this.links[p].source.item.recommendMessage = this.recommendationsData[i].recommendMessage;
                        this.links[p].source.item.recommendReason = this.recommendationsData[i].recommendReason;
                        this.links[p].source.item.recommendSeverity = this.recommendationsData[i].recommendSeverity;
                        this.links[p].source.item.recommendAction = this.recommendationsData[i].recommendAction;
                    }
                }
            }
        }
    }
}

var displayAPI = new DisplayAPI();
