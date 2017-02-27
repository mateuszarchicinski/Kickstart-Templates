// PROJECT CONFIG
module.exports = {
    APP_NAME: "app",
    LANGUAGES: [ // Required to building templates with multiple languages
        'pl', // First element is default
        'en'
    ],
    CONFIG_FILE: 'project.config.js',
    DATA_FILE: 'project.data.json', // Data object which are passing to pug (Dynamic templates).
    DIRECTORY: {
        WORK_DIR: 'src',
        DIST_DIR: 'dist',
        TEST_DIR: 'test'
    },
    FTP_CONFIG: {
        HOST: '',
        USER: '',
        PASSWORD: ''
    },
    API_KEYS: {
        TINIFY: ''
    }
};