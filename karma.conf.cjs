module.exports = (config) => {
  config.set({
    basePath: '',
    port: Number(process.env.KARMA_PORT || 9876),
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    reporters: ['progress', 'kjhtml'],
    client: { clearContext: false },
    restartOnFileChange: true,
    browserNoActivityTimeout: 90000,
    customLaunchers: {
      FirefoxHeadlessPrivacy: {
        base: 'FirefoxHeadless',
        prefs: { 'privacy.resistFingerprinting': true },
      },
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-dev-shm-usage',
        ],
      },
    },
  });
};
