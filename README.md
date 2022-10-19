
Uses code from https://github.com/checkly/headless-recorder
Since this extension is injecting code into the user's browser, 
it is reduced to the bare minimum.

Selecting the extension button opens a popup with a play and stop button.
Pressing play injects a capture content script into the current tab.
The capture script sends browser events to a service 
that runs on port  on the local computer.
Pressing stop in the extension stops recording.



