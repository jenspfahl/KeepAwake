const GdkPixbuf = imports.gi.GdkPixbuf;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const Gettext = imports.gettext.domain('KeepAwake');
const _ = Gettext.gettext;

const NO_YELLOW_BACKGROUND = 'no-yellow-background';


function init() {
    Convenience.initTranslations("KeepAwake");
}

function ShowDesktopSettingsWidget() {
    this._init();
}

ShowDesktopSettingsWidget.prototype = {

    _init: function() {
        this._grid = new Gtk.Grid();
        this._grid.margin = 50;
        this._grid.row_spacing = this._grid.column_spacing = 20;
	      this._settings = Convenience.getSettings();

        let introLabel = _("Show yellow background icon if keep awake enabled");

        this._grid.attach(new Gtk.Label({ label: introLabel, wrap: true, sensitive: true,
                                   margin_bottom: 10, margin_top: 5 }),
                                    0, 1, 1, 1);

        let currentNoYellowBackground = this._settings.get_boolean(NO_YELLOW_BACKGROUND);
        let switcher = new Gtk.Switch();
        switcher.active = !currentNoYellowBackground;
        this._grid.attach(switcher, 1, 1, 1, 1);

        switcher.connect('state-set', Lang.bind(this, function(widget) {
              this._settings.set_boolean(NO_YELLOW_BACKGROUND, !this._settings.get_boolean(NO_YELLOW_BACKGROUND));
            }));
    },

    _completePrefsWidget: function() {
        let scollingWindow = new Gtk.ScrolledWindow({
                                 'hscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                 'vscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                 'hexpand': true, 'vexpand': true});
        scollingWindow.add_with_viewport(this._grid);
        scollingWindow.show_all();
        return scollingWindow;
    }
};

function buildPrefsWidget() {
    let widget = new ShowDesktopSettingsWidget();
    return widget._completePrefsWidget();
}
