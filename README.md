# Gnome shell extension *Keep Awake* #

Keep your computer be awake! Forbid your computer to activate sceensaver, turn off your screen or suspend when it is idle for a while. Toogle this option on or off by one click.

This extension can be helpful when you give a presentation or are watching a video or are reading a document for a while or any else where your computer should be keep awake.

## Installation ##

1. Drop the `KeepAwake@jepfa.de` folder and its contents into `~/.local/share/gnome-shell/extensions/`.  
	One way to do this is as follows:
	
	
	```bash
	mkdir git
	cd git
	git clone https://github.com/jenspfahl/KeepAwake.git
	cp -r KeepAwake/KeepAwake@jepfa.de ~/.local/share/gnome-shell/extensions/
	```
	You can do `ln -s` instead of `cp -r` if you prefer.
	
2. Restart gnome shell: Press Alt+F2 -> r -> Enter.  
   If that doesn't work (e.g. on Wayland): log out -> log in
   
3. Install/Run `gnome-tweak-tool` (restart it if it was already running)
4. Go to Extensions and activate KeepAwake.

## Usage ##

When you have configured some screensaver or "sleep" powersaving settings, the icon looks like this. 
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
