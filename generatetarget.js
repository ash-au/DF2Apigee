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

/* Steps
1. Create an xml object
2. Create xml file from object
3. Make changes to file if required
*/
function generateTarget(g) {
    // Target File
    let targetNode = g.getNode('TargetEndpoint');

    obj = {};
    obj.TargetEndpoint = targetNode.data;

    obj.TargetEndpoint.Flows = {};
    obj.TargetEndpoint.Flows.Flow = [];

    // Now start parsing the graph
    let count=0;

    g.forEachLinkedNode('TargetEndpoint', function(linkedNode, link) {
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
            obj.TargetEndpoint.Flows.Flow[count] = lflow;
            count = count+1;
        }
    }, true);

    var builder = new xml2js.Builder();
    var xml = builder.buildObject(obj);
    file = "./apiproxy/targets/default.xml";
    fs.outputFile(file, xml)
        .then(
            console.log("Written Target")
        )
        .catch(err => {
            console.log(err)
        })

    //displayGraph(g);
    //console.log(xml);
}

exports.generateTarget = generateTarget;
