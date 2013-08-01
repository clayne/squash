(function(){
	function decimalAdjust(type, value, exp) {
		if (typeof exp === 'undefined' || +exp === 0) {
			return Math[type](value);
		}
		value = +value;
		exp = +exp;
		if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
			return NaN;
		}
		value = value.toString().split('e');
		value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
		value = value.toString().split('e');
		return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
	}

	if (!Math.round10) {
		Math.round10 = function(value, exp) {
			return decimalAdjust('round', value, exp);
		};
	}
	if (!Math.floor10) {
		Math.floor10 = function(value, exp) {
			return decimalAdjust('floor', value, exp);
		};
	}
	if (!Math.ceil10) {
		Math.ceil10 = function(value, exp) {
			return decimalAdjust('ceil', value, exp);
		};
	}
  if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (fn, scope) {
      'use strict';
      var i, len;
      for (i = 0, len = this.length; i < len; ++i) {
        if (i in this) {
          fn.call(scope, this[i], i, this);
        }
      }
    };
  }
})();

google.load('visualization', '1', {packages:['table', 'corechart']});

var benchmark = new function () {
  var _this = this;

  _this.data = [];

  google.setOnLoadCallback(function () {
    Object.getOwnPropertyNames (benchmark_data).forEach (function (dataset, i, a) {
      var data = new google.visualization.DataTable ();

      data.addColumn('string', 'Plugin');
      data.addColumn('string', 'Codec');
      data.addColumn('number', 'Compression Ratio');
      data.addColumn('number', 'Compression Speed (KB/s)');
      data.addColumn('number', 'Decompress Speed (KB/s)');

      var uncompressed_size = benchmark_data[dataset]["uncompressed-size"];

      data.addRows (benchmark_data[dataset].data.map (function (e) {
        return [e.plugin, e.codec,
                Math.round10 (uncompressed_size / e.size, -2),
                Math.round10 ((uncompressed_size / e.compress_cpu) / (1024), -2),
                Math.round10 ((uncompressed_size / e.decompress_cpu) / (1024), -2)];
      }));

      _this.data[dataset] = data;

      $("#datasets-list").append ('<li><a href="#' + dataset + '" onclick="benchmark.load(\'' + dataset + '\')">' + dataset + '</a></li>');
    });
  });

  this.load = function (name) {
    var visualizations = [];
    var result = $('<div id="' + name + '"></div>');

    $("#results").empty ().append (result);
    result.append ("<h2>" + name + " Results</h2>");

    {
      var result_table = $("<div></div>");
      result.append (result_table);
      var table = new google.visualization.Table (result_table.get (0));
      table.draw (_this.data[name]);
      visualizations.push (table);
    }

    {
      var compression_ratio_view = new google.visualization.DataView (_this.data[name]);
      compression_ratio_view.setColumns ([1, 2]);

      var compression_ratio_container = $("<div></div>");
      result.append (compression_ratio_container);
      var compression_ratio = new google.visualization.BarChart (compression_ratio_container.get (0));
      compression_ratio.draw (compression_ratio_view, {
        legend: 'none',
        title: 'Compression Ratio',
        vAxis: { title: 'Codecs' },
        height: ($("#results").innerWidth () * (9 / 16))
      });
      visualizations.push (compression_ratio);
    }

    {
      var compression_ratio_vs_speed_view = new google.visualization.DataView (_this.data[name]);
      compression_ratio_vs_speed_view.setColumns ([
        2,
        3,
        4,
        { sourceColumn: 1, role: 'tooltip' }
      ]);
      var compression_ratio_vs_speed_container = $("<div></div>");
      result.append (compression_ratio_vs_speed_container);
      var compression_ratio_vs_speed = new google.visualization.ScatterChart (compression_ratio_vs_speed_container.get (0));
      compression_ratio_vs_speed.draw (compression_ratio_vs_speed_view, {
        title: 'Compression Ratio vs. Speed',
        hAxis: { title: 'Ratio', minValue: 0 },
        vAxis: { title: 'Speed (KB/s, logarithmic)', minValue: 0, logScale: true },
        height: ($("#results").innerWidth () * (9 / 16))
      });
      visualizations.push (compression_ratio_vs_speed);
    }

    {
      var speed_view = new google.visualization.DataView (_this.data[name]);
      speed_view.setColumns ([
        3,
        4,
        { sourceColumn: 1, role: 'tooltip' }
      ]);
      var speed_container = $("<div></div>");
      result.append (speed_container);
      var speed = new google.visualization.ScatterChart (speed_container.get (0));
      speed.draw (speed_view, {
        legend: 'none',
        title: 'Compression Speed vs. Decompression Speed',
        hAxis: { title: 'Compression Speed (KB/s)', minValue: 0 },
        vAxis: { title: 'Decompression Speed (KB/s)', minValue: 0 },
        height: ($("#results").innerWidth () * (9 / 16))
      });
      visualizations.push (speed);
    }

    visualizations.forEach (function (visualization) {
      google.visualization.events.addListener(visualization, 'select', function() {
        var selection = visualization.getSelection ();
        visualizations.forEach (function (v) {
          if (v !== visualization) {
            v.setSelection (selection);
          }
        });
      });
    });
  };
} ();
