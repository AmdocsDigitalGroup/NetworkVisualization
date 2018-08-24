/*jshint esversion: 6 */
/**
 * Created by zoejo on 07/17/17.
 */

class OutputTree {

    constructor() {
        this.items = {};
        this.relations = [];
        this.geoCoder = new BingGeocoder();
    }

    addLink(source, target, kind) {
        var link = new Relation(source, target, kind);
        this.relations.push(link);
    }

    addMultiLink(endpointList, linkName) {
        var node = new MultilinkHub(endpointList, linkName);
        this.items[node.id] = node;
        for (let endpoint of endpointList) {
            this.addLink(node.id, endpoint.portCircuitId, "multilink");
        }
    }

    addSite(jsonSite) {
        var node = new Site(jsonSite);
        this.items[node.id] = node;
        if (!node.coordinates) {
            this.geoCoder.enqueueSite(this._extractAddress(jsonSite), node);
        }
        // BingGeocoder.geocode(this._extractAddress(jsonSite),
        //     function(address, status){
        //         node.address = address;
        //         node.coordinates = new GeoCoordinates(address.coordinates[1], address.coordinates[0]);
        //     });

        return node;
    }

    _extractAddress(jsonSite) {
        return {
            addressLine: jsonSite.siteAddressExploded.cplStreetName,
            locality: jsonSite.siteAddressExploded.cplCity,
            postalCode: "" + jsonSite.siteAddressExploded.cplZip,
            coordinates: [0, 0],
            id: ""
        };
    }
    
    addPort(jsonPort, site) {
        var node = new Port(jsonPort, site.id);
        this.items[node.id] = node;
        this.recommendation = new Recommendation(node.id);
        this.addLink(node.id, site.id, 'portToSite');
    }

    addFlexware(site, services) {
        var fwnode = new Flexware(site, services);
        this.items[fwnode.id] = fwnode;
        this.addLink(fwnode.id, site.id, 'flexwareToSite');

        var keys = Object.keys(services);
        for (let key of keys) {
            if (services[key] === true) {

                var serviceId = "" + site.locationId + "-" + key;
                this._addService(fwnode, {
                    type: key,
                    id: serviceId
                });
            }
        }
    }

    _addService(fwnode, service) {
        var node = new Service(service.id, service.type);
        this.items[node.id] = node;
        this.addLink(node.id, fwnode.id, 'serviceToFlexware');
    }

    addPortToPortLink(endpointList, linkName) {
        //used to add a PointToPointCenter between two endpoints, and add them
        //to the relations list.
        var port0 = endpointList[0];
        var port1 = endpointList[1];
        if (this.items[port0.portCircuitId] == undefined) {
            console.log("remove " + linkName);
            return;
        }
        if (this.items[port1.portCircuitId] == undefined) {
            console.log("remove " + linkName);
            return;
        }
        var p2pCenter = new PointToPointCenter(port0, port1, linkName);
        this.items[p2pCenter.id] = p2pCenter;
        this.addLink(port0.portCircuitId, p2pCenter.id, 'portToCenter');
        this.addLink(port1.portCircuitId, p2pCenter.id, 'portToCenter');
    }
}

function getSimpleFormatFrom(input) {
    var output = new OutputTree();
    //iterating over items.
    var groupNum = 1;
    for (let site of input.customerSiteList) {
        groupNum++;
        var siteNode = output.addSite(site);
        for (let port of site.portList) {
            output.addPort(port, siteNode);
        }
        if (site.flexwareEnabled) {
            output.addFlexware(siteNode, site.services);
        }
    }

    for (let linkname in input.evcMap) {
        if (!input.evcMap.hasOwnProperty(linkname)) { //guard against prototype properties.
            continue;
        }
        var endptList = input.evcMap[linkname].endptList;
        var assetId = input.evcMap[linkname].id;

        if (endptList.length === 2) { //Assuming this is a p2p link
            output.addPortToPortLink(endptList, linkname);
            var selEvc = 'PointToPointCenter' + linkname;
            output.items[selEvc].assetId = assetId;
        }
        if (endptList.length >= 3) { //Assuming an MTP
            output.addMultiLink(endptList, linkname);
            output.items[linkname].assetId = assetId;
        }
    }
    return output;
}
