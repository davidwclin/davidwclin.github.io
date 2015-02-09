---
layout: post
title:  "Mash pH Nomograph"
date:   2015-02-09 09:00:00
categories: homebrewing
---

<style>
    svg {
        shape-rendering: crispEdges;
        margin-left: -142px;
    }

    path,
    line {
        fill: none;
        stroke: black;
    }
    circle {
        stroke:black;
        fill:none;
    }
    text {
        font-family: Arial, Helvetica, sans-serif ;
    }
    .tick text {
        font-size:14px;
    }
    svg .connector {
        shape-rendering: auto;
        stroke: blue;
    }
    svg .target {
        opacity: 0.3;
    }
    svg .hidden {
        opacity: 0.05;
        cursor: pointer;
    }
</style>

[*How to Brew*](http://www.amazon.com/How-Brew-Everything-Right-First/dp/0937381888) by John Palmer is the most useful and comprehensive book I've come across for homebrewing. The book makes great use of a [nomograph](http://en.wikipedia.org/wiki/Nomogram) to simplify [mash pH targeting](http://www.howtobrew.com/section3/chapter15-3.html). This is important for a [complete conversion, good hop utilization, and other desirable characteristics](https://byo.com/hops/item/1493-the-power-of-ph).

A nomograph better communicates linear relationships than a spreadsheet ever could. The scale and magnitude of values and changes are more intuitively understood. I thought that I could make a pretty neat interactive nomograph using [D3](http://d3js.org/). Do read [Palmer's description](http://www.howtobrew.com/section3/chapter15-3.html) for how to use this.

<svg id="ra-nomograph" width="1024" height="530"/>

Happy to take any feedback/thoughs. Cheers!

<script src="/assets/d3.v3.min.js"></script>
<script src="/assets/rule.js"></script>
<script>
    var raDim =  {width:732, origin:[0, 0],     domain:[-360, 300]};
    var alkDim = {width:284, origin:[259, 109], domain:[0, 450]};
    var mgDim =  {width:190, origin:[73, 151],  domain:[0, 100]};
    var ehDim =  {width:508, origin:[73, 252],  domain:[0, 350]};
    var caDim =  {width:755, origin:[73, 338],  domain:[0, 400]};

    var ruleset = d3.select("svg#ra-nomograph").append("g")
        .attr("transform", "translate({0},{1})".format(100, 120))
        .attr("id", "ruleset");

    var alk = rule().dim(alkDim).domain2([0, 550])
        .isInput(true)
        .label({text:"Alkalinity as CaCO3 (ppm)", x:-210, y:-10})
        .label({isValue:true, x:-200, y:10})
        .label({text:"[HCO3] (ppm)", x:310, y:20});
    ruleset.call(alk);

    var mg = rule().dim(mgDim)
        .isInput(true).isTop(false)
        .label({text:"[Mg] (ppm)", x:-90, y:10})
        .label({isValue:true, x:-80, y:30});
    ruleset.call(mg);

    var ca = rule().dim(caDim)
        .isInput(true)
        .label({text:"[Ca] (ppm)", x:-110, y:-10})
        .label({isValue:true, x:-100, y:10})
    ;
    ruleset.call(ca);

    var eh = rule().dim(ehDim).attr("id", "eh")
        .outputFn(function(ca, mg) { return ca/1.4 + mg/1.7; }, ca, mg)
        .label({text:"Effective Hardness", x:540, y:-10})
        .label({isValue:true, x:550, y:10})
    ;
    ruleset.call(eh);

    var ra = rule().dim(raDim).attr("id", "ph").isTop(false).domain2([5.1, 6.2])
        .outputFn(function(alk, eh) { return alk - eh; }, alk, eh)
        .label({text:"Mash pH", x:0, y:-55})
        .label({text:"(@ room temp)", x:0, y:-35})
        .label({text:"Residual Alkalinity",       x:700, y:45})
        .label({text:"as CaCO3 (ppm)", x:700, y:65})
        .label({isValue:true, x:710, y:85})
    ;

    ruleset.call(ra);

    ruleset.call(connector().r1(mg).r2(ca));
    ruleset.call(connector().r1(ra).r2(eh));

    function gStop(offset, color) {
        return function(selection) {
            selection.append("svg:stop")
                .attr("offset", offset + "%")
                .attr("stop-color", color)
                .attr("stop-opacity", 1);
        };
    }

    var gradient = ruleset.append("svg:defs")
        .append("svg:linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%").attr("y1", "100%")
            .attr("x2", "100%").attr("y2", "100%")
            .attr("spreadMethod", "pad");
    gradient.call(gStop(0, "#fbec01"));
    gradient.call(gStop(30, "#bf5a01"));
    gradient.call(gStop(60, "#330701"));
    gradient.call(gStop(70, "#321701"));
    gradient.call(gStop(100, "#040201"));

    ruleset.append("rect")
        .attr("x", 342)
        .attr("y", -95)
        .attr("width", 266)
        .attr("height", 46)
        .style("fill", "url(#gradient)");


</script>
