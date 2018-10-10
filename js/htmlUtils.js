var graph, data, index = 0;
var box, site;
var linkingSet;
var currentScale = -1;
var allowAnimations = true;

var togglePortState =false;
var togglePTPState =false;


function onLoad() {
    //note: if animations are disallowed the svg with the templates should be hidden to remove the animation clocks
    // var ptp=document.querySelectorAll(".PointToPointCenter-node");
    // var line = document.getElementsByTagName("line");
    //
    // for(var i=0;i<ptp.length;i++)
    //     ptp[i].style.display="none";
    // for(var i=0;i<line.length;i++)
    //     line[i].style.display="none";
   // togglesidenavleft();
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
       // checkGraphView();

       // if(document.getElementById("PTPToggleView").checked == true){
        cleanPortSiteAnimation();

        if(counterClick % 2 ==0){ //Alerts View

            togglealertsdefault();
            checkTogglePTPAndLines();
            checkTogglePort();
           checkLabelToggle();
            //checkToggleMTP();
        }
        else{  // All View
            // checkGraphView();
           // toggleclick();
            checkToggleAll();
            checkTogglePTPAndLines();
            checkTogglePort();
            checkGraphView();
            checkLabelToggle();


        }

        linkZoom(parseInt(this.value));
    });
    $('#zoom-slider-bar').on("mousemove", function () {
        console.log("slider changed: "+typeof(parseInt(this.value)));
       // checkGraphView();

        // if(document.getElementById("PTPToggleView").checked == true){
        cleanPortSiteAnimation();
            if(counterClick % 2 ==0){ //Alerts View
            // alertlines();
            togglealertsdefault();
            checkTogglePTPAndLines();
            checkTogglePort();
            checkLabelToggle();

        }
        else{


              //  toggleclick();
            checkToggleAll();
            checkTogglePTPAndLines();
            checkTogglePort();
                checkGraphView();
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



function togglegraphView() {

    togglesidenavleft();

    counterClick++;
    console.log("Number of times alert button is clicked"+ counterClick);


    if(counterClick % 2 ==0){ //Even (Alerts View)

        //Alerts View

        document.getElementById("PortToggleView").checked = false;
        document.getElementById("PTPOnlyToggleView").checked = false;
        togglealertsdefault();
        document.getElementById("alert-btn").style.background="#111 url('../resources/images/icons/round-warning-24px-blue.png') no-repeat";
        document.getElementById("alert-btn").style.backgroundSize="100%";
        document.getElementById("label-btn").disabled=false;
    }
    else{ //Odd (All View)

        document.getElementById("alert-btn").style.background="#111 url('../resources/images/icons/round-warning-white.png') no-repeat";
        document.getElementById("alert-btn").style.backgroundSize="100%";
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
        var adiod= document.querySelectorAll(".Adiod-node.use-node");

         togglePortState=true;
        document.getElementById("PortToggleView").checked = true;
        togglePTPState=true;
         document.getElementById("PTPOnlyToggleView").checked = true;
        // document.getElementById("MTPToggleView").checked = true;

        // labelToggle();

       // if(document.getElementById("labelToggleView").checked == true){
        if(counterClickLabel %2 == 0) {//Even(Label is on)
            for (var i = 0; i < portLabel.length; i++) {
                portLabel[i].style.display = "";
            }

        }
        else{
            for (var i = 0; i < portLabel.length; i++) {
                portLabel[i].style.display = "none";
            }

        }

        document.getElementById("label-btn").disabled=false;

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
        for (var i = 0; i < adiod.length; i++)
            adiod[i].style.display = "";




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
     // togglePortState =true;
     // togglePTPState =true;


}





function checkGraphView(){
    console.log("Number of times alert button is clicked from check function" + counterClick);

    // if(counterClick==0){
    //     togglealertsdefault();
    //     // checkTogglePTPAndLines();
    //     // checkTogglePort();
    //     // checkLabelToggle();
    //
    // }

     if(counterClick % 2 ==0){ //Even (Alerts View)


        // document.getElementById("PortToggleView").checked = false;
        // document.getElementById("PTPOnlyToggleView").checked = false;
        togglealertsdefault();
        // checkTogglePTPAndLines();
        // checkTogglePort();
        // checkLabelToggle();

    }
    else{ //Odd (All View)

        // checkTogglePTP();
        // checkTogglePTPAndLines();
        // checkTogglePort();
        // checkLabelToggle();
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
         var adiod= document.querySelectorAll(".Adiod-node.use-node");

         // document.getElementById("PortToggleView").checked = true;
         // document.getElementById("PTPOnlyToggleView").checked = true;
        // document.getElementById("MTPToggleView").checked = true;

        // labelToggle();

       // if(document.getElementById("labelToggleView").checked == true){
         if(counterClickLabel %2 == 0) {//Even(Label is on)
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
         for (var i = 0; i < adiod.length; i++)
             adiod[i].style.display = "";




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
function checkToggleAll(){

  //  if(document.getElementById("PTPToggleView").checked == false){
    if(counterClick % 2 !=0){ //Odd (All View)
        toggleON();

    }else{
        console.log("hi there!");
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
    var adiod= document.querySelectorAll(".Adiod-node.use-node");

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
    for(var i=0;i<adiod.length;i++)
        adiod[i].style.display="none";


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
    var adiod= document.querySelectorAll(".Adiod-node.use-node");


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
    for(var i=0;i<adiod.length;i++)
        adiod[i].style.display="";




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
    console.log("inside toggleport function");

    togglePortState =document.getElementById("PortToggleView").checked;

    if(counterClick % 2 ==0){ //Even (Alerts View)

   // if (document.getElementById("PTPToggleView").checked == true) { //Alerts View
        if (document.getElementById("PortToggleView").checked == true) {
            for (var i = 0; i < ports.length; i++)
                ports[i].style.display = "";
            for(var i=0;i<portLabel.length;i++)
                portLabel[i].style.display="";
            //checkLabelToggle();
            document.getElementById("label-btn").disabled =false;
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
            document.getElementById("label-btn").disabled =true;
            togglealertsdefault();
            checkTogglePTPAndLines();
            //checkToggleMTP();
        }
    }
    else{ //All View


        if (document.getElementById("PortToggleView").checked == true) {
            for (var i = 0; i < ports.length; i++)
                ports[i].style.display = "";
            // for(var i=0;i<portLabel.length;i++)
            //     portLabel[i].style.display="";
            document.getElementById("label-btn").disabled =false;
            checkLabelToggle();
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

            document.getElementById("label-btn").disabled =true;
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

    // if (document.getElementById("PTPToggleView").checked == true) { //Alerts View
        if(counterClick % 2 ==0){     //Alerts View

        if (document.getElementById("PortToggleView")!=null&&document.getElementById("PortToggleView").checked == true) {

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

        if (document.getElementById("PortToggleView")!=null&&document.getElementById("PortToggleView").checked == true) {
            for (var i = 0; i < ports.length; i++)
                ports[i].style.display = "";
            // for(var i=0;i<portLabel.length;i++)
            //     portLabel[i].style.display="";
            checkLabelToggle();
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


           // checkLabelToggle();
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


   // if (document.getElementById("PTPToggleView").checked == true) { //Alerts View
    togglePTPState =document.getElementById("PTPOnlyToggleView").checked;
    if(counterClick % 2 ==0){ //Even (Alerts View)
        if (document.getElementById("PTPOnlyToggleView")!=null&&document.getElementById("PTPOnlyToggleView").checked == true) {

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

        if (document.getElementById("PTPOnlyToggleView")!=null&&document.getElementById("PTPOnlyToggleView").checked == true) {

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

    // if (document.getElementById("PTPToggleView").checked == true) { //Alerts View

    if(counterClick % 2 ==0){ //Alerts View

       // if (togglePTPState==true) {
        if(document.getElementById("PTPOnlyToggleView")!=null&&document.getElementById("PTPOnlyToggleView").checked == true){
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
        if (togglePTPState==true) {

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
    var adiod= document.querySelectorAll(".Adiod-node.use-node");

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
    for(var i=0;i<adiod.length;i++) {
        adiod[i].style.display="none";
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

//counterClickLabel
function labelToggle() {

    counterClickLabel++;

    var portLabel = document.getElementsByClassName("PortName");
    var evcss = document.getElementsByClassName("PointToPointCenter");
    var ports = document.querySelectorAll(".Port-node.use-node.clickable");

    console.log("Number of times label toggle isclicked" + counterClickLabel);



   // if (document.getElementById("PTPToggleView").checked == false) { // All view

    //    if (document.getElementById("labelToggleView").checked == false) { //Label is turned off
    if(counterClick % 2 !==0){ //Odd (All View)

        if(counterClickLabel %2 !== 0){ // Label is turned off

            for (var i = 0; i < portLabel.length; i++) {
                portLabel[i].style.display = "none";
            }
            document.getElementById("label-btn").style.background="#111 url('../resources/images/icons/round-label-off-blue.png') no-repeat";
            document.getElementById("label-btn").style.backgroundSize="100%";
        }

        else { //Label is turned on
            for (var i = 0; i < portLabel.length; i++) {

                console.log("inside checklabeltoggle all view - toggle is  on 1067");
                portLabel[i].style.display = "";
            }
            document.getElementById("label-btn").style.background="#111 url('../resources/images/icons/round-label-blue.png') no-repeat";
            document.getElementById("label-btn").style.backgroundSize="100%";
        }
    }

    else {  // Alerts view
      //  if (document.getElementById("labelToggleView").checked == false) { //Label is turned off

        if(counterClickLabel %2 !== 0){ // Label is turned off

            for (var i = 0; i < portLabel.length; i++) {
                portLabel[i].style.display = "none";
            }
            document.getElementById("label-btn").style.background="#111 url('../resources/images/icons/round-label-off-blue.png') no-repeat";
            document.getElementById("label-btn").style.backgroundSize="100%";
        }
        else { //Label is turned on
            document.getElementById("label-btn").style.background="#111 url('../resources/images/icons/round-label-blue.png') no-repeat";
            document.getElementById("label-btn").style.backgroundSize="100%";
            if (document.getElementById("PortToggleView")!=null&&document.getElementById("PortToggleView").checked == true) {
                for (var i = 0; i < portLabel.length; i++) {
                    portLabel[i].style.display = "";
                }

            }
            else {


                for (var i = 0; i < evcss.length; i++) {
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
                                    else {
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
                                    else {
                                        portLabel[k].style.display = "none";
                                    }
                                }
                            }
                        }
                    }
                }
            }

        }
    }
}

function checkLabelToggle(){
    console.log("inside checklabeltoggle");
    var portLabel = document.getElementsByClassName("PortName");
    var evcss = document.getElementsByClassName("PointToPointCenter");
    var ports = document.querySelectorAll(".Port-node.use-node.clickable");

   // if (document.getElementById("PTPToggleView").checked == false) { // All view

    //    if (document.getElementById("labelToggleView").checked == false) { //Label is turned off

    console.log("Number of times label is clicked from check label funciton"+ counterClickLabel);
    if(counterClick % 2 !==0){ //Odd (All View)

        if(counterClickLabel %2 !== 0){ // Label is turned off

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
       // if (document.getElementById("labelToggleView").checked == false) { //Label is turned off

        if(counterClickLabel %2 !== 0){ // Label is turned off

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

// function sidenavleftdefault(){
//
//     console.log("inside leg toggle");
//     var sideNavLeftDef = document.getElementById("sidenavleftdefault");
//     sideNavLeftDef.className='sideNavLeftDef';
//
//
//     sideNavLeftDef.style.cssText='width:16vw';
//     sideNavLeftDef.style.cssText='paddingLeft:10px';
//     sideNavLeftDef.style.cssText='paddingRight:10px';
//     sideNavLeftDef.style.cssText='width:16vw';
//
//
//
//     //P Tag
//     var ptag = document.createElement("p");
//     ptag.innerHTML="Hello There";
//     sideNavLeftDef.appendChild(ptag);
//
//
//
// }






//clear selection and display legend
function clearSelectionData(){
    cleanPortSiteAnimation();
    togglesidenavleft();
}

// Left Side Nav


function togglesidenavleft(data){
    cleanPortSiteAnimation();
    var checkHead = document.getElementById("chosenHead");
    var sideNavLeft = document.getElementById("sidenavLeft");
   // var slideBtn=document.getElementById("slideBtnLeft");
    var newSlideBtnDiv =document.getElementById("corner-button");
    var newSlideBtn=document.getElementById("close");
  // var close=document.getElementById("close-btn");




if(data == null){

    sideNavLeft.style.width = "16vw";
    sideNavLeft.style.paddingLeft = "10px";
    sideNavLeft.style.paddingRight = "10px";

    //*******Working close button*****//
   // slideBtn = document.createElement("div");
   // slideBtn.setAttribute("id", "slideBtnLeft");
   // slideBtn.setAttribute("class", "slideBtnLeft");
   // slideBtn.setAttribute("onclick", "togglesidenavleft('close')");
   // slideBtn.innerHTML = "x";
   //  slideBtn.style.display = "";
   //  sideNavLeft.innerHTML="";

    newSlideBtnDiv = document.createElement("div");
    newSlideBtnDiv.setAttribute("class", "corner-button");
    newSlideBtnDiv.setAttribute("id", "corner-button");

    newSlideBtn = document.createElement("button");
    newSlideBtn.setAttribute("type", "button");
    newSlideBtn.setAttribute("id", "close");
    newSlideBtn.setAttribute("class", "close");
    newSlideBtn.setAttribute("data-dismiss", "modal");
    newSlideBtn.setAttribute("onclick", "togglesidenavleft('close')");
    newSlideBtn.setAttribute("aria-label", "Close");

    newSlideBtnDiv.appendChild(newSlideBtn);
    newSlideBtnDiv.style.display="";



    sideNavLeft.innerHTML="";




    console.log("legend on");
    var ptag = document.createElement("h4");
    ptag.innerHTML="Map Legend";
    ptag.className='p';


    var site = document.createElement("div");
    site.innerHTML = "<img class='flexwareImg' src='resources/images/icons/location.svg' ></img>" + " Site" + "<br>";

    var siteCluster = document.createElement("div");
    siteCluster.innerHTML = "<img class='flexwareImg' src='resources/images/icons/locationCluster.svg' ></img>" + " Four Sites in Cluster" + "<br>";

    var port = document.createElement("div");
    port.innerHTML = "<img class='flexwareImg' src='resources/images/icons/newport.svg'></img>" + " Port " ;

    var portCluster = document.createElement("div");
    portCluster.innerHTML = "<img class='flexwareImg' src='resources/images/icons/newportCluster.svg'></img>" + " Nine Ports in Cluster " + "<br>";

    var ptp = document.createElement("div");
    ptp.innerHTML = "<img class='flexwareImg' src='resources/images/icons/PTPImage.png'></img>" + " PTP" ;

    var mtp = document.createElement("div");
    mtp.innerHTML = "<img class='flexwareImg' src='resources/images/icons/evc.png'></img>" + " MTP" + "<br>";

    var flexware = document.createElement("div");
    flexware.innerHTML = "<img class='flexwareImg' src='resources/images/icons/flexwareImg2.png'></img>" + " Flexware" +"<br>";

    var firewall = document.createElement("div");
    firewall.innerHTML = "<img class='flexwareImg' src='resources/images/icons/firewallImg.png'></img>" + " Firewall" +"<br>";

    var router = document.createElement("div");
    router.innerHTML = "<img class='flexwareImg' src='resources/images/icons/routerImg.png'></img>" + " Router" +"<br>";

    var wanx = document.createElement("div");
    wanx.innerHTML = "<img class='flexwareImg' src='resources/images/icons/wanxImg.png'></img>" + " WanX" +"<br>";

    var adiod = document.createElement("div");
    adiod.innerHTML = "<img class='flexwareImg' src='resources/images/icons/internet1.svg'></img>" + " Adiod" +"<br>";

    var close = document.createElement("div");
    //close.setAttribute("id", "close-btn");
    // close.setAttribute("class", "close-btn");
    close.setAttribute("onclick", "togglesidenavleft('close')");
    close.innerHTML = "<img class='closeImg' src='resources/images/icons/close.svg'></img>";


   // sideNavLeft.appendChild(slideBtn);
   // sideNavLeft.appendChild(newSlideBtnDiv);
    sideNavLeft.appendChild(close);
    sideNavLeft.appendChild(ptag);

    sideNavLeft.appendChild(site);
    sideNavLeft.appendChild(siteCluster);
    //
    // var portLabel = document.createElement("label");
    // portLabel.setAttribute("class", "input-toggle");
    // portLabel.setAttribute("for", "PortToggleView");
    // var portInput = document.createElement("input");
    // portInput.setAttribute("type", "checkbox");
    // portInput.setAttribute("id", "PortToggleView");
    // // portInput.setAttribute("onclick", "toggleport()");
    // var portSpan = document.createElement("span");
    // togglePortState = document.getElementById("PortToggleView").checked;
    // togglePTPState = document.getElementById("PTPOnlyToggleView").checked;

    if(togglePortState==true){

        console.log("toggleState is true");

        var portLabelTag = document.createElement("label");
        portLabelTag.setAttribute("class", "input-toggle");
        portLabelTag.setAttribute("for", "PortToggleView");
        var portInput = document.createElement("input");
        portInput.setAttribute("type", "checkbox");
        portInput.setAttribute("id", "PortToggleView");
        portInput.setAttribute("onclick", "toggleport()");
        portInput.setAttribute("checked", "true");
        var portSpan = document.createElement("span");
    }
    else{
        console.log("toggleState is false");
        var portLabelTag = document.createElement("label");
        portLabelTag.setAttribute("class", "input-toggle");
        portLabelTag.setAttribute("for", "PortToggleView");
        var portInput = document.createElement("input");
        portInput.setAttribute("type", "checkbox");
        portInput.setAttribute("id", "PortToggleView");
        portInput.setAttribute("onclick", "toggleport()");
        var portSpan = document.createElement("span");
    }

    portLabelTag.appendChild(portInput);
    portLabelTag.appendChild(portSpan);
    port.appendChild(portLabelTag);

    sideNavLeft.appendChild(port);
    sideNavLeft.appendChild(portCluster);


    // var label2 = label.cloneNode(true);
    // ptp.appendChild(label2);
    // var ptpLabel = document.createElement("label");
    // ptpLabel.setAttribute("class", "input-toggle");
    // ptpLabel.setAttribute("for", "PTPOnlyToggleView");
    // var ptpInput = document.createElement("input");
    // ptpInput.setAttribute("type", "checkbox");
    // ptpInput.setAttribute("id", "PTPOnlyToggleView");
    // // ptpInput.setAttribute("onclick", "togglePTP()");
    // var ptpSpan = document.createElement("span");


    if(togglePTPState==true){

        console.log("toggleState is true");
        var ptpLabel = document.createElement("label");
        ptpLabel.setAttribute("class", "input-toggle");
        ptpLabel.setAttribute("for", "PTPOnlyToggleView");
        var ptpInput = document.createElement("input");
        ptpInput.setAttribute("type", "checkbox");
        ptpInput.setAttribute("id", "PTPOnlyToggleView");
         ptpInput.setAttribute("onclick", "togglePTP()");
        ptpInput.setAttribute("checked", "true");
        var ptpSpan = document.createElement("span");
    }
    else{
        var ptpLabel = document.createElement("label");
        ptpLabel.setAttribute("class", "input-toggle");
        ptpLabel.setAttribute("for", "PTPOnlyToggleView");
        var ptpInput = document.createElement("input");
        ptpInput.setAttribute("type", "checkbox");
        ptpInput.setAttribute("id", "PTPOnlyToggleView");
         ptpInput.setAttribute("onclick", "togglePTP()");
        var ptpSpan = document.createElement("span");
    }



    ptpLabel.appendChild(ptpInput);
    ptpLabel.appendChild(ptpSpan);
    ptp.appendChild(ptpLabel);

    sideNavLeft.appendChild(ptp);
    sideNavLeft.appendChild(mtp);
    sideNavLeft.appendChild(flexware);
    sideNavLeft.appendChild(firewall);
    sideNavLeft.appendChild(router);
    sideNavLeft.appendChild(wanx);
    sideNavLeft.appendChild(adiod);




}
else {
    if (data == "close") {
        sideNavLeft.style.width = "0";
        sideNavLeft.style.paddingLeft = "0";
        sideNavLeft.style.paddingRight = "0";
       // slideBtn.style.display = "none";
       // newSlideBtnDiv.style.display="none"

        var close1 = document.createElement("div");
        close1.setAttribute("onclick", "togglesidenavleft('close')");
        close1.setAttribute("id", "close-btn");
        close1.innerHTML = "<img class='closeImg' src='resources/images/icons/close.svg'></img>";
        close1.style.display="none";
        
        var clusterTable = document.getElementById("clustertableDisplay");
        var clusterHead = document.getElementsByClassName("clusterHead");
        if(clusterTable){
            clusterTable.style.display="none";
            clusterHead[0].style.display="none";
        }

       // Hide the toggleswitches on left side nav
       var toggleSwitch= document.getElementsByClassName("input-toggle");
       for(var i=0; i<toggleSwitch.length;i++){
           toggleSwitch[i].style.display="none";
       }

        //Hide the Clear Selection Button on left side nav
        var clearSelection= document.getElementsByClassName("info-btn1");
        for(var i=0; i<clearSelection.length;i++){
            clearSelection[i].style.display="none";
        }

       if(document.getElementById("PortToggleView")!=null&&document.getElementById("PTPOnlyToggleView")!=null){
        togglePortState = document.getElementById("PortToggleView").checked;
        togglePTPState = document.getElementById("PTPOnlyToggleView").checked;
    }

    } else if ($('#sidenavLeft').width() == 0 && checkHead != null && checkHead.innerHTML != null && (checkHead.innerHTML.includes(data.item.siteAlias) || checkHead.innerHTML.includes(data.item.id) || checkHead.innerHTML.includes(data.item.linkName))) {


        var clearSelection;
        if(document.getElementsByClassName("info-btn1")!=null){
            document.getElementsByClassName("info-btn1")[0].style.display="";
        }else{
            clearSelection = document.createElement("button");
            clearSelection.setAttribute("class",'info-btn1');
            clearSelection.setAttribute("onclick","clearSelectionData()");
            clearSelection.innerHTML="Clear Selection";
            clearSelection.style.display="";
            sideNavLeft.appendChild(clearSelection);
        }


        sideNavLeft.style.width = "16vw";
        sideNavLeft.style.paddingLeft = "10px";
        sideNavLeft.style.paddingRight = "10px";


        // var close3 = document.createElement("div");
        // close3.innerHTML = "<img class='closeImgInfo' src='resources/images/icons/close.svg'></img>";
        // close3.style.display="";


        // sideNavLeft.appendChild(close3);



        // togglePortState = document.getElementById("PortToggleView").checked;
        // togglePTPState = document.getElementById("PTPOnlyToggleView").checked;


    } else {

        while (sideNavLeft.firstChild) {
            sideNavLeft.removeChild(sideNavLeft.firstChild);
        }



        sideNavLeft.style.width = "16vw";
        sideNavLeft.style.paddingLeft = "10px";
        sideNavLeft.style.paddingRight = "10px";

        var clearSelection = document.createElement("button");
        clearSelection.setAttribute("class",'info-btn1');
        clearSelection.setAttribute("onclick","clearSelectionData()");
        clearSelection.innerHTML="Clear Selection";
        sideNavLeft.appendChild(clearSelection);

        var close2 = document.createElement("div");
        close2.setAttribute("onclick", "togglesidenavleft('close')");
        close2.innerHTML = "<img class='closeImgInfo' src='resources/images/icons/close.svg'></img>";
        close2.style.display="";


        //Working Cross button
        // slideBtn = document.createElement("div");
        // slideBtn.setAttribute("id", "slideBtnLeft");
        // slideBtn.setAttribute("class", "slideBtnLeft");
        // slideBtn.setAttribute("onclick", "togglesidenavleft('close')");
        // slideBtn.innerHTML = "x";
        // slideBtn.style.display = "";
        //
        // sideNavLeft.appendChild(slideBtn);









        var port = document.createElement("div");
        port.innerHTML = "<img class='flexwareImg' src='resources/images/icons/newport.svg'></img>" + " Port " ;
        port.style.display="none";

        var ptp = document.createElement("div");
        ptp.innerHTML = "<img class='flexwareImg' src='resources/images/icons/PTPImage.png'></img>" + " PTP" ;
        ptp.style.display="none";



        if(togglePortState==true){

            console.log("toggleState in else is true");

            var portLabelTag = document.createElement("label");
            portLabelTag.setAttribute("class", "input-toggle");
            portLabelTag.setAttribute("for", "PortToggleView");
            var portInput = document.createElement("input");
            portInput.setAttribute("type", "checkbox");
            portInput.setAttribute("id", "PortToggleView");
            portInput.setAttribute("onclick", "toggleport()");
            portInput.setAttribute("checked", "true");
            var portSpan = document.createElement("span");
        }
        else{
            console.log("toggleState in else is false");
            var portLabelTag = document.createElement("label");
            portLabelTag.setAttribute("class", "input-toggle");
            portLabelTag.setAttribute("for", "PortToggleView");
            var portInput = document.createElement("input");
            portInput.setAttribute("type", "checkbox");
            portInput.setAttribute("id", "PortToggleView");
            portInput.setAttribute("onclick", "toggleport()");
            var portSpan = document.createElement("span");
        }

        portLabelTag.appendChild(portInput);
        portLabelTag.appendChild(portSpan);
        port.appendChild(portLabelTag);

        sideNavLeft.appendChild(port);

        if(togglePTPState==true){

            console.log("toggleState in else is true");
            var ptpLabel = document.createElement("label");
            ptpLabel.setAttribute("class", "input-toggle");
            ptpLabel.setAttribute("for", "PTPOnlyToggleView");
            var ptpInput = document.createElement("input");
            ptpInput.setAttribute("type", "checkbox");
            ptpInput.setAttribute("id", "PTPOnlyToggleView");
            ptpInput.setAttribute("onclick", "togglePTP()");
            ptpInput.setAttribute("checked", "true");
            var ptpSpan = document.createElement("span");
        }
        else{
            console.log("toggleState in else is false");
            var ptpLabel = document.createElement("label");
            ptpLabel.setAttribute("class", "input-toggle");
            ptpLabel.setAttribute("for", "PTPOnlyToggleView");
            var ptpInput = document.createElement("input");
            ptpInput.setAttribute("type", "checkbox");
            ptpInput.setAttribute("id", "PTPOnlyToggleView");
            ptpInput.setAttribute("onclick", "togglePTP()");
            var ptpSpan = document.createElement("span");
        }



        ptpLabel.appendChild(ptpInput);
        ptpLabel.appendChild(ptpSpan);
        ptp.appendChild(ptpLabel);

        // Hide the toggleswitches on left side nav
        var toggleSwitch= document.getElementsByClassName("input-toggle");
        for(var i=0; i<toggleSwitch.length;i++) {
            toggleSwitch[i].style.display = "none";

        }
        sideNavLeft.appendChild(close2);

        var tempData;
        if (data.item != null)
            tempData = data.item;
        else
            tempData = data;


        switch (tempData.kind) {
            case "Site":
                console.log("printing site data" + JSON.stringify(tempData));

                var head = document.createElement("h4");
                head.setAttribute("id", "chosenHead");
                head.innerHTML = "<img src='resources/images/icons/location.svg' ></img>" + tempData.siteAlias;
                var subHead = document.createElement("h5");
                subHead.innerHTML = "Site ID : " + tempData.siteId;
                var subContent = document.createElement("div");
                subContent.style.backgroundColor = "rgb(38, 38, 38)";
                var hr = document.createElement("hr");
                var table = document.createElement("table");
                var divTable = document.createElement("div");
                var tableData = "<tr><td style='width: 30%'>Address</td><td>" + tempData.siteAddress + "</td></tr>";
                tableData += "<tr><td style='width: 30%'>Location ID</td><td>" + tempData.locationId + "</td></tr>";
                tableData += "<tr><td style='width: 30%'>SDN Capable</td><td>" + tempData.sdnCapable + "</td></tr>";
                table.innerHTML = tableData;
                sideNavLeft.appendChild(head);
                sideNavLeft.appendChild(subHead);
                sideNavLeft.appendChild(hr);
                divTable.appendChild(table);
                sideNavLeft.appendChild(divTable);
                sideNavLeft.appendChild(hr.cloneNode());
                var serviceTable=document.createElement("table");



                var portsInfo = document.querySelectorAll(".Port-node.use-node.clickable");
                var clusterInfo = document.querySelectorAll(".Cluster-node.use-node");
                var flexwareInfo = document.querySelectorAll(".Flexware-node.use-node.clickable");

                var resultPorts = [];
                for (var i = 0; i < portsInfo.length; i++) {
                    if (portsInfo[i].__data__.item.attachedTo == data.id) {
                        resultPorts.push(portsInfo[i].__data__);
                    }
                }

                    if(resultPorts.length ==0){
                        for (var i = 0; i < clusterInfo.length; i++) {
                            var clusterData = clusterInfo[i].__data__.item.items;
                            for (item in clusterData) {
                                var datacl = {};
                                datacl['type'] = clusterData[item].kind;
                                switch (clusterData[item].kind) {
                                    case 'Site':

                                        break;

                                    case 'Port':

                                        if(clusterData[item].attachedTo == tempData.locationId ){
                                            resultPorts.push(clusterData[item]);
                                        }

                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                    }

                for (var i = 0; i < resultPorts.length; i++) {

                    console.log("resultPorts "+ resultPorts[i]);
                }





                var portDiv = document.createElement("div");
                var portHead = document.createElement("h5");
                portHead.innerHTML = "Ports";
                table = document.createElement("table");
                table.setAttribute("id", "tableDisplay");
                tableData = "";

                var servDiv = document.createElement("div");
                var servHead = document.createElement("h5");
                servHead.innerHTML = "Services";
                serviceTable = document.createElement("table");
                serviceTable.setAttribute("id", "tableDisplay");
                var serviceTableData = "";

                for (var i = 0; i < resultPorts.length; i++) {

                    if(resultPorts[i].item==undefined){ //Sites inside a cluster

                        //tableData += "<tr><td style='width: 30%'>" + resultPorts[i].id + "</td>";
                        tableData+="<tr><td onmouseout='resetPortInfo(\""+resultPorts[i]+"\")' onmouseover='displayPortInfo(\""+resultPorts[i]+"\")' onclick='sideNavClick(\""+resultPorts[i].id+"\")'>"+resultPorts[i].id+"</td>";


                        if (resultPorts[i].hasEVC) {
                            //tableData+="<td> <svg class='newlegend-icon'><use xlink:href='#vertex-PointToPointCenterIcon' height='2' width='2'></use></svg></td></tr>";
                            tableData = tableData + getTableDataPorts(resultPorts[i]) + "</tr>";

                        } else {
                            tableData += "</tr>";
                        }
                    }
                    else{ //Sites outside the cluster

                        tableData+="<tr><td onmouseout='resetPortInfo(\""+resultPorts[i].id+"\")' onmouseover='displayPortInfo(\""+resultPorts[i].id+"\")' onclick='sideNavClick(\""+resultPorts[i].id+"\")'>"+resultPorts[i].id+"</td>";

                       // tableData += "<tr><td style='width: 30%'>" + resultPorts[i].id + "</td>";
                        if (resultPorts[i].item.hasEVC) {
                            //tableData+="<td> <svg class='newlegend-icon'><use xlink:href='#vertex-PointToPointCenterIcon' height='2' width='2'></use></svg></td></tr>";
                            tableData = tableData + getTableDataPorts(resultPorts[i]) + "</tr>";

                        } else {
                            tableData += "</tr>";
                        }
                    }
                    // tableData += "<tr><td style='width: 30%'>" + resultPorts[i].id + "</td>";
                    //
                    // if (resultPorts[i].item.hasEVC) {
                    //     //tableData+="<td> <svg class='newlegend-icon'><use xlink:href='#vertex-PointToPointCenterIcon' height='2' width='2'></use></svg></td></tr>";
                    //     tableData = tableData + getTableDataPorts(resultPorts[i]) + "</tr>";
                    //
                    // } else {
                    //     tableData += "</tr>";
                    // }

                }
                table.innerHTML = tableData;
                portDiv.appendChild(portHead);
                portDiv.appendChild(table);
                sideNavLeft.appendChild(portDiv);

                if(tempData.flexwareEnabled){

                    var str1 = tempData.id;
                    var str2 = "flexware";
                    var str3 = "-FWfirewall";
                    var str4 = "-FWrouter_1";
                    var str5 = "-FWwanX_0";
                    var flexwareId = str1.concat(str2);
                    var firewallId = str1.concat(str3);
                    var routerId = flexwareId.concat(str4);
                    var wanxId = flexwareId.concat(str5);



                    serviceTableData+="<tr><td onclick='sideNavClick(\"" + flexwareId + "\")'> Flexware  </td><td>";


                    if(tempData.services.FWfirewall){

                        serviceTableData += "<span onclick='sideNavClick(\"" + firewallId + "\")'>Firewall</span></br>";
                    }

                    if(tempData.services.FWrouter){
                        serviceTableData += "<span onclick='sideNavClick(\"" + routerId + "\")'>Router</span></br>";
                    }

                    if(tempData.services.FWwanX){
                        serviceTableData += "<span onclick='sideNavClick(\"" + wanxId + "\")'>WanX</span></br>";
                    }
                    serviceTableData += "</tr></td>";


                    serviceTable.innerHTML = serviceTableData;
                    servDiv.appendChild(servHead);
                    servDiv.appendChild(serviceTable);
                    sideNavLeft.appendChild(servDiv);


                }

                if(tempData.adiodEnabled){
                    var str1 = tempData.id;
                    var str2 = "adiod";
                    var adiodId = str1.concat(str2);

                    serviceTableData+="<tr><td onclick='sideNavClick(\"" + adiodId + "\")'> Adiod  </td></td>";

                    serviceTable.innerHTML = serviceTableData;
                    servDiv.appendChild(serviceTable);
                    sideNavLeft.appendChild(servDiv);
                }








                break;
            case 'Port':
                var head = document.createElement("h4");
                head.setAttribute("id", "chosenHead");
                head.innerHTML = "<img src='resources/images/icons/newport.svg'></img>" + "Port " + tempData.id;
                var subHead = document.createElement("h5");
                subHead.innerHTML = tempData.ownerSite.item.siteName + " | " + tempData.ownerSite.item.siteAlias;

                sideNavLeft.appendChild(head);
                sideNavLeft.appendChild(subHead);
                var hr = document.createElement("hr");
                sideNavLeft.appendChild(hr);
                if (tempData.recommendMessage) {
                    //port recommendation
                    displayRecommendation(data, sideNavLeft);

                }
                var portsConnectedInfo = document.createElement("h4");
                portsConnectedInfo.innerHTML = "Ports Connected";
                table = document.createElement("table");
                table.setAttribute("id", "tableDisplay");
                tableData = "<tr>";
                tableData = tableData + getTableDataPorts(data) + "</tr>";
                table.innerHTML = tableData;
                var br = document.createElement("br");
                //sideNavLeft.appendChild(br);
                sideNavLeft.appendChild(portsConnectedInfo);
                sideNavLeft.appendChild(table);
                sideNavLeft.appendChild(br);
                
                var newPTPOrder = document.createElement("h4");
                newPTPOrder.innerHTML="Create PTP Connection";
                sideNavLeft.appendChild(newPTPOrder);
                var searchPort = document.createElement("div");
                searchPort.setAttribute("id","portSearchDiv");
                var searchPortInput = document.createElement("input");
                searchPortInput.setAttribute("type","search");
                searchPortInput.setAttribute("placeholder","Search Ports");
                searchPortInput.setAttribute("id","searchPortText");
                searchPort.appendChild(searchPortInput);
                sideNavLeft.appendChild(searchPort);
                $( "#searchPortText" ).on("focus change paste keyup autocompleteopen",function() {
                    var searchTags=getPortTags();
                    $( "#searchPortText" ).autocomplete({
                        autoFocus: true,
                        minLength:1,
                        source: searchTags,
                        open: function(event, ui){
                            $(this).autocomplete("widget").css({"width":"10%"});
                            $(this).autocomplete("widget").css({"left":"12px"});
                            cleanPortSiteAnimation();
                            return false;
                        },
                        focus: function(event, ui){
                            //togglesidenavleft(ui.item.data);
                            
                            displayUIEffect(event, ui);
                        },
                        select: function(event, ui){
                            displayPTPOrder(data,ui.item.data,sideNavLeft);
                            displayUIEffect(event, ui);
                        }
                    });
                });
                
                break;
            case 'PointToPointCenter':
                var head = document.createElement("h4");
                head.setAttribute("id", "chosenHead");
                head.innerHTML = "<img class='portHead' src='resources/images/icons/PTPImage.png'></img>PTP Center " + tempData.linkName;
                sideNavLeft.appendChild(head);
                if (tempData.recommendMessage) {
                    displayRecommendation(data, sideNavLeft);
                } else {
                    displayNetworkHealthInfo(data, sideNavLeft);

                }
                var portsConnectedInfo = document.createElement("h5");
                portsConnectedInfo.innerHTML = "Ports Connected";
                table = document.createElement("table");
                table.setAttribute("id", "tableDisplay");
                tableData = "<tr>";
                tableData = tableData + getTableDataPorts(tempData) + "</tr>";
                table.innerHTML = tableData;
                var br = document.createElement("br");
                sideNavLeft.appendChild(br);
                sideNavLeft.appendChild(portsConnectedInfo);
                sideNavLeft.appendChild(table);
                break;
            case "Multilinkhub":
                var head = document.createElement("h4");
                head.setAttribute("id", "chosenHead");
                head.innerHTML = "<img class='portHead' src='resources/images/icons/evc.png'></img> Multilinkhub " + tempData.linkName;
                sideNavLeft.appendChild(head);
                var br = document.createElement("br");
                sideNavLeft.appendChild(br);
                if (tempData.recommendMessage) {
                    displayRecommendation(data, sideNavLeft);
                } else {
                    displayNetworkHealthInfo(data, sideNavLeft);
                }
                var portsConnectedInfo = document.createElement("h5");
                portsConnectedInfo.innerHTML = "Ports Connected";
                table = document.createElement("table");
                table.setAttribute("id", "tableDisplay");
                tableData = "<tr>";
                tableData = tableData + getTableDataPorts(tempData) + "</tr>";

                table.innerHTML = tableData;
                var br = document.createElement("br");
                sideNavLeft.appendChild(br);
                sideNavLeft.appendChild(portsConnectedInfo);
                sideNavLeft.appendChild(table);
                break;
            case "Cluster":



                var form = document.createElement("div");
                form.setAttribute("id", "searchForm-left");
                var input = document.createElement("input");
                input.setAttribute("type", "search-left");
                input.setAttribute("placeholder", "Search");
                input.setAttribute("id", "searchClusterText");
                input.setAttribute("onkeyup", "searchCluster()");
                input.setAttribute("focus", "searchCluster()");
                input.setAttribute("change", "searchCluster()");


                var table = document.createElement("table");
                var divTable = document.createElement("div");

                var portDiv = document.createElement("div");
                var portHead = document.createElement("p");
                portHead.className = 'clusterHead';
                portHead.innerHTML = "Cluster Information";
                table = document.createElement("table");
                table.setAttribute("id", "clustertableDisplay");
                tableData = "";



                var clusterData = tempData.items;
                for (item in clusterData) {
                    var data = {};
                    data['type'] = clusterData[item].kind;
                    switch (clusterData[item].kind) {
                        case 'Site':


                            if (tableData != null)
                                tableData += "</td></tr>";
                            tableData += "<tr><td onmouseout='resetPortInfo(\"" + clusterData[item].siteAlias + "\")' onmouseover='displayPortInfo(\"" + clusterData[item].siteAlias + "\")' onclick='sideNavClick(\"" + clusterData[item].siteAlias + "\")'>" + clusterData[item].siteAlias + "</td><td>";


                            break;

                        case 'Port':

                            tableData += "<span onmouseout='resetPortInfo(\"" + clusterData[item].id + "\")' onmouseover='displayPortInfo(\"" + clusterData[item].id + "\")' onclick='sideNavClick(\"" + clusterData[item].id + "\")'>" + clusterData[item].id + "</span><br>"

                            break;


                        case 'Adiod':

                            // tableData += clusterData[item].id + "<br>";
                            tableData += "<span onmouseout='resetPortInfo(\"" + clusterData[item].id + "\")' onmouseover='displayPortInfo(\"" + clusterData[item].id + "\")' onclick='sideNavClick(\"" + clusterData[item].id + "\")'>" + clusterData[item].id + "</span><br>"


                            break;

                        case 'Flexware':

                            // tableData += clusterData[item].id + "<br>";
                            tableData += "<span onmouseout='resetPortInfo(\"" + clusterData[item].id + "\")' onmouseover='displayPortInfo(\"" + clusterData[item].id + "\")' onclick='sideNavClick(\"" + clusterData[item].id + "\")'>" + clusterData[item].id + "</span><br>"
                            break;



                    }


                    form.appendChild(input);
                    sideNavLeft.appendChild(form);

                    table.innerHTML = tableData;
                    portDiv.appendChild(portHead);
                    portDiv.appendChild(table);
                    sideNavLeft.appendChild(portDiv);
                }
                break;

                case"Adiod":
                    var head = document.createElement("h4");
                    head.setAttribute("id", "chosenHead");
                   head.innerHTML = "<img src='resources/images/icons/internet1.svg' style=\"width: 32px; height: 43px;\"></img>" + "Adiod " + tempData.id;
                    var subHead = document.createElement("h6");
                   // subHead.innerHTML = tempData.ownerSite.item.siteName + " | " + tempData.ownerSite.item.siteAlias;

                    sideNavLeft.appendChild(head);
                    sideNavLeft.appendChild(subHead);
                    var hr = document.createElement("hr");
                    sideNavLeft.appendChild(hr);
                    break;

                case"Flexware":
                    var head = document.createElement("h4");
                    head.setAttribute("id", "chosenHead");
                    head.innerHTML = "<img class='flexwareImg' src='resources/images/icons/flexwareImg2.png'></img>" + " Flexware " + tempData.id;
                    var subHead = document.createElement("h6");
                    subHead.innerHTML = data.ownerSite.siteName + " | " + data.ownerSite.siteAlias;

                    sideNavLeft.appendChild(head);
                    sideNavLeft.appendChild(subHead);
                    var hr = document.createElement("hr");
                    sideNavLeft.appendChild(hr);
                    var flexwareInfo = document.createElement("h5");
                    flexwareInfo.innerHTML = "Usage Statistics";
                    table = document.createElement("table");
                    table.setAttribute("id", "tableDisplay2");
                    tableData = "<tr><td>CPU</td><td>"+(100*displayAPI.flexData[0].cpu)+"%</td></tr>";
                    tableData += "<tr><td>Memory</td><td>"+(100*displayAPI.flexData[0].memory.percentage)+"%</td></tr>";
                    tableData += "<tr><td>Storage</td><td>"+(100*displayAPI.flexData[0].disk.percentage)+"%</td></tr>";
                    table.innerHTML = tableData;

                    var flexwareSpecs = document.createElement("h5");
                    flexwareSpecs.innerHTML = "Flexware Specs";
                    var tableInfo  = document.createElement("table");
                    tableInfo.setAttribute("id", "tableDisplay2");
                    tableData = "<tr><td>Part Number</td><td>ATT-U401</td></tr>";
                    tableData += "<tr><td>Make and Model</td><td>ATT-U401</td></tr>";
                    tableData += "<tr><td>WAN1</td><td>Electrical</td></tr>";
                    tableData += "<tr><td>Modem</td><td>LTE</td></tr>";
                    tableInfo.innerHTML = tableData;
                    sideNavLeft.appendChild(flexwareSpecs);
                    sideNavLeft.appendChild(tableInfo);
                    var br = document.createElement("br");
                    sideNavLeft.appendChild(br);
                    sideNavLeft.appendChild(flexwareInfo);
                    sideNavLeft.appendChild(table)
                    sideNavLeft.appendChild(br.cloneNode());

                    var configSoftware =  document.createElement("h5");
                    configSoftware.innerHTML = "Configure Software";
                    var configAdd  = document.createElement("table");
                    configAdd.setAttribute("id", "tableDisplay2");
                    configAdd.setAttribute("class","removableTable");
                    tableData = "<tr><td ><input type='checkbox' name='flexSelect' id='firewallSelect' value='firewall' checked onclick='return false;''><label for='firewallSelect'><img class='flexwareImg label-text' src='resources/images/icons/firewallImg.png'></label></td><td>Add firewall</td></tr>";
                    tableData += "<tr><td ><input type='checkbox' name='flexSelect' id='wanxSelect' value='WANX' ><label for='wanxSelect'><img class='flexwareImg label-text' src='resources/images/icons/wanxImg.png'></label></td><td>Add WANX</td></tr>";
                    tableData += "<tr><td ><input type='checkbox' name='flexSelect' id='routerSelect' value='Router'><label for='routerSelect'><img class='flexwareImg label-text' src='resources/images/icons/routerImg.png'></label></td><td class='form-inline'><label for='routerCount'>Add Router</label><input type='text' class='form-control input-sm' id='routerCount' disabled> </td></tr>";
                    configAdd.innerHTML = tableData;
                    
                    var reviewBilling = document.createElement("button");
                    reviewBilling.innerHTML="Review Order";
                    reviewBilling.setAttribute("id","flexButtonRemovable");
                    reviewBilling.setAttribute("class","buttonTicket");
                    reviewBilling.setAttribute("onclick","processFlexware(this)");
                    reviewBilling.disabled = true;

                    sideNavLeft.appendChild(configSoftware);
                    sideNavLeft.appendChild(configAdd);
                    sideNavLeft.appendChild(reviewBilling);
                    document.getElementById('routerSelect').onchange = function() {
                        document.getElementById('routerCount').disabled = !this.checked;
                        reviewBilling.disabled = (!this.checked&&!document.getElementById('wanxSelect').checked);
                        if(document.getElementById("confirmFlexBut"))
                            document.getElementById("confirmFlexBut").disabled=(!this.checked&&!document.getElementById('wanxSelect').checked);
                    };
                    document.getElementById('wanxSelect').onchange = function() {
                        reviewBilling.disabled = (!this.checked&&!document.getElementById('routerCount').checked);
                        if(document.getElementById("confirmFlexBut"))
                            document.getElementById("confirmFlexBut").disabled=(!this.checked&&!document.getElementById('routerCount').checked);
                    };

                    break;

                case "Service":

                    if(tempData.type== "FWfirewall"){
                    var head = document.createElement("h4");
                    head.setAttribute("id", "chosenHead");
                    head.innerHTML="<img class='flexwareImg' src='resources/images/icons/firewallImg.png'></img>"+ " Firewall " +"<br>"+ tempData.id;

                    sideNavLeft.appendChild(head);
                    var hr = document.createElement("hr");
                    sideNavLeft.appendChild(hr);

                        var firewallSpecs = document.createElement("h5");
                        firewallSpecs.innerHTML = "Firewall Specs";
                        var tableInfo  = document.createElement("table");
                        tableInfo.setAttribute("id", "tableDisplay2");
                        tableData = "<tr><td>Part Number</td><td>FortiGate- VM00</td></tr>";
                        tableData += "<tr><td>Software</td><td>Fortinet FortiGate – VM00</td></tr>";
                        tableData += "<tr><td>Software Version</td><td>15.1X49-D40.6</td></tr>";
                        tableInfo.innerHTML = tableData;
                        sideNavLeft.appendChild(firewallSpecs);
                        sideNavLeft.appendChild(tableInfo);
                        var br = document.createElement("br");
                        sideNavLeft.appendChild(br);
                       // sideNavLeft.appendChild(flexwareInfo);
                        //sideNavLeft.appendChild(table)
                        sideNavLeft.appendChild(br.cloneNode());


                    }

                    if(tempData.type== "FWwanX"){
                        var head = document.createElement("h4");
                        head.setAttribute("id", "chosenHead");
                       // head.innerHTML = "<img src='resources/images/icons/wanxImg.png' style=\"width: 32px; height: 43px;\"></img>" + " WanX " + tempData.id;
                        head.innerHTML = "<img class='flexwareImg' src='resources/images/icons/wanxImg.png' style=\"margin-right: 0px; margin-left: 0px;\"></img>"+ " WanX " + tempData.id;
                        var subHead = document.createElement("h6");
                        // subHead.innerHTML = tempData.ownerSite.item.siteName + " | " + tempData.ownerSite.item.siteAlias;

                        sideNavLeft.appendChild(head);
                        sideNavLeft.appendChild(subHead);
                        var hr = document.createElement("hr");
                        sideNavLeft.appendChild(hr);
                    }

                    if(tempData.type== "FWrouter"){
                        var head = document.createElement("h4");
                        head.setAttribute("id", "chosenHead");
                      //  head.innerHTML = "<img src='resources/images/icons/routerImg.png' style=\"width: 32px; height: 43px;\"></img>" + " Router " + tempData.id;
                        head.innerHTML = "<img class='flexwareImg' src='resources/images/icons/routerImg.png'></img>"+ " Router " + tempData.id;
                        var subHead = document.createElement("h6");
                        // subHead.innerHTML = tempData.ownerSite.item.siteName + " | " + tempData.ownerSite.item.siteAlias;

                        sideNavLeft.appendChild(head);
                        sideNavLeft.appendChild(subHead);
                        var hr = document.createElement("hr");
                        sideNavLeft.appendChild(hr);
                    }





                    break;

                break;
            default:
                break;

        }
        
        if(document.getElementById("PortToggleView")!=null&&document.getElementById("PTPOnlyToggleView")!=null){
            togglePortState = document.getElementById("PortToggleView").checked;
            togglePTPState = document.getElementById("PTPOnlyToggleView").checked;
        }
        
    }

}

}

function processFlexware(flex){
    var parent = flex.parentElement;
    flex.innerHTML="Update Order";
    var wanxPriceRec = (document.getElementById("wanxSelect").checked)? 1: 0;
    var routerPrice = (document.getElementById("routerSelect").checked)? (document.getElementById("routerCount").value):0; 
    var monthly=0,single=0;
    if(wanxPriceRec!=0||routerPrice!=0){
        single=1000;
        monthly=50;
        if(wanxPriceRec){
            monthly+=60;
            single+=350;
        }
        if(routerPrice){
            single+=75*routerPrice;
            monthly+=100*routerPrice;
        }
    }
    if($("#tempFlexTable").length){
        $("#tempFlexTable").remove();
        $("#confirmFlexBut").remove();
    }
    $("#confFlex").remove();
    var charges = document.createElement("div");
    charges.setAttribute("class","serviceSelection");
    charges.setAttribute("id","tempFlexTable");
    charges.innerHTML= "<table ><tr><td>One-time fee</td><td> $"+single+"</td></tr><tr><td>Monthly Charges</td><td>$"+(monthly)+"</td></tr><tr><td>Total Charges</td><td>$"+(single+monthly)+"</td></tr></table>";
    parent.appendChild(charges);

    var confirmOrder = document.createElement("button");
    confirmOrder.innerHTML="Confirm Order";
    confirmOrder.setAttribute("id","confirmFlexBut");
    confirmOrder.setAttribute("class","buttonTicket");
    confirmOrder.setAttribute("onclick","confirmFlex(this)");
    parent.appendChild(confirmOrder);

}

function confirmFlex(flex){
    var parent = flex.parentElement;
    $("#tempFlexTable").remove();
    $("#confirmFlexBut").remove();
    var divEle = document.createElement("div");
    divEle.setAttribute("id","confFlex");
    divEle.innerHTML="Order confirmed!";
    parent.appendChild(divEle);

    var order = {};
        order.services = {};
        order.services.FWfirewall = false;
        
       if (document.getElementById("wanxSelect").checked) {
            order.services.FWwanX = true;
        } else {
            order.services.FWwanX = false;
        }
        if(document.getElementById("routerSelect").checked){
            order.services.FWrouter = document.getElementById("routerCount").value;
        }else{
            order.services.FWrouter=0;
        }
        
        console.log(order);
        order.id = generateOrder("fw", true);
        console.log(order.id);

        graph.addFWService(null, order);
        
        $(".removableTable").remove();
        $("#flexButtonRemovable").remove();
        cleanPortSiteAnimation();
}
function displayPTPOrder(portA,portB,sideNavLeft){
    console.log(portA);
    console.log(portB);
    if($("#ptpDivTable").length){
        $("#ptpDivTable").remove();
    }
    var ptpDiv = document.createElement("div");
    ptpDiv.setAttribute("id","ptpDivTable");
    var ptpTable = document.createElement("table");
    ptpTable.setAttribute("id","tableDisplay3");
    tableData = "<br><tr>";
    tableData+="<td><b>From "+portA.id+"</b><br>"+portA.item.ownerSite.item.siteName+"<br>"+portA.item.ownerSite.item.siteAddress+"</td>";
    tableData+="<td><b>To "+portB.id+"</b><br>"+portB.item.ownerSite.item.siteName+"<br>"+portB.item.ownerSite.item.siteAddress+"</td>";
    tableData += "</tr>";

    ptpTable.innerHTML=tableData;

    var createPTP = document.createElement("button");
    createPTP.innerHTML="Create PTP";
    createPTP.setAttribute("class","buttonTicket");
    createPTP.setAttribute("onclick","processPTP(this)");
    
    ptpDiv.appendChild(ptpTable);
    ptpDiv.appendChild(createPTP);
    sideNavLeft.appendChild(ptpDiv);
    graph.setNodeLinkingSet(portA.item,portB.item);
}
function processPTP(createPTP){
    var ptpDiv = createPTP.parentElement;
    createPTP.remove();
    var bandwidthSelect = document.createElement("div");
    bandwidthSelect.setAttribute("id","bandwidthSel");
    bandwidthSelect.setAttribute("class","serviceSelection");
    bandwidthSelect.innerHTML="<span>The bandwidth/CIR limit of the port determines your available bandwidth/CIR. To increase the bandwidth of one or more endpoints above the current port limit, submit the multi-gigabit EVC design change request.</span>";
    bandwidthSelect.innerHTML+="<input id='bandValue' class='bandwidthSelector' value='1' type='range' min='1' max='50' step='1'><span id='bandValDisplay'></span>";
    

    var serviceSelection = document.createElement("div");
    serviceSelection.setAttribute("id","serviceSel");
    serviceSelection.setAttribute("class","serviceSelection");
    serviceSelection.innerHTML="<h4>Class of Service</h4><input type='radio' id='bMedium' value='1' name='servClass' aria-required='true' checked><span style='margin-left:2em;font-weight: bold;'>business critical medium</span><br><input type='radio' id='bHigh' value='2' name='servClass'><span style='margin-left:2em;font-weight: bold;'>business critical high</span><br><input type='radio' id='bUrgent' value='3' name='servClass'><span style='margin-left:2em;font-weight: bold;'>business critical urgent</span>";
    

    var macIcon = document.createElement("div");
    macIcon.setAttribute("class","serviceSelection");
    macIcon.innerHTML="<h4>Number OF MAC ADDRESSES</h4><div class='macIcon'><input type='radio' value='1' name='macServ' aria-required='true'><div class='moreMac'>Yes<span class='macSelect' style='padding-left:1.6em'>Increase to 500 MAC address for each multipoint EVC on the port</span></div><br><input id='defaultMac' type='radio' value='2' name='macServ' checked><div class='moreMac'>No<span class='macSelect' style='padding-left:2em'>Each multipoint EVC on the port has a default limit of 250 MAC addresses</span></div></div>";
    
    var reviewOrder = document.createElement("button");
    reviewOrder.innerHTML="Review Order";
    reviewOrder.setAttribute("class","buttonTicket");
    reviewOrder.setAttribute("onclick","reviewPTP(this)");

    ptpDiv.appendChild(bandwidthSelect);
    ptpDiv.appendChild(serviceSelection);
    ptpDiv.appendChild(macIcon);
    ptpDiv.appendChild(reviewOrder);
    $("#bandValue").change(function () {
        var bandwidthVal = $("#bandValue").val();
        $("#bandValDisplay").html(bandwidthVal+" Mbps");
    });
    $("#bandValue").on("mousemove",function () {
        var bandwidthVal = $("#bandValue").val();
       $("#bandValDisplay").html(bandwidthVal+" Mbps");
    });
    //For touchscreen devices
    $("#bandValue").on("touchmove",function () {
        varbandwidthVal = $("#bandValue").val();
        $("#bandValDisplay").html(bandwidthVal+" Mbps");
    });
}
function reviewPTP(reviewOrder){
    if($("#tempPTPTable").length){
        $("#tempPTPTable").remove();
        $("#confirmPTPBut").remove();
    }
    var ptpDiv = reviewOrder.parentElement;
    reviewOrder.innerHTML="Update Order";
    var charges = document.createElement("div");
    charges.setAttribute("class","serviceSelection");
    charges.setAttribute("id","tempPTPTable");
    var band = parseInt(document.getElementById("bandValue").value);
    var service = parseInt($('input[name=servClass]:checked').val());
    var mac = parseInt($('input[name=macServ]:checked').val());
    charges.innerHTML= "<table ><tr><td>One-time fee</td><td> $1000.00</td></tr><tr><td>Monthly Charges</td><td>$"+((band+service+mac)*10.22)+"</td></tr><tr><td>Total Charges</td><td>$"+(1000+((band+service+mac)*10.22))+"</td></tr></table>";
    ptpDiv.appendChild(charges);

    var confirmOrder = document.createElement("button");
    confirmOrder.innerHTML="Confirm Order";
    confirmOrder.setAttribute("id","confirmPTPBut");
    confirmOrder.setAttribute("class","buttonTicket");
    confirmOrder.setAttribute("onclick","confirmPTP()");
    ptpDiv.appendChild(confirmOrder);
}
function confirmPTP(confirm){
    $("#ptpDivTable").children().not("#tableDisplay3").remove();
    var ordered = document.createElement("div");
    ordered.innerHTML="<p>Order Confirmed</p><p>Order Number 1234567835</p>";
    $("#ptpDivTable").append(ordered);
    var id = generateOrder("evc", true);
    console.log(id);
    graph.addEVC(id);
    cleanPortSiteAnimation();
}
function displayNetworkHealthInfo(data,sideNavLeft){
    var networkHealthInfo = document.createElement("h5");
    networkHealthInfo.innerHTML="Network Health Information";
    table = document.createElement("table");
    table.setAttribute("id","tableDisplay2");
    tableData="";
    for(var i=0;i<displayAPI.networkData.length;i++){
        if(data.item.linkName==displayAPI.networkData[i].id){
            tableData+="<tr><td>Network Latency</td><td>"+displayAPI.networkData[i].latency+"ms roundtrip</td></tr>";
            if(displayAPI.networkData[i].pktloss>10){
                tableData+="<tr><td>Packet Loss</td><td style='color:red;font-weight: bold;'>"+displayAPI.networkData[i].pktloss+"% <img class='alertIconTable' src='resources/images/icons/NOD-Portal-alarm.png'></img></td></tr>";
            }else{
                tableData+="<tr><td>Packet Loss</td><td>"+displayAPI.networkData[i].pktloss+"%</td></tr>";
            }
            
            tableData+="<tr><td>Throughput</td><td>"+displayAPI.networkData[i].throughput+" Mbps</td></tr>";
        }
    }

    table.innerHTML=tableData;
    var br=document.createElement("br");

    sideNavLeft.appendChild(br);
    sideNavLeft.appendChild(networkHealthInfo);
    //sideNavLeft.appendChild(br.cloneNode());
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
    divRec.appendChild(subHead);
    divRec.appendChild(recReason);
    divRec.appendChild(recMessage);
    
    switch(data.item.kind){
        case 'PointToPointCenter':
        case 'Multilinkhub':
            var recAction = document.createElement("button");
            recAction.innerHTML=data.item.recommendAction;
            recAction.setAttribute("class","buttonTicket");
            recAction.setAttribute("onclick","processAction(this)");
            divRec.appendChild(recAction);
            break;
        case 'Port':
            var recMessage2 = document.createElement("p");
            recMessage2.setAttribute("id","portBandwidths");
            recMessage2.setAttribute("onclick","bandwidthClick(this)");
            recMessage2.innerHTML="<input type='radio' name='bandwidth' id='' value='$1823.86'>3000 Mbps (best)<br><input type='radio' name='bandwidth' id='' value='$1550.00'>2500 Mbps (recommended) <br><input type='radio' name='bandwidth' id=''value='$1273.61'>2000 Mbps (minimum recquired)<br>";
            divRec.appendChild(recMessage2);
            divRec.appendChild(document.createElement("br"));
            break;
    }
    
    
    sideNavLeft.appendChild(divRec);
}

function bandwidthClick(child){
    var parent=child.parentElement;
    var temp=document.getElementById("billContent");
    if(temp!=null){
        temp.remove();
    }
    var billContent = document.createElement("div");
    billContent.setAttribute("id","billContent");
    var payment="<p>One-Time charge : $1000.00</p><p>Recurring Payment charge :"+$('input[name=bandwidth]:checked', '#portBandwidths').val()+"</p>";
    var terms="<div id='dummyTerms'><div style='position:absolute'><i class='material-icons accept' style='font-size:20px'>done</i></div><span style='margin-left:3em;font-weight: bold;'>Accept Terms & Conditions</span><br><div style='position:absolute'> <i class='material-icons' style='font-size:20px'>done</i></div><span style='margin-left:3em;font-weight: bold;'>Send Notification</span></div>";
    billContent.innerHTML=payment+terms;
    var recAction = document.createElement("button");
    recAction.innerHTML="Review";
    recAction.setAttribute("class","buttonTicket");
    recAction.setAttribute("onclick","processAction(this)");
    billContent.appendChild(recAction);
   
    parent.appendChild(billContent);
    parent.appendChild(document.createElement("br"));
}

function processAction(data){
    var id="",details="";
    if(data.innerHTML=="Review"){
        id="Order Id = 0124AS031232";
        details = "Order placed!";
    }else{
        id="Ticket Number = 0124AS031232";
        details = "Ticket Created!";
    }
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
        ticketCreated.innerHTML=details;
        var ticketDetails =document.createElement("p");
        ticketDetails.innerHTML=id;
        if(document.getElementById("dummyTerms")!= null)
        document.getElementById("dummyTerms").remove();
        parent.removeChild(pulsateDiv);
        parent.appendChild(ticketCreated);
        parent.appendChild(ticketDetails);
    }
}

function retrievePortObject(id){
    var portsInfo = document.querySelectorAll(".Port-node.use-node.clickable");
    for(var i=0;i<portsInfo.length;i++){
        if(portsInfo[i].__data__.id==id){
            return portsInfo[i].__data__.item;
        }
    }
    var clusterInfo = document.querySelectorAll(".Cluster.vertices");
    for(var i=0;i<clusterInfo.length;i++){
        if(clusterInfo[i].__data__.item.items[id]!=null){
            return clusterInfo[i].__data__.item.items[id];
        }
    }
}

function getTableDataPorts(portData){
    console.log("portData"+ JSON.stringify(portData));
    var tableData="<td>";
    var lines = document.getElementsByTagName("line");
    var EVCouterInfo = document.querySelectorAll(".Multilinkhub.vertices");
    var evcssInfo = document.getElementsByClassName("PointToPointCenter");
    var connections = [];
    for(var j=0;j<evcssInfo.length;j++){
        if(evcssInfo[j].__data__.id==portData.id){
            for(port in evcssInfo[j].__data__.item.ports){
                connections.push(retrievePortObject(evcssInfo[j].__data__.item.ports[port]));
                console.log(retrievePortObject(evcssInfo[j].__data__.item.ports[port]));
                console.log(evcssInfo[j].__data__.item.ports[port]);
            }
        }
    }

    for(var j=0;j<EVCouterInfo.length;j++){
        if(EVCouterInfo[j].__data__.id==portData.id){
            for(port in EVCouterInfo[j].__data__.item.ports){
                connections.push(retrievePortObject(EVCouterInfo[j].__data__.item.ports[port]));
                console.log(retrievePortObject(EVCouterInfo[j].__data__.item.ports[port]));
                console.log(EVCouterInfo[j].__data__.item.ports[port]);
            }
        }
    }
    if(connections.length==0){
        // for(var j=0;j<lines.length;j++){
        //     if(lines[j].classList != "icon-line"){
        //         if(lines[j].__data__.source.id ==portData.id||lines[j].__data__.target.id ==portData.id){
        //             if(lines[j].__data__.source.id ==portData.id){
        //                 connections.push(lines[j].__data__.target.item);
        //             }else {
        //                 connections.push(lines[j].__data__.source.item);
        //             }
        //         }
        //     }    
        // }

        for(var j=0;j<evcssInfo.length;j++){
            if(evcssInfo[j].__data__.item.ports.includes(portData.id)){
                connections.push(evcssInfo[j].__data__.item);
                // for(port in evcssInfo[j].__data__.item.ports){
                //     if(evcssInfo[j].__data__.item.ports[port]!=portData.id){
                //         //connections.push(retrievePortObject(evcssInfo[j].__data__.item.ports[port]));
                        
                //         console.log(retrievePortObject(evcssInfo[j].__data__.item.ports[port]));
                //         console.log(evcssInfo[j].__data__.item.ports[port]);
                //     }
                // }
            }
        }
        for(var j=0;j<EVCouterInfo.length;j++){
            if(EVCouterInfo[j].__data__.item.ports.includes(portData.id)){
                connections.push(EVCouterInfo[j].__data__.item);
                // for(port in EVCouterInfo[j].__data__.item.ports){
                //     if(EVCouterInfo[j].__data__.item.ports[port]!=portData.id){
                //         //connections.push(retrievePortObject(EVCouterInfo[j].__data__.item.ports[port]));
                        
                //         console.log(retrievePortObject(EVCouterInfo[j].__data__.item.ports[port]));
                //         console.log(EVCouterInfo[j].__data__.item.ports[port]);
                //     }
                // }
            }
        }

    }
    for(var k=0;k<connections.length;k++){
        if(connections[k].kind == 'PointToPointCenter'){

            for(var p=0;p<connections[k].ports.length;p++){
                if(connections[k].ports[p]!=portData.id){
                    //tableData+="<img class='ptpTableIcon' src='resources/images/icons/NOD-point-to-point-06.png'></img><br><span onmouseout='resetPortInfo(\""+connections[k].ports[p]+"\")' onmouseover='displayPortInfo(\""+connections[k].ports[p]+"\")' onclick='sideNavClick(\""+connections[k].ports[p]+"\")'>"+connections[k].ports[p]+"</span><br>";
                    if(k+1==connections.length)
                        tableData+="<img class='portHead' src='resources/images/icons/PTPImage.png'></img><br><span onmouseout='resetPortInfo(\""+connections[k].ports[p]+"\")' onmouseover='displayPortInfo(\""+connections[k].ports[p]+"\")' onclick='sideNavClick(\""+connections[k].ports[p]+"\")'>"+connections[k].ports[p]+"</span>";    
                    else
                        tableData+="<img class='portHead' src='resources/images/icons/PTPImage.png'></img><br><span onmouseout='resetPortInfo(\""+connections[k].ports[p]+"\")' onmouseover='displayPortInfo(\""+connections[k].ports[p]+"\")' onclick='sideNavClick(\""+connections[k].ports[p]+"\")'>"+connections[k].ports[p]+"</span><hr>";
                }
            }

        }else if(connections[k].kind == 'Multilinkhub'){
            //tableData+="<img class='ptpTableIcon2' src='resources/images/icons/NOD-EVC-connection-08.png'></img><br>";
            tableData+="<img class='portHead' src='resources/images/icons/evc.png'></img><br>";
            for(var p=0;p<connections[k].ports.length;p++){
                if(connections[k].ports[p]!=portData.id){
                    tableData+="<span onmouseout='resetPortInfo(\""+connections[k].ports[p]+"\")' onmouseover='displayPortInfo(\""+connections[k].ports[p]+"\")' onclick='sideNavClick(\""+connections[k].ports[p]+"\")'>"+connections[k].ports[p]+"</span><br>";
                }
            }
        }else if(connections[k].kind == 'Port'){
            tableData+="<span onmouseout='resetPortInfo(\""+connections[k].id+"\")' onmouseover='displayPortInfo(\""+connections[k].id+"\")' onclick='sideNavClick(\""+connections[k].id+"\")'>"+connections[k].id+"</span><br>";
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
    var clusterInfo = document.querySelectorAll(".Cluster-node.use-node");
    var flexwareInfo = document.querySelectorAll(".Flexware-node.use-node.clickable");
    var firewallInfo = document.querySelectorAll(".FWfirewall.use-node");
    var wanxInfo = document.querySelectorAll(".FWwanX.use-node");
    var routerInfo = document.querySelectorAll(".FWrouter.use-node");
    var adiodInfo=document.querySelectorAll(".Adiod-node.use-node");

    console.log("inside sidenav click data"+ data);


    for(var i=0;i<portsInfo.length;i++){
        if(portsInfo[i].__data__.id==data){
            togglesidenavleft(portsInfo[i].__data__);
            displayAPI.displayNodeInfo(portsInfo[i].__data__, portsInfo[i]);
        }
    }

    for(var i=0;i<flexwareInfo.length;i++){
        if(flexwareInfo[i].__data__.id==data){
            togglesidenavleft(flexwareInfo[i].__data__);
           // displayAPI.displayNodeInfo(portsInfo[i].__data__, portsInfo[i]);
        }
    }

    for(var i=0;i<firewallInfo.length;i++){
        if(firewallInfo[i].__data__.id==data){
            console.log("going to togglesidenavleft");
            togglesidenavleft(firewallInfo[i].__data__);
            // displayAPI.displayNodeInfo(portsInfo[i].__data__, portsInfo[i]);
        }
    }

    for(var i=0;i<wanxInfo.length;i++){
        if(wanxInfo[i].__data__.id==data){
            togglesidenavleft(wanxInfo[i].__data__);
            // displayAPI.displayNodeInfo(portsInfo[i].__data__, portsInfo[i]);
        }
    }
    for(var i=0;i<routerInfo.length;i++){
        if(routerInfo[i].__data__.id==data){
            togglesidenavleft(routerInfo[i].__data__);
            // displayAPI.displayNodeInfo(portsInfo[i].__data__, portsInfo[i]);
        }
    }
    for(var i=0;i<adiodInfo.length;i++){
        if(adiodInfo[i].__data__.id==data){
            togglesidenavleft(adiodInfo[i].__data__);
            // displayAPI.displayNodeInfo(portsInfo[i].__data__, portsInfo[i]);
        }
    }





    for (var i = 0; i < clusterInfo.length; i++) {
        var clusterData = clusterInfo[i].__data__.item.items;
        for (item in clusterData) {
            var datacl = {};
            datacl['type'] = clusterData[item].kind;
            switch (clusterData[item].kind) {
                case 'Site':

                    if(clusterData[item].siteAlias == data){

                        togglesidenavleft(clusterData[item]);
                       // displayAPI.displayNodeInfo(clusterData[item], clusterData[item].id);
                    }
                    break;

                case 'Port':


                    if(clusterData[item].id == data){

                        togglesidenavleft(clusterData[item]);
                       // displayAPI.displayNodeInfo(clusterData[item], clusterData[item].id);
                    }
                    break;

                case 'Adiod':
                    if(clusterData[item].id == data){

                        togglesidenavleft(clusterData[item]);
                        // displayAPI.displayNodeInfo(clusterData[item], clusterData[item].id);
                    }
                    break;

                case 'Flexware':
                    if(clusterData[item].id == data){

                        togglesidenavleft(clusterData[item]);
                    }


                default:
                    break;
            }
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
    var EVCouterInfo = document.querySelectorAll(".Multilinkhub.vertices");
    for(var i=0;i<EVCouterInfo.length;i++){
        displayAPI.releaseNodeInfo(EVCouterInfo[i].__data__, EVCouterInfo[i].childNodes[0]);
    }
    var evcssInfo = document.getElementsByClassName("PointToPointCenter");
    for(var i=0;i<evcssInfo.length;i++){
        displayAPI.releaseNodeInfo(evcssInfo[i].__data__, evcssInfo[i].childNodes[0]);
    }

}

$( "#searchText" ).on("focus change paste keyup autocompleteopen",function() {

    var searchTags=getSearchTags();
    $( "#searchText" ).autocomplete({
        autoFocus: true,
        minLength:1,
        source: searchTags,
        open: function(event, ui){
            $(this).autocomplete("widget").css({"width":"58vw"});
            $(this).autocomplete("widget").css({"left":"20vw"});
            cleanPortSiteAnimation();
            return false;
        },
        focus: function(event, ui){
            togglesidenavleft(ui.item.data);
            displayUIEffect(event, ui);
            // Code to zoom in to the Site
            //if(ui.item.latlong!=null)
            // graph.fitBoundedMap(ui.item.latlong);
            //return false;
        },
        select: function(event, ui){
            
            displayUIEffect(event, ui);
            // if(ui.item.latlong!=null)
            //     graph.fitBoundedMap(ui.item.latlong);
            //return false;
        }
    });
});

function getPortTags(){
    var searchTags=[];
    var portsInfo = document.querySelectorAll(".Port-node.use-node.clickable");
    var clusterInfo = document.querySelectorAll(".Cluster.vertices");
    for(var i=0;i<portsInfo.length;i++){
        var data={}
        data['type']=portsInfo[i].__data__.item.kind;
        data['value']=portsInfo[i].__data__.item.kind+" ("+portsInfo[i].__data__.item.id+")";
        data['data']=portsInfo[i].__data__;
        data['useTarget']=portsInfo[i];
        searchTags.push(data);
    }
    for(var i=0;i<clusterInfo.length;i++){
        var clusterData = clusterInfo[i].__data__.item.items;
        for(item in clusterData){
            if(clusterData[item].kind=='Port'){
                var data={};
                data['type']=clusterData[item].kind;
                data['data']=clusterData[item];
                data['value']=clusterData[item].id;
                data['ownerSite']=clusterData[item].ownerSite;
                searchTags.push(data);
            }
        }
    }
        return searchTags;
}
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
        data['data']=evcssInfo[i].__data__;
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
        data['data']=EVCouterInfo[i].__data__;
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
            data['data']=clusterData[item];
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

function searchCluster() {
    var input, filter, table, tr, td, i;
    input = document.getElementById("searchClusterText");
    filter = input.value.toUpperCase();
    table = document.getElementById("clustertableDisplay");
    tr = table.getElementsByTagName("tr");
    for (i = 0; i < tr.length; i++) {
        td1 = tr[i].getElementsByTagName("td")[0];
        td2 = tr[i].getElementsByTagName("td")[1];
        if (td1 || td2) {
            if (td1.innerHTML.toUpperCase().indexOf(filter) > -1 || td2.innerHTML.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }



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

function masterEventHandler(){

            this.classList.toggle("active");
            var dropdownContent = this.nextElementSibling;
            if (dropdownContent.style.display === "block") {
                dropdownContent.style.display = "none";
            } else {
                dropdownContent.style.display = "block";
            }

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