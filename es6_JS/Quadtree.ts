/*jshint esversion: 6 */
/**
 * Created by zoejo on 08/03/17.
 */
/**@interface Point
 * @prop {number} lat the Latitude of a coordinate pair
 * @prop {number} lng the Longitude of a coordinate pair
  */
interface Point{
    lat: number,
    lng: number
}
/**@interface Relation
 * @prop {string} source the start point of a link
 * @prop {string} target the end point of a link
*/
interface Relation{
    source: string,
    target: string
}
/**
 * QuadTree is a data structure to attempt to make clustering logic more efficient. 
 * The premise is that each inner node has up to four descendents, representing the
 * NE, NW, SE, and SW quadrants. By filing items into leaves (one site per leaf), we
 * can approximate distance based clustering by simply clustering everything below a
 * certain level.
 * @name Quadtree
 * @prop {QTNode} root the root node of the tree
 * @prop {number} lastDepthChecked the depth level last checked. used Externally to fetch node names with resolve
 */
class Quadtree{
    root;
    lastDepthChecked: number;
    static errSites = {};
    /**
     * Quadtree constructor
     * @param nwCorner - the upper left corner of the map 
     * @param seCorner - the lower left corner of the map
     */
    constructor(nwCorner: Point, seCorner: Point){
        this.root = new QTNode(1, nwCorner, seCorner, 1, 0);
        this.lastDepthChecked = -1;
    }
    /**
     * sets lastDepthChecked to -1 to represent non-map view
     */
    swithToFreeView(){
        this.lastDepthChecked = -1;
    }
    /**
     * adds a site to the tree
     * @param site the site to be added
     * @param ports the objects attached to the site (ports, flexware box and services)
     */
    insert(site: Object, ports: Object[]){
        this.root.insert(site, ports);
    }
    /**
     * used to get the id of the cluster with itemId, or returns the itemId if none
     * @param itemId the id of the node to be found
     * @param depth the maximum depth the search may go to before returning the node that holds the item instead
     * @return {string} the resolved id
     */
    resolve(itemId, depth) {
        return this.root.resolve(itemId, depth);
    }
    /**
     * All items up to depth will be listed. If depth at a non-leaf node is reached, then it will generate a cluster.
     * @param depth Maximum depth.
     */
    list(depth){
        this.lastDepthChecked = depth;
        return this.root.list(depth);
    }
    /**
     * 
     * @param sites Object holding all sites to be put into the tree
     * @param items Object holding all items in the graph
     * @param relations Array with all relations in the graph
     * @param tree the current tree, if any
     * @return {Quadtree} the new tree with all sites
     */
    static buildTree(sites: Object, items: Object, relations: Relation[], tree:Quadtree, nwCorner: Point, seCorner: Point): Quadtree{
        var clusterTree;
        if(tree){
            clusterTree = tree;
        }else{
            clusterTree = new Quadtree(nwCorner, seCorner);
        }

        for(let site in sites){
            if(sites[site].item.kind == 'Site_Prequalified'){
                continue;
            }
            var ports = [];
            for(let link in relations){
                if(relations[link].target == sites[site].id){
                    ports.push(items[relations[link].source]);
                    if(items[relations[link].source].kind == "Flexware"){
                        for(let service in relations){
                            if(relations[service].target == items[relations[link].source].id){
                                ports.push(items[relations[service].source]);
                            }
                        }
                    }
                }
            }
            clusterTree.insert(sites[site].item, ports);
        }
        return clusterTree;
    }
}
/**Class for the node that holds either a site and it's ports or links to the next level of the tree
 * @name QTNode
 * @prop {number} level the depth of the node
 * @prop {Point} nwCorner the upper left coordinate of the node's area
 * @prop {Point} swCorner the lowwer right coordinate of the node's area
 * @prop {Point} center the center coordinates of the node's area
 * @prop {Array[QTNode]} quadrants the child nodes of the current node
 * @prop {number} nodeId the id of the node
 * @prop {Map} itemIdToQuadrantMapping the map to indicate which child to search next
 * @prop {Object} heldSite the site in the node, if any
 * @prop {Object[]} heldPorts the ports of the heldSite, if any.
 * @prop {number} MAX_LEVEL 
 * @static 
 * @prop {number} NW 
 * @static 
 * @prop {number} NE 
 * @static 
 * @prop {number} SE 
 * @static 
 * @prop {number} SW 
 * @static 
 */
class QTNode{
    level: number;
    nwCorner: Point;
    seCorner: Point;
    center: Point;
    quadrants: QTNode[];
    nodeId: number;
    itemIdToQuadrantMapping = new Map();
    heldSite: Object;
    heldPorts: Object[];

    public static readonly MAX_LEVEL = 20;
    public static readonly NW = 1;
    public static readonly NE = 2;
    public static readonly SE = 3;
    public static readonly SW = 4;

    constructor(level: number, nwCorner: Point, seCorner: Point, parentId: number, direction: number){
        this.level = level;
        this.nwCorner = nwCorner;
        this.seCorner = seCorner;
        this.center = {lat: (nwCorner.lat + seCorner.lat)/2, lng: (nwCorner.lng + seCorner.lng)/2};
        this.quadrants = [null, null, null, null];
        /** @property nodeId is used to uniquely and consistently generate cluster ids*/
        this.nodeId = ((parentId-1) * 4) + 1 + direction;
        /** @property itemIdToQuadrantMapping is used to make it easier to route queries about an item to the relevant node. */
        this.itemIdToQuadrantMapping = new Map();
        this.heldSite = undefined;
        this.heldPorts = undefined;
    }

    /**
     * Lists all items above depth. Everything below is clustered up.
     * @param depth {number} Number of levels to traverse before clustering.
     */
    list(depth: number){
        var result = {};
        depth--;
        if(depth === 0){
            var newCluster = this._makeCluster();
            if(newCluster._findNumSites() > 1){
                result[newCluster.id] = newCluster;
            }else{
                result = newCluster.items;
            }
        } else if(!this._isLeaf()){
            for(let quadrant of this.quadrants){
                if(quadrant){
                    let list = quadrant.list(depth);
                    for(let item in list){
                        result[item] = list[item];
                    }
                }
            }
        } else {//is a leaf
            result[this.heldSite.id] = this.heldSite;
                    for(let port in this.heldPorts)
                        result[this.heldPorts[port].id] = this.heldPorts[port];
        }
        return result;
    }

    _makeCluster(){
        return new QTCluster(this.nodeId, this.list(-1));
    }
    resolve(itemId: string, depth: number){
        if(depth === -1){//free view checking
            return itemId;
        }
        if(this.heldSite){//this implies leaf
            for(let item of [this.heldSite, ...this.heldPorts]){
                if(item.id === itemId){
                    return item.id;
                }
            }
            return "This statement should be unreachable through normal means";
        }
        depth--;
        if(depth === 0){//was searching depth 1, only one node allowed
            return "cluster" + this.nodeId;
        }
        if(this.itemIdToQuadrantMapping.has(itemId)){//further levels allowed, check next
            return this.quadrants[this.itemIdToQuadrantMapping.get(itemId)-1].resolve(itemId, depth);
        }
        return itemId;//anything that wasn't mapped. ie, EVCs
    }

    insert(site: Object, ports: Object[]){
        //CASE 3: At a parent node.
        if(!this._isLeaf()){
            let destination = this._determineQuadrant(site.coordinates);
            this._addIfEmpty(destination).insert(site, ports);
            for(let item of [site, ...ports]){
                this.itemIdToQuadrantMapping.set(item.id, destination);
            }
        }else
        //reordered cases to use short circuit comparison with this.heldSite.id 8-31-17
        //CASE 1: We're at an empty leaf, or a repeated site
        if((this._isLeaf() && !this.heldSite) || (this.heldSite.id === site.id)){
            this.heldSite = site;
            this.heldPorts = ports;
            return;
        }

        //CASE 2: We're at a nonempty leaf
        else if(this._isLeaf() && this.heldSite){
            var checkLat = Math.abs(site.coordinates.lat - this.heldSite.coordinates.lat);
            var checkLng = Math.abs(site.coordinates.lng - this.heldSite.coordinates.lng);

            if((checkLat < .00001) && (checkLng < .00001)){
                if(site.kind == 'Site_Prequalified'){
                    Quadtree.errSites[site.id] = site;
                }else{
                    Quadtree.errSites[this.heldSite.id] = this.heldSite;
                    this.heldSite = site;
                    this.heldPorts = ports;
                }
            }else{
                let destination = this._determineQuadrant(site.coordinates);
                this._addIfEmpty(destination).insert(site, ports);
                for(let item of [site, ...ports]){
                    this.itemIdToQuadrantMapping.set(item.id, destination);
                }

                destination = this._determineQuadrant(this.heldSite.coordinates);
                this._addIfEmpty(destination).insert(this.heldSite, this.heldPorts);
                for(let item of [this.heldSite, ...this.heldPorts]){
                    this.itemIdToQuadrantMapping.set(item.id, destination);
                }

                this.heldSite = undefined;
                this.heldPorts = undefined;
            }
        }
    }

    _addIfEmpty(direction): QTNode{
        if(!this.quadrants[direction - 1]){
            switch(direction){
                case QTNode.NW:
                    this.quadrants[direction - 1] = new QTNode(this.level+1, this.nwCorner,
                        {lat: this.center.lat, lng: this.center.lng}, this.nodeId, direction);
                    break;
                case QTNode.SW:
                    this.quadrants[direction - 1] = new QTNode(this.level+1, {lat: this.center.lat, lng: this.nwCorner.lng},
                        {lat:this.seCorner.lat, lng: this.center.lng}, this.nodeId, direction);
                    break;
                case QTNode.SE:
                    this.quadrants[direction - 1] = new QTNode(this.level+1, {lat: this.center.lat, lng: this.center.lng},
                        this.seCorner, this.nodeId, direction);
                    break;
                case QTNode.NE:
                    this.quadrants[direction - 1] = new QTNode(this.level+1, {lat: this.nwCorner.lat, lng: this.center.lng},
                        {lat: this.center.lat, lng: this.seCorner.lng}, this.nodeId, direction);
                    break;
                default:
                    throw "invalid direction";
            }
        }
        return this.quadrants[direction - 1];
    }


    /**
     * Determines which quadrant holds a point. If a point falls directly on one of the center lines, we fail to the
     * North and West.
     * @param x
     * @param y
     * @returns {number}
     * @private
     */
    _determineQuadrant(point: Point): number{
        if(point.lat < this.center.lat){
            if(point.lng > this.center.lng){
                return QTNode.SE;
            } else {
                return QTNode.SW;
            }
        } else {
            if(point.lng > this.center.lng){
                return QTNode.NE;
            } else {
                return QTNode.NW;
            }
        }
    }

    /**
     * Is this node a leaf?
     * @returns {boolean}
     * @private
     */
    _isLeaf(): boolean{
        for(var q of this.quadrants){
            if(q){return false;}
        }
        return true;
    }
}

class QTCluster{
    id: string;
    kind: string;
    items: Object;
    _coordinates: Point;
    _numSites: number;


    constructor(id: number, items: Object){
        this.id = "cluster" + id;
        this.kind = "Cluster";
        this.items = items;
        this._editted();
    }

    /**
     * Sets flags to indicate that we've changed, and cached values no longer hold true.
     * Does not mutate a closure.
     * @private
     */
    _editted(): void{
        this._coordinates = undefined;
        this._numSites = undefined;
    }

    /**
     * Finds the centerpoint coordinate of the cluster, which is defined to be the average coordinate
     * of all sites with defined coordinates.
     * @returns {GeoCoordinates}
     * @private
     */
    _findCenter(): Point{
        var sumLat = 0, sumLong = 0, count = 0;
        for(let item in this.items){
            if(!this.items[item].coordinates){//guard against undef coordinates
                continue;
            } else if(this.items[item].kind.startsWith("Site")){
                sumLat += this.items[item].coordinates.lat;
                sumLong += this.items[item].coordinates.lng;
                count += 1;
            }
        }

        if(count === 0){
            return new GeoCoordinates(0,0);
        } else {
            return new GeoCoordinates(sumLat / count, sumLong / count);
        }
    }

    /**
     * Finds the number of sites present in the cluster.
     * @returns {number}
     * @private
     */
    _findNumSites(): number{
        var count = 0;
        for(let item in this.items){
            if(this.items[item].kind === "Cluster"){
                count += this.items[item].numSites;
            } else if(this.items[item].kind === "Site"){
                count += 1;
            }
        }
        return count;
    }

    get coordinates(): Point{
        if(!this._coordinates){
            this._coordinates = this._findCenter();
        }
        return this._coordinates;
    }

    get numSites(): number{
        if(!this._numSites){
            this._numSites = this._findNumSites();
        }
        return this._numSites;
    }
}