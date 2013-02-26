//<debug>
Ext.Loader.setPath({
    'Ext': 'touch/src',
    'App': 'app',
    'Ext.i18n': 'lib/Ext.i18n.Bundle-touch/i18n'
});
//</debug>

Ext.define('Ext.overrides.event.recognizer.LongPress', {
    override: 'Ext.event.recognizer.LongPress',
    config: {
        minDuration: 250
    }
});

Ext.application({
    name: 'App',

    requires: [
        'Ext.MessageBox',
        'Ext.i18n.Bundle',
        'App.util.Config'
    ],

    views: ['Main', 'layers.MapSettings'],
    controllers: ["Download",'Main', 'Layers', 'Settings', 'Search', 'Query'],
    stores: ['BaseLayers', 'Overlays', 'SelectedOverlays', 'Search', 'Query', 'SavedMaps', 'MyMaps'],

    viewport: {
        autoMaximize: true
    },

    icon: {
        '57': 'resources/icons/Icon.png',
        '72': 'resources/icons/Icon~ipad.png',
        '114': 'resources/icons/Icon@2x.png',
        '144': 'resources/icons/Icon~ipad@2x.png'
    },

    isIconPrecomposed: true,

    startupImage: {
        '320x460': 'resources/startup/320x460.jpg',
        '640x920': 'resources/startup/640x920.png',
        '768x1004': 'resources/startup/768x1004.png',
        '748x1024': 'resources/startup/748x1024.png',
        '1536x2008': 'resources/startup/1536x2008.png',
        '1496x2048': 'resources/startup/1496x2048.png'
    },

    launch: function() {
        this.prepareI18n();

        // create the main view and set the map into it
        var mainView = Ext.create('App.view.Main');

        Ext.create('App.view.layers.MapSettings');

        this.configurePicker();
        this.configureMessageBox();

        Ext.getStore('Overlays').setSorters(App.util.Config.getLanguage());

        this.handleTablet();
    },

    onUpdated: function() {
        window.location.reload();
    },

    handleTablet: function() {
        if (Ext.os.is.Tablet) {
            var msg = OpenLayers.String.format(
                OpenLayers.i18n('mobile.redirect_msg'),
                {
                    url: 'http://maps.geoportail.lu'
                }
            );
            msg += "<a href='#' class='close' style='float:right'>" +
                   OpenLayers.i18n('mobile.close') + "</a>";
            var actionSheet = Ext.create('Ext.ActionSheet', {
                ui: 'redirect',
                modal: false,
                html: msg
            });

            Ext.Viewport.add(actionSheet);
            actionSheet.show();
            Ext.Function.defer(function() {
                actionSheet.hide();
            }, 15000);
            actionSheet.element.on({
                'tap': function(e) {
                    if (Ext.get(e.target).hasCls('close')) {
                        actionSheet.hide();
                    }
                }
            });
        }
    },

    prepareI18n: function() {
        Ext.i18n.Bundle.configure({
            bundle: 'App',
            path: 'resources/i18n',
            language: App.util.Config.getLanguage(),
            noCache: true
        });
        OpenLayers.Lang.setCode(App.util.Config.getLanguage());
    },

    configureMessageBox: function() {
        // Override MessageBox default messages
        Ext.define('App.MessageBox', {
            override: 'Ext.MessageBox',

            statics: {
                YES   : {text: Ext.i18n.Bundle.message('messagebox.yes'),    itemId: 'yes', ui: 'action'},
                NO    : {text: Ext.i18n.Bundle.message('messagebox.no'),     itemId: 'no'},
                CANCEL: {text: Ext.i18n.Bundle.message('messagebox.cancel'), itemId: 'cancel'},

                OKCANCEL: [
                    {text: Ext.i18n.Bundle.message('messagebox.ok'), itemId: 'ok', ui: 'action'},
                    {text: Ext.i18n.Bundle.message('messagebox.cancel'), itemId: 'cancel'}
                ],
                YESNOCANCEL: [
                    {text: Ext.i18n.Bundle.message('messagebox.yes'),    itemId: 'yes', ui: 'action'},
                    {text: Ext.i18n.Bundle.message('messagebox.no'),     itemId: 'no'},
                    {text: Ext.i18n.Bundle.message('messagebox.cancel'), itemId: 'cancel'}
                ],
                YESNO: [
                    {text: Ext.i18n.Bundle.message('messagebox.yes'), itemId: 'yes', ui: 'action'},
                    {text: Ext.i18n.Bundle.message('messagebox.no'),  itemId: 'no'}
                ]
            }
        });
    },

    configurePicker: function() {
        Ext.define('App.Picker', {
            override : 'Ext.picker.Picker',
            config: {
                doneButton:{
                    text : Ext.i18n.Bundle.message('button.done')
                },
                cancelButton:{
                    text : Ext.i18n.Bundle.message('button.cancel')
                }
            }
        });
    }
});
