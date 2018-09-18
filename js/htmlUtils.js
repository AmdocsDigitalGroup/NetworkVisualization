var graph, data, index = 0;
var box, site;
var linkingSet;
var currentScale = -1;
var allowAnimations = true;

function onLoad() {
    //note: if animations are disallowed the svg with the templates should be hidden to remove the animation clocks
    // var ptp=document.querySelectorAll(".PointToPointCenter-node");
    // var line = document.getElementsByTagName("line");
    //
    // for(var i=0;i<ptp.length;i++)
    //     ptp[i].style.display="none";
    // for(var i=0;i<line.length;i++)
    //     line[i].style.display="none";


    if (!allowAnimations) {
        $("svg.topology").css("display", "none");
    }

    $.ajax({
        url: "input_data/diskUtilization.json",
    }).done(function (data) {
        displayAPI.parseFlexwareJson(data);
    });

//    $.ajax({
//        url: "http://localhost:8080/advisor/recommend?gcpOrgId=5443301900"
//    }).done(function(res) {
//        $.ajax({
//            url: "input_data/targetRecommendation.json"
//        }).done(function (data) {
//            displayAPI.parseTargetRecommendations(data);
//        });
//    });

    $.ajax({
        url: "input_data/targetRecommendation.json"
    }).done(function (data) {
        displayAPI.parseTargetRecommendations(data);
    });

    $.ajax({
        url: "input_data/networkIssues.json",
    }).done(function (data) {
        //give data to the graph
        displayAPI.parseNetworkHealth(data);
        //run digest cycle to update alerts
        if (graph) {
            graph.digest();
        }
        //if graph hasn't loaded, try again every second
        else {
            var count = 0;
            var waitForGraph = setInterval(function () {
                if (graph) {
                    clearInterval(waitForGraph);
                    graph.digest();
                } else {
                    //after 5 seconds of graph not loading, timeout
                    count++;
                    if (count > 5) {
                        console.error("graph failed to load after network data retrived");
                        clearInterval(waitForGraph);
                    }

                }
            }, 1000);
        }
    });

    var clickable = {
        Port: true,
        Multilinkhub: false,
        Site: true,
        Site_Prequalified: false,
        PointToPointCenter: false,
        Service: false,
        Flexware: true,
        Cluster: false
    };

    var kinds = { //the kinds visible in the graph, and the href they use for the graphic
        Port: '#vertex-Port',
        Multilinkhub: '#vertex-Multilinkhub',
        Site: '#vertex-Site',
        Site_Prequalified: '#vertex-Site-Prequalified',
        PointToPointCenter: '#vertex-PointToPointCenter',
        FWfirewall: '#vertex-firewall',
        FWrouter: '#vertex-router',
        FWwanX: '#vertex-wanX',
        Flexware: '#vertex-Flexware',
        Cluster: '#vertex-Cluster',
        PortCluster: '#vertex-PortCluster',
        //  Adiod: '#vertex-adiod',
       // adiodInternet: '#vertex-internet',
        Adiod: '#vertex-cloud'

    };
    var listSet = false;
    /**function to open the connection popup */
    function openPopup(lSet) {
        linkingSet = lSet;
        $("#modal-1").modal();
        $("#openConnectionTab a").trigger('click');
        if (!listSet)
            setListeners();
    }
    /**function to open the flexware popup */
    function openFW(b, s) {
        console.log("inside open fw function");
        box = b;
        site = s;
        $("#modal-fw").modal();
        $("#openFWTab a").trigger('click');
        if (!listSet)
            setListeners();
    }

    /**function to open the recommendation popup */
    function openRec(eleData) {
        recData = eleData;
        if(recData.kind == 'Port') {
            $("#modal-re").modal();
            $("#openReTab a").trigger('click');
        } else {
            $("#modal-reCt").modal();
        }

        if (!listSet)
            setListeners();
    }



    //clears state on popup close, listeners set only once
    function setListeners() {
        listSet = true;
        $("#modal-1").on("hidden.bs.modal", function () {
            graph.stateChange();
            linkingSet = null;
        });
        $("#modal-fw").on("hidden.bs.modal", function () {
            graph.stateChange();
            box = null;
            site = null;
        });
    }
    var popup = {
        "connection": openPopup,
        "flexware": openFW,
        "recommendation": openRec

    };
    console.log("after pop up");

    graph = topology_graph(document.getElementById('topology-graph'), undefined, [], kinds, clickable, popup, linkZoom);

    data = datasets[index];

    graph.render(data.items, data.relations);

    $("#include-popup").load("popup.html", function (d) {
        //console.log("popup.html loaded");
    });

    $('#zoom-slider-bar').change(function () {
        console.log("slider changed: "+typeof(parseInt(this.value)));


        if(document.getElementById("PTPToggleView").checked == true){

            togglealertsdefault();
            checkTogglePTPAndLines();
            checkTogglePort();
           checkLabelToggle();
            //checkToggleMTP();
        }
        else{
            toggleclick()
            checkTogglePTP();
            checkTogglePTPAndLines();
            checkTogglePort();
            //labelToggle();
            checkLabelToggle();
            //checkToggleMTP();
            //checkalertlines();

        }

        linkZoom(parseInt(this.value));
    });
    $('#zoom-slider-bar').on("mousemove", function () {
        console.log("slider changed: "+typeof(parseInt(this.value)));


        if(document.getElementById("PTPToggleView").checked == true){
            // alertlines();
            togglealertsdefault();
            checkTogglePTPAndLines();
            checkTogglePort();
            checkLabelToggle();

        }
        else{

            checkTogglePTP();
            checkTogglePTPAndLines();
            checkTogglePort();
            checkLabelToggle();
            //checkalertlines();

        }

        linkZoom(parseInt(this.value));
    });

}

function linkZoom(scale) {
    if (currentScale != scale) {
        currentScale = scale;
        $('#zoom-slider-bar').val(scale);
        graph.zoomTo(scale);
    }
}

function zoomButton(shift) {

    var scale = currentScale + shift;
    console.log("zooming in");
    if (scale < 0) {
        scale = 0;
    }
    if (scale > 20) {
        scale = 20;
    }
    linkZoom(scale);
}






function toggleLegend() {
    $("#legend").toggleClass("active");
    $("#legend-toggle").toggleClass("active");
}



function toggleclick() {


    if (document.getElementById("PTPToggleView").checked == true) {

       // var portLabel = document.getElementsByClassName("PortName");

        togglealertsdefault();

        document.getElementById("PortToggleView").checked = false;
        document.getElementById("PTPOnlyToggleView").checked = false;
        document.getElementById("MTPToggleView").checked = false;

        // if(document.getElementById("labelToggleView").checked == false){
        //     for (var i = 0; i < portLabel.length; i++) {
        //         portLabel[i].style.display = "none";
        //     }
        // }

    }
    else {



        var evcss = document.getElementsByClassName("PointToPointCenter");
        var line = document.getElementsByTagName("line");
        var EVCouterCircle = document.querySelectorAll("#vertex-Multilinkhub .EVCouter");
        var EVCouter = document.querySelectorAll("#vertex-Multilinkhub");
        var recIcon = document.querySelectorAll("#recommendation-icon");
        var alertIcon = document.querySelectorAll("#alert-icon");
        var ports = document.querySelectorAll(".Port-node.use-node.clickable");
        var sites = document.querySelectorAll(".Site.vertices");
        var fwfirewall = document.querySelectorAll(".FWfirewall.vertices");
        var flexware = document.querySelectorAll(".Flexware.vertices");
        var portLabel = document.getElementsByClassName("PortName");

        document.getElementById("PortToggleView").checked = true;
        document.getElementById("PTPOnlyToggleView").checked = true;
        document.getElementById("MTPToggleView").checked = true;

        // labelToggle();

        if(document.getElementById("labelToggleView").checked == true){
            for (var i = 0; i < portLabel.length; i++) {
                portLabel[i].style.display = "";
            }

        }
        else{
            for (var i = 0; i < portLabel.length; i++) {
                portLabel[i].style.display = "none";
            }

        }

        for (var i = 0; i < evcss.length; i++)
            evcss[i].style.display = "";
        for (var i = 0; i < line.length; i++)
            line[i].style.display = "";
        for (var i = 0; i < EVCouterCircle.length; i++)
            EVCouterCircle[i].style.display = "";
        for (var i = 0; i < EVCouter.length; i++)
            EVCouter[i].style.display = "";
        for (var i = 0; i < recIcon.length; i++)
            recIcon[i].style.display = "";
        for (var i = 0; i < alertIcon.length; i++)
            alertIcon[i].style.display = "";
        for (var i = 0; i < ports.length; i++)
            ports[i].style.display = "";
        for (var i = 0; i < sites.length; i++)
            sites[i].style.display = "";
        for (var i = 0; i < fwfirewall.length; i++)
            fwfirewall[i].style.display = "";
        for (var i = 0; i < flexware.length; i++)
            flexware[i].style.display = "";




        for (var i = 0; i < evcss.length; i++) {
            if (evcss[i].hasAlert == true) {
                var ptpWithAlertId = evcss[i].__data__.id;
                port0=evcss[i].__data__.item.ports[0];
                port1=evcss[i].__data__.item.ports[1];

                for (var i = 0; i < line.length; i++) { //Appearing the connection lines(ptp to port lines) &&  port to site lines

                    if (line[i].classList != "icon-line") {
                        if (line[i].__data__.target.id == ptpWithAlertId || port0 == line[i].__data__.source.id || port1 == line[i].__data__.source.id) {
                            var d3line = d3.select(line[i]).classed("alertline", true).attr("dashin", false).attr("standard", false).attr("edges", false).attr("standard", false).attr("line", false);
                        }
                        else{
                            line[i].style.display="";
                            d3.select(line[i]).classed("alertline", false).attr("dashin", true).attr("standard", true).attr("edges", true).attr("standard", true).attr("line", true);
                        }
                    }
                    else{
                        line[i].style.display="";
                        d3.select(line[i]).classed("alertline", false).attr("dashin", true).attr("standard", true).attr("edges", true).attr("standard", true).attr("line", true);
                    }
                }
            }
        }

    }
}
function checkTogglePTP(){

    if(document.getElementById("PTPToggleView").checked == false){
        toggleON();

    }else{
        consoel.log("hi there!")
    }
}

function toggleOFF(){
    var ptp=document.querySelectorAll(".PointToPointCenter-node");
    var line = document.getElementsByTagName("line");
    var EVCouterCircle =document.querySelectorAll("#vertex-Multilinkhub .EVCouter");
    var EVCouter = document.querySelectorAll("#vertex-Multilinkhub");
    var recIcon =  document.querySelectorAll("#recommendation-icon");
    var alertIcon =  document.querySelectorAll("#alert-icon");
    var ports = document.querySelectorAll(".Port-node.use-node.clickable");

    for(var i=0;i<ptp.length;i++)
        ptp[i].style.display="none";
    for(var i=0;i<line.length;i++)
        line[i].style.display="none";
    for(var i=0;i<EVCouterCircle.length;i++)
        EVCouterCircle[i].style.display="none";
    for(var i=0;i<EVCouter.length;i++)
        EVCouter[i].style.display="none";
    for(var i=0;i<recIcon.length;i++)
        recIcon[i].style.display="none";
    for(var i=0;i<alertIcon.length;i++)
        alertIcon[i].style.display="none";
    for(var i=0;i<ports.length;i++)
        ports[i].style.display="none";

}



function toggleON(){
    var ptp=document.querySelectorAll(".PointToPointCenter-node");
    var line = document.getElementsByTagName("line");
    var EVCouterCircle =document.querySelectorAll("#vertex-Multilinkhub .EVCouter");
    var EVCouter = document.querySelectorAll("#vertex-Multilinkhub");
    var recIcon =  document.querySelectorAll("#recommendation-icon");
    var alertIcon =  document.querySelectorAll("#alert-icon");
    var ports = document.querySelectorAll(".Port-node.use-node.clickable");
    var sites = document.querySelectorAll(".Site.vertices");
    var fwfirewall =  document.querySelectorAll(".FWfirewall.vertices");
    var flexware = document.querySelectorAll(".Flexware.vertices");
    var evcss = document.getElementsByClassName("PointToPointCenter");

    for(var i=0;i<ptp.length;i++)
        ptp[i].style.display="";
    for(var i=0;i<line.length;i++)
        line[i].style.display="";
    for(var i=0;i<EVCouterCircle.length;i++)
        EVCouterCircle[i].style.display="";
    for(var i=0;i<EVCouter.length;i++)
        EVCouter[i].style.display="";
    for(var i=0;i<recIcon.length;i++)
        recIcon[i].style.display="";
    for(var i=0;i<alertIcon.length;i++)
        alertIcon[i].style.display="";
    for(var i=0;i<ports.length;i++)
        ports[i].style.display="";
    for(var i=0;i<sites.length;i++)
        sites[i].style.display="";
    for(var i=0;i<fwfirewall.length;i++)
        fwfirewall[i].style.display="";

    for(var i=0;i<flexware.length;i++)
        flexware[i].style.display="";



    for (var i = 0; i < evcss.length; i++) {
        if (evcss[i].hasAlert == true) {
            var ptpWithAlertId = evcss[i].__data__.id;
            port0=evcss[i].__data__.item.ports[0];
            port1=evcss[i].__data__.item.ports[1];

            for (var i = 0; i < line.length; i++) { //Appearing the connection lines(ptp to port lines) &&  port to site lines

                if (line[i].classList != "icon-line") {
                    if (line[i].__data__.target.id == ptpWithAlertId || port0 == line[i].__data__.source.id || port1 == line[i].__data__.source.id) {
                        var d3line = d3.select(line[i]).classed("alertline", true).attr("dashin", false).attr("standard", false).attr("edges", false).attr("standard", false).attr("line", false);
                    }
                    else{
                        line[i].style.display="";
                        d3.select(line[i]).classed("alertline", false).attr("dashin", true).attr("standard", true).attr("edges", true).attr("standard", true).attr("line", true);
                    }
                }
                else{
                    line[i].style.display="";
                    d3.select(line[i]).classed("alertline", false).attr("dashin", true).attr("standard", true).attr("edges", true).attr("standard", true).attr("line", true);
                }
            }
        }
    }
}

function togglesidenav(){
    console.log("sidenav toggled");
    if($('#sidenav').width()== 0) {
        console.log("sidenav toggled open");
        document.getElementById("sidenav").style.width = "250px";
       // document.getElementById("slidebtn").style.paddingRight = "250px";
        document.getElementById("slidebtn").style.display="none";
    }

    else{
        console.log("sidenav toggled close");
        document.getElementById("sidenav").style.width = "0";
        document.getElementById("slidebtn").style.display="";
        document.getElementById("slidebtn").style.paddingRight = "0";
        document.getElementById("slidebtn").style.opacity = "45";
    }
}



function toggleport(){
    var ports = document.querySelectorAll(".Port-node.use-node.clickable");
    var portLabel = document.getElementsByClassName("PortName");
    var line = document.getElementsByTagName("line");

    if (document.getElementById("PTPToggleView").checked == true) { //Alerts View
        if (document.getElementById("PortToggleView").checked == true) {
            for (var i = 0; i < ports.length; i++)
                ports[i].style.display = "";
            for(var i=0;i<portLabel.length;i++)
                portLabel[i].style.display="";
            for(var i=0;i<line.length;i++) {
                if (line[i].classList != "icon-line") {
                    if (line[i].__data__.kinds == "PortSite") {
                        line[i].style.display = "";
                        d3.select(line[i]).classed("alertline", false).attr("dashin", true).attr("standard", true).attr("edges", true).attr("standard", true).attr("line", true);
                    }
                }
            }

        }
        else {

            togglealertsdefault();
            checkTogglePTPAndLines();
            //checkToggleMTP();
        }
    }
    else{ //All View
        if (document.getElementById("PortToggleView").checked == true) {
            for (var i = 0; i < ports.length; i++)
                ports[i].style.display = "";
            for(var i=0;i<portLabel.length;i++)
                portLabel[i].style.display="";
            for(var i=0;i<line.length;i++) {
                if (line[i].classList != "icon-line") {
                    if (line[i].__data__.kinds == "PortSite") {
                        line[i].style.display = "";
                    }
                }
            }
        }
        else {
            for(var i=0;i<ports.length;i++)
                ports[i].style.display="none";
            for(var i=0;i<portLabel.length;i++)
                portLabel[i].style.display="none";
            // for(var i=0;i<line.length;i++){
            //     if(line[i].__data__.kinds == "PortSite"){
            //         line[i].style.display="none";
            //     }
            // }
        }
        }
}


function checkTogglePort(){
    var ports = document.querySelectorAll(".Port-node.use-node.clickable");
    var portLabel = document.getElementsByClassName("PortName");
    var line = document.getElementsByTagName("line");

    if (document.getElementById("PTPToggleView").checked == true) { //Alerts View

        if (document.getElementById("PortToggleView").checked == true) {

            for (var i = 0; i < ports.length; i++)
                ports[i].style.display = "";
            for(var i=0;i<portLabel.length;i++)
                portLabel[i].style.display="";
            for(var i=0;i<line.length;i++) {
                if (line[i].classList != "icon-line") {
                    if (line[i].__data__.kinds == "PortSite") {
                        line[i].style.display = "";
                        d3.select(line[i]).classed("alertline", false).attr("dashin", true).attr("standard", true).attr("edges", true).attr("standard", true).attr("line", true);
                    }
                }
            }

        }
        else {


            togglealertsdefault();
            checkTogglePTPAndLines();
            //
            //checkToggleMTP();

        }
    }

    else { //All View

        if (document.getElementById("PortToggleView").checked == true) {
            for (var i = 0; i < ports.length; i++)
                ports[i].style.display = "";
            for(var i=0;i<portLabel.length;i++)
                portLabel[i].style.display="";
            for(var i=0;i<line.length;i++) {
                if (line[i].classList != "icon-line") {
                    if (line[i].__data__.kinds == "PortSite") {
                        line[i].style.display = "";
                        d3.select(line[i]).classed("alertline", false).attr("dashin", true).attr("standard", true).attr("edges", true).attr("standard", true).attr("line", true);
                    }
                }
            }

        }
        else{
            for(var i=0;i<ports.length;i++)
                ports[i].style.display="none";
            for(var i=0;i<portLabel.length;i++)
                portLabel[i].style.display="none";
            // for(var i=0;i<line.length;i++){
            //     if(line[i].__data__.kinds == "PortSite"){
            //         line[i].style.display="none";
            //
            //     }
            // }

        }


    }
}

function togglePTP() {
    var evcss = document.getElementsByClassName("PointToPointCenter");
    var line = document.getElementsByTagName("line");


    if (document.getElementById("PTPToggleView").checked == true) { //Alerts View

        if (document.getElementById("PTPOnlyToggleView").checked == true) {

            for (var i = 0; i < evcss.length; i++)
                evcss[i].style.display = "";
                // for (var i = 0; i < line.length; i++)
                //     line[i].style.display = "";

            for (var i = 0; i < evcss.length; i++) {
                if (evcss[i].hasAlert == true) {
                    var ptpWithAlertId = evcss[i].__data__.id;
                    port0=evcss[i].__data__.item.ports[0];
                    port1=evcss[i].__data__.item.ports[1];

                    for (var i = 0; i < line.length; i++) { //Appearing the connection lines(ptp to port lines) &&  port to site lines

                        if (line[i].classList != "icon-line") {
                            if (line[i].__data__.target.id == ptpWithAlertId || port0 == line[i].__data__.source.id || port1 == line[i].__data__.source.id) {
                                 d3.select(line[i]).classed("alertline", true).attr("dashin", false).attr("standard", false).attr("edges", false).attr("standard", false).attr("line", false);
                            }
                            else{
                                line[i].style.display="";
                                d3.select(line[i]).classed("alertline", false).attr("dashin", true).attr("standard", true).attr("edges", true).attr("standard", true).attr("line", true);
                            }
                        }
                        else{
                            line[i].style.display="";
                            d3.select(line[i]).classed("alertline", false).attr("dashin", true).attr("standard", true).attr("edges", true).attr("standard", true).attr("line", true);
                        }
                    }
                }
            }
        }
        else {

            //checkToggleMTP();
            togglealertsdefault();
            checkTogglePort();

        }
    }
    else { // All View

        if (document.getElementById("PTPOnlyToggleView").checked == true) {

            for (var i = 0; i < evcss.length; i++)
                evcss[i].style.display = "";
            for (var i = 0; i < line.length; i++)
                line[i].style.display = "";


        }
        else {
            for (var i = 0; i < evcss.length; i++)
                evcss[i].style.display = "none";
            for (var i = 0; i < line.length; i++)
                line[i].style.display = "none";
            checkTogglePort();
            //checkToggleMTP();
        }
    }
}



function checkTogglePTPAndLines() {

    var evcss = document.getElementsByClassName("PointToPointCenter");
    var line = document.getElementsByTagName("line");

    if (document.getElementById("PTPToggleView").checked == true) { //Alerts View

        if (document.getElementById("PTPOnlyToggleView").checked == true) {
            for (var i = 0; i < evcss.length; i++)
                evcss[i].style.display = "";


            for (var i = 0; i < evcss.length; i++) {
                if (evcss[i].hasAlert == true) {
                    var ptpWithAlertId = evcss[i].__data__.id;
                    port0=evcss[i].__data__.item.ports[0];
                    port1=evcss[i].__data__.item.ports[1];

                    for (var i = 0; i < line.length; i++) { //Appearing the connection lines(ptp to port lines) &&  port to site lines

                        if (line[i].classList != "icon-line") {
                            if (line[i].__data__.target.id == ptpWithAlertId || port0 == line[i].__data__.source.id || port1 == line[i].__data__.source.id) {
                                d3.select(line[i]).classed("alertline", true).attr("dashin", false).attr("standard", false).attr("edges", false).attr("standard", false).attr("line", false);
                            }
                            else{
                                line[i].style.display="";
                                d3.select(line[i]).classed("alertline", false).attr("dashin", true).attr("standard", true).attr("edges", true).attr("standard", true).attr("line", true);
                            }
                        }
                        else{
                            line[i].style.display="";
                            d3.select(line[i]).classed("alertline", false).attr("dashin", true).attr("standard", true).attr("edges", true).attr("standard", true).attr("line", true);
                        }
                    }
                }
            }
        }

        else {
            togglealertsdefault();


        }
    }


    else {  //All View
        if (document.getElementById("PTPOnlyToggleView").checked == true) {

            for(var i=0;i<evcss.length;i++)
                evcss[i].style.display="";
            for(var i=0;i<line.length;i++)
            line[i].style.display="";

        }
        else{

            for(var i=0;i<evcss.length;i++)
                evcss[i].style.display="none";
            for(var i=0;i<line.length;i++)
            line[i].style.display="none";
            checkTogglePort();

        }
    }
}



function toggleMTP(){
    var EVCouterCircle =document.querySelectorAll("#vertex-Multilinkhub .EVCouter");
    var EVCouter = document.querySelectorAll("#vertex-Multilinkhub");
    var recIcon =  document.querySelectorAll("#recommendation-icon");
   // var alertIcon =  document.querySelectorAll("#alert-icon");


    if (document.getElementById("PTPToggleView").checked == true) { //Alerts View
        if(document.getElementById("MTPToggleView").checked == true) {

            for(var i=0;i<EVCouterCircle.length;i++)
                EVCouterCircle[i].style.display="";
            for(var i=0;i<EVCouter.length;i++)
                EVCouter[i].style.display="";
            for(var i=0;i<recIcon.length;i++)
                recIcon[i].style.display="";

            // checkTogglePort();
            // checkTogglePTPAndLines();

        }
        else{
            togglealertsdefault();
            checkTogglePort();
            checkTogglePTPAndLines();

        }
        }

        else{
        if(document.getElementById("MTPToggleView").checked == true) {

            for(var i=0;i<EVCouterCircle.length;i++)
                EVCouterCircle[i].style.display="";
            for(var i=0;i<EVCouter.length;i++)
                EVCouter[i].style.display="";
            for(var i=0;i<recIcon.length;i++)
                recIcon[i].style.display="";

        }
        else{
            for(var i=0;i<EVCouterCircle.length;i++)
                EVCouterCircle[i].style.display="none";
            for(var i=0;i<EVCouter.length;i++)
                EVCouter[i].style.display="none";
            for(var i=0;i<recIcon.length;i++)
                recIcon[i].style.display="none";

        }
    }
}



function checkToggleMTP(){

    var EVCouterCircle =document.querySelectorAll("#vertex-Multilinkhub .EVCouter");
    var EVCouter = document.querySelectorAll("#vertex-Multilinkhub");
    var recIcon =  document.querySelectorAll("#recommendation-icon");
   // var alertIcon =  document.querySelectorAll("#alert-icon");

    if (document.getElementById("PTPToggleView").checked == true) { //Alerts View
        if(document.getElementById("MTPToggleView").checked == true) {

            for(var i=0;i<EVCouterCircle.length;i++)
                EVCouterCircle[i].style.display="";
            for(var i=0;i<EVCouter.length;i++)
                EVCouter[i].style.display="";
            for(var i=0;i<recIcon.length;i++)
                recIcon[i].style.display="";

        }
        else{
            togglealertsdefault();
             // checkTogglePort();
             // checkTogglePTPAndLines();

        }
    }

    else{
        if(document.getElementById("MTPToggleView").checked == true) {

            for(var i=0;i<EVCouterCircle.length;i++)
                EVCouterCircle[i].style.display="";
            for(var i=0;i<EVCouter.length;i++)
                EVCouter[i].style.display="";
            for(var i=0;i<recIcon.length;i++)
                recIcon[i].style.display="";

        }
        else{
            for(var i=0;i<EVCouterCircle.length;i++)
                EVCouterCircle[i].style.display="none";
            for(var i=0;i<EVCouter.length;i++)
                EVCouter[i].style.display="none";
            for(var i=0;i<recIcon.length;i++)
                recIcon[i].style.display="none";

        }
    }

}

// function togglealerts(){
//
// console.log("I am in togglealerts without turning on the switch");
//     var evcss = document.getElementsByClassName("PointToPointCenter");
//     var line = document.getElementsByTagName("line");
//     var ports = document.querySelectorAll(".Port-node.use-node.clickable");
//
//     if(document.getElementById("alertToggleView").checked == true){
//         console.log("alert toggle turned on");
//         console.log("checking posrtOnEVC from htmlUtils" );
//         for(var i=0;i<evcss.length;i++) {
//
//             if (evcss[i].hasAlert == true) {
//                 console.log("printing evcss" + evcss[i]);
//                 evcss[i].style.display="none";
//                 var ptpWithAlertId =  evcss[i].__data__.id;
//                 console.log(ptpWithAlertId);
//                // d3.selectAll(".PointToPointCenter").text(function(d) {console.log(d);})
//                console.log("printing the associated port0" + evcss[i].__data__.item.ports[0]);
//                 console.log("printing the associated port1" + evcss[i].__data__.item.ports[1]);
//                 for(var j=0;j<ports.length;j++){ //Disapperaing the ports
//                     if(evcss[i].__data__.item.ports[0] == ports[j].__data__.id ){
//                             console.log("index of port"+ j);
//                             ports[j].style.display="none";
//                     }
//                     if(evcss[i].__data__.item.ports[1] == ports[j].__data__.id ){
//                         console.log("index of port"+ j);
//                         ports[j].style.display="none";
//                     }
//                 }
//                 for(var i=0;i<line.length;i++){ //Disappearing the lines
//                     if(line[i].__data__.target.id == ptpWithAlertId){
//                         console.log("index:" + i);
//                         line[i].style.display="none";
//                     }
//                     else{
//                         console.log("coming in else");
//                         line[i].style.display="";
//                     }
//                 }
//             }
//             else{
//                 console.log("NOT printing evcss");
//                 evcss[i].style.display="";
//             }
//         }
//     }
//     else{
//         for(var i=0;i<evcss.length;i++) {
//             evcss[i].style.display = "";
//         }
//         for(var i=0;i<line.length;i++){
//             line[i].style.display= "";
//         }
//         for(var j=0;j<ports.length;j++){
//             ports[j].style.display = "";
//         }
//     }
// }

function togglealertsdefault(){

    var evcss = document.getElementsByClassName("PointToPointCenter");
    var line = document.getElementsByTagName("line");
    var ports = document.querySelectorAll(".Port-node.use-node.clickable");
    var sites = document.querySelectorAll(".Site.vertices");
    var EVCouterCircle =document.querySelectorAll("#vertex-Multilinkhub .EVCouter");
    var EVCouter = document.querySelectorAll("#vertex-Multilinkhub");
    var recIcon =  document.querySelectorAll("#recommendation-icon");
    var fwfirewall =  document.querySelectorAll(".FWfirewall.vertices");
    var flexware = document.querySelectorAll(".Flexware.vertices");
    var portLabel = document.getElementsByClassName("PortName");

    for(var i=0;i<evcss.length;i++) {
        evcss[i].style.display="none";
    }

    for(var i=0;i<line.length;i++) {
        line[i].style.display="none";
    }

    for(var i=0;i<ports.length;i++) {
        ports[i].style.display="none";
    }

    for(var i=0;i<EVCouterCircle.length;i++) {
        EVCouterCircle[i].style.display="none";
    }
    for(var i=0;i<EVCouter.length;i++) {
        EVCouter[i].style.display="none";
    }
    for(var i=0;i<recIcon.length;i++) {
        recIcon[i].style.display="none";
    }
    for(var i=0;i<fwfirewall.length;i++) {
        fwfirewall[i].style.display="none";
    }
    for(var i=0;i<flexware.length;i++) {
        flexware[i].style.display="none";
    }
    for(var i=0;i<portLabel.length;i++) {
        portLabel[i].style.display="none";
    }


    for(var i=0;i<evcss.length;i++) {
        if (evcss[i].hasAlert == true) {
            console.log("printing index of ptp with alert" + i);
            evcss[i].style.display = "";

            var ptpWithAlertId =  evcss[i].__data__.id;
            console.log("ptpWithAlertId" + ptpWithAlertId);
            port0=evcss[i].__data__.item.ports[0];
            console.log("printing the associated port0" + port0);
            port1=evcss[i].__data__.item.ports[1];
            console.log("printing the associated port1" + port1);


            for(var j=0;j<ports.length;j++) { //Appearing the ports
                if (evcss[i].__data__.item.ports[0] == ports[j].__data__.id) {
                    console.log("index of port" + j);
                    ports[j].style.display = "";

                    for(var k=0;k<portLabel.length;k++){ //Appearing of the Port Labels
                        if(portLabel[k].__data__.id == ports[j].__data__.id){
                            portLabel[k].style.display = "";
                        }
                    }
                }
                if (evcss[i].__data__.item.ports[1] == ports[j].__data__.id) {
                    console.log("index of port" + j);
                    ports[j].style.display = "";

                    for(var k=0;k<portLabel.length;k++){ //Appearing of the Port Labels
                        if(portLabel[k].__data__.id == ports[j].__data__.id){
                            portLabel[k].style.display = "";
                        }
                    }
                }
            }


            for(var i=0;i<line.length;i++){ //Appearing the connection lines(ptp to port lines) &&  port to site lines

                if(line[i].classList != "icon-line"){
                    if(line[i].__data__.target.id == ptpWithAlertId || port0 == line[i].__data__.source.id || port1 == line[i].__data__.source.id ){
                        line[i].style.display="";
                        d3.select(line[i]).classed("alertline", true).attr("dashin", false).attr("standard", false).attr("edges", false).attr("standard", false).attr("line", false);

                    }
                    else{

                        line[i].style.display="none";
                    }
                }
            }


            for(var k=0;k<line.length;k++){ //appearing the sites

                if(line[k].classList != "icon-line"){
                    if(port0 == line[k].__data__.source.id && line[k].__data__.kinds == "PortSite") {
                        console.log("printing all the sites " + line[k].__data__.target.id);
                        var Site1 = line[k].__data__.target.id;

                        for (var m=0;m<sites.length;m++){
                            if(sites[m].__data__.id == Site1){
                                sites[m].style.display="";
                            }
                        }
                    }
                    // else{
                    //     console.log("not printing the sites1");
                    // }

                    if(port1 == line[k].__data__.source.id && line[k].__data__.kinds == "PortSite") {
                        console.log("printing all the sites " + line[k].__data__.target.id);
                        var Site2 = line[k].__data__.target.id;

                        for (var m=0;m<sites.length;m++){
                            if(sites[m].__data__.id == Site2){
                                sites[m].style.display="";
                            }
                        }
                    }
                    // else{
                    //     console.log("not printing the sites2");
                    // }
                }
                else{
                    console.log("it is icon-line");
                }
            }
        }
    }
}


function labelToggle() {
    var portLabel = document.getElementsByClassName("PortName");
    var evcss = document.getElementsByClassName("PointToPointCenter");
    var ports = document.querySelectorAll(".Port-node.use-node.clickable");

    if (document.getElementById("PTPToggleView").checked == false) { // All view

        if (document.getElementById("labelToggleView").checked == false) { //Label is turned off


            for (var i = 0; i < portLabel.length; i++) {
                portLabel[i].style.display = "none";
            }
        }

        else { //Label is turned on
            for (var i = 0; i < portLabel.length; i++) {

                console.log("inside checklabeltoggle all view - toggle is  on 1067");
                portLabel[i].style.display = "";
            }

        }
    }

    else {  // Alerts view
        if (document.getElementById("labelToggleView").checked == false) { //Label is turned off
            for (var i = 0; i < portLabel.length; i++) {
                portLabel[i].style.display = "none";
            }

        }
        else { //Label is turned on

            for(var i=0;i<evcss.length;i++) {
                if (evcss[i].hasAlert == true) {

                    var ptpWithAlertId = evcss[i].__data__.id;
                    port0 = evcss[i].__data__.item.ports[0];
                    port1 = evcss[i].__data__.item.ports[1];

                    for (var j = 0; j < ports.length; j++) { //Appearing the ports
                        if (evcss[i].__data__.item.ports[0] == ports[j].__data__.id) {

                            for (var k = 0; k < portLabel.length; k++) { //Appearing of the Port Labels
                                if (portLabel[k].__data__.id == ports[j].__data__.id) {

                                    console.log("inside checklabeltoggle all view - toggle is  on line 1096");
                                    portLabel[k].style.display = "";
                                }
                                else{
                                    portLabel[k].style.display = "none";
                                }
                            }
                        }
                        if (evcss[i].__data__.item.ports[1] == ports[j].__data__.id) {

                            for (var k = 0; k < portLabel.length; k++) { //Appearing of the Port Labels
                                if (portLabel[k].__data__.id == ports[j].__data__.id) {
                                    portLabel[k].style.display = "";

                                    console.log("inside checklabeltoggle all view - toggle is  on line 1110");
                                }
                                else{
                                    portLabel[k].style.display = "none";
                                }
                            }
                        }
                    }
                }}

        }
    }
}

function checkLabelToggle(){
    console.log("inside checklabeltoggle");
    var portLabel = document.getElementsByClassName("PortName");
    var evcss = document.getElementsByClassName("PointToPointCenter");
    var ports = document.querySelectorAll(".Port-node.use-node.clickable");

    if (document.getElementById("PTPToggleView").checked == false) { // All view

        if (document.getElementById("labelToggleView").checked == false) { //Label is turned off

            console.log("inside checklabeltoggle all view - toggle is  off");
            for (var i = 0; i < portLabel.length; i++) {
                portLabel[i].style.display = "none";
            }


        }

        else { //Label is turned on
            console.log("inside checklabeltoggle all view - toggle is  on");
            for (var i = 0; i < portLabel.length; i++) {
                portLabel[i].style.display = "";
            }

        }
    }

    else{ //Alerts View
        if (document.getElementById("labelToggleView").checked == false) { //Label is turned off
            for (var i = 0; i < portLabel.length; i++) {
                portLabel[i].style.display = "none";
            }

        }
        else { //Label is turned on

            for(var i=0;i<evcss.length;i++) {
                if (evcss[i].hasAlert == true) {

                    var ptpWithAlertId = evcss[i].__data__.id;
                    port0 = evcss[i].__data__.item.ports[0];
                    port1 = evcss[i].__data__.item.ports[1];

                    for (var j = 0; j < ports.length; j++) { //Appearing the ports
                        if (evcss[i].__data__.item.ports[0] == ports[j].__data__.id) {

                            for (var k = 0; k < portLabel.length; k++) { //Appearing of the Port Labels
                                if (portLabel[k].__data__.id == ports[j].__data__.id) {

                                    console.log("inside checklabeltoggle all view - toggle is  on line1167");
                                    portLabel[k].style.display = "";
                                }
                                else{
                                    portLabel[k].style.display = "none";
                                }
                            }
                        }
                        if (evcss[i].__data__.item.ports[1] == ports[j].__data__.id) {

                            for (var k = 0; k < portLabel.length; k++) { //Appearing of the Port Labels
                                if (portLabel[k].__data__.id == ports[j].__data__.id) {

                                    console.log("inside checklabeltoggle all view - toggle is   on line 1179");
                                    portLabel[k].style.display = "";
                                }
                                else{
                                    portLabel[k].style.display = "none";
                                }
                            }
                        }
                    }
                }}

        }

    }

}








// Left Side Nav
function togglesidenavleft(data){
    var checkHead = document.getElementById("chosenHead");
    var sideNavLeft = document.getElementById("sidenavLeft");
    var slideBtn=document.getElementById("slideBtnLeft");
    if(data=="close"){
        sideNavLeft.style.width = "0";
        sideNavLeft.style.paddingLeft = "0";
        sideNavLeft.style.paddingRight = "0";
        slideBtn.style.display="none";
    }
    else if($('#sidenavLeft').width()!= 0&&checkHead!=null && checkHead.innerHTML!=null && (checkHead.innerHTML.includes(data.item.siteAlias)||checkHead.innerHTML.includes(data.item.id)||checkHead.innerHTML.includes(data.item.linkName))){
        sideNavLeft.style.width = "0";
        sideNavLeft.style.paddingLeft = "0";
        sideNavLeft.style.paddingRight = "0";
        slideBtn.style.display="none";
    }else if($('#sidenavLeft').width()== 0&&checkHead!=null && checkHead.innerHTML!=null && (checkHead.innerHTML.includes(data.item.siteAlias)||checkHead.innerHTML.includes(data.item.id)||checkHead.innerHTML.includes(data.item.linkName))){
        sideNavLeft.style.width = "16vw";
        sideNavLeft.style.paddingLeft = "10px";
        sideNavLeft.style.paddingRight = "10px";
        slideBtn.style.display="";
    }else {

        while (sideNavLeft.firstChild) {
            sideNavLeft.removeChild(sideNavLeft.firstChild);
        }
        sideNavLeft.style.width = "16vw";
        sideNavLeft.style.paddingLeft = "10px";
        sideNavLeft.style.paddingRight = "10px";
        slideBtn= document.createElement("div");
        slideBtn.setAttribute("id","slideBtnLeft");
        slideBtn.setAttribute("class","slideBtnLeft");
        slideBtn.setAttribute("onclick","togglesidenavleft('close')");
        slideBtn.innerHTML="x";
        slideBtn.style.display="";
        sideNavLeft.appendChild(slideBtn);
        switch(data.item.kind){
            case "Site":
                var head = document.createElement("h4");
                head.setAttribute("id", "chosenHead");
                head.innerHTML="<img src='resources/images/icons/location.svg' ></img>"+data.item.siteAlias;
                var subHead = document.createElement("h5");
                subHead.innerHTML="Site ID : "+data.item.siteId;
                var subContent = document.createElement("div");
                subContent.style.backgroundColor = "rgb(38, 38, 38)";
                var hr = document.createElement("hr");
                var table = document.createElement("table");
                var divTable = document.createElement("div");
                var tableData = "<tr><td style='width: 30%'>Address</td><td>"+data.item.siteAddress+"</td></tr>";
                tableData+="<tr><td style='width: 30%'>Location ID</td><td>"+data.item.locationId+"</td></tr>";
                tableData+="<tr><td style='width: 30%'>SDN Capable</td><td>"+data.item.sdnCapable+"</td></tr>";
                table.innerHTML = tableData;
                sideNavLeft.appendChild(head);
                sideNavLeft.appendChild(subHead);
                sideNavLeft.appendChild(hr);
                divTable.appendChild(table);
                sideNavLeft.appendChild(divTable);
                sideNavLeft.appendChild(hr.cloneNode());


                var portsInfo = document.querySelectorAll(".Port-node.use-node.clickable");
                var resultPorts=[];
                for(var i=0;i<portsInfo.length;i++){
                    if(portsInfo[i].__data__.item.attachedTo==data.id){
                        resultPorts.push(portsInfo[i].__data__);
                    }
                }
                for(var i=0; i<resultPorts.length;i++){
                    console.log(resultPorts[i]);
                }

                var portDiv = document.createElement("div");
                var portHead = document.createElement("h5");
                portHead.innerHTML="Ports";
                table = document.createElement("table");
                table.setAttribute("id","tableDisplay");
                tableData="";
                for(var i=0; i<resultPorts.length;i++){
                    tableData += "<tr><td style='width: 30%'>"+resultPorts[i].id+"</td>";
                    if(resultPorts[i].item.hasEVC){
                        //tableData+="<td> <svg class='newlegend-icon'><use xlink:href='#vertex-PointToPointCenterIcon' height='2' width='2'></use></svg></td></tr>";
                        tableData=tableData+getTableDataPorts(resultPorts[i])+"</tr>";

                    }else{
                        tableData+="</tr>";
                    }

                }
                table.innerHTML = tableData;
                portDiv.appendChild(portHead);
                portDiv.appendChild(table);
                sideNavLeft.appendChild(portDiv);
                break;
            case 'Port':
                var head = document.createElement("h4");
                head.setAttribute("id", "chosenHead");
                head.innerHTML="<img src='resources/images/icons/newport.svg'></img>"+"Port "+data.item.id;
                var subHead = document.createElement("h6");
                subHead.innerHTML=data.item.ownerSite.item.siteName+" | "+data.item.ownerSite.item.siteAlias;

                sideNavLeft.appendChild(head);
                sideNavLeft.appendChild(subHead);
                var hr = document.createElement("hr");
                sideNavLeft.appendChild(hr);
                if(data.item.recommendMessage){
                    //port recommendation
                }
                var portsConnectedInfo = document.createElement("h5");
                portsConnectedInfo.innerHTML="Ports Connected";
                table = document.createElement("table");
                table.setAttribute("id","tableDisplay");
                tableData="<tr>";
                tableData=tableData+getTableDataPorts(data)+"</tr>";
                table.innerHTML=tableData;
                var br=document.createElement("br");
                portsConnectedInfo.appendChild(br);
                portsConnectedInfo.appendChild(table);
                sideNavLeft.appendChild(portsConnectedInfo);

                break;
            case 'PointToPointCenter':
                var head = document.createElement("h4");
                head.setAttribute("id", "chosenHead");
                head.innerHTML="<img src='resources/images/icons/NOD-point-to-point-06.png'></img>PTP Center "+data.item.linkName;
                sideNavLeft.appendChild(head);
                if(data.item.recommendMessage){
                    displayRecommendation(data,sideNavLeft);
                }else{
                    displayNetworkHealthInfo(data,sideNavLeft);

                }
                break;
            case "Multilinkhub":
                var head = document.createElement("h4");
                head.setAttribute("id", "chosenHead");
                head.innerHTML="<img src='resources/images/icons/NOD-EVC-connection-08.png'></img> Multilinkhub "+data.item.linkName;
                sideNavLeft.appendChild(head);
                var br=document.createElement("br");
                sideNavLeft.appendChild(br);
                if(data.item.recommendMessage){
                    displayRecommendation(data,sideNavLeft);
                }else{
                    displayNetworkHealthInfo(data,sideNavLeft);
                }
                break;
            case "Cluster":
                 var head = document.createElement("h4");
                //head.setAttribute("id", "chosenHead");
                //head.innerHTML="<img src='resources/images/icons/location.svg' ></img>";
                head.innerHTML="Cluster Information";
                 var subHead = document.createElement("h5");
                // subHead.innerHTML="Site ID : "+data.item.siteId;
                // var subContent = document.createElement("div");
                // subContent.style.backgroundColor = "rgb(38, 38, 38)";
                 var hr = document.createElement("hr");
                // var table = document.createElement("table");
                // var divTable = document.createElement("div");
                // var tableData = "<tr><td style='width: 30%'>Address</td><td>"+data.item.siteAddress+"</td></tr>";
                // tableData+="<tr><td style='width: 30%'>Location ID</td><td>"+data.item.locationId+"</td></tr>";
                // tableData+="<tr><td style='width: 30%'>SDN Capable</td><td>"+data.item.sdnCapable+"</td></tr>";
                // table.innerHTML = tableData;
                // sideNavLeft.appendChild(head);
                // sideNavLeft.appendChild(subHead);
                // sideNavLeft.appendChild(hr);
                // divTable.appendChild(table);
                // sideNavLeft.appendChild(divTable);


                var clusterInfo = document.querySelectorAll(".Cluster-node.use-node");
                for (var i = 0; i < clusterInfo.length; i++) {
                    var clusterData = clusterInfo[i].__data__.item.items;
                    for (item in clusterData) {
                        var data = {};
                        data['type'] = clusterData[item].kind;
                        switch (clusterData[item].kind) {
                            case 'Site':
                               console.log(clusterData[item].siteAlias);
                                subHead.innerHTML=subHead.innerHTML + "Site : "+clusterData[item].siteAlias + "<br>";

                                break;

                            case 'Port':
                                subHead.innerHTML= subHead.innerHTML + "Port : "+clusterData[item].id + "<br>";
                                 console.log("cluster ports" + clusterData[item].id);
                                break;

                            case 'Adiod':
                                subHead.innerHTML= subHead.innerHTML + "Adiod : "+clusterData[item].id + "<br>";
                                console.log("Adiod" + clusterData[item].id);
                                break;

                            case 'Flexware':
                                subHead.innerHTML= subHead.innerHTML + "Flexware : "+clusterData[item].id + "<br>";
                                console.log("Flexware" + clusterData[item].id);

                                break;
                            default:
                                break;
                        }

                    }
                }
                sideNavLeft.appendChild(head);
                sideNavLeft.appendChild(subHead);
                sideNavLeft.appendChild(hr.cloneNode());





                break;





            default:
                break;
        }
    }

}
function displayNetworkHealthInfo(data,sideNavLeft){
    var networkHealthInfo = document.createElement("h5");
    networkHealthInfo.innerHTML="Network Health Information";
    table = document.createElement("table");
    table.setAttribute("id","tableDisplay");
    tableData="";
    for(var i=0;i<displayAPI.networkData.length;i++){
        if(data.item.linkName==displayAPI.networkData[i].id){
            tableData+="<tr><td>Network Latency</td><td>"+displayAPI.networkData[i].latency+"ms roundtrip</td></tr>";
            tableData+="<tr><td>Packet Loss</td><td>"+displayAPI.networkData[i].pktloss+"%</td></tr>";
            tableData+="<tr><td>Throughput</td><td>"+displayAPI.networkData[i].throughput+" Mbps</td></tr>";
        }
    }

    table.innerHTML=tableData;
    var br=document.createElement("br");

    sideNavLeft.appendChild(br);
    sideNavLeft.appendChild(networkHealthInfo);
    sideNavLeft.appendChild(br.cloneNode());
    sideNavLeft.appendChild(table);
}
function displayRecommendation(data,sideNavLeft){
    var divRec = document.createElement("div");
    var subHead = document.createElement("h5");
    subHead.innerHTML="<img src='resources/images/icons/advise-icon.svg'></img>Recommendation";
    var recReason = document.createElement("p");
    recReason.innerHTML=data.item.recommendReason;
    recReason.style.color="red";
    var recMessage = document.createElement("p");
    recMessage.innerHTML=data.item.recommendMessage;
    var recAction = document.createElement("button");
    recAction.innerHTML=data.item.recommendAction;
    recAction.setAttribute("class","buttonTicket");
    recAction.setAttribute("onclick","processAction(this)");
    divRec.appendChild(subHead);
    divRec.appendChild(recReason);
    divRec.appendChild(recMessage);
    divRec.appendChild(recAction);
    sideNavLeft.appendChild(divRec);
}
function processAction(data){
    var parent = data.parentElement;
    parent.removeChild(data);
    var pulsateDiv = document.createElement("div");
    pulsateDiv.setAttribute("id","pulsateRecommendation");
    pulsateDiv.setAttribute("style","{display:none;width: 50%;margin-left: 38%;}");
    pulsateDiv.innerHTML="<img src='resources/images/login/gears.png'><br><span style='margin-left:5%;font-weight:bold;'>Processing...</span>";
    parent.appendChild(pulsateDiv);

    $("#pulsateRecommendation").css("display", "block").effect('pulsate', { times: 5 }, 1500, checkoutRecommendation);
    function checkoutRecommendation(){
        var ticketCreated= document.createElement("p");
        ticketCreated.innerHTML="Ticket Created!"
        var ticketDetails =document.createElement("p");
        ticketDetails.innerHTML="Ticket Number = 0124AS031232";
        parent.removeChild(pulsateDiv);
        parent.appendChild(ticketCreated);
        parent.appendChild(ticketDetails);
    }
}

function getTableDataPorts(portData){
    var tableData="<td>";
    var lines = document.getElementsByTagName("line");
    var connections = [];
    for(var j=0;j<lines.length;j++){
        if(lines[j].classList != "icon-line"){
            if(lines[j].__data__.source.id ==portData.id||lines[j].__data__.target.id ==portData.id){
                if(lines[j].__data__.source.id ==portData.id){
                    if(lines[j].__data__.target.id ==data.id){
                        continue;
                    }else{
                        connections.push(lines[j].__data__.target);
                    }
                }else {
                    if(lines[j].__data__.source.id ==data.id){
                        continue;
                    }else{
                        connections.push(lines[j].__data__.source);
                    }
                }
            }
        }

    }
    for(var k=0;k<connections.length;k++){
        if(connections[k].item.kind == 'PointToPointCenter'){

            for(var p=0;p<connections[k].item.ports.length;p++){
                if(connections[k].item.ports[p]!=portData.id){
                    tableData+="<img class='ptpTableIcon' src='resources/images/icons/NOD-point-to-point-06.png'></img><br><span onmouseout='resetPortInfo(\""+connections[k].item.ports[p]+"\")' onmouseover='displayPortInfo(\""+connections[k].item.ports[p]+"\")' onclick='sideNavClick(\""+connections[k].item.ports[p]+"\")'>"+connections[k].item.ports[p]+"</span><br>";
                }
            }

        }else if(connections[k].item.kind == 'Multilinkhub'){
            tableData+="<img class='ptpTableIcon2' src='resources/images/icons/NOD-EVC-connection-08.png'></img><br>";
            for(var p=0;p<connections[k].item.ports.length;p++){
                if(connections[k].item.ports[p]!=portData.id){
                    tableData+="<span onmouseout='resetPortInfo(\""+connections[k].item.ports[p]+"\")' onmouseover='displayPortInfo(\""+connections[k].item.ports[p]+"\")' onclick='sideNavClick(\""+connections[k].item.ports[p]+"\")'>"+connections[k].item.ports[p]+"</span><br>";
                }
            }
        }
    }
    tableData+="</td>";
    return tableData;
}
function resetPortInfo(data){
    var portsInfo = document.querySelectorAll(".Port-node.use-node.clickable");
    for(var i=0;i<portsInfo.length;i++){
        if(portsInfo[i].__data__.id==data){
            displayAPI.releaseNodeInfo(portsInfo[i].__data__, portsInfo[i]);
            portsInfo[i].style.display="none";
        }
    }
}
function displayPortInfo(data){
    var portsInfo = document.querySelectorAll(".Port-node.use-node.clickable");
    for(var i=0;i<portsInfo.length;i++){
        if(portsInfo[i].__data__.id==data){
            displayAPI.displayNodeInfo(portsInfo[i].__data__, portsInfo[i]);
            portsInfo[i].style.display="";
        }
    }
}
function sideNavClick(data){
    var portsInfo = document.querySelectorAll(".Port-node.use-node.clickable");
    for(var i=0;i<portsInfo.length;i++){
        if(portsInfo[i].__data__.id==data){
            togglesidenavleft(portsInfo[i].__data__);
            displayAPI.displayNodeInfo(portsInfo[i].__data__, portsInfo[i]);
        }
    }
}





function displayUIEffect(event, ui){
    if((ui.item.data!=null && ui.item.useTarget!=null)||(ui.item.itemInfo!=null&& ui.item.useTarget!=null)){

        if(ui.item.type=="Multilinkhub"||ui.item.type=="PointToPointCenter"){
            var neighbors = findNodeGraphics(ui.item.itemInfo, ui.item.useTarget, displayAPI.links);
            for (var i = 1; i < neighbors.length; i++) {
                d3.select(neighbors[i]).classed("portOnEVC", true);
                console.log("portonEVC on mouseover in displayAPI" + d3.select(neighbors[i]).classed("portOnEVC", true));
            }
            displayAPI.drawEVCLines(ui.item.useTarget, "connection-line", false);
        }
        else if(ui.item.type=='Flexware'){
            displayAPI.displayNodeInfo(ui.item.data,ui.item.useTarget);
            displayAPI.displayFlexwareHealth(ui.item.useTarget);
        }else{
            cleanPortSiteAnimation();
            displayAPI.displayNodeInfo(ui.item.data,ui.item.useTarget);

        }
    }
}
function cleanPortSiteAnimation(){
    var portsInfo = document.querySelectorAll(".Port-node.use-node.clickable");
    for(var i=0;i<portsInfo.length;i++){
        displayAPI.releaseNodeInfo(portsInfo[i].__data__, portsInfo[i]);
    }
    var sitesInfo = document.querySelectorAll(".Site.vertices");
    for(var i=0;i<sitesInfo.length;i++){
        displayAPI.releaseNodeInfo(sitesInfo[i].__data__, sitesInfo[i].childNodes[0]);
    }
}

$( "#searchText" ).on("focus change paste keyup autocompleteopen",function() {

    var searchTags=getSearchTags();
    $( "#searchText" ).autocomplete({
        autoFocus: true,
        minLength:1,
        source: searchTags,
        open: function(event, ui){
            cleanPortSiteAnimation();
            return false;
        },
        focus: function(event, ui){
            displayUIEffect(event, ui);
            // if(ui.item.latlong!=null)
            //     graph.fitBoundedMap(ui.item.latlong);
            return false;
        },
        select: function(event, ui){
            displayUIEffect(event, ui);
            if(ui.item.latlong!=null)
                graph.fitBoundedMap(ui.item.latlong);
        }
    });
});

function getSearchTags(){
    var searchTags=[];
    var sitesInfo = document.querySelectorAll(".Site.vertices");
    var clusterInfo = document.querySelectorAll(".Cluster.vertices");
    var evcssInfo = document.getElementsByClassName("PointToPointCenter");
    var portsInfo = document.querySelectorAll(".Port-node.use-node.clickable");
    var EVCouterInfo = document.querySelectorAll(".Multilinkhub.vertices");
    var fwfirewallInfo =  document.querySelectorAll(".FWfirewall.vertices");
    var flexwareInfo = document.querySelectorAll(".Flexware.vertices");
    /*
     *   Retreiving Site Information to autocomplete
     */
    for(var i=0;i<sitesInfo.length;i++){
        var data={};
        data['type']='Site';
        if(sitesInfo[i].__data__.item.siteId!=null)
            data['value']=sitesInfo[i].__data__.item.siteAlias+ " ("+sitesInfo[i].__data__.item.siteId+")";
        else
            data['value']=sitesInfo[i].__data__.item.siteAlias;
        data['id']=sitesInfo[i].__data__.item.id;
        data['data']=sitesInfo[i].__data__;
        data['useTarget']=sitesInfo[i].childNodes[0];
        data['latlong']=sitesInfo[i].__data__.latlong;
        //console.log(data);
        searchTags.push(data);
    }
    /*
     *   Retreiving EVC's Information to autocomplete
     */
    for(var i=0;i<evcssInfo.length;i++){
        var data={}
        data['type']=evcssInfo[i].__data__.item.kind;
        data['value']=evcssInfo[i].__data__.item.kind+" ("+evcssInfo[i].__data__.item.linkName+")";
        data['ports']=evcssInfo[i].__data__.item.ports;
        data['itemInfo']=evcssInfo[i].__data__.item;
        data['useTarget']=evcssInfo[i].childNodes[0];
        searchTags.push(data);
    }

    /*
     *   Retreiving Ports Information to autocomplete
     */
    for(var i=0;i<portsInfo.length;i++){
        var data={}
        data['type']=portsInfo[i].__data__.item.kind;
        data['value']=portsInfo[i].__data__.item.kind+" ("+portsInfo[i].__data__.item.id+")";
        data['data']=portsInfo[i].__data__;
        data['useTarget']=portsInfo[i];
        searchTags.push(data);
    }
    /*
     *   Retreiving Multi-link hub Information to autocomplete
     */
    for(var i=0;i<EVCouterInfo.length;i++){
        var data={}
        data['type']=EVCouterInfo[i].__data__.item.kind;
        data['value']=EVCouterInfo[i].__data__.item.kind+" ("+EVCouterInfo[i].__data__.item.id+")";
        data['itemInfo']=EVCouterInfo[i].__data__.item;
        data['useTarget']=EVCouterInfo[i].childNodes[0];
        searchTags.push(data);
    }
    /*
     *   Retreiving Flexware Firewall Information to autocomplete
     */
    for(var i=0;i<fwfirewallInfo.length;i++){
        var data={}
        data['type']='FWfirewall Service';
        data['value']="FwFirewall Service ("+fwfirewallInfo[i].__data__.id+")";
        data['data']=fwfirewallInfo[i].__data__;
        data['useTarget']=fwfirewallInfo[i].childNodes[0];
        searchTags.push(data);
    }
    /*
     *   Retreiving Flexware Information to autocomplete
     */
    for(var i=0;i<flexwareInfo.length;i++){
        var data={}
        data['type']='Flexware';
        data['value']="Flexware ("+flexwareInfo[i].__data__.id+")";
        data['Flexware']=flexwareInfo[i].__data__.Flexware;
        data['data']=flexwareInfo[i].__data__;
        data['useTarget']=flexwareInfo[i].childNodes[0];
        searchTags.push(data);
    }
    /*
     *   Retreiving Cluster Information to autocomplete
     */
    for(var i=0;i<clusterInfo.length;i++){
        var clusterData = clusterInfo[i].__data__.item.items;
        for(item in clusterData){
            var data={};
            data['type']=clusterData[item].kind;
            switch(clusterData[item].kind){
                case 'Site':
                    if(clusterData[item].siteId!=null)
                        data['value']=clusterData[item].siteAlias+ " ("+clusterData[item].siteId+")";
                    else
                        data['value']=clusterData[item].siteAlias;
                    if(clusterData[item].coordinates!=null){
                        data["latlong"]=clusterData[item].coordinates;
                    }
                    break;
                case 'Port':
                    data['value']=clusterData[item].id;
                    data['ownerSite']=clusterData[item].ownerSite;
                    break;
                case 'Adiod':
                    data['value']="Adiod ("+clusterData[item].id+")";
                    data['id']=clusterData[item].id;
                    break;
                case 'Flexware':
                    data['value']="Flexware ("+clusterData[item].id+")";
                    data['id']=clusterData[item].id;
                    break;
                default:
                    break;
            }
            //console.log(data);

            searchTags.push(data);
        }


    }
    return searchTags;
}







function checkToggleAlerts(){
    var evcss = document.getElementsByClassName("PointToPointCenter");

    if(document.getElementById("alertToggleView").checked == true){
    }
    else{
    }
}






// function togglemapView(){
//
//
//
//     if(document.getElementById("mapToggleView").checked == true){
//         d3.select("#bing-map").style("display", "none");
//         toggleON();
//
//
//     }
//     else{
//         console.log("map toggle turned off");
//     }
// }

var dropdown = document.getElementsByClassName("dropdown-btn");
var i;

for (i = 0; i < dropdown.length; i++) {
    dropdown[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var dropdownContent = this.nextElementSibling;
        if (dropdownContent.style.display === "block") {
            dropdownContent.style.display = "none";
        } else {
            dropdownContent.style.display = "block";
        }
    });
}



function poke() {
    index = (index + 1) % datasets.length;
    data = datasets[index];
    graph.switchDataset(data);
    return datasets[index];
}

function turnOnPorts() {

    var ports = document.querySelectorAll(".Port-node.use-node.clickable");
    var portLabel = document.getElementsByClassName("PortName");
    var line = document.getElementsByTagName("line");

    if (document.getElementById("PTPToggleView").checked == true) { //Alerts View

        for (var i = 0; i < ports.length; i++)
            ports[i].style.display = "";
        for (var i = 0; i < portLabel.length; i++)
            portLabel[i].style.display = "";
        for (var i = 0; i < line.length; i++) { //Port to Site Lines
            if (line[i].classList != "icon-line") {
                if (line[i].__data__.kinds == "PortSite") {
                    line[i].style.display = "";
                    d3.select(line[i]).classed("alertline", false).attr("dashin", true).attr("standard", true).attr("edges", true).attr("standard", true).attr("line", true);
                }
            }
        }
    }
    else { //All View
        if (document.getElementById("PortToggleView").checked == true) {
            for (var i = 0; i < ports.length; i++)
                ports[i].style.display = "";
            for (var i = 0; i < portLabel.length; i++)
                portLabel[i].style.display = "";
            for (var i = 0; i < line.length; i++) { //Port to Site Lines
                if (line[i].classList != "icon-line") {
                    if (line[i].__data__.kinds == "PortSite") {
                        line[i].style.display = "";
                    }
                }
            }
        }
    }
}



function turnOffPorts(){
    var ports = document.querySelectorAll(".Port-node.use-node.clickable");
    var portLabel = document.getElementsByClassName("PortName");
    var line = document.getElementsByTagName("line");

    if (document.getElementById("PTPToggleView").checked == true) { //Alerts View
            togglealertsdefault();
            checkTogglePTPAndLines();
            //checkToggleMTP();
    }
    else{ //All View

            for(var i=0;i<ports.length;i++)
                ports[i].style.display="none";
            for(var i=0;i<portLabel.length;i++)
                portLabel[i].style.display="none";
            }
}

function turnOnPTPandLines(){
    var evcss = document.getElementsByClassName("PointToPointCenter");
    var line = document.getElementsByTagName("line");


    if (document.getElementById("PTPToggleView").checked == true) { //Alerts View


        for (var i = 0; i < evcss.length; i++)
            evcss[i].style.display = "";

        for (var i = 0; i < evcss.length; i++) {
            if (evcss[i].hasAlert == true) {
                var ptpWithAlertId = evcss[i].__data__.id;
                port0 = evcss[i].__data__.item.ports[0];
                port1 = evcss[i].__data__.item.ports[1];

                for (var i = 0; i < line.length; i++) { //Appearing the connection lines(ptp to port lines) &&  port to site lines

                    if (line[i].classList != "icon-line") {
                        if (line[i].__data__.target.id == ptpWithAlertId || port0 == line[i].__data__.source.id || port1 == line[i].__data__.source.id) {
                            d3.select(line[i]).classed("alertline", true).attr("dashin", false).attr("standard", false).attr("edges", false).attr("standard", false).attr("line", false);
                        }
                        else {
                            line[i].style.display = "";
                            d3.select(line[i]).classed("alertline", false).attr("dashin", true).attr("standard", true).attr("edges", true).attr("standard", true).attr("line", true);
                        }
                    }
                    else {
                        line[i].style.display = "";
                        d3.select(line[i]).classed("alertline", false).attr("dashin", true).attr("standard", true).attr("edges", true).attr("standard", true).attr("line", true);
                    }
                }
            }
        }
    }



    else { // All View

        if (document.getElementById("PTPOnlyToggleView").checked == true) {

            for (var i = 0; i < evcss.length; i++)
                evcss[i].style.display = "";
            for (var i = 0; i < line.length; i++)
                line[i].style.display = "";

        }
    }
}

function turnOffPTPandLines(){

    var evcss = document.getElementsByClassName("PointToPointCenter");
    var line = document.getElementsByTagName("line");


    if (document.getElementById("PTPToggleView").checked == true) { //Alerts View
            //checkToggleMTP();
            togglealertsdefault();
            checkTogglePort();
    }
    else { // All View


            for (var i = 0; i < evcss.length; i++)
                evcss[i].style.display = "none";
            for (var i = 0; i < line.length; i++)
                line[i].style.display = "none";
            checkTogglePort();
            //checkToggleMTP();
    }
}

function turnOnMTP(){
    var EVCouterCircle =document.querySelectorAll("#vertex-Multilinkhub .EVCouter");
    var EVCouter = document.querySelectorAll("#vertex-Multilinkhub");
    var recIcon =  document.querySelectorAll("#recommendation-icon");
    // var alertIcon =  document.querySelectorAll("#alert-icon");


    if (document.getElementById("PTPToggleView").checked == true) { //Alerts View


            for(var i=0;i<EVCouterCircle.length;i++)
                EVCouterCircle[i].style.display="";
            for(var i=0;i<EVCouter.length;i++)
                EVCouter[i].style.display="";
            for(var i=0;i<recIcon.length;i++)
                recIcon[i].style.display="";

            // checkTogglePort();
            // checkTogglePTPAndLines();

    }

    else{


            for(var i=0;i<EVCouterCircle.length;i++)
                EVCouterCircle[i].style.display="";
            for(var i=0;i<EVCouter.length;i++)
                EVCouter[i].style.display="";
            for(var i=0;i<recIcon.length;i++)
                recIcon[i].style.display="";
    }
}

function turnOffMTP(){
    var EVCouterCircle =document.querySelectorAll("#vertex-Multilinkhub .EVCouter");
    var EVCouter = document.querySelectorAll("#vertex-Multilinkhub");
    var recIcon =  document.querySelectorAll("#recommendation-icon");
    // var alertIcon =  document.querySelectorAll("#alert-icon");


    if (document.getElementById("PTPToggleView").checked == true) { //Alerts View

            togglealertsdefault();
            checkTogglePort();
            checkTogglePTPAndLines();

    }

    else{

            for(var i=0;i<EVCouterCircle.length;i++)
                EVCouterCircle[i].style.display="none";
            for(var i=0;i<EVCouter.length;i++)
                EVCouter[i].style.display="none";
            for(var i=0;i<recIcon.length;i++)
                recIcon[i].style.display="none";

    }

}

function turnOnLegend(){
    var portLabel = document.getElementsByClassName("PortName");
    var evcss = document.getElementsByClassName("PointToPointCenter");
    var ports = document.querySelectorAll(".Port-node.use-node.clickable");

    if (document.getElementById("PTPToggleView").checked == false) { // All view

            for (var i = 0; i < portLabel.length; i++) {

                console.log("inside checklabeltoggle all view - toggle is  on 1067");
                portLabel[i].style.display = "";
            }


    }

    else {  // Alerts view

            for(var i=0;i<evcss.length;i++) {
                if (evcss[i].hasAlert == true) {

                    var ptpWithAlertId = evcss[i].__data__.id;
                    port0 = evcss[i].__data__.item.ports[0];
                    port1 = evcss[i].__data__.item.ports[1];

                    for (var j = 0; j < ports.length; j++) { //Appearing the ports
                        if (evcss[i].__data__.item.ports[0] == ports[j].__data__.id) {

                            for (var k = 0; k < portLabel.length; k++) { //Appearing of the Port Labels
                                if (portLabel[k].__data__.id == ports[j].__data__.id) {

                                    console.log("inside checklabeltoggle all view - toggle is  on line 1096");
                                    portLabel[k].style.display = "";
                                }
                                else{
                                    portLabel[k].style.display = "none";
                                }
                            }
                        }
                        if (evcss[i].__data__.item.ports[1] == ports[j].__data__.id) {

                            for (var k = 0; k < portLabel.length; k++) { //Appearing of the Port Labels
                                if (portLabel[k].__data__.id == ports[j].__data__.id) {
                                    portLabel[k].style.display = "";

                                    console.log("inside checklabeltoggle all view - toggle is  on line 1110");
                                }
                                else{
                                    portLabel[k].style.display = "none";
                                }
                            }
                        }
                    }
                }}
    }
}

function turnOffLegend(){
    var portLabel = document.getElementsByClassName("PortName");
    var evcss = document.getElementsByClassName("PointToPointCenter");
    var ports = document.querySelectorAll(".Port-node.use-node.clickable");

    if (document.getElementById("PTPToggleView").checked == false) { // All view

            for (var i = 0; i < portLabel.length; i++) {
                portLabel[i].style.display = "none";
            }
    }

    else {  // Alerts view
        if (document.getElementById("labelToggleView").checked == false) { //Label is turned off
            for (var i = 0; i < portLabel.length; i++) {
                portLabel[i].style.display = "none";
            }
        }
    }
}