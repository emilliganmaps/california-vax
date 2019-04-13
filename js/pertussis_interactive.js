function createSequenceControls(map, attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element (slider)
            $(container).append('<input class="range-slider" type="range">');

            //add skip buttons
            $(container).append('<button class="skip" id="reverse">Previous Year</button>');
            //name forward button
            $(container).append('<button class="skip" id="forward">Next Year</button>');
            
            L.DomEvent.disableClickPropagation(container);
            return container;
        }
    });
    
    map.addControl(new SequenceControl());
    
            //set slider attributes
            $('.range-slider').attr({
                max: 14,
                min: 0,
                value: 0,
                step: 1
            });
            
            //slider listener
            $('.range-slider').on('input', function(){
                var index = $(this).val();
            //update symbols as slider moves   
                updatePropSymbols(map, attributes[index]);
                updateLegend(map, attributes[index]);
            });
            
            //click function to define how slider works
            $('.skip').click(function(){
                //get the old index value
                var index = $('.range-slider').val();

                //forward one step or backward one step
                if ($(this).attr('id') == 'forward'){
                    index++;
                    //loops to first once end of slider is reached
                    index = index > 14 ? 0 : index;
                } else if ($(this).attr('id') == 'reverse'){
                    index--;
                    //loops to last once beginning of slider is reached
                    index = index < 0 ? 14 : index;
                };

                //update slider
                $('.range-slider').val(index);
                //update symbols
                updatePropSymbols(map, attributes[index]);
                updateLegend(map, attributes[index]);
        });     
};



//calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

//function to create popups instead of having popup definitions in multiple code blocks
function createPopup(properties, attribute, layer, radius){
    //defines the county
    var popupContent = "<p><b>County:</b> " + properties.county + "</p>";
    //defines the year
    var year = attribute.split("_")[0];
    //how the popup reads th number of pertussis cases
    popupContent += "<p><b>Number of reported pertussis cases in " + year + ":</b> " + properties[attribute];
    
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-radius)
    });
};

//function for updating proportional symbols
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            
            //consolidates popup references
            createPopup(props, attribute, layer, radius);
        };
	});
};

//create function to make the proportional symbols of a certain color, fill, opacity, etc
function pointToLayer(feature, latlng, attributes){
	
	var attribute = attributes[0];
    
	var geojsonMarkerOptions = {
		fillColor: "#920229",
        color: "#7E0828",
		weight: 1,
		opacity: 1,
		fillOpacity: 0.8
	};
	
	var attValue = Number(feature.properties[attribute]);
	geojsonMarkerOptions.radius = calcPropRadius(attValue);
    
    layer = L.circleMarker(latlng, geojsonMarkerOptions);
	
	createPopup(feature.properties, attribute, layer, geojsonMarkerOptions.radius);
	
	return layer;		
};
		
//process data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with real values
        if (attribute.indexOf("0") > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};

//create proportional symbols
function createPropSymbols(data, map, attributes){
	//adjusts the symbols for each data point to reflect its value using the calcPropRadius function results
	L.geoJson(data, {
		pointToLayer: function(feature,latlng){
			return pointToLayer(feature,latlng,attributes);
		}
	}).addTo(map);
};

//function to retrieve the data and place it on the map
function getData(map){
    //load the data from the pertussis json
    $.ajax("data/ca_pertussis.geojson", {
        dataType: "json",
        success: function(response){  
			//create an attributes array
            var attributes = processData(response);
                    createPropSymbols(response, map, attributes);
                    createSequenceControls(map, attributes);
                    createLegend(map, attributes);
		}
    });
};



//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 15;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
}; 

//function call to create the leaflet map
function createMap(){
    //zooms automatically to California
    var map = L.map('map', {
        center: [37.0783, -119.4179],
        zoom: 6
    });

//mapbox basemap
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZW1pbGxpZ2FuIiwiYSI6ImNqczg0NWlxZTBia2U0NG1renZyZDR5YnUifQ.UxV3OqOsN6KuZsclo96yvQ', {
    //map attribution
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    //uses mapbox streets as opposed to satellite imagery, etc.
    id: 'mapbox.dark',
    //my unique access token
    accessToken: 'pk.eyJ1IjoiZW1pbGxpZ2FuIiwiYSI6ImNqczg0NWlxZTBia2U0NG1renZyZDR5YnUifQ.UxV3OqOsN6KuZsclo96yvQ'
}).addTo(map);
    
        getData(map);
};

//make population a controllable layer
function controlLayers(map){
    var overlayMaps = {
        "Population": newLayer
    };
//toggle population points on and off
    L.control.layers(null, overlayMaps).addTo(map);
};

//create map when everything has been intialized
$(document).ready(createMap);