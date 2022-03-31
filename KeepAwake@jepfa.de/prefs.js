const GdkPixbuf = imports.gi.GdkPixbuf;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Config = imports.misc.config;
const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

const Gettext = imports.gettext.domain('KeepAwake');
const _ = Gettext.gettext;

const NO_YELLOW_BACKGROUND = 'no-yellow-background';
const ENABLE_NOTIFICATIONS = 'enable-notifications';


function init() {
    Convenience.initTranslations("KeepAwake");
}

function ShowDesktopSettingsWidget() {
    this._init();
}

ShowDesktopSettingsWidget.prototype = {

    _init: function() {
        this._grid = new Gtk.Grid();
        this._grid.margin_start = 50;
        this._grid.margin_end = 50;
        this._grid.margin_top = 50;
        this._grid.margin_bottom = 50;
        this._grid.row_spacing = this._grid.column_spacing = 20;
	    this._settings = Convenience.getSettings();

        let yellowBackgroundLabel = _("Show yellow background icon if keep awake enabled");

        this._grid.attach(new Gtk.Label({ label: yellowBackgroundLabel, wrap: true, sensitive: true,
                                   margin_bottom: 10, margin_top: 5 }),
                                    0, 0, 1, 1);

        let currentNoYellowBackground = this._settings.get_boolean(NO_YELLOW_BACKGROUND);
        let noYellowBackgroundSwitcher = new Gtk.Switch();
        noYellowBackgroundSwitcher.active = !currentNoYellowBackground;
        this._grid.attach(noYellowBackgroundSwitcher, 1, 0, 1, 1);

        noYellowBackgroundSwitcher.connect('state-set', Lang.bind(this, function(widget) {
              this._settings.set_boolean(NO_YELLOW_BACKGROUND, !this._settings.get_boolean(NO_YELLOW_BACKGROUND));
            }));

        let enableNotificationsLabel = _("Show notifications on mode change");

        this._grid.attach(new Gtk.Label({ label: enableNotificationsLabel, wrap: true, sensitive: true,
                                   margin_bottom: 10, margin_top: 5 }),
                                    0, 1, 1, 1);

        let currentEnableNotifications = this._settings.get_boolean(ENABLE_NOTIFICATIONS);
        let enableNotificationsSwitcher = new Gtk.Switch();
        enableNotificationsSwitcher.active = currentEnableNotifications;
        this._grid.attach(enableNotificationsSwitcher, 1, 1, 1, 1);
        enableNotificationsSwitcher.connect('state-set', Lang.bind(this, function(widget) {
              this._settings.set_boolean(ENABLE_NOTIFICATIONS, !this._settings.get_boolean(ENABLE_NOTIFICATIONS));
            }));
    },

    _completePrefsWidget: function() {
        let scollingWindow = new Gtk.ScrolledWindow({
                                 'hscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                 'vscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                 'hexpand': true, 'vexpand': true});
        if (shellVersion >= 40){
            scollingWindow.set_child(this._grid);
            scollingWindow.show();
        }else {
            scollingWindow.add_with_viewport(this._grid);
            scollingWindow.show_all();
        }
        return scollingWindow;
    }
};

function buildPrefsWidget() {
    let widget = new ShowDesktopSettingsWidget();
    return widget._completePrefsWidget();
}
