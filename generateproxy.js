const nGraph = require('ngraph.graph');
const xml2js = require('xml2js');
const fs = require('fs-extra');

function displayGraph(g) {
    g.forEachNode(function(node){
        console.log(node);
    });
    //g.forEachLink(function(link) {
    //    console.log(link);
    //});
}

/* Proxy follows this structure
-> ProxyFolderName
    -> apiproxy
        --> ProxyName.xml
        --> policies    // For now we'll only consider VerifyAPIKey Policy
        --> resources   // This will empty for phase 1
        --> manifests
            --> manifest.xml
        --> proxies
            --> default.xml
        --> targets     // basically an xml file for each target but for now we'll only consider default
            --> default.xml

Steps
1. Create an xml object
2. Create xml file from object
3. Make changes to file if required
*/
function generateProxy(g) {
    // Manifest file
    let obj = { Manifest: { $: { name: "manifest" } } };

    let tep = { VersionInfo: { $: { resourceName: "default", version: "SHA-512" } } };
    
    obj.Manifest.ProxyEndPoints = tep;
    obj.Manifest.TargetEndPoints = tep;

    let builder = new xml2js.Builder();
    let xml = builder.buildObject(obj);

    let file = "./apiproxy/manifests/manifest.xml";
    fs.outputFile(file, xml)
        .then(
            console.log("Written manifest")
        )
        .catch(err => {
            console.log(err)
        })
    //console.log(xml);

    // proxy file
    let proxyNode = g.getNode('ProxyEndPoint');

    obj = {};
    obj.ProxyEndPoint = proxyNode.data;

    obj.ProxyEndPoint.Flows = {};
    obj.ProxyEndPoint.Flows.Flow = [];

    // Now start parsing the graph
    var count=0;

    g.forEachLinkedNode('ProxyEndPoint', function(linkedNode, link) {
        if (linkedNode.data && linkedNode.data.type === "flow") {
            let fName = linkedNode.id.replace(/ /g, "_");
            //console.log(fName);
            let lflow = {
                $: { name: fName },
                Description: {},
                Request: {},
                Response: {},
                Condition: {}
            };
            //console.log(lflow);
            obj.ProxyEndPoint.Flows.Flow[count] = lflow;
            count = count+1;
        }
    }, true);

    xml = builder.buildObject(obj);
    //displayGraph(g);
    file = "./apiproxy/proxies/default.xml";
    fs.outputFile(file, xml)
        .then(
            console.log("Written Proxy")
        )
        .catch(err => {
            console.log(err)
        })
    //console.log(xml);
}

exports.generateProxy = generateProxy;
//var g = nGraph();
//generateProxy(g);