const fs = require('fs-extra');
const NGraph = require('ngraph.graph');
const gp = require("./generateproxy.js");
const gt = require("./generatetarget.js");

let g = NGraph();

function parseIntent(jsonFileName) {
    let fullFileName = "./Agent/intents/" + jsonFileName;
    jsonFileName = jsonFileName.split(".json")[0];
    fs.readJSON(fullFileName, function(err, data) {
        if (err)
            throw(err);
        if (data) {
            // If you are getting info from dialogflow API, this may need to change.
            // TODO: Perhaps make the code a bit more modular
            if (data.webhookUsed) {
                //console.log(jsonFileName);
                //console.log(data.webhookUsed);
                g.addNode(jsonFileName, {
                    type: "flow"
                });
                g.addLink("ProxyEndPoint", jsonFileName, "to");
                g.addLink("TargetEndpoint", jsonFileName, "to");
                // Need to add this data into a graph data structure
                // TODO: This about how to add policies to this
                // what would be the logic for adding policies
                // TODO: will need to create a separate file for each policy
                // TODO: Think about how to do javascript policies
                // TODO: Think about if entire configuration can be done using yaml
            }
        }
    });
};

function createProxySkeleton() {
    console.log("Create proxy skeleton");
    // Start with the graph
    g.addNode("ProxyEndPoint", {
        $: {name: "default"},
        Description: {},
        FaultRules: {},
        PreFlow: { $: {name: "PreFlow"}, Request: {}, Response: {}, },
        PostFlow: { $: {name: "PostFlow"}, Request: {}, Response: {}, },
        Flows: "graphList",
        HTTPProxyConnection: {
            BasePath: "/voice",
            VirtualHost: "secure"
        },
        RouteRule: {
            $: {name: "default"},
            Condition: "routerule_condition",
            TargetEndpoint: "default"
        }
    });
    g.addLink("ProxyEndPoint", "Preflow");
    g.addLink("ProxyEndPoint", "Postflow");
}

function createTargetSkeleton() {
    console.log("Create target skeleton");
    // Start with the graph
    g.addNode("TargetEndpoint", {
        $: {name: "default"},
        Description: {},
        FaultRules: {},
        PreFlow: { $: {name: "PreFlow"}, Request: {}, Response: {}, },
        PostFlow: { $: {name: "PostFlow"}, Request: {}, Response: {}, },
        Flows: "graphList",
        HTTPTargetConnection: {
            Properties: {},
            URL: "https://httpbin.org"
        },
    });
    g.addLink("TargetEndpoint", "Preflow");
    g.addLink("TargetEndpoint", "Postflow");
}

function displayGraph() {
    g.forEachNode(function(node){
        console.log(node);
    });
    //g.forEachLink(function(link) {
    //    console.log(link);
    //});
}

/* Note on promises
1. There a "producing code" that does something and takes time e.g. loading data over network
2. there is "consuming code" that wants the result of the producing code once it's ready.
3. A "promise" is a special javascript object that links the "producing code" and the "consuming code" together.
   Promise makes the result available to all of subscribed code when it's ready. */
// async here ensures that the function will return a promise and wraps non-promises in it
fs.opendir("./Agent/intents", async (err, dir) => {
    createProxySkeleton();
    createTargetSkeleton();
    console.log(dir.path);
    // await here make javascript wait until that promise settles and returns its result
    while ((item = await dir.read())) {
        //console.log(item);
        if (item.isFile()) {
            filename = item.name;
            parseIntent(filename);
        }
    }
    dir.close();
    //displayGraph();
    gp.generateProxy(g);
    gt.generateTarget(g);
});