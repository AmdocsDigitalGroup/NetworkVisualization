/**
 * Created by zoejo on 07/11/17.
 */

/**
 * AccessibleInfoText is a collection of utility functions that is meant to help generate aria-labels and descriptions.
 * Currently it is mostly just for nodes. For debugging convenience, by convention all methods of this will log to console.
 */
class AccessibleInfoText{
    constructor(){

    }

    getLabelForPrequalifiedSite(siteItem){
        var result = 'Prequalified Site: ' + siteItem.siteAlias;
        console.log("getLabelForPrequalifiedSite:" + result);
        return result;
    }

    getDescForPrequalifiedSite(siteItem){
        return this.getLabelForSite(siteItem) + " can be activated.";
    }

    getLabelForFWBox(item){
        return "Flexware";
    }

    getDescForFWBox(item){
        //TODO
        return "NOT IMPLEMENTED YET";
    }

    /**
     *
     * @param {Service} fwItem
     * @returns {string}
     */
    getLabelForFWItem(fwItem){
        return fwItem.prettyType;
    }

    getDescForFWItem(fwItem){
        var str = this.getLabelForFWItem(fwItem);
        //TODO add metadata
        return str;
    }


    getLabelForSite(siteItem){
        var result = 'Site: ' + siteItem.siteAlias;
        console.log("getLabelForSite:" + result);
        return result;
    }

    /**
     *
     * @param site A valid site object
     * @returns {String} A description string for the site
     */
    getDescForSite(siteItem){
        return this.getLabelForSite(siteItem) + " has " + '' + " ports and is connected to " + '' + "other sites. Press space to navigate the ports, and arrow keys to navigate between ports.";
    }


    /**
     *
     * @param {Port} portItem
     * @returns {string}
     */
    getLabelForPort(portItem){
        return "Port: " + portItem.id;
    }

    getDescForPort(portItem){
        var str = this.getDescForPort(portItem);
        return str;
    }

    getLabelForEVC(evcItem){
        //TODO
        return "NOT IMPLEMENTED YET";
    }

    getDescForEVC(evcItem){
        //TODO
        return "NOT IMPLEMENTED YET";
    }
}

var accessibleInfoText = new AccessibleInfoText();