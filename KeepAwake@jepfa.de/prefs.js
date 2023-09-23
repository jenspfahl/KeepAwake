import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


const NO_COLOR_BACKGROUND = 'no-color-background';
const ENABLE_NOTIFICATIONS = 'enable-notifications';
const BACKGROUND_COLOR = 'background-color';
const USE_BOLD_ICONS = 'use-bold-icons';

export default class KeepAwakePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        const appearanceGroup = new Adw.PreferencesGroup({
            title: _('Appearance'),
            description: _('Configure the appearance of KeepAwake!'),
        });
        page.add(appearanceGroup);
            

        // use colored icon for video mode

        const colorizedIconRow = new Adw.SwitchRow({
            title: _("Colorized enabled icon"),
            subtitle: _('Show background-colored icon if keep awake is enabled'),
        });
        appearanceGroup.add(colorizedIconRow);

        window._settings = this.getSettings();
        window._settings.bind(NO_COLOR_BACKGROUND, colorizedIconRow, 'active',
            Gio.SettingsBindFlags.INVERT_BOOLEAN);


            
        // color picker

        let colorBackgroundLabel = new Gtk.Label({ label: _('Use this background color'),
             margin_bottom: 10, margin_top: 10, margin_start: 10, margin_end: 32});

        const rgba = new Gdk.RGBA();
        rgba.parse(window._settings.get_string(BACKGROUND_COLOR));

        let colorPicker = new Gtk.ColorButton({
            rgba: rgba,
            show_editor: true,
            use_alpha: true,
            visible: true
        });

        let bgColorBox = new Gtk.Box();
        bgColorBox.set_orientation(Gtk.Orientation.HORIZONTAL); 
        bgColorBox.prepend(colorBackgroundLabel, true, false, 32);
        bgColorBox.append(colorPicker, true, false, 32);

        const bgColorRow = new Adw.PreferencesRow();
        bgColorRow.child = bgColorBox;
        appearanceGroup.add(bgColorRow);


        colorPicker.connect('color-set', () => {
            window._settings.set_string(BACKGROUND_COLOR, colorPicker.get_rgba().to_string());
        });


        // icon set

        const iconSetRow = new Adw.SwitchRow({
            title: _("Use alternative icons"),
            subtitle: _('Use bold icons which may be more appealing. A change requires a relaunch of Gnome to take in effect!'),
        });
        appearanceGroup.add(iconSetRow);

        window._settings = this.getSettings();
        window._settings.bind(USE_BOLD_ICONS, iconSetRow, 'active',
            Gio.SettingsBindFlags.DEFAULT);


       

        // Notifications    

        const notificationsGroup = new Adw.PreferencesGroup({
            title: _('Notifications'),
        });
        page.add(notificationsGroup);

        const showNotificationsRow = new Adw.SwitchRow({
            title: _("Show notifications on mode change"),
            subtitle: _("Show a short notification when the mode has changed by clicking on the icon."),
        });
        notificationsGroup.add(showNotificationsRow);

        window._settings.bind(ENABLE_NOTIFICATIONS, showNotificationsRow, 'active',
            Gio.SettingsBindFlags.DEFAULT);

        
    }
}

