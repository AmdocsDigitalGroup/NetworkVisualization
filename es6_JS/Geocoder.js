/**
 * Created by zoejo on 08/09/17.
 */
var BING_API_KEY = 'Akg_FZYIXiJc8S0ZecryN60DVoNKcHsd8fNm89pSSshPe_R4y89aoVQB8tBK02zt';
class GeoCoordinates {
    constructor(lat, long) {
        this.lat = lat;
        this.lng = long;
    }
}
;
/**
 * Concrete implementation of a Geocoder for use with Bing's REST API. Note that this does not take advantage of
 * Bing's batch geocoding feature, as it needs to be able to work within a few seconds.
 */
class BingGeocoder {
    constructor() {
        this.siteQueue = [];
        this.batchRunning = false;
    }
    batchGeocode(addresses, callback) {
        for (let address of addresses) {
            this.geocode(address, callback);
        }
    }
    enqueueSite(address, site) {
        var temp = BingGeocoder._buildUrl(address).split("&key=");
        var key = temp[0];
        var storeCheck = window.localStorage.getItem(key);
        if (storeCheck) {
            var coords = storeCheck.split("#");
            site.address = address;
            site.coordinates = new GeoCoordinates(Number(coords[0]), Number(coords[1]));
            window.clearTimeout(this.e);
            this.e = window.setTimeout(function () {
                d3.select("#view-button").dispatch("geo-data-loaded");
            }, 300);
        }
        else {
            this.siteQueue.push({ address: address, site: site });
            if (!this.batchRunning)
                this.startBatch();
        }
    }
    startBatch() {
        this.batchRunning = true;
        var empty = (this.siteQueue.length == 0);
        var closure = this;
        var i;
        window.clearTimeout(this.e);
        i = window.setInterval(function () {
            if (empty && (closure.siteQueue.length == 0)) {
                closure.batchRunning = false;
                window.clearInterval(i);
                closure.e = window.setTimeout(function () {
                    d3.select("#view-button").dispatch("geo-data-loaded");
                }, 1000);
            }
            else {
                var obj = closure.siteQueue.shift();
                closure.geocode(obj.address, function (address, status) {
                    obj.site.address = address;
                    obj.site.coordinates = new GeoCoordinates(obj.address.coordinates[0], obj.address.coordinates[1]);
                    var temp = BingGeocoder._buildUrl(address).split("&key=");
                    var key = temp[0];
                    var coords = obj.address.coordinates[0] + "#" + obj.address.coordinates[1];
                    window.localStorage.setItem(key, coords);
                });
                empty = (closure.siteQueue.length == 0);
            }
        }, 100);
    }
    /**
     * Sends an async request to Bing for geocoding an address. Callback is called if
     * @param address
     * @param callback
     */
    geocode(address, callback) {
        let url = BingGeocoder._buildUrl(address);
        fetchJsonp(url, {
            jsonpCallback: 'jsonp'
        }).then(function (response) {
            return response.json();
        }).then(function (json) {
            let addr = BingGeocoder._parsePayload(json, address);
            callback(addr, 200);
            console.log('parsed json', json);
        }).catch(function (ex) {
            console.log('parsing failed', ex);
        });
        /*let request = new XMLHttpRequest();
        request.open("GET", url);
        request.onreadystatechange = function() {
            if(request.readyState == XMLHttpRequest.DONE){
                if(request.status == 200) {
                    BingGeocoder._parsePayload(request.responseText, address);
                    callback(address, 200);
                } else {
                    console.error(`BingGeocode.geocode: Error on request. Status is ${request.statusText} . Payload follows:`);
                    console.error(request.response);
                }
            }
        };
        request.send();*/
    }
    /**
     * Given a valid payload, pulls out the coordinates and any unfilled information. This is a fairly naive implementation, and hopes
     * that there are no collisions.
     * @param payload
     * @param address
     * @private
     */
    static _parsePayload(payload, address) {
        console.log(payload);
        address.coordinates = payload.resourceSets[0].resources[0].point.coordinates;
        return address;
    }
    static _buildUrl(address) {
        return `https://dev.virtualearth.net/REST/v1/Locations?countryRegion=${BingGeocoder._checkMember(address.countryRegion)}&adminDistrict=${BingGeocoder._checkMember(address.adminDistrict)}&locality=${BingGeocoder._checkMember(address.locality)}&postalCode=${BingGeocoder._checkMember(address.postalCode)}&addressLine=${BingGeocoder._checkMember(address.addressLine)}&includeNeighborhood=true&maxResults=1&key=${BING_API_KEY}`;
    }
    /**
     * Used to check parameters for Bing. If they are not present, a - is inserted as a nil value. Otherwise, we encode it for a URL.
     * @param value
     * @returns {string}
     * @private
     */
    static _checkMember(value) {
        if (!value) {
            return "-";
        }
        else {
            return encodeURIComponent(value);
        }
    }
}
//# sourceMappingURL=Geocoder.js.map