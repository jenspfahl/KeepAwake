// Author: Jens Pfahl and contributors

import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';
import Cogl from 'gi://Cogl';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

const MODE_OFF = 0;
const MODE_ON = 1;
const MODE_ON_LOCK = 2;



/*

 used system GSettings
 ---------------------

 org.gnome.settings-daemon.plugins.power:

 idle-dim			bool	false
 sleep-inactive-ac-type		String	'nothing'
 sleep-inactive-battery-type	String	'nothing'


 org.gnome.desktop.session:

 idle-delay			int32	0


 org.gnome.desktop.screensaver

 idle-activation-enabled 	bool	false

*/

const POWER_SCHEMA			= 'org.gnome.settings-daemon.plugins.power';
const POWER_DIM_KEY			= 'idle-dim';
const POWER_AC_KEY			= 'sleep-inactive-ac-type';
const POWER_BAT_KEY			= 'sleep-inactive-battery-type';

const SESSION_SCHEMA			= 'org.gnome.desktop.session';
const SESSION_DELAY_KEY			= 'idle-delay';

const SCREENSAVER_SCHEMA		= 'org.gnome.desktop.screensaver';
const SCREENSAVER_ACTIVATION_KEY	= 'idle-activation-enabled'; 

const POWER_DIM_VIDEO_MODE = false;
const POWER_AC_VIDEO_MODE = 'nothing';
const POWER_BAT_VIDEO_MODE = 'nothing';

const SESSION_DELAY_VIDEO_MODE = 0;
const SCREENSAVER_ACTIVATION_VIDEO_MODE = false;

const RESTORE_STATE_KEY			= 'restore-state';

const NO_COLOR_BACKGROUND = 'no-color-background';
const ENABLE_NOTIFICATIONS = 'enable-notifications';
const BACKGROUND_COLOR = 'background-color';
const USE_BOLD_ICONS = 'use-bold-icons';
const KEEP_AWAKE_WHEN_LOCKED = 'keep-awake-when-locked';
const ALLOW_SCREEN_DIMM = 'allow-screen-dimm';



// settings
let _powerSettings, _sessionSettings, _screensaverSettings, _extensionSettings;

// IU components
let _trayButton, _bgTrayColor, _trayIconOn, _trayIconOff, _trayIconOnLock, _buttonPressEventId;
let _iconOn, _iconOff, _iconOnLock;
let _iconOnBold, _iconOffBold, _iconOnLockBold;


// 0 = video mode off --> system/monitor (possibly) suspends when idle
// 1 = video mode on --> system/monitor doesn't suspend when idle
// 2 = video mode on and locked between restarts of shell/system
let _mode;

// 0 = default
// 1 = bold
let _usedIconSet;

let _lastPowerDim, _lastPowerAc, _lastPowerBat, _lastSessionDelay, _lastScreensaverActivation;
let _powerDimEventId, _powerAcEventId, _powerBatEventId, _sessionDelayEventId, _screensaverActivationEventId;
let _useBoldIconsEventId, _noColorBackgroundEventId, _backgroundColorEventId, _allowScreenDimmEventId;




function getPowerDim() {
    return _powerSettings.get_boolean(POWER_DIM_KEY);
}

function setPowerDim(value) {
    _powerSettings.set_boolean(POWER_DIM_KEY, value);
}

function getPowerAc() {
    return _powerSettings.get_string(POWER_AC_KEY);
}

function setPowerAc(value) {
    _powerSettings.set_string(POWER_AC_KEY, value);
}

function getPowerBat() {
    return _powerSettings.get_string(POWER_BAT_KEY);
}

function setPowerBat(value) {
    _powerSettings.set_string(POWER_BAT_KEY, value);
}

function getStateRestore() {
    return _extensionSettings.get_boolean(RESTORE_STATE_KEY);
}

function setStateRestore(value) {
    _extensionSettings.set_boolean(RESTORE_STATE_KEY, value);
}

function getSessionDelay() {
    return _sessionSettings.get_uint(SESSION_DELAY_KEY);
}

function setSessionDelay(value) {
    _sessionSettings.set_uint(SESSION_DELAY_KEY, value);
}

function getScreensaverActivation() {
    return _screensaverSettings.get_boolean(SCREENSAVER_ACTIVATION_KEY);
}

function setScreensaverActivation(value) {
    _screensaverSettings.set_boolean(SCREENSAVER_ACTIVATION_KEY, value);
}

function getBackgroundColor(){
    return _extensionSettings.get_string(BACKGROUND_COLOR);
}

function getNoColorBackground() {
    return _extensionSettings.get_boolean(NO_COLOR_BACKGROUND);
}

function getEnableNotifications() {
    return _extensionSettings.get_boolean(ENABLE_NOTIFICATIONS);
}

function isUseBoldIcons() {
    return _extensionSettings.get_boolean(USE_BOLD_ICONS);
}

function isKeepAwakeWhenLocked() {
    return _extensionSettings.get_boolean(KEEP_AWAKE_WHEN_LOCKED);
}

function isAllowScreenDimm() {
    return _extensionSettings.get_boolean(ALLOW_SCREEN_DIMM);
}

function _updateScreenDimm() {
    if (isAllowScreenDimm()) {
        setSessionDelay(_lastSessionDelay);
        setScreensaverActivation(_lastScreensaverActivation);
    } 
    else {
        _lastSessionDelay = getSessionDelay();
        setSessionDelay(SESSION_DELAY_VIDEO_MODE);

        _lastScreensaverActivation = getScreensaverActivation();
        setScreensaverActivation(SCREENSAVER_ACTIVATION_VIDEO_MODE);
    }
}

function _handleScreenDimmChanged() {
    if (_mode == MODE_ON_LOCK || _mode == MODE_ON) {
        _updateScreenDimm();
    }
}

function enableVideoMode() {

    _lastPowerDim = getPowerDim();
    setPowerDim(POWER_DIM_VIDEO_MODE);

    _lastPowerAc = getPowerAc();
    setPowerAc(POWER_AC_VIDEO_MODE);

    _lastPowerBat = getPowerBat();
    setPowerBat(POWER_BAT_VIDEO_MODE);

    _updateScreenDimm();


}

function disableVideoMode() {

    setPowerDim(_lastPowerDim);
    setPowerAc(_lastPowerAc);
    setPowerBat(_lastPowerBat);
    setSessionDelay(_lastSessionDelay);
    setScreensaverActivation(_lastScreensaverActivation);

}



function isReadyForWatchingVideo() {
    if (isAllowScreenDimm()) {
        return getPowerDim() == POWER_DIM_VIDEO_MODE
            && getPowerAc() == POWER_AC_VIDEO_MODE
	        && getPowerBat() == POWER_BAT_VIDEO_MODE;
    }
    else {
        return getPowerDim() == POWER_DIM_VIDEO_MODE
            && getPowerAc() == POWER_AC_VIDEO_MODE
	        && getPowerBat() == POWER_BAT_VIDEO_MODE
	        && getSessionDelay() == SESSION_DELAY_VIDEO_MODE
	        && getScreensaverActivation() == SCREENSAVER_ACTIVATION_VIDEO_MODE;
    }
}


function toggleMode() {

    if (_mode == MODE_ON) {

        // on --> on with lock
	    _mode = MODE_ON_LOCK;
	    setStateRestore(true);
    }
    else if (_mode == MODE_ON_LOCK) {

        // on with lock --> off
        disableVideoMode();
        if (isReadyForWatchingVideo()) {
            // there are all options ready for watching videos at the beginning --> mode keeps "on"
            Main.notify(_("VIDEO_MODE_ALREADY_CONFIGURED"));
            _mode = MODE_ON; // but we switch off the persistance
            setStateRestore(false);
        }
        else {
            _mode = MODE_OFF;
            setStateRestore(false);
        }
    }
    else if (_mode == MODE_OFF) {

        // off --> on
        enableVideoMode();
        _mode = MODE_ON;

    }

}


function updateMode() {

    if (isReadyForWatchingVideo()) {
        _mode = getStateRestore() ? MODE_ON_LOCK : MODE_ON;
    }
    else {
        _mode = MODE_OFF;
    }


}


function showModeTween() {
    let _tweenText;

    if (_mode == MODE_ON) {
        _tweenText = new St.Label({ style_class: 'video-label-on', text: _("COMPUTER_KEEPS_AWAKE") });
    }
    else if (_mode == MODE_ON_LOCK) {
	     _tweenText = new St.Label({ style_class: 'video-label-on', text: _("COMPUTER_KEEPS_AWAKE_PERSISTENT") });
    }
    else if (_mode == MODE_OFF) {
        _tweenText = new St.Label({ style_class: 'video-label-off', text: _("COMPUTER_CAN_FALL_ASLEEP") });
    }

    Main.uiGroup.actor.add_child(_tweenText);

    let monitor = Main.layoutManager.primaryMonitor;

    _tweenText.set_position(monitor.x + Math.floor(monitor.width / 2 - _tweenText.width / 2),
                      monitor.y + Math.floor(monitor.height / 2 - _tweenText.height / 2));

    _tweenText.ease({
        opacity: 0,
        duration: 1000,
        delay: 500,
        transition: Clutter.AnimationMode.EASE_OUT_QUAD,
        onComplete: () => {
            if (_tweenText != null) {
              Main.uiGroup.actor.remove_child(_tweenText);
              _tweenText.destroy();
              _tweenText = null;
            }
        }
    });


}


function _reassignIcons() {
    if (isUseBoldIcons()) {
        _trayIconOn.gicon = _iconOnBold;
        _trayIconOff.gicon = _iconOffBold;
        _trayIconOnLock.gicon = _iconOnLockBold;
    }
    else {
        _trayIconOn.gicon = _iconOn;
        _trayIconOff.gicon = _iconOff;
        _trayIconOnLock.gicon = _iconOnLock;
    }
}



function updateIcon() {

    _reassignIcons();

    if (_mode == MODE_ON || _mode == MODE_ON_LOCK) {
      if (getNoColorBackground()) {
        _trayButton.set_background_color(_bgTrayColor);
      }
      else {
        _trayButton.set_background_color(color_from_string(getBackgroundColor())); 
      }
	 _trayButton.set_child( _mode == MODE_ON ? _trayIconOn: _trayIconOnLock);
    }
    else if (_mode == MODE_OFF) {
        _trayButton.set_background_color(_bgTrayColor);
	      _trayButton.set_child(_trayIconOff);
    }

}

function color_from_string(color) {
    let clutterColor, res;

    if (Cogl.Color.from_string) {
        [res, clutterColor] = Cogl.Color.from_string(color);
    }
    else {
        [res, clutterColor] = Clutter.Color.from_string(color);
    }
  
    return clutterColor;
}


function _handleIconClicked(actor, event) {

    // only trigger clicked event on cursor click (mouse/touchpad) or touch begin
    // to prevent multiple triggers on a single touch event (touch start + touch end)
    if (event.type() === Clutter.EventType.BUTTON_PRESS ||
        event.type() === Clutter.EventType.TOUCH_BEGIN) {

        toggleMode();
        updateIcon();
        if (getEnableNotifications()) {
            showModeTween();
        }
    }
}


function _reflectChanges() {

    // we save the reflective user settings or the extension settings,
    // because when this extension terminated without calling disable(), we can restore the original user settings

    if (getPowerDim() != POWER_DIM_VIDEO_MODE) { // the user changed the settings, we came probably not from enableVideoMode()
        _lastPowerDim = getPowerDim;
    }

    if (getPowerAc() != POWER_AC_VIDEO_MODE) { // the user changed the settings, we came probably not from enableVideoMode()
        _lastPowerAc = getPowerAc();
    }

    if (getPowerBat() != POWER_BAT_VIDEO_MODE) { // the user changed the settings, we came probably not from enableVideoMode()
        _lastPowerBat = getPowerBat();
    }

    if (getSessionDelay() != SESSION_DELAY_VIDEO_MODE) { // the user changed the settings, we came probably not from enableVideoMode()
        _lastSessionDelay = getSessionDelay();
    }

    if (getScreensaverActivation() != SCREENSAVER_ACTIVATION_VIDEO_MODE) { // the user changed the settings, we came probably not from enableVideoMode()
        _lastScreensaverActivation = getScreensaverActivation();
    }


    _extensionSettings.set_boolean(POWER_DIM_KEY, _lastPowerDim);
    _extensionSettings.set_string(POWER_AC_KEY, _lastPowerAc);
    _extensionSettings.set_string(POWER_BAT_KEY, _lastPowerBat);
    _extensionSettings.set_int(SESSION_DELAY_KEY, _lastSessionDelay);
    _extensionSettings.set_boolean(SCREENSAVER_ACTIVATION_KEY, _lastScreensaverActivation);


    // update UI
    updateMode();
    updateIcon();

}

export default class KeepAwakeExtension extends Extension {
    enable() {
        _trayButton = new St.Bin({ style_class: 'panel-button',
        reactive: true,
        can_focus: true,
        x_expand: true,
        y_expand: false,
        track_hover: true });
        _trayIconOn = new St.Icon({ style_class: 'system-status-icon' });
        _trayIconOff = new St.Icon({style_class: 'system-status-icon' });
        _trayIconOnLock = new St.Icon({ style_class: 'system-status-icon' });


        // init GSettings
        _powerSettings = new Gio.Settings({ schema_id: POWER_SCHEMA });
        _sessionSettings = new Gio.Settings({ schema_id: SESSION_SCHEMA });
        _screensaverSettings = new Gio.Settings({ schema_id: SCREENSAVER_SCHEMA });
        _extensionSettings = this.getSettings();

        _iconOnBold = Gio.icon_new_for_string(this.path + '/icons/eye-on-symbolic_bold.svg');
        _iconOffBold = Gio.icon_new_for_string(this.path + '/icons/eye-off-symbolic_bold.svg');
        _iconOnLockBold = Gio.icon_new_for_string(this.path + '/icons/eye-on-lock-symbolic_bold.svg');
    
        _iconOn = Gio.icon_new_for_string(this.path + '/icons/eye-on-symbolic.svg');
        _iconOff = Gio.icon_new_for_string(this.path + '/icons/eye-off-symbolic.svg');
        _iconOnLock = Gio.icon_new_for_string(this.path + '/icons/eye-on-lock-symbolic.svg');

        _bgTrayColor = _trayButton.get_background_color();


        // Before connect to _reflectChanges(), we restore the last saved settings to the user settings, if they are not disturbing.
        // The reason is, when the user shutdown the system or loggod off, disable() is obviously not called to call disableVideoMode().
        if (isReadyForWatchingVideo()) {

            // load last saved extension settings
            _lastPowerDim = _extensionSettings.get_boolean(POWER_DIM_KEY);
            _lastPowerAc = _extensionSettings.get_string(POWER_AC_KEY);
            _lastPowerBat = _extensionSettings.get_string(POWER_BAT_KEY);
            _lastSessionDelay = _extensionSettings.get_int(SESSION_DELAY_KEY);
            _lastScreensaverActivation = _extensionSettings.get_boolean(SCREENSAVER_ACTIVATION_KEY);

            setPowerDim(_lastPowerDim);
            setPowerAc(_lastPowerAc);
            setPowerBat(_lastPowerBat);
            setSessionDelay(_lastSessionDelay);
            setScreensaverActivation(_lastScreensaverActivation);
        }
        else {
            // load current user settings
            _lastPowerDim = getPowerDim();
            _lastPowerAc = getPowerAc();
            _lastPowerBat = getPowerBat();
            _lastSessionDelay = getSessionDelay();
            _lastScreensaverActivation = getScreensaverActivation();
        }



        // reflect settings changes
        _powerDimEventId = _powerSettings.connect('changed::' + POWER_DIM_KEY,  _reflectChanges);
        _powerAcEventId = _powerSettings.connect('changed::' + POWER_AC_KEY,  _reflectChanges);
        _powerBatEventId = _powerSettings.connect('changed::' + POWER_BAT_KEY,  _reflectChanges);
        _sessionDelayEventId =_sessionSettings.connect('changed::' + SESSION_DELAY_KEY,  _reflectChanges);
        _screensaverActivationEventId = _screensaverSettings.connect('changed::' + SCREENSAVER_ACTIVATION_KEY,  _reflectChanges);

        _useBoldIconsEventId = _extensionSettings.connect('changed::' + USE_BOLD_ICONS,  updateIcon);
        _noColorBackgroundEventId = _extensionSettings.connect('changed::' + NO_COLOR_BACKGROUND,  updateIcon);
        _backgroundColorEventId = _extensionSettings.connect('changed::' + BACKGROUND_COLOR,  updateIcon);
        _allowScreenDimmEventId = _extensionSettings.connect('changed::' + ALLOW_SCREEN_DIMM,  _handleScreenDimmChanged);


        // enable UI
        Main.panel._rightBox.insert_child_at_index(_trayButton, 0);

        _buttonPressEventId = _trayButton.connect('button-press-event', _handleIconClicked);
        _buttonPressEventId = _trayButton.connect('touch-event', _handleIconClicked);


        // restore previous state
        if (getStateRestore() === true) {
            enableVideoMode();
            _mode = MODE_ON_LOCK;
        }

        updateMode();
        updateIcon();
    }

    disable() {

        if (!isKeepAwakeWhenLocked()) {
            disableVideoMode();

            _extensionSettings.set_boolean(POWER_DIM_KEY, POWER_DIM_VIDEO_MODE);
            _extensionSettings.set_string(POWER_AC_KEY, POWER_AC_VIDEO_MODE);
            _extensionSettings.set_string(POWER_BAT_KEY, POWER_BAT_VIDEO_MODE);
            _extensionSettings.set_int(SESSION_DELAY_KEY, SESSION_DELAY_VIDEO_MODE);
            _extensionSettings.set_boolean(SCREENSAVER_ACTIVATION_KEY, SCREENSAVER_ACTIVATION_VIDEO_MODE);
        }
        

        _trayButton.disconnect(_buttonPressEventId);
        Main.panel._rightBox.remove_child(_trayButton);
    
    
        _powerSettings.disconnect(_powerDimEventId);
        _powerSettings.disconnect(_powerAcEventId);
        _powerSettings.disconnect(_powerBatEventId);
        _sessionSettings.disconnect(_sessionDelayEventId);
        _screensaverSettings.disconnect(_screensaverActivationEventId);
        _extensionSettings.disconnect(_useBoldIconsEventId);
        _extensionSettings.disconnect(_noColorBackgroundEventId);
        _extensionSettings.disconnect(_backgroundColorEventId);
        _extensionSettings.disconnect(_allowScreenDimmEventId);
     
        _screensaverSettings = null;
        _powerSettings = null;
        _sessionSettings = null;
        _extensionSettings = null;
    
        _trayButton.set_child(null);
        _trayButton.destroy();
        _trayButton = null;
        _trayIconOn.destroy();
        _trayIconOn = null;
        _trayIconOff.destroy();
        _trayIconOff = null;
        _trayIconOnLock.destroy();
        _trayIconOnLock = null;

    }
}


