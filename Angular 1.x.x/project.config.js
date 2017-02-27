// PROJECT CONFIG
module.exports = {
    APP_NAME: "app",
    LANGUAGES: [ // Required to create templates in different languages. First element is default.
        'pl',
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
        PASSWORD: '',
        DESTINATION: '/public_html/'
    },
    API_KEYS: {
        TINIFY: ''
    }
};