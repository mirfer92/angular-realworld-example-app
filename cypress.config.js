const { defineConfig } = require("cypress");

module.exports = defineConfig({
  viewportWidth: 1920,
  viewportHeight: 1080,
  video: true,
  env: {
    // username: 'artem.bondary16@gmail.com', // This value is overriden by cypress.config.json
    // password: 'PasswordTest1',
    apiUrl: 'https://api.realworld.io'
  },
  retries: {
    runMode: 2,
    openMode: 0
  },
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  e2e: {
    baseUrl: 'http://localhost:4200',
    SpecPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    excludeSpecPattern: ['**/1-getting-started', '**/2-advanced-examples'],
    setupNodeEvents(on, config) {
      // implement node event listeners here
      const username = process.env.APP_USERNAME
      const password = process.env.APP_PASSWORD

      if(!password) {
        throw new Error("Missing APP_PASSWORD env variable");
      }
      if(!username) {
        throw new Error("Missing APP_USERNAME env variable");
      }

      config.env = {username, password};
      return config;
    },
  },
});
