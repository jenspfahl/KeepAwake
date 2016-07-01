# Gnome shell extension *Keep Awake* #

Keep your computer be awake! Forbid your computer to activate sceensaver, turn off your screen or suspend when it is idle for a while. Toogle this option on or off by one click.

This extension can be helpful when you give a presentation or are watching a video or are reading a document for a while or any else where your computer should be keep awake.

## Usage ##

When you has configured some screensaver or "sleep" powersaving settings, the icon looks like this. 
![](pic1.png)

Toggle it to deactivate all screensaver and powersaving settings.

![](pic2.png)

Now you can watch videos absolutely undisturbed!

## Interna ##
 
This extension toggle following Gnome Settings:
 
 
From `org.gnome.settings-daemon.plugins.power`:
 
* `idle-dim`: Time during dimm the screen when idle
* `sleep-inactive-ac-type`: Suspend when idle and power cable is plugged
* `sleep-inactive-battery-type`: Suspend when idle and power cable is unplugged (battery mode)
 
 
From `org.gnome.desktop.session`:
 
* `idle-delay`: Time during turn off the screen when idle
 
From `org.gnome.desktop.screensaver`:
 
* `idle-activation-enabled`: Activate screensaver when idle

If you wish to toggle some more settings, please contact me or create a pull request.