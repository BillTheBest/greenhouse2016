angular.module('app.directives', [])

    .directive('tempChart', function () {

        return {  
            restrict: 'E',
            scope: {
                temps: '='
            },
        link: function (scope, element, attrs) {
            
            var alarmDataLoaded = false;
            
            
            var tempValueTexts  = [12,12];
//            ****************** watchers *****************************
            
            scope.$watch('temps', function(newValue, oldValue) {
            }, true);
            
            scope.$watch('temps.currentTemperature', function(newValue, oldValue) {
                updateTemp();
            }, true);
            
            scope.$watch('temps.brightness', function(newValue, oldValue) {
                updateDataset();
//                setTimeout(function(){updateBrightness();}, 1000);    
            }, true);
            
            scope.$watch('temps.alarm', function(newValue, oldValue) {
                if (scope.temps.alarm) {
                    alarmDataLoaded = true;
                    addAdjustmentCircles();
                }       
                if (alarmDataLoaded) {
                    alarmText();
                }         
            }, true);
            
            scope.$watch('temps.hightemp', function(newValue, oldValue) {
                tempValueTexts[1]  = newValue;
                updateTemp();
            }, true);
            
            scope.$watch('temps.lowtemp', function(newValue, oldValue) {
                updateTemp();
                tempValueTexts[0]  = newValue;

            }, true);
            var maxTemp  = 40;
            
            // temperature tendency
            scope.$watch('temps.previousTemp', function(newValue, oldValue) {  
                if (scope.temps.previousTemp[0] > scope.temps.previousTemp[1]){
                    d3.select("#triangle").remove();
                    drawTriangle(sinkingTriangle, "#00CCFF")
                } 
                else if (scope.temps.previousTemp[0] < scope.temps.previousTemp[1]){
                    d3.select("#triangle").remove();
                    drawTriangle(risingTriangle, "#FF6666")
                } else {
                    d3.select("#triangle").remove();
                }
            }, true);
            
            
            var alarm = true;
            
            var width = 500,
            height = 500,
            radius = Math.min(width, height) / 2 - 20;
            var cRadius = 20;
            var cornerRadius = 12;
            var angle = "";
    
            var svg = d3.select(element[0])
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")

            // brightness circle
            var color = d3.scale.ordinal()
                .range(["#E3E3CC", "#f4f4f4", "#F0F0B6", "#f4f4f4", "#FFE97D", "#f4f4f4", "#fff"]);

            // inner circle
            var color2 = d3.scale.ordinal()
                .range(["#f4f4f4", "#f4f4f4", "#f4f4f4", "#f4f4f4", "#fff"]);

            var dotColor = d3.scale.ordinal()
                .range(["#00CCFF", "#FF6666"]);
           
            
            var alarmlimits = function () {
                return [convertToAngle(scope.temps.lowtemp), convertToAngle(scope.temps.hightemp)];
            }
                  
            // colors for different light levels 
            var updateDataset = function () {
                var first = "";
                var firstsecond ="";
                var second = "";
                var secondsecond="";
                var third="";
                var thirdsecond="";
                      
                if (scope.temps.brightness > 33) {
                    first = 33;
                    firstsecond  = 0;
                } else if (scope.temps.brightness < 33){
                    first = scope.temps.brightness;
                    firstsecond = (33-first);
                    second = 0;
                    secondsecond = 34;
                    third = 0;
                    thirdsecond = 33;
                } if (scope.temps.brightness > 67) {
                    second = 34;
                    secondsecond = 0;
                    third = (scope.temps.brightness - 67);
                    thirdsecond = (33 - third);
                } else if (scope.temps.brightness < 67 && scope.temps.brightness > 33){
                    second = (scope.temps.brightness - first);
                    secondsecond = (34 - second);
                    third = 0;
                    thirdsecond = 33;
                }
                
                var set = [first, firstsecond, second, secondsecond, third, thirdsecond];
                                
                dataset = {
                    brightness: [first, firstsecond, second, secondsecond, third, thirdsecond, 11],
                    fullcircle: [20, 25, 25, 20, 10]
                    }
            };
            
            updateDataset();

            var convertToAngle = function (temperature) {
                return temperature * 360/maxTemp;     
            }

            alarmlimits[0] = convertToAngle(alarmlimits[0]);
            alarmlimits[1] = convertToAngle(alarmlimits[1]);


//            ************* Draggin part **************************

            var currentDraggedAdjustmentCircle = "";
            
            var drag = d3.behavior.drag()
            //    .origin(function(d) { return d; })
                .on("drag", dragmove)
                .on("dragend", dragDataUpdate);
            
            function dragmove(d) {
                
                currentDraggedAdjustmentCircle = d3.select(this)[0];
                angle = calcAngle(d3.event.x, d3.event.y)
                
                if (angle < 20 && angle >= 0 || angle <= 360 && angle > 340) {
                 return;   
                }
                
                angleToDegree = Math.round(angle/360*maxTemp );
                angleToPlace = angleToDegree * 360 / maxTemp;
                

                var x = cosX(angleToPlace - 90, 60);
                var y = sinY(angleToPlace - 90, 60);
                
                var xD = cosX(angleToPlace - 90, 80);
                var yD = sinY(angleToPlace - 90, 80);
                
                d3.select(this)
                    .attr("cx", d.cx = x)
                    .attr("cy", d.cy = y);
                
                if (currentDraggedAdjustmentCircle[0].id == "adjustmentCircle_0") {
                d3.select("#adjustmentValue_0")
                    .attr("dx", d.cx = xD)
                    .attr("dy", d.cy = yD + 4)
                    .text(angleToDegree);
            }      
                
                if (currentDraggedAdjustmentCircle[0].id == "adjustmentCircle_1") {
                d3.select("#adjustmentValue_1")
                    .attr("dx", d.cx = xD)
                    .attr("dy", d.cy = yD + 4)
                    .text(angleToDegree);
                }
            }
            
            function dragDataUpdate (d) {
                scope.$apply(function(){
                    if (currentDraggedAdjustmentCircle[0].id == "adjustmentCircle_0") {
                        scope.temps.lowtemp = Math.round(angle/360*maxTemp);
                        alarmlimits[0] = convertToAngle(scope.temps.lowtemp);
                    } else {
                        scope.temps.hightemp = Math.round(angle/360*maxTemp);
                        alarmlimits[1] = convertToAngle(scope.temps.hightemp);                      
                    }
                });
                updateTemp();
                addAdjustmentCircles();
            }

            var pie = d3.layout.pie()
                .padAngle(.00)
                .sort(null);

            var arc = d3.svg.arc()
                .startAngle(function(d) { return d.startAngle + Math.PI/10; })
                .endAngle(function(d) { return d.endAngle + Math.PI/10; })
                .innerRadius(radius - 20)
                .outerRadius(radius)
                .cornerRadius(2);

            var arc2 = d3.svg.arc()
                .startAngle(function(d) { return d.startAngle + Math.PI/10; })
                .endAngle(function(d) { return d.endAngle + Math.PI/10; })
                .innerRadius(radius - 58)
                .outerRadius(radius - 53)
                .cornerRadius(2);

            var svg1 = svg.append('g')
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
            var svg2 = svg.append('g')
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


            var sinkingTriangle = [{x:0, y:0}, {x:16, y:0}, {x:08, y:10}];
            var risingTriangle = [{x:0, y:10}, {x:16, y:10}, {x:08, y:0}];
            
            var line = d3.svg.line()
                .x(function(d) { return d.x; })
                .y(function(d) { return d.y; });
            
           
        
            
// ************** TRIANGLE indicating tendency of the temperature change ******************************

            var drawTriangle = function(cordinates, color){
                                    console.log(d3.select("#triangle"));
                d3.select("#triangle").remove();
                
                 svg3 = svg.append('g')
                .attr("id", "triangle")    
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
                
                var triangle = svg3.selectAll("g")

                .data(cordinates);
                    triangle.enter()
                    .append("path")
                    .attr("d", line(cordinates))
                    .style("stroke-width", 2)
    //            .style("stroke", "steelblue")
                                      .attr("transform", "translate(105,-50)")

                .style("fill", color);
            }
            
// **************** dots for adjusting low and high temp **********************
            
            var addAdjustmentCircles = function(){
                
                if (alarmDataLoaded) {
               
                var circleG = svg1.selectAll("g")
                    .data(alarmlimits)

                 var gEnter = circleG.enter()
                    .append('g')
                    .attr("transform", function(d){return "translate("+0 +"," + 0+ ")"})

                var circle = gEnter.append("circle")
                    .attr("id", function(d,i) {return "adjustmentCircle_" + i})
                    .attr("r", function(d) {return 22;})
                    .attr("cx", function(d) { return (radius - 60) * Math.cos((d-90)*Math.PI/180) })
                    .attr("cy", function(d) { return (radius - 60) * Math.sin((d-90)*Math.PI/180) })
                    .style("stroke", "white")    // set the line colour
                    .style("stroke-width", 31)    // set the stroke width
                    .attr("fill", function(d, i) { return dotColor(i); })
                    .call(drag);
                    
                    

                    gEnter.append("text")
                    .style("fill", "#999")
                    .attr("id", function(d,i) {return "adjustmentValue_" + i})
                    .attr("dx", function(d) { return (radius - 80) * Math.cos((d-90)*Math.PI/180) })
                    .attr("dy", function(d) { return (radius - 80) * Math.sin((d-90)*Math.PI/180)  + 4 })
                    .attr("text-anchor", "middle")
                    .text(function (d) {
                        return d / (360/maxTemp); })
                    ;
                }
            };

            
// ****************Temperature value *******************************
            
            function updateTemp() {       
                d3.select("#CurrentTemp").remove();
                
                var text = svg1.append("text")
                    .attr("id", "CurrentTemp");
                var textLabels = text
                    .attr("x", 0)
                    .attr("y", 20)
                    .text(function (d) {
                        return scope.temps.currentTemperature + "ºC"; })
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "100px")
                    .style("text-anchor","middle") //place the text halfway on the arc

                
                .attr("fill", function(){
                    if (scope.temps.currentTemperature < scope.temps.lowtemp && scope.temps.alarm) {
                        return "#00CCFF";
                    } else if (scope.temps.currentTemperature > scope.temps.hightemp && scope.temps.alarm) {
                        console.log(scope.temps.currentTemperature +":"+ scope.temps.hightemp)
                        return "#FF6666";
                    } else {
                        return "grey";
                    }
                });
                
               
            }  
            updateTemp();
            
            var Temp_label = svg1.append("text")            
            var TemptextLabel = Temp_label
                .attr("x", 0)
                .attr("y", 60)
                .text("Temperature")
                .attr("font-family", "sans-serif")
                .attr("font-size", "30px")
                .style("text-anchor","middle") //place the text halfway on the arc
                .attr("fill", "grey");
            
            
            
//      *************** Brightness ********************      
            
            var updateBrightness = function(){            
                // brightness circle
                var path = svg1.selectAll("path")
                    .data(pie(dataset.brightness))
                    .attr("d", arc)

                    .enter().append("path")
                    .attr("id", function(d,i) {return "brightnesspath_" + i})
                    .attr("fill", function(d, i) { return color(i); })
                    .attr("d", arc);

                d3.select("#testi").remove();
                
                // brightness text
                svg1.append("text")
                    .attr("dy", "17")
                    .attr("id", "testi")
                    .style("font-size", "18px")
                    .style("fill", "#e6b800")
                  .append("textPath") //append a textPath to the text element
                    .attr("xlink:href", "#brightnesspath_6") //place the ID of the path here
                    .style("text-anchor","middle") //place the text halfway on the arc
                    .attr("startOffset", "23%")		
                    .text("Brightness: " + scope.temps.brightness + "%");
                
                var transition = svg1.transition().duration(1000);

                transition.selectAll(".textpath")
                    .attrTween("xlink:href", function() {
                        return function() { return "#brightnesspath_2"; }; });
            };     
            updateBrightness();


            // adjustment circle
            var path2 = svg2.selectAll("path")
                .data(pie(dataset.fullcircle))
                .enter().append("path")
                .attr("id", function(d,i) {return "adjustmentPath_" + i})
                .attr("fill", function(d, i) { return color2(i); })
                .attr("d", arc2);
            
           
//            ************* ALARM TEXTS **********************
            
            var alarmText = function () { 
            
                // alarm is set on
                if (scope.temps.alarm) {  
                    d3.select("#AlarmOffText").remove();
                    
                // alarm text  
                    addAdjustmentCircles();

//                    updateAlarmTemperatureTexts();


                svg2.append("text")
                    .attr("dy", "20")
                    .attr("id", "AlarmOnText")
                    .style("fill", "#999")
                    .style("font-size", "24px")
                    .style("cursor", "default")

                    .append("textPath") //append a textPath to the text element
                    .attr("xlink:href", "#adjustmentPath_4") //place the ID of the path here
                    .style("text-anchor","middle") //place the text halfway on the arc
                    .attr("startOffset", "24%")	
                    .on("click", function(d, i) { 
                        scope.$apply(function(){
                            scope.temps.alarm = false;
                        });

                        d3.select("#adjustmentCircle_0").style("visibility", "hidden");
                        d3.select("#adjustmentCircle_1").style("visibility", "hidden");
                        d3.select("#adjustmentValue_0").style("visibility", "hidden");
                        d3.select("#adjustmentValue_1").style("visibility", "hidden");            
                        alarmText();
                        updateTemp();
                        ;})
                    .text("Alarm On");
                
                // alarm is off
                } else {
                    d3.select("#alarmTemperatureLow").remove();
                    d3.select("#alarmTemperatureHigh").remove();
                    d3.select("#AlarmOnText").remove();
                    svg2.append("text")
                        .attr("dy", "20")
                        .attr("id", "AlarmOffText")
                        .style("fill", "#c4c4c4")
                        .style("font-size", "24px")
                        .style("cursor", "default")


                        .append("textPath") //append a textPath to the text element
                        .attr("xlink:href", "#adjustmentPath_4") //place the ID of the path here
                        .style("text-anchor","middle") //place the text halfway on the arc
                        .attr("startOffset", "24%")	
                        .on("click", function(d, i) {
                            scope.$apply(function(){    
                                scope.temps.alarm = true;
                            });
                        
                            d3.select("#adjustmentCircle_0").style("visibility", "visible");
                            d3.select("#adjustmentCircle_1").style("visibility", "visible");
                            d3.select("#adjustmentValue_0").style("visibility", "visible");
                            d3.select("#adjustmentValue_1").style("visibility", "visible");

                            alarmText();
                            updateTemp();
                        })
                        .text("Alarm Off");
                }
            }
            alarmText();
            
            // Functions for moving adjustment dots
            function calcAngle (x, y){
                var theta = -Math.atan2(x,y);
                theta *= 180 / Math.PI;
                return Math.round(theta + 180);
            }
            var cosX = function (angle, offset) {
                var x = (radius - offset) * Math.cos(angle*Math.PI/180);
                return x;
            }
            var sinY = function (angle, offset) {
                 var y = (radius - offset) * Math.sin(angle*Math.PI/180);
                 return y;
             }
         }
    };
})
     
     





// Mostly copy-paste from the temperature directive
  .directive('waterChart', function () {
    
        return {  
            restrict: 'E',
            scope: {
                water: '='

            },
        link: function (scope, element, attrs) {
            
            var dataset = {
                    moisture: [0, 90, 10],
                    fullcircle: [18, 18, 18, 18, 18, 10]
            };
            
            var alarmDataLoaded = false;
            
            scope.$watch('water.alarm', function(newValue, oldValue) {
                if (scope.water.alarm) {
                    alarmDataLoaded = true;
                }
                if (alarmDataLoaded) {
                    alarmText();
                }  
            }, true);

            scope.$watch('water.moisture[0]', function(newValue, oldValue) {    
                updateDataset();
                setTimeout(function(){
                    updateChart();}, 100);    
                updateMoisture();
            }, true);
            
            scope.$watch('water.previousMoisture', function(newValue, oldValue) {    
                updateDataset();   
            }, true);
            
            scope.$watch('water.lowlimit', function(newValue, oldValue) {
                if (newValue > 0) {
                    updateLowLimit(newValue);   
                    addAdjustmentCircles();
                }
            }, true);
            
            var maxTemp  = 100;
    
            var width = 500,
            height = 500,
            radius = Math.min(width, height) / 2 - 20;
            var cRadius = 20;
            var cornerRadius = 12;
            var angle = "";
    
            var svg = d3.select(element[0])
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")

            // brightness circle
            var color = d3.scale.ordinal()
                .range(["#66ccff", "#cedaff", "#f4f4f4", "#fff"]);

            // inner circle
            var color2 = d3.scale.ordinal()
                .range(["#f9f9f9", "#f4f4f4", "#f9f9f9", "#f4f4f4", "#f9f9f9", "#ffffff"]);

            var dotColor = d3.scale.ordinal()
            .range(["#999", "#FF6666"]);
             
            var low = null;
            
            var updateLowLimit = function (value) {
                low = [360 * value / 100];
            } ;
            
            var high = [100];
            
            var updateDataset = function () {
                var previousMoisture = 0;
                if (scope.water.moisture[1] > scope.water.moisture[0]) {
                    previousMoisture = scope.water.moisture[1] - scope.water.moisture[0];
                }
                
                dataset = {
                    moisture: [scope.water.moisture[0] * 0.9, previousMoisture,  90 - previousMoisture - scope.water.moisture[0] * 0.9, 10],
                    previousMoisture: [scope.water.previousMoisture * .9, 90 - scope.water.previousMoisture * 0.9, 10],
                    fullcircle: [18, 18, 18, 18, 18, 10]
                }
            };
            
           updateDataset();
            
            var convertToAngle = function (temperature) {
                return temperature * 360/maxTemp;     
            }
            
            
//            ************* Draggin part **************************

            var currentDraggedAdjustmentCircle = "";
            
            var drag = d3.behavior.drag()
            //    .origin(function(d) { return d; })
                .on("drag", dragmove)
                .on("dragend", dragDataUpdate);
            
            function dragmove(d) {
                
                currentDraggedAdjustmentCircle = d3.select(this)[0];

                console.log(currentDraggedAdjustmentCircle[0].id);
                angle = calcAngle(d3.event.x, d3.event.y)
                
                if (angle < 20 && angle >= 0 || angle <= 360 && angle > 340) {
                 return;   
                }
                
                angleToDegree = Math.round(angle/360*100 );
                angleToPlace = angleToDegree * 360 / 100;
                

                var x = cosX(angleToPlace - 90, 60);
                var y = sinY(angleToPlace - 90, 60);
                
                var xD = cosX(angleToPlace - 90, 80);
                var yD = sinY(angleToPlace - 90, 80);
                
                d3.select(this)
                    .attr("cx", d.cx = x)
                    .attr("cy", d.cy = y);
                
                if (currentDraggedAdjustmentCircle[0].id == "moist_adjustmentCircle_0") {
                d3.select("#moist_adjustmentValue_0")
                    .attr("dx", xD)
                    .attr("dy", yD + 4)
                    .text(angleToDegree + "%");
            }      
                
                if (currentDraggedAdjustmentCircle[0].id == "moist_adjustmentCircle_1") {
                d3.select("#moist_adjustmentValue_1")
                    .attr("dx", d.cx = xD)
                    .attr("dy", d.cy = yD + 4)
                    .text(angleToDegree );
                }
                low[0] = convertToAngle(Math.round(angle/360*maxTemp));
                scope.water.lowlimit = angleToDegree;
            }
            
            function dragDataUpdate (d) {
                scope.$apply(function(){
                    if (currentDraggedAdjustmentCircle[0].id == "moist_adjustmentCircle_0") {
                        scope.water.lowlimit = Math.round(angle/360*maxTemp);
                    } 
                });
                addAdjustmentCircles();
            }

            
//            **************** Pie svg and g *************************
            var pie = d3.layout.pie()
                .sort(null);

            var arc = d3.svg.arc()
                .startAngle(function(d) { return d.startAngle + Math.PI/10; })
                .endAngle(function(d) { return d.endAngle + Math.PI/10; })
                .innerRadius(radius - 20)
                .outerRadius(radius)
                .cornerRadius(2);

            var arc2 = d3.svg.arc()
                .startAngle(function(d) { return d.startAngle + Math.PI/10; })
                .endAngle(function(d) { return d.endAngle + Math.PI/10; })
                .innerRadius(radius - 58)
                .outerRadius(radius - 53)
                .cornerRadius(2);

            var arc3 = d3.svg.arc()
                .startAngle(function(d) { return d.startAngle + Math.PI/10; })
                .endAngle(function(d) { return d.endAngle + Math.PI/10; })
                .innerRadius(radius - 58)
                .outerRadius(radius - 53)
                .cornerRadius(2);

            var svg1 = svg.append('g')
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
            
            var svg2 = svg.append('g')
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

            
//            ************ dots for adjustin low and high temp ****************
            
            var addAdjustmentCircles = function(){
                
                if (alarmDataLoaded && low) {
                            console.log(scope.water.lowlimit);
                                    console.log("adjustmentCircle" + alarmDataLoaded);
                                console.log(low);
                var circleG = svg1.selectAll("g")
                    .data(low)

                 var gEnter = circleG.enter()
                    .append('g')
                    .attr("transform", function(d){return "translate("+0 +"," + 0+ ")"})

                var circle = gEnter.append("circle")
                    .attr("id", function(d,i) {return "moist_adjustmentCircle_" + i})
                    .attr("r", function(d) {return 22;})
                    .attr("cx", function(d) { return (radius - 60) * Math.cos((d-90)*Math.PI/180) })
                    .attr("cy", function(d) { return (radius - 60) * Math.sin((d-90)*Math.PI/180) })
                    .style("stroke", "white")    // set the line colour
                    .style("stroke-width", 31)    // set the stroke width
                    .attr("fill", function(d, i) { return dotColor(i); })
                    .call(drag);         

                    gEnter.append("text")
                    .style("fill", "#999")
                    .attr("id", function(d,i) {return "moist_adjustmentValue_" + i})
                    .attr("dx", function(d) { return (radius - 80) * Math.cos((d-90)*Math.PI/180) })
                    .attr("dy", function(d) { return (radius - 80) * Math.sin((d-90)*Math.PI/180)  + 4 })
                    .attr("text-anchor", "middle")
                    .text(function (d) {
                        console.log(d);
                        return d / (360/maxTemp) + "%"; });
                }
            };
            
//  ****************** MOISTURE VALUE ***************************
            function updateMoisture() {   
                d3.select("#CurrentMoisture").remove();
                
                var text = svg1.append("text")
                    .attr("id", "CurrentMoisture");
                var textLabels = text
                                 .attr("x", 0)
                                 .attr("y", 20)
                                 .text( function (d) { return scope.water.moisture[0] + "%"; })
                                 .attr("font-family", "sans-serif")
                                .attr("font-size", "100px")
                                .style("text-anchor","middle") //place the text halfway on the arc

                .attr("fill", "grey");
            }
            
            updateMoisture();
            
            var label = svg1.append("text")
            
            var textLabels = label
                                 .attr("x", 0)
                                 .attr("y", 70)
                                 .text("Soil Moisture")
                                 .attr("font-family", "sans-serif")
                                .attr("font-size", "30px")
                                .style("text-anchor","middle") //place the text halfway on the arc

                .attr("fill", "grey");
            
            
// ----------  outer moisture chart pie! ----------------------------------
            var updateChart = function(){
                
                d3.select("#chartValue").remove();
                
                // previousbrightness circle
                var path = svg1.selectAll("path")
                    .data(pie(dataset.moisture))
                    .attr("d", arc)
                    .enter().append("path")
                    .attr("id", function(d,i) {return "moistPath_" + i})
                    .attr("fill", function(d, i) { return color(i); })
                    .attr("d", arc);
         
                // moisture value text
                svg1.append("text")
                    .attr("dy", "17")
                    .attr("id", "chartValue")
                    .style("font-size", "18px")
                    .style("fill", "#66ccff")
                  .append("textPath") //append a textPath to the text element
                    .attr("xlink:href", "#moistPath_3") //place the ID of the path here
                        .style("text-anchor","middle") //place the text halfway on the arc
                        .attr("startOffset", "24%")		
                    .text("Moisture: " + scope.water.moisture[0] + "%");
                
                var transition = svg.transition()
                    .duration(1000);



                transition.selectAll(".textpath")
                    .attrTween("xlink:href", function() { return function() { return "#moistPath_3"; }; });
            };
            
            updateChart();


//   -------------------  adjustment circle ------------------------
            var path2 = svg2.selectAll("path")
                .data(pie(dataset.fullcircle))
                .enter().append("path")
                .attr("id", function(d,i) {return "moist_adjustmentPath_" + i})
                .attr("fill", function(d, i) { return color2(i); })
                .attr("d", arc2);
       
            
//            **************** Alarm Text ************************
            var alarmText = function () {
                            
                if (scope.water.alarm == true) {

//                 alarm text  
                addAdjustmentCircles();
                d3.select("#moist_AlarmOffText").remove();

                svg2.append("text")
                    .attr("dy", "20")
                    .attr("id", "moist_AlarmOnText")
                    .style("fill", "#999")
                    .style("cursor", "default")
                    .style("font-size", "24px")

                    .append("textPath") //append a textPath to the text element
                    .attr("xlink:href", "#moist_adjustmentPath_5") //place the ID of the path here
                    .style("text-anchor","middle") //place the text halfway on the arc
                    .attr("startOffset", "24%")	
                    .on("click", function(d, i) { 
                        scope.$apply(function(){
                            scope.water.alarm = false;
                        });
                        d3.select("#moist_adjustmentCircle_0").style("visibility", "hidden");
                        d3.select("#moist_adjustmentCircle_1").style("visibility", "hidden");
                     d3.select("#moist_adjustmentValue_0").style("visibility", "hidden");
                        d3.select("#moist_adjustmentValue_1").style("visibility", "hidden");
                        alarmText();})
                    .text("Alarm On");
            } else {
                d3.select("#moist_AlarmOnText").remove();
                svg2.append("text")
                    .attr("dy", "20")
                    .attr("id", "moist_AlarmOffText")
                    .style("fill", "#c4c4c4")
                    .style("cursor", "default")
                    .style("font-size", "24px")

                    .append("textPath") //append a textPath to the text element
                    .attr("xlink:href", "#moist_adjustmentPath_5") //place the ID of the path here
                    .style("text-anchor","middle") //place the text halfway on the arc
                    .attr("startOffset", "24%")	
                    .on("click", function(d, i) {
                        scope.$apply(function(){
                            scope.water.alarm = true;
                        });
                        d3.select("#moist_adjustmentCircle_0").style("visibility", "visible");
                        d3.select("#moist_adjustmentCircle_1").style("visibility", "visible");
                        d3.select("#moist_adjustmentValue_0").style("visibility", "visible");
                        d3.select("#moist_adjustmentValue_1").style("visibility", "visible");
                        alarmText(); })
                    .text("Alarm Off");
                }
            }
            
            alarmText();
            
            // Functions for moving adjustment dots
            function calcAngle (x, y){
                var theta = -Math.atan2(x,y);
                theta *= 180 / Math.PI;
                return Math.round(theta + 180);
            }
            
            var cosX = function (angle, offset) {
                var x = (radius - offset) * Math.cos(angle*Math.PI/180);
                return x;
            }
            var sinY = function (angle, offset) {
                 var y = (radius - offset) * Math.sin(angle*Math.PI/180);
                 return y;
             }
         }
    };
});
     

