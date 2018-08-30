    var ptpEVC = {};
    var flexware = {};
    var tarRec = {};
    //Future references
    var mtpEVC = {};

    var finalOrderID = 1000;
    ptpEVC.isOpen = false;

    $(".navCon li").on("click", function () {
        $(".navCon li").removeClass("active");
    });
    $(".navFWli li").on("click", function () {
        $(".navFWli li").removeClass("active");
    });


    /**EVC connection setup */
    ptpEVC.billVal = 0;
    ptpEVC.monthly = 50;
    ptpEVC.single = 1000;
    ptpEVC.tabOptionsId = "#evcTabOptions";
    ptpEVC.pulsateIconId = "#pulsateIcon";
    ptpEVC.bandwidthValId = "#bandwidthValue";
    ptpEVC.bandwidthTextId = "#range";
    ptpEVC.checkoutLiId = "#evcCheckout";
    ptpEVC.checkoutLinkId = "#fourth";
    ptpEVC.confirmEVCId = "#confirmEVC";

    $(ptpEVC.tabOptionsId + " li:not(:last-child)").click(function () {
        $(ptpEVC.pulsateIconId).css("display", "none");
        $(ptpEVC.checkoutLinkId).css("display", "none");
    });

    $("#modal-1").on("shown.bs.modal", function () {
        $(ptpEVC.checkoutLinkId).css("display", "none");
        $(ptpEVC.pulsateIconId).css("display", "none");

        var tempSite1 = linkingSet[0].site.siteAddress.split(' ').reverse();
        var addressSite1 = { street: "", city: "", zip: "" };
        addressSite1.zip = tempSite1[0];
        addressSite1.city = tempSite1[2] + " " + tempSite1[1]
        for (var i = 3; i < tempSite1.length; i++)
            addressSite1.street = tempSite1[i] + " " + addressSite1.street;

        $("#siteOneName").html(linkingSet[0].site.siteName);
        $("#siteOneAddress").html(addressSite1.street);
        $("#siteOneCity").html(addressSite1.city);
        $("#siteOneZip").html(addressSite1.zip);

        var tempSite2 = linkingSet[1].site.siteAddress.split(' ').reverse();
        var addressSite2 = { street: "", city: "", zip: "" };
        addressSite2.zip = tempSite2[0];
        addressSite2.city = tempSite2[2] + " " + tempSite2[1]
        for (var i = 3; i < tempSite2.length; i++)
            addressSite2.street = tempSite2[i] + " " + addressSite2.street;

        $("#siteTwoName").html(linkingSet[0].site.siteName);
        $("#siteTwoAddress").html(addressSite2.street);
        $("#siteTwoCity").html(addressSite2.city);
        $("#siteTwoZip").html(addressSite2.zip);

        $(ptpEVC.bandwidthValId).val(1);
        $(ptpEVC.bandwidthTextId).html(1);
        $("#bMedium").prop('checked', true);
        $("#defaultMac").prop('checked', true);
        ptpEVC.bandwidthVal = 1;
        ptpEVC.serviceVal = 1;
        ptpEVC.macVal = 2;
        ptpEVC.billVal = 0;
        ptpEVC.monthly = 50;
        ptpEVC.single = 1000;
        $("#oneTimeEvc").html(ptpEVC.single);
        $("#monthlyEvc").html(ptpEVC.monthly);
        $("#totalBill").html(ptpEVC.billVal);
    });

    ptpEVC.bandwidthVal = $(ptpEVC.bandwidthTextId).text();
    $(ptpEVC.bandwidthValId).change(function () {
        ptpEVC.bandwidthVal = $(ptpEVC.bandwidthValId).val();
        $(ptpEVC.bandwidthTextId).html(ptpEVC.bandwidthVal);
    });
    $(ptpEVC.bandwidthValId).on("mousemove",function () {
        ptpEVC.bandwidthVal = $(ptpEVC.bandwidthValId).val();
        $(ptpEVC.bandwidthTextId).html(ptpEVC.bandwidthVal);
    });
    //For touchscreen devices
    $(ptpEVC.bandwidthValId).on("touchmove",function () {
        ptpEVC.bandwidthVal = $(ptpEVC.bandwidthValId).val();
        $(ptpEVC.bandwidthTextId).html(ptpEVC.bandwidthVal);
    });
    ptpEVC.serviceVal = $("input[name='serviceClass']:checked").val();
    $("input[name='serviceClass']").click(function () {
        ptpEVC.serviceVal = $("input[name='serviceClass']:checked").val();
    });

    ptpEVC.macVal = $("input[name='macService']:checked").val();
    $("input[name='macService']").click(function () {
        ptpEVC.macVal = $("input[name='macService']:checked").val();
    });
    $(".navCon li:not(:last-child)").click(function () {
        ptpEVC.isOpen = false;
        $(ptpEVC.checkoutLiId).css("pointer-events", "fill");
    });
    $(ptpEVC.checkoutLiId).click(function () {
        if (ptpEVC.isOpen) {
            console.log("In condition");
            $(ptpEVC.checkoutLiId).css("pointer-events", "none");
        } else {
            $(ptpEVC.tabOptionsId + " li").keydown(false);
            $(ptpEVC.tabOptionsId + " li").css("pointer-events", "none");
            $(ptpEVC.pulsateIconId).css("display", "block").effect('pulsate', { times: 5 }, 1500, checkoutEVC);
            function checkoutEVC() {
                // $("#evcTabOptions li").keypress(function(){return true;});
                $(ptpEVC.tabOptionsId + " li").unbind("keydown");
                $(ptpEVC.tabOptionsId + " li").css("pointer-events", "fill");
                $(ptpEVC.checkoutLinkId).fadeTo(1000, 1);
                $(ptpEVC.pulsateIconId).css("display", "none");
                $("#tempEVCOrderID").html(generateOrder("evc", false));
                ptpEVC.billVal = 0;
                ptpEVC.monthly = 50;
                ptpEVC.single = 1000;
                if (ptpEVC.macVal == 1) {
                    ptpEVC.monthly += 200;
                    ptpEVC.single += 0;
                }
                if (ptpEVC.serviceVal == 2) {
                    ptpEVC.monthly += 150;
                    ptpEVC.single += 0;
                }
                if (ptpEVC.serviceVal == 3) {
                    ptpEVC.monthly += 500;
                    ptpEVC.single += 0;
                }
                ptpEVC.monthly = ptpEVC.monthly + 5 * Math.sqrt(ptpEVC.bandwidthVal) + .5 * ptpEVC.bandwidthVal;
                ptpEVC.billVal = (ptpEVC.monthly + ptpEVC.single).toFixed(2);
                ptpEVC.monthly = ptpEVC.monthly.toFixed(2);
                ptpEVC.single = ptpEVC.single.toFixed(2);
                $("#oneTimeEvc").html(ptpEVC.single);
                $("#monthlyEvc").html(ptpEVC.monthly);
                $("#totalBill").html(ptpEVC.billVal);
                ptpEVC.isOpen = true;
            }
        }
    });

    $(ptpEVC.confirmEVCId).click(function () {
        var id = generateOrder("evc", true);
        console.log(id);
        graph.addEVC(id);

    });

    /**Flexware setup */
    flexware.count = 0;
    flexware.billFWVal = 0;
    flexware.FWmonthly = 50;
    flexware.FWsingle = 1000;
    flexware.isOpen = false;
    flexware.isSingleItemAdded = false;
    flexware.existingItem = {};

    flexware.firewallLabelId = "#labelFirewall";
    flexware.wanXLabelId = "#labelWanx";
    flexware.routerLabelId = "#labelRouter";

    flexware.fwTabOptionsId = "#FWTabOptions";
    flexware.pulsateIconId = "#pulsateFWIcon";
    flexware.checkoutLinkId = "#thirdFW";
    flexware.firewallDecisionId = "#firewallDecision";
    flexware.wanXDecisionId = "#wanxDecision";

    flexware.addRouterId = "#addRouter";
    flexware.removeRouterId = "#removeRouter";
    flexware.checkoutLiId = "#FWCheckout";
    flexware.confirmOrderId = "#confirmFW";

    $(flexware.fwTabOptionsId+" li:not(:last-child)").click(function () {
        $(flexware.pulsateIconId).css("display", "none");
        $(flexware.checkoutLinkId).css("display", "none");
    });

    $("#modal-fw").on("shown.bs.modal", function () {
        console.log(box.services);
        flexware.existingItem = box.services;
        if (flexware.existingItem.FWfirewall) {
            $(flexware.firewallLabelId).html("Included");
            $(flexware.firewallDecisionId).html("remove_circle_outline");
            $("#firewallBtn").prop('disabled', true);
            console.log($("#firewallBtn").prop("disabled"));

        } else {
            $(flexware.firewallLabelId).html("");
            $(flexware.firewallDecisionId).html("add_circle_outline");
        }
        if (flexware.existingItem.FWwanX) {
            $(flexware.wanXLabelId).html("Included");
            $(flexware.wanXDecisionId).html("remove_circle_outline");
            $("#wanxBtn").prop('disabled', true);

        } else {
            $(flexware.wanXLabelId).html("");
            $(flexware.wanXDecisionId).html("add_circle_outline");
        }
        $("#FWSiteName").html(site.siteName);
        $("#FWSiteAddress").html(site.address.addressLine);
        $("#FWSiteCity").html(site.address.locality);
        $("#FWSiteZip").html(site.address.postalCode);

        flexware.count = 0;
        $(flexware.routerLabelId).html("");
        flexware.billFWVal = 0;
        flexware.FWmonthly = 50;
        flexware.FWsingle = 1000;
        $("#tempFWSingle").html(flexware.FWsingle);
        $("#tempFWMonthly").html(flexware.FWmonthly);
        $("#singleFWbilling").html(flexware.FWsingle);
        $("#monthlyFWbilling").html(flexware.FWmonthly);
        $("#totalFWbilling").html(flexware.billFWVal);
    });

    $(flexware.firewallDecisionId).click(function () {
        if ($(flexware.firewallDecisionId).text() === "add_circle_outline") {
            $(flexware.firewallLabelId).html("Included");
            $(flexware.firewallDecisionId).html("remove_circle_outline");
        } else if ($(flexware.firewallDecisionId).text() === "remove_circle_outline" && $("#firewallBtn").prop("disabled") == false) {
            $(flexware.firewallLabelId).html("");
            $(flexware.firewallDecisionId).html("add_circle_outline");
        }
    });
    $(flexware.wanXDecisionId).click(function () {
        if ($(flexware.wanXDecisionId).text() === "add_circle_outline") {
            $(flexware.wanXLabelId).html("Included");
            $(flexware.wanXDecisionId).html("remove_circle_outline");
        } else if ($(flexware.wanXDecisionId).text() === "remove_circle_outline" && $("#wanxBtn").prop("disabled") == false) {
            $(flexware.wanXLabelId).html("");
            $(flexware.wanXDecisionId).html("add_circle_outline");
        }

    });
    $(flexware.addRouterId).click(function () {
        if ((flexware.existingItem.FWrouter + flexware.count) < 25) {
            flexware.count = flexware.count + 1;
            $(flexware.routerLabelId).html(flexware.count);
        } else {
            $(flexware.addRouterId).prop('disabled', true);
        }
    });
    $(flexware.removeRouterId).click(function () {
        if (flexware.count === 0) {
            $(flexware.routerLabelId).html(0);
        } else {
            flexware.count = flexware.count - 1;
            $(flexware.routerLabelId).html(flexware.count);
            $(flexware.addRouterId).prop('disabled', false);
        }

    });
    $(".navFWli li:not(:last-child)").click(function () {
        flexware.isOpen = false;
        $(flexware.checkoutLiId).css("pointer-events", "fill");
    });
    $(flexware.checkoutLiId).click(function () {
        if (flexware.isOpen) {
            $(flexware.checkoutLiId).css("pointer-events", "none");
        } else {
            $(flexware.fwTabOptionsId+" li").keydown(false);
            $(flexware.fwTabOptionsId+" li").css("pointer-events", "none");
            $(flexware.pulsateIconId).css("display", "block").effect('pulsate', { times: 5 }, 1500, checkoutFW);
            function checkoutFW() {
                $(flexware.fwTabOptionsId+" li").unbind("keydown");
                $(flexware.fwTabOptionsId+" li").css("pointer-events", "fill");
                flexware.billFWVal = 0;
                flexware.FWmonthly = 50;
                flexware.FWsingle = 1000;
                $(flexware.checkoutLinkId).fadeTo(1000, 1);
                $(flexware.pulsateIconId).css("display", "none");
                $("#tempFWOrderID").html(generateOrder("fw", false));
                if ($(flexware.firewallLabelId).text() == "Included" && !flexware.existingItem.FWfirewall) {
                    flexware.FWmonthly += 800;
                    flexware.FWsingle += 300;
                    flexware.isSingleItemAdded = true;

                }
                if ($(flexware.wanXLabelId).text() == "Included" && !flexware.existingItem.FWwanX) {
                    flexware.FWmonthly += 60;
                    flexware.FWsingle += 350;
                    flexware.isSingleItemAdded = true;
                }
                if ($(flexware.routerLabelId).html() && $(flexware.routerLabelId).html() != 0) {
                    flexware.isSingleItemAdded = true;
                }
                if (flexware.isSingleItemAdded) {
                    $(flexware.confirmOrderId).prop('disabled', false);
                    flexware.FWmonthly += 100 * flexware.count;
                    flexware.FWsingle += 75 * flexware.count;
                    flexware.billFWVal = (flexware.FWmonthly + flexware.FWsingle).toFixed(2);
                } else {
                    flexware.FWmonthly = 0;
                    flexware.FWsingle = 0;
                    flexware.billFWVal = 0;
                    $(flexware.confirmOrderId).prop('disabled', true);
                }
                $("#singleFWbilling").html(flexware.FWsingle);
                $("#monthlyFWbilling").html(flexware.FWmonthly);
                $("#totalFWbilling").html(flexware.billFWVal);
                flexware.isOpen = true;
                flexware.isSingleItemAdded = false;
            }
        }
    });
    $("#FWCart").click(function () {
        flexware.billFWVal = 0;
        flexware.FWmonthly = 50;
        flexware.FWsingle = 1000;
        if ($(flexware.firewallLabelId).text() == "Included" && !flexware.existingItem.FWfirewall) {
            flexware.FWmonthly += 800;
            flexware.FWsingle += 300;
            flexware.isSingleItemAdded = true;
        }
        if ($(flexware.wanXLabelId).text() == "Included" && !flexware.existingItem.FWwanX) {
            flexware.FWmonthly += 60;
            flexware.FWsingle += 350;
            flexware.isSingleItemAdded = true;
        }
        if ($(flexware.routerLabelId).html() && $(flexware.routerLabelId).html() != 0) {
            flexware.isSingleItemAdded = true;
        }
        if (flexware.isSingleItemAdded) {
            flexware.FWmonthly += 100 * flexware.count;
            flexware.FWsingle += 75 * flexware.count;
        }
        else {
            flexware.FWmonthly = 0;
            flexware.FWsingle = 0;
        }
        $("#tempFWSingle").html(flexware.FWsingle);
        $("#tempFWMonthly").html(flexware.FWmonthly);
        flexware.isSingleItemAdded = false;
    });
    $(flexware.confirmOrderId).click(function () {
        var order = {};
        order.services = {};
        if (box.services.FWfirewall) {
            order.services.FWfirewall = false;
        } else if ($(flexware.firewallLabelId).text() == "Included") {
            order.services.FWfirewall = true;
        } else {
            order.services.FWfirewall = false;
        }
        if (box.services.FWwanX) {
            order.services.FWwanX = false;
        } else if ($(flexware.wanXLabelId).text() == "Included") {
            order.services.FWwanX = true;
        } else {
            order.services.FWwanX = false;
        }
        order.services.FWrouter = flexware.count;
        console.log(order);
        order.id = generateOrder("fw", true);
        console.log(order.id);

        graph.addFWService(null, order);
       // graph.addAdiodService(null, order);

    });
    function generateOrder(type, confirmed) {
        var orderID = {};
        orderID.evcOrder = "EVC";
        orderID.fwOrder = "FW";

        if (type == "evc") {
            if (confirmed) {
                orderID.evcOrder = orderID.evcOrder + finalOrderID;
                finalOrderID++;
                return orderID.evcOrder;
            } else {
                orderID.evcOrder = orderID.evcOrder + finalOrderID;
                return orderID.evcOrder;
            }
        }
        if (type == "fw") {
            if (confirmed) {
                orderID.fwOrder = orderID.fwOrder + finalOrderID;
                finalOrderID++;
                return orderID.fwOrder;
            } else {
                orderID.fwOrder = orderID.fwOrder + finalOrderID;
                return orderID.fwOrder;
            }
        }
        if (type == "port") {
            if (confirmed) {
                orderID.fwOrder = orderID.fwOrder + finalOrderID;
                finalOrderID++;
                return orderID.fwOrder;
            } else {
                orderID.fwOrder = orderID.fwOrder + finalOrderID;
                return orderID.fwOrder;
            }
        }
    }

    /** Target Recommendation setup */
    tarRec.billVal = 0;
    tarRec.monthly = 50;
    tarRec.single = 1000;
    tarRec.isOpen = false;
    tarRec.tabOptionsId = "#reTabOptions";
    tarRec.pulsateIconId = "#pulsateReIcon";
    tarRec.bandwidthValId = "#reBandwidthValue";
    tarRec.bandwidthTextId = "#reBwRange";
    tarRec.checkoutLiId = "#reCheckout";
    tarRec.checkoutLinkId = "#thirdRe";
    tarRec.confirmEVCId = "#confirmRe";
    tarRec.cartTabId = "#reCart"

  $("#modal-re").on("shown.bs.modal", function () {
      $(tarRec.checkoutLinkId).css("display", "none");
      $(tarRec.pulsateIconId).css("display", "none");

      $("#recMsg").html(recData.recommendMessage);
      $("#recReason").html(recData.recommendReason);
      $("#recAction").html(recData.recommendAction);
  });

  $("#modal-reCt").on("shown.bs.modal", function () {
      $(tarRec.pulsateIconId).css("display", "none");
      
      $("#recMsgCt").html(recData.recommendMessage);
      $("#recReasonCt").html(recData.recommendReason);
      $("#recActionCt").html(recData.recommendAction);
  });

$(tarRec.cartTabId).click(function () {
    tarRec.bandwidthVal = $("#reBandwidthValueRadio input[type='radio']:checked").val();
    console.log(tarRec.bandwidthVal);
    tarRec.billVal = 0;
    tarRec.monthly = 50;
    tarRec.single = 1000;
    if (tarRec.macVal == 1) {
        tarRec.monthly += 200;
        tarRec.single += 0;
    }
    if (tarRec.serviceVal == 2) {
        tarRec.monthly += 150;
        tarRec.single += 0;
    }
    if (tarRec.serviceVal == 3) {
        tarRec.monthly += 500;
        tarRec.single += 0;
    }
    tarRec.monthly = tarRec.monthly + 5 * Math.sqrt(tarRec.bandwidthVal) + .5 * tarRec.bandwidthVal;
    tarRec.billVal = (tarRec.monthly + tarRec.single).toFixed(2);
    tarRec.monthly = tarRec.monthly.toFixed(2);
    tarRec.single = tarRec.single.toFixed(2);
    $("#tempReSingle").html(tarRec.single);
    $("#tempReMonthly").html(tarRec.monthly);
});

$(tarRec.bandwidthValId).change(function () {
    tarRec.bandwidthVal = $(tarRec.bandwidthValId).val();
    $(ptpEVC.bandwidthTextId).html(tarRec.bandwidthVal);
});
$(tarRec.bandwidthValId).on("mousemove",function () {
    tarRec.bandwidthVal = $(tarRec.bandwidthValId).val();
    $(tarRec.bandwidthTextId).html(tarRec.bandwidthVal);
});
//For touchscreen devices
$(tarRec.bandwidthValId).on("touchmove",function () {
    tarRec.bandwidthVal = $(tarRec.bandwidthValId).val();
    $(tarRec.bandwidthTextId).html(tarRec.bandwidthVal);
});

$("#reBandwidthValueRadio input").change(function () {
    tarRec.bandwidthVal = $("#reBandwidthValueRadio input[type='radio']:checked").val();
    $(tarRec.bandwidthTextId).html(tarRec.bandwidthVal);
});

$(tarRec.checkoutLiId).click(function () {
    $('#reOderStatus').css('display', 'none');
    $(tarRec.pulsateIconId).css("display", "block").effect('pulsate', { times: 5 }, 1500, checkoutRec);
    function checkoutRec() {
        $(tarRec.checkoutLinkId).fadeTo(1000, 1);
        $(tarRec.pulsateIconId).css("display", "none");
        $('#reOderStatus').css('display', 'block');
        tarRec.billVal = 0;
        tarRec.monthly = 50;
        tarRec.single = 1000;
        if (tarRec.macVal == 1) {
            tarRec.monthly += 200;
            tarRec.single += 0;
        }
        if (tarRec.serviceVal == 2) {
            tarRec.monthly += 150;
            tarRec.single += 0;
        }
        if (tarRec.serviceVal == 3) {
            tarRec.monthly += 500;
            tarRec.single += 0;
        }
        tarRec.monthly = tarRec.monthly + 5 * Math.sqrt(tarRec.bandwidthVal) + .5 * tarRec.bandwidthVal;
        tarRec.billVal = (tarRec.monthly + tarRec.single).toFixed(2);
        tarRec.monthly = tarRec.monthly.toFixed(2);
        tarRec.single = tarRec.single.toFixed(2);
        $("#singleReBilling").html(tarRec.single);
        $("#monthlyReBilling").html(tarRec.monthly);
        $("#totalReBilling").html(tarRec.billVal);
        tarRec.isOpen = true;
    }
});

$('#recActionCt').click(function () {
    $('#firstReCt').removeClass('active');
    $("#pulsateReCtIcon").css("display", "block").effect('pulsate', { times: 5 }, 1500, checkoutRecCt);
    function checkoutRecCt() {
        $("#pulsateReCtIcon").css("display", "none");
        $('#secondReCt').show();
        $('#secondReCt').addClass('active');
        $('#recActionCt').hide();
        $('#cancelReBtn').html('CLOSE');
    }
});

$('#cancelReBtn').click(function () {
    $('#secondReCt').hide();
    $('#secondReCt').removeClass('active');
    $('#firstReCt').addClass('active');
    $('#recActionCt').show();
    $('#cancelReBtn').html('CANCEL');
});