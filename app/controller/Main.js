Ext.define('App.controller.Main', {
    extend: 'Ext.app.Controller',

    requires: [
        'App.util.Config',
        'App.view.layers.MapSettings',
        'App.view.Settings',
        'App.view.MoreMenu',
        'App.view.Search',
        'App.view.Login',
        'App.view.MyMaps',
        'Ext.field.Email'
    ],
    config: {
        refs: {
            mainView: '#mainView',
            moreMenu: '#moreMenu',
            mapSettingsView: '#mapSettingsView',
            settingsView: {
                selector: '#settingsView',
                xtype: 'settingsview'
            },
            searchView: {
                selector: '#searchView',
                xtype: 'searchview',
                autoCreate: true
            },
            loginView: {
                selector: '#loginView',
                xtype: 'loginview',
                autoCreate: true
            },
            queryResultsView: '#queryResultsView',
            queryDetailView: '#queryDetailView',
            searchField: 'searchfield[action=search]',
            loginButton: 'button[action=loginform]',
            logoutButton: 'button[action=logout]',
            myMapsButton: 'button[action=mymaps]',
            themeSelect: '#themeSelect'
        },
        control: {
            'button[action=more]': {
                tap: 'onMore'
            },
            'button[action=main]': {
                tap: function() {
                    this.redirectTo('main');
                }
            },
            'button[action=back]': {
                tap: function() {
                    window.history.back();
                }
            },
            'button[action=mapsettings]': {
                tap: function() {
                    this.redirectTo('mapsettings');
                }
            },
            'button[action=settings]': {
                tap: function() {
                    this.redirectTo('settings');
                }
            },
            'button[action=sendbymail]': {
                tap: "sendByMail"
            },
            loginButton: {
                tap: function() {
                    this.redirectTo('login');
                }
            },
            logoutButton: {
                tap: "logout"
            },
            'button[action=login]': {
                tap: 'doLogin'
            },
            myMapsButton: {
                tap: function() {
                    this.redirectTo('mymaps');
                }
            },
            searchField: {
                focus: function() {
                    this.redirectTo('search');
                }
            },
            mainView: {
                query: function(view, bounds, map) {
                    this.onMapQuery(view, bounds, map);
                }
            }
        },
        routes: {
            '': 'showMain',
            'main': 'showMain',
            'mapsettings': 'showMapSettings',
            'settings': 'showSettings',
            'search': 'showSearch',
            'login': 'showLogin'
        }
    },

    showMain: function() {
        var animation = {type:'reveal', direction: 'down'};
        if (Ext.Viewport.getActiveItem() == this.getSearchView()) {
            animation = {type: 'fade', out: true, duration: 500};
            this.getSearchView().down('searchfield').blur();
        } else if (Ext.Viewport.getActiveItem() == this.getQueryResultsView() ||
            Ext.Viewport.getActiveItem() == this.getQueryDetailView() ||
            Ext.Viewport.getActiveItem().id == 'myMapDetailView' ||
            Ext.Viewport.getActiveItem().id == 'myMapFeatureDetailView') {
            animation = {type: 'slide', direction: 'right'};
        } else if (Ext.Viewport.getActiveItem() == this.getLoginView()) {
            animation = {type: 'flip'};
        }
        // hide the search field to prevent intempestive focus
        var field = this.getSearchField();
        field && field.hide() && field.setDisabled(true);

        animation.listeners = {
            animationend: function() {
                this.getMainView().getMap().updateSize();
            },
            scope: this
        };
        Ext.Viewport.animateActiveItem(0, animation);

        // show the search field again
        if (field) {
            field.show({
                type: "fadeIn"
            });
            Ext.defer(field.enable, 1000, field);
        }
    },

    showMapSettings: function() {
        var mapSettingsView = this.getMapSettingsView();

        var animation = {type: 'slide', direction: 'right'};
        if (Ext.Viewport.getActiveItem() == this.getMainView()) {
            animation = {type: 'cover', direction: "up"};
        }
        Ext.Viewport.animateActiveItem(
            mapSettingsView,
            animation
        );
    },

    showSettings: function() {
        Ext.Viewport.animateActiveItem(
            this.getSettingsView(),
            {type: 'cover', direction: "up"}
        );
    },

    showSearch: function() {
        if (window.device && navigator.connection &&
            navigator.connection.type == Connection.NONE) {
            Ext.Msg.alert("", Ext.i18n.Bundle.message('search.nonetwork'));
            this.getMainView().down('#fakeSearch').blur();
        } else {
            Ext.Viewport.animateActiveItem(
                this.getSearchView(),
                {
                    type: 'fade',
                    duration: 500
                }
            );
            this.getSearchView().down('searchfield').focus();
        }
    },

    onMore: function(button) {
        this.getMoreMenu().showBy(button);
    },

    onMapQuery: function(view, bounds, map) {
        var layers = map.getLayersByName('Overlays')[0].params.LAYERS;
        var scale = map.getScale();
        // launch query only if there are layers to query
        if (layers.length) {
            var p = [bounds, layers, parseInt(scale, 0)];
            var joinedParams = p.join('-');
            joinedParams = encodeURIComponent(joinedParams);
            this.redirectTo('query/' + joinedParams);
        }
    },

    sendByMail: function() {
        Ext.Msg.prompt(
            Ext.i18n.Bundle.message('button.sendbymail'),
            'E-mail',
            function(buttonId, value) {
                if (buttonId != 'ok') {
                    return;
                }
                var map = this.getMainView().getMap();
                var layers = [];
                if (map.baseLayer.layername) {
                    layers = [map.baseLayer.layername];
                }
                layers = layers.concat(map.getLayersByName('Overlays')[0].params.LAYERS);
                var theme = this.getThemeSelect() ?
                    this.getThemeSelect().getValue() : 0;
                theme = App.util.Config.getThemes() ?
                    App.util.Config.getThemes()[theme] : 'main';
                Ext.data.JsonP.request({
                    url: App.util.Config.getWsgiUrl() + 'sendbymail',
                    params: {
                        layers: layers.join(','),
                        bbox: map.getExtent().toBBOX(),
                        width: map.getSize().w,
                        height: map.getSize().h,
                        x: map.getCenter().lon,
                        y: map.getCenter().lat,
                        zoom: map.getZoom(),
                        lang: Ext.i18n.Bundle.getLanguage(),
                        theme: theme,
                        mail: value
                    },
                    success: function(resp) {
                        if (resp.success === true) {
                            Ext.Msg.alert('', Ext.i18n.Bundle.message('sendbymail.done'));
                        } else if (resp.message == "Invalid e-mail address." ){
                            Ext.Msg.alert('', Ext.i18n.Bundle.message('sendbymail.invalidemail'));
                        } else {
                            Ext.Msg.alert('', Ext.i18n.Bundle.message('sendbymail.wrong'));
                        }
                    },
                    callbackKey: 'cb'
                });
                localStorage.setItem('sendbymail_email', value);
            },
            this,
            false,
            localStorage.getItem('sendbymail_email'),
            {
                xtype: 'emailfield'
            }
        );
    },

    showLogin: function() {
        Ext.Viewport.animateActiveItem(
            this.getLoginView(),
            {type: 'flip'}
        );
    },

    doLogin: function() {
        this.getLoginView().submit({
            success: function(form, result) {
                if (result && result.success) {
                    var prevUrl = this.getLoginView().getUrl();
                    var url = App.util.Config.getWsgiUrl() + 'login_handler';
                    this.getLoginView().setUrl(url);
                    this.getLoginView().submit({});
                    this.redirectTo('');
                    // the login_handler service is supposed to answer with 302
                    // redirect. Thus, we cannot rely on it to use success
                    // callback for the submit
                    Ext.defer(this.checkUser, 1000, this);
                    this.getLoginView().setUrl(prevUrl);
                }
            },
            failure: function() {
                Ext.Msg.alert('', Ext.i18n.Bundle.message('login.error'));
            },
            scope: this
        });
    },

    logout: function() {
        var url = App.util.Config.getWsgiUrl() + 'logout_handler';
        Ext.Ajax.request({url: url});
        // the login_handler service is supposed to answer with 302
        // redirect. Thus, we cannot rely on it to use success
        // callback for the submit
        Ext.defer(this.checkUser, 1000, this);
    },

    checkUser: function() {
        if (!window.device) {
            return;
        }
        var url = App.util.Config.getWsgiUrl() + 'user';
        Ext.Ajax.request({
            url: url,
            success: function(response) {
                App.user = Ext.decode(response.responseText);
                this.getLoginButton().hide();
                this.getLogoutButton().show();
                this.getMyMapsButton().show();
                Ext.getStore('MyMaps').load();
            },
            failure: function(response) {
                App.user = null;
                this.getLoginButton().show();
                this.getLogoutButton().hide();
                this.getMyMapsButton().hide();
            },
            scope: this
        });
    }
});
