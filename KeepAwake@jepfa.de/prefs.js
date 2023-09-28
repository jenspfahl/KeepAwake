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
        });
        window.add(page);

        const appearanceGroup = new Adw.PreferencesGroup({
            title: _('GROUP_APPEARANCE'),
        });
        page.add(appearanceGroup);
            

        // use colored icon for video mode

        const colorizedIconRow = new Adw.SwitchRow({
            title: _('TITLE_COLORIZED_ICON_BG'),
            subtitle: _('DESC_COLORIZE_ICON_BG_IF_KEEP_AWAKE'),
        });
        appearanceGroup.add(colorizedIconRow);

        window._settings = this.getSettings();
        window._settings.bind(NO_COLOR_BACKGROUND, colorizedIconRow, 'active',
            Gio.SettingsBindFlags.INVERT_BOOLEAN);


            
        // color picker

        let colorBackgroundLabel = new Gtk.Label({ label: _('TITLE_COLORIZE_ICON_BGWITH_THIS_COLOR'),
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
            title: _('DESC_USE_ALTERNATIVE_ICON_SET'),
            subtitle: _('TITLE_USE_BOLD_ICONS_REQUIRES_RELAUNCH'),
        });
        appearanceGroup.add(iconSetRow);

        window._settings.bind(USE_BOLD_ICONS, iconSetRow, 'active',
            Gio.SettingsBindFlags.DEFAULT);


       

        // Notifications    

        const notificationsGroup = new Adw.PreferencesGroup({
            title: _('GROUP_NOTIFICATIONS'),
        });
        page.add(notificationsGroup);

        const showNotificationsRow = new Adw.SwitchRow({
            title: _('TITLE_SHOW_NOTIFICATIONS'),
            subtitle: _('DESC_SHOW_NOTIFICATION_WHEN_CLICKED'),
        });
        notificationsGroup.add(showNotificationsRow);

        window._settings.bind(ENABLE_NOTIFICATIONS, showNotificationsRow, 'active',
            Gio.SettingsBindFlags.DEFAULT);

        
    }
}

