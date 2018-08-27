//The Key is currently ATT's map key
var BING_KEY = "Akg_FZYIXiJc8S0ZecryN60DVoNKcHsd8fNm89pSSshPe_R4y89aoVQB8tBK02zt";
var bingLayer;
/**The Canvas imagery sets don't include a imagery provider for copyright.  I am unsure how to 
 * either add one or to handle the error leaflet-bing-layer throws when reading null
 * It does not affect performance in any way.  
 * 8/21/17 A quick fix has been done to mask the error. Attributioin to Microsoft is provided in setTick of 
 * topology-graph if no Imagery provider is given by Bing.
 */

 /**The options are only for leaflet-bing-layer, not bing itself.  It can only include what bing-layer includes */
var options = {bingMapsKey: BING_KEY, imagerySet: "CanvasLight"};
/**@center: currently statically set to [0, 0]
 * @zoom: currently statically set to 8
 * @leaflet's options for map
 * 
 * The view is adjusted in topology-graph after the data is read, so the starting point matters little.
 */

function getMap(center, zoom, mapOptions) {
    var map = L.map('bing-map', mapOptions)
        .setView(center, zoom);

    /**Cheap way of changing map settings by adding style settings to the url that calls Bing REST service (in leaflet-bing-layer)
     * Malciously abuses global scope. yay javascript
     * Note: style used here in an inclusive fasion. The root element class (me) is set to default visiblity false
     * so visiblie elements are added one by one. See https://msdn.microsoft.com/en-us/library/mt823636.aspx for a
     * full listing of the avalible elements and their hierarchy.
    */
    L.TileLayer.Bing.METADATA_URL += '&st=global|lc:fefef5_'+
        'me|v:0;lbc:000000;loc:00555555;lv:0_'+
        // 'bld|v:0;fc:50ffffff_'+
        //'rd|v:0;fc:10000000;sc:50000000_'+
        //'us|v:0_'+
        //'ard|v:0_'+
        //'st|v:0_'+
        'wt|v:1;sc:85bbd9;fc:7ab0b0;lv:0_'+
        'rv|v:0;bv:0;lv:0;fc:85bbd9_'+
        //'ct|v:1;lv:1;bv:1;boc:6e461c;bsc:6e461c_'+
        // 'cr|v:1;bv:1;bsc:5ec8fa;boc:5ec8fa_' +
        'pl|v:1;1v:0;bv:0;bsc:5ec8fa;boc:5ec8fa';


    /**
     * Bing Style key:
     * global: lc -- land color
     * me -- map element
     * rd -- road
     * us -- unpaved street
     * ard -- arterial road
     * st -- street
     * wt -- water
     * rv -- river
     * pl -- political
     *
     *
     * Attributes:
     * v - visiblity (boolean)
     * lv - label visiblity (boolean)
     * bv - border visiblity (boolean)
     * fc - fill color (hex)
     * sc - stroke color (hex)
     * lbc - label color (hex)
     * loc - label outline (hex)
     * bsc - border stroke color (hex)
     * boc - border outline color (hex)
     *
     */

     /**add new bing layer to map, return map. */
    bingLayer = L.tileLayer.bing(options).addTo(map);
    return map;
}

