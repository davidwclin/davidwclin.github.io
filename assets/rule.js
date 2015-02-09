String.prototype.format = function() {
       var content = this;
       for (var i=0; i < arguments.length; i++)
       {
            var replacement = '{' + i + '}';
            content = content.replace(replacement, arguments[i]);
       }
       return content;
};

var NUMBER_FORMAT = d3.format(",.0f");
var NUMBER_ADD_FORMAT = d3.format("+,.0f");

function rule() {
    var width = 500, height = 100,
        domain = [5.1, 6.2],
        domain2 = null, //secondary scale, visual only
        isTop = true, //for primary scale
        scale, isInput = false,
        outputFn = null,
        origin = [0, 0],
        onChanges = {},
        attribs = {}, //for outer container
        vals = [{current: 0, target: 0}],
        labels = [], // {text:_, x:_, y:_}
        draw
    ;

    function axes(domain, range, orient, ticks) {
        var scale = d3.scale.linear().domain(domain).range(range);
        return d3.svg.axis().scale(scale).orient(orient).ticks(ticks);
    };

    function my(selection) {
        var self = arguments.callee;
        selection.each(function(d, i) {
            var container = selection.append("g")
                .attr("transform", "translate({0},{1})".format(origin[0], origin[1]));
            for(var k in attribs) {
               container.attr(k, attribs[k]);
            }
            scale = d3.scale.linear().domain(domain).range([0,width]);

            container.append("g").call(d3.svg.axis().scale(scale).orient(isTop ? "top" : "bottom").ticks(10));
            if(domain2) {
                container.append("g").call(axes(domain2, [0, width], isTop ? "bottom" : "top", 10));
            }

            for(var i in labels) {
                var label = labels[i];
                text = container.append("text")
                    .attr("transform", "translate({0},{1})".format(label.x, label.y));
                if(label.isValue) {
                    text.attr("class", "value");
                } else {
                    text.text(label.text)
                }

            }
            Object.keys(vals[0]).forEach(function(k) {
                vals[0][k] = (domain[0] + domain[1]) / 2;
            });
            draw = function() {
                Object.keys(vals[0]).forEach(function(k) {
                    container.selectAll("." + k)
                        .data(vals)
                        .attr("cx", function(d) { return scale(d[k]); })
                      .enter().append("circle")
                        .attr("class", k)
                        .attr("cx", function(d) { return scale(d[k]); })
                        .attr("cy", 0)
                        .attr("r", 5);
                    container.select(".value")
                        .text(function(d) {
                            var v1 = self.val();
                            var v2 = self.val("target")
                            if(v1-v2 == 0) {
                                return NUMBER_FORMAT(v1);
                            }
                            return "{0}{1}={2}".format(
                                NUMBER_FORMAT(v1), NUMBER_ADD_FORMAT(v2-v1), NUMBER_FORMAT(v2));
                        });
                    for(var i in onChanges[k]) {
                        onChanges[k][i]();
                    }
                });
            }

            if(isInput) {
                draw();
                var setTarget = function(t) {
                    var x = scale.invert(d3.mouse(t)[0]);
                    self.val("target", x);
                };
                var isJustSet = false, timeout;
                container.append("rect") //for mouse events
                    .attr("class", "hidden")
                    .attr("width", width)
                    .attr("height", 50)
                    .attr("transform", "translate(0,-25)")
                    .on("mousemove", function() {
                        if(isJustSet) return;
                        setTarget(this);
                    })
                    .on("mousedown", function() {
                        var x = scale.invert(d3.mouse(this)[0]);
                        self.val("current", x);
                        isJustSet = true; clearTimeout(timeout);
                        setTarget(this);
                        timeout = setTimeout(function() {
                            isJustSet = false;
                        }, 700);
                    });
            }
            if(outputFn) {
                var f = outputFn[0];
                var rules = Array.prototype.slice.call(outputFn, 1);
                rules.forEach(function(rule) {
                    Object.keys(vals[0]).forEach(function(k) {
                        var doCalc = function() {
                            var ruleVals = rules.map(function(x) { return x.val(k); });
                            self.val(k, f.apply(null, ruleVals));
                        };
                        doCalc();
                        rule.onChange(k, doCalc);
                    });
                });

            }
        });
    };
    my.width = function(v) {
        if (!arguments.length) return width;
        width = v;
        return my;
    }
    my.height = function(v) {
        if (!arguments.length) return height;
        height = v;
        return my;
    }
    my.domain = function(v) {
        if (!arguments.length) return domain;
        domain = v;
        return my;
    }
    my.domain2 = function(v) {
        if (!arguments.length) return domain2;
        domain2 = v;
        return my;
    }
    my.isTop = function(v) {
        if (!arguments.length) return isTop;
        isTop = v;
        return my;
    }
    my.isInput = function(v) {
        if (!arguments.length) return isInput;
        isInput = v;
        return my;
    }
    my.origin = function(v) {
        if (!arguments.length) return origin;
        origin = v;
        return my;
    }
    my.attr = function(n, v) {
        if (!v) return attribs[n];
        attribs[n] = v;
        return my;
    }
    my.val = function(k, v) {
        if(!v && !k) return vals[0].current;
        if(!v) return vals[0][k];
        vals[0][k] = v;
        draw(k);
        return my;
    }
    my.label = function(v) { // {text:_, isValue:_, x:_, y:_} provide text OR isValue
        if (!arguments.length) return labels;
        labels.push(v);
        return my;
    }

    /** SETTER BELOW **/
    my.outputFn = function(f, rules) { // (fn [f & rules] ...)
        outputFn = arguments;
        return my;
    }
    my.dim = function(d) {
        if(d.width) my.width(d.width);
        if(d.origin) my.origin(d.origin);
        if(d.domain) my.domain(d.domain);
        return my;
    }
    my.onChange = function(k, v) {
        if (!v) {
            v = k; k = "current";
        }
        if(!onChanges[k]) {
            onChanges[k] = [];
        }
        onChanges[k].push(v);
        return my;
    }

    /** GETTERS BELOW **/
    my.valCoord = function(k) {
        var x = + scale(my.val(k)) + origin[0];
        return {x:x, y:origin[1]};
    }

    return my;
}

var lineFn = d3.svg.line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });

function drawLine(k) {
    return function(selection) {
        selection.attr("d", function(d) {
            return lineFn(d.map(function(x) { return x.valCoord(k); }))
        });
    };
}

var i = 0;
function connector() {
    var r1, r2;
    function my(selection) {
        ["current", "target"].forEach(function(k) {
            var id = "line-{0}-{1}".format(k, i++);
            selection.insert("g", ":first-child")
                .datum([r1, r2]).append("path")
                .attr("id", id)
                .attr("class", "connector " + k)
                .call(drawLine(k));

            [r1, r2].forEach(function(r) {
                r.onChange("current", function() {
                    selection.select("#" + id).call(drawLine(k));
                });
            });
        });
    }
    my.r1 = function(v) {
        if (!arguments.length) return r1;
        r1 = v;
        return my;
    }
    my.r2 = function(v) {
        if (!arguments.length) return r2;
        r2 = v;
        return my;
    }
    return my;
}
