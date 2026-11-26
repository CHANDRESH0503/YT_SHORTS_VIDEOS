import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// macOS 26: the bare chrome-headless-shell cannot locate icudtl.dat for its helper processes
// ("Target closed"). Chrome for Testing ships as a proper .app bundle and works.
Config.setChromeMode('chrome-for-testing');
