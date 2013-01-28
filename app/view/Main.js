window.i18n = Ext.i18n.Bundle;
Ext.define('App.view.Main', {
    extend: 'Ext.Container',
    xtype: 'mainview',
    requires: [
        'App.plugin.StatefulMap'
    ],
    id: "mainView",
    config: {
        map: null,
        plugins: 'statefulmap',
        center: null,
        zoom: null,
        vectorLayer: null,
        layout: 'vbox',
        items: [ ]
    },

    initialize: function() {
        this.callParent(arguments);
        this.on('painted', this.render, this, {
            single: true
        });
    },

    applyItems: function(items, collection) {
        items = [
            {
                xtype: 'component',
                flex: 1,
                id: "map-container"
            }, {
                xtype: "button",
                iconCls: 'search',
                iconMask: true,
                action: "search",
                top: 10,
                left: 10
            }, {
                xtype: "button",
                iconCls: "layers",
                iconMask: true,
                action: "mapsettings",
                top: 10,
                right: 10
            }, {
                xtype: "button",
                iconCls: "more",
                iconMask: true,
                action: "more",
                bottom: 10,
                right: 10
            }
        ];
        return this.callParent([items, collection]);
    },

    setCenterZoomFromQueryParams: function() {
        var queryParams = OpenLayers.Util.getParameters();
        if (queryParams.x && queryParams.y && queryParams.zoom) {
            this.setCenter(
                new OpenLayers.LonLat(queryParams.x, queryParams.y));
            this.setZoom(queryParams.zoom);
        }
    },

    updateMap: function(map) {
        this.fireEvent('setmap', this, map);
    },

    // initial rendering
    render: function(component) {
        var map = this.getMap();
        var mapContainer = this.down('#map-container').element;
        map.render(mapContainer.dom);

        // required so that the map gets effectively displayed
        // height = 0 if not set
        map.viewPortDiv.style.position = "absolute";

        this.setCenterZoomFromQueryParams();

        var center = this.getCenter(),
            zoom = this.getZoom();
        if (center && zoom) {
            map.setCenter(center, zoom);
        } else {
            map.zoomToMaxExtent();
        }

        mapContainer.on('longpress', function(event, node) {
            var map = this.getMap();
            var el = Ext.get(map.div);
            var pixel = new OpenLayers.Pixel(
                event.pageX - el.getX(),
                event.pageY - el.getY()
            );
            var bounds = this.pixelToBounds(pixel);
            this.fireEvent('longpress', this, bounds, map, event);
        }, this);

        // highlight layer
        this.setVectorLayer(new OpenLayers.Layer.Vector('Vector', {
            styleMap: new OpenLayers.StyleMap(OpenLayers.Util.applyDefaults({
                strokeWidth: 3,
                strokeColor: 'red'
            }, OpenLayers.Feature.Vector.style['default']))
        }));
        map.addLayer(this.getVectorLayer());

        map.addControls([
            new GeolocateControl()
        ]);
        if (!Ext.os.is.iOS) {
            map.addControls([new OpenLayers.Control.Zoom()]);
        }
        this.fireEvent('mapready', map);
    }
});
