/*jshint esversion: 6 */
/**
 * This file holds the implementations for all basic item types.
 * Created by zoejo on 07/17/17.
 * By convention, all identifiers starting with 'json' identify json inputs.
 */


var EVC_TYPE = {
    ASE 	: {value : 1, label : 'ASE'},//classic only
    HYBRID	: {value : 2, label : 'Hybrid'},//SDN and classic
    ASENOD	: {value : 3, label : 'ASENOD'},//purely SDN

    //Given 2...n ports in a list, returns the EVC type.
    determineLinkType : function(portList) {
        if(portList.length > 1){
            return 0;
        }
        var prevPortType = portList[0].portType;
        for(let port in portList){
            if(prevPortType != port.portType){
                return EVC_TYPE.HYBRID;
            }
        }
        if(prevPortType == "SDN"){
            return EVC_TYPE.ASENOD;
        } else {
            return EVC_TYPE.ASE;
        }
    }
};

/**
 * This represents a Flexwarebox
 */
class Flexware{
    constructor(siteObj, services){
        this.id = siteObj.id + "flexware";
        this.kind = 'Flexware';
        this.services = services;
    }
}

class Adiod{
    constructor(siteObj, services2) {

        this.id = siteObj.id + "adiod";
        this.kind = 'Adiod';
        this.services2 = services2;
    }
}



class Relation{
    constructor(source, target, kind){
        this.source = source;
        this.target = target;
        this.kind = kind;
    }

    get asArray(){
        return [this.source, this.target];
    }
}

/**
 * This represents a site, including prequalified sites.
 * Sites are uniquely identified by their locationId.
 */
class Site{
    constructor(jsonSite){
        this.kind = 'Site';
        if(jsonSite.portList.length == 0 && !jsonSite.flexwareEnabled){
            /** We guess which sites are prequalified by seeing if they have no flexware and flexware disabled.*/
            this.kind = 'Site_Prequalified';
        }
        this.siteName = jsonSite.siteName;
        this.siteId = jsonSite.siteId;
        this.siteAddress = jsonSite.siteAddress;
        this.locationId = jsonSite.locationId;
        this.city = jsonSite.siteAddressExploded.cplCity;
        this.state = jsonSite.siteAddressExploded.cplState;
        this.zip = jsonSite.siteAddressExploded.cplZip;
        this.countryCode = jsonSite.siteAddressExploded.countryCode;
        this.countryName = jsonSite.siteAddressExploded.countryName;
        this.sdnCapable = jsonSite.sdnCapable;
        this.id = jsonSite.locationId;
        this.flexwareEnabled = jsonSite.flexwareEnabled;
        this.adiodEnabled=jsonSite.adiodEnabled;
        this.services2=jsonSite.services2;
        this.services = jsonSite.services;
        if(jsonSite.siteAlias) {
            this.siteAlias = jsonSite.siteAlias;
        } else {
            this.siteAlias = jsonSite.siteAddressExploded.cplCity;
        }

        //coordinateUtils.applyJSONLatLong(jsonSite, this);
        if(jsonSite.coordinates){
            this.coordinates =  new GeoCoordinates(jsonSite.coordinates[0], jsonSite.coordinates[1]);
        }

        console.log("Services2" + JSON.stringify(this.services2));
    }
}

class Port{
    constructor(jsonPort, siteId){
        this.kind = 'Port';
        this.id = jsonPort.id;
        this.portInterface = jsonPort.portInterface;
        this.classOfService = jsonPort.classOfService;
        this.speedOrCir = jsonPort.speedOrCir;
        this.bandwidthTier = jsonPort.bandwidthTier;
        this.attachedTo = siteId;
    }
}




class MultilinkHub{
    constructor(jsonEndpointList, linkName){
        this.kind = 'Multilinkhub';
        this.linkName = linkName;
        this.id = linkName;
        this.ports = [];
        this.portInfo = [];

        for(var port in jsonEndpointList) {
            if(jsonEndpointList.hasOwnProperty(port)) {
                this.ports.push(jsonEndpointList[port].portCircuitId);
                this.portInfo.push(new Port(jsonEndpointList[port], 0));
            }
        }
    }

    addPort(port){
        this.ports.push(port.id);
        this.portInfo.push(port);
    }
}

class PointToPointCenter{
    /**
     * Represents a PointToPointCenter/PTP.
     * If jsonPort0 or jsonPort1 is null or undefined, we assume that ports will be supplied
     * later by using addPort().
     * @param jsonPort0
     * @param jsonPort1
     * @param linkName
     */
    constructor(jsonPort0, jsonPort1, linkName){
        this.kind = 'PointToPointCenter';
        this.id = this.kind + linkName;
        this.linkName = linkName;
        if(jsonPort0 !== null && jsonPort0 !== undefined && jsonPort1 !== null && jsonPort1 !== undefined){
            this.ports = [jsonPort0.portCircuitId, jsonPort1.portCircuitId];
            this.portInfo = [new Port(jsonPort0, 0), new Port(jsonPort1,0)];
        } else {
            this.ports = [];
            this.portInfo = [];
        }
    }

    addPort(portObj){
        this.ports.push(portObj.id);
        this.portInfo.push(portObj);
    }
}

class Recommendation {
    constructor(jsonId) {
        var jsonRecommendation = displayAPI.recommendationsData;
        var recLen = jsonRecommendation.length;
        for(var k = 0; k < recLen; k++) {
            if(jsonId == jsonRecommendation[k].assetId) {
                this.recommendMessage = jsonRecommendation.recommendMessage;
                this.recommendSeverity = jsonRecommendation.recommendSeverity;
                this.recommendAction = jsonRecommendation.recommendAction;
            }
        }
    }
}
