Topology Graph
===============

Provides a simple force directed topology graph for kubernetes items.

#### Disclaimer
This is an early implementation and is subject to change.

![Screenshot](https://raw.github.com/kubernetes-ui/topology-graph/master/scratch/screenshot.png)

Getting Started
---------------

This project was originally built on Kubernetes-UI, and customized to fit our needs.
### Setup Environment
1. Requires node, bower, and gulp installed to build working enviroment.
    - To Install Node, download NodeJS LTS version from [here](https://nodejs.org/en/).
    - Install Bower using `npm install bower` command from terminal.
    - Install Gulp using `npm install gulp` command from terminal. 
2. Download or clone entire repository, maintaining file hierarchy.
3. Run the following commands in terminal from the project directory to build the run enviroment.
    - `npm install`
    - `bower install`
    - `gulp`

This will install any required dependencies necessary to run the ```index.html``` demo. Bower is used to manage external dependencies.


Building and Running
--------------------
```
gulp
cd prod
http-server
```

Gulp is used to build and minify the project. If you would like to run the non-minified version, do not use ```cd prod```.



Usage
-----

Include the JS and CSS files, after angularjs and d3:

```xml
<script src="bower_components/angular/angular.js"></script>
<script src="bower_components/d3/d3.js"></script>
<script src="bower_components/kubernetes-topology-graph/dist/topology-graph.js"></script>
<link rel="stylesheet" href="bower_components/kubernetes-topology-graph/dist/topology-graph.css" />
```

Make sure your angular app / module includes ```kubernetesUI``` as a module dependency.

```
angular.module('exampleApp', ['kubernetesUI'])
```

Define how the svg vertices (nodes) will display:

```xml
    <svg>
      <defs>
        <g id="vertex-Node">
          <circle r="15" stroke="black" fill="white"></circle>
          <text y="6">N</text>
        </g>
        <g id="vertex-Pod">
          <circle r="15" stroke="black" fill="white"></circle>
          <text y="6">P</text>
        </g>
      </defs>
    </svg>
```

Define the following in your controller scope:

```javascript
$scope.my_items = {
    item1: { kind: "Node" },
    item2: { kind: "Pod" }
};

$scope.my_relations = [
    { source: "item2", "target": "item1"}
];

$scope.my_kinds = {
    "Pod": "#vertex-Pod",
    "Node": "#vertex-Node"
};
```

Now include the graph:

```xml
<kubernetes-topology-graph items="my_items" relations="my_relations" kinds="my_kinds">
</kubernetes-topology-graph>
```

Documentation
-------------

##Key types

###Inputs into ```topology-graph.js```

#### items

A javascript plain object containing items as property values. It is strongly recommended that ```ModelTypes.js``` and ```TransformInputJSON.js``` be used to instantiate these objects. The keys
of this object are used in the ```relations``` attribute. The items are required to have the following properties:

* ```kind```: string with a valid kind, which should correlate with the ```kinds``` object. As a convention, closely related types will have a major and minor name separated by an underscore. For example, ```Site_Prequalified```. By complying with this convention, we can use ```kinds.startsWith()``` to match the parent kind, and equality to test for the exact kind.

* ```uniqueId```: string with a unique identifier that should never be repeated with any item in the system. Some item types avoid a collision by prepending their kind to an id number or using a counter.

Item types are defined in the ```ModelTypes.js``` file. This may in the future be broken out into multiple type modules. The types will be defined in more detail in that file. The items object is initially instantiated by ```OutputTree``` in ```TransformInputJSON.js```.

#### kinds

A javascript plain object with kinds as keys. Only
items with an ```item.kind``` that is a key in this object will be displayed. The
values should be xlink hrefs (eg: html ids prefixed with '#'). These will be used to draw
the vertices.

Note that services are a special case documented later.

###Managed by Topology.js

#### relations

An array of javascript objects describing relations between ```items```. Each object should
have the following properties:

 * ```relation.source```: string key of an item in the ```items``` map.
 * ```relation.target```: string key of an item in the ```items``` map.
 * ```relation.value``` : number representing a weight. No longer in use.
 * ```relation.kind```  : string representing type of a link. Not currently used for anything, but may be used in the future.

#### nodes
Array holding the graphics info for nodes.
#### lookup
Object that is effectively a key-value mapping into nodes.

#### edges
Edges is derived from relations.

#### selection
If this is attribute is set, then it represents the item that should be marked as
selected in the topology. When this is set the 'select' scope event will not automatically
select items in the graph. It becomes the responsibility of the caller to watch for the
event, and change the selection.

#### 'select'

This is a scope event that will be emitted when the selection changes. The argument will
be the item (from the ```items``` map) that is being select, or ```null``` if nothing is
selected. You can call ```event.preventDefault()``` during this event to prevent the default
selection behavior.

#### 'render'

This is a scope event that will be emitted when items are rendered as elements. The argument
will be D3 selection of <g> elements that correspond to items. Each item has its data set to
one of the items. The default implementation of this event sets the title from Kubernetes
metadata and tweaks the look of for certain statuses. Use ```event.preventDefault()``` to
prevent this default behavior.

#### force
Optional. A D3 force layout to use instead of creating one by default. The force layout size
will be updated, and layout  will be started as appropriate. Reassigning this field after
the directive has been created, will not affect the graph, but changes to force layout should
work fine.

Styling
-------

Using the ```<defs>``` and CSS you should be able to achieve the look you want. The
directive applies the item *kind* as a class to each vertex. Each edge also gets a class
with the concatenated item *kind* of the *source* and *target*, in that order.

See ```topology-graph.css``` for an example default look and feel, that uses the classes
described above.

Kinds
-----



