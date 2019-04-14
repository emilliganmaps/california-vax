//function call to create the leaflet map
function createMap(){
    //zooms automatically to California
    var map = L.map('map', {
        center: [36.7783, -115.4179],
        zoom: 6
    });
    
    var pertussis = new L.geoJson().addTo(map);
    var measles = new L.geoJson().addTo(map);
    
    getpertussisData(map, pertussis, measles);
    getmeaslesData(map, pertussis, measles);

    //mapbox basemap
    var dark = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZW1pbGxpZ2FuIiwiYSI6ImNqczg0NWlxZTBia2U0NG1renZyZDR5YnUifQ.UxV3OqOsN6KuZsclo96yvQ', {
        //map attribution
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        //uses mapbox streets as opposed to satellite imagery, etc.
        id: 'mapbox.dark',
        //my unique access token
        accessToken: 'pk.eyJ1IjoiZW1pbGxpZ2FuIiwiYSI6ImNqczg0NWlxZTBia2U0NG1renZyZDR5YnUifQ.UxV3OqOsN6KuZsclo96yvQ'
    }).addTo(map);
    
    var light = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZW1pbGxpZ2FuIiwiYSI6ImNqczg0NWlxZTBia2U0NG1renZyZDR5YnUifQ.UxV3OqOsN6KuZsclo96yvQ', {
        //map attribution
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        //uses mapbox streets as opposed to satellite imagery, etc.
        id: 'mapbox.light',
        //my unique access token
        accessToken: 'pk.eyJ1IjoiZW1pbGxpZ2FuIiwiYSI6ImNqczg0NWlxZTBia2U0NG1renZyZDR5YnUifQ.UxV3OqOsN6KuZsclo96yvQ'
    }).addTo(map);

    L.control.layers(baseMaps, overlayMaps, {collapsed: false}).addTo(map);
    return map;
};

//make diseases controllable layers
function controlLayers(map){
    var baseMaps = {
        "Dark": dark,
        "Light": light,
    };
    var overlayMaps = {
        "Pertussis": pertussis,
        "Measles": measles
    };
//toggle disease layers on and off
    L.control.layers(baseMaps, overlayMaps, {collapsed: false}).addTo(map);
    return map;
};


//function to create popups instead of having popup definitions in multiple code blocks
function createPopup(properties, attribute, layer, radius){
    var popupContent = " ";
    
    if (properties.pertussis) {
        popupContent += "<p><b>Number of reported pertussis cases in " + year + ":</b> " + properties[attribute];
    } else
    if (properties.measles) {
        popupContent += "<p><b>Number of reported measles cases in " + year + ":</b> " + properties[attribute];
    }
    
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-radius)
    });
};

//function for updating proportional symbols for pertussis
function updatePropSymbolsPertussis(pertussisSize, map, attribute){
    pertussisSize.eachLayer(function(layer){
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

//function for updating proportional symbols for measles
function updatePropSymbolsMeasles(measlesSize, map, attribute){
    measlesSize.eachLayer(function(layer){
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
    
    if (feature.properties.Pertussis){
        var geojsonMarkerOptions = {
            fillColor: "#82008f",
            color: "#82008f",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        };
    } else if (feature.properties.Measles){
        var geojsonMarkerOptions = {
            fillColor: "#ff5341",
            color: "#ff5341",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        };
    }

	var attValue = Number(feature.properties[attribute]);
	
    geojsonMarkerOptions.radius = calcPropRadius(attValue);
    
    var layer = L.circleMarker(latlng, geojsonMarkerOptions);
	
	createPopup(feature.properties, attribute, layer, geojsonMarkerOptions.radius);
	
    //layer.on({
        //mouseover: function(){
            //this.openPopup();
            //this.setStyle({color: "white", weight: 3});
        //},
        //mouseout: function(){
            //this.closePopup();
            //this.setStyle({color: "gray", weight: 1});
        //}
    //});
    
	return layer;		
};

//calculate proportional symbol radius
function calcPropRadius(attValue){
    var scaleFactor = 15;
    var area = attValue * scaleFactor;
    var radius = (Math.sqrt(area/Math.PI))*(2);
    return radius;
};

//create proportional symbols for pertussis
function createPropSymbolsPertussis(data, pertussis, attributes){
	//adjusts the symbols for each data point to reflect its value using the calcPropRadius function results
	pertussisSize = L.geoJson(data, {
		pointToLayer: function(feature,latlng){
			return pointToLayer(feature,latlng,attributes);
		}
	}).addTo(pertussis);
};
//create proportional symbols for measles
function createPropSymbolsMeasles(data, measles, attributes){
	//adjusts the symbols for each data point to reflect its value using the calcPropRadius function results
	measlesSize = L.geoJson(data, {
		pointToLayer: function(feature,latlng){
			return pointToLayer(feature,latlng,attributes);
		}
	}).addTo(measles);
};
	
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
                updatePropSymbolsPertussis(pertussisSize, map, attributes[index]);
                updatePropSymbolsMeasles(measlesSize, map, attributes[index]);
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
                updatePropSymbolsPertussis(pertussisSize, map, attributes[index]);
                updatePropSymbolsMeasles(measlesSize, map, attributes[index]);
                updateLegend(map, attributes[index]);
        });     
};


//calculate the max, mean, and min values for a given attribute
function getCircleValuesPertussis(map, attribute){
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
//calculate the max, mean, and min values for a given attribute
function getCircleValuesMeasles(map, attribute){
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

//function to retrieve the data and place it on the map
function getpertussisData(map, pertussis, measles){
    //load the data from the pertussis json
    $.ajax("data/ca_pertussis.geojson", {
        dataType: "json",
        success: function(response){  
			//create an attributes array
            var attributes = processData(response);
                    createPropSymbolsPertussis(response, pertussis, attributes);
		}
    });
};
//function to retrieve the data and place it on the map
function getmeaslesData(map, pertussis, measles){
    //load the data from the measles json
    $.ajax("data/ca_measles.geojson", {
        dataType: "json",
        success: function(response){  
			//create an attributes array
            var attributes = processData(response);
                    createPropSymbolsMeasles(response, measles, attributes);
                    createSequenceControls(map, pertussis, measles, attributes);
                    createLegend(map, pertussis, measles, attributes);
		}
    });
};


//create map when everything has been intialized
$(document).ready(createMap);