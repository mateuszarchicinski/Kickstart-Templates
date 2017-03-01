// PROJECT CONFIG
module.exports = {
    APP_NAME: "app",
    LANGUAGES: [ // Required to create templates in different languages. Remember to create directories with the same name (src/template/views/pl - en) and to configure Data File
        'pl', // First element is default variable
        'en'
    ],
    CONFIG_FILE: 'project.config.js',
    DATA_FILE: 'project.data.json', // Data object which are passing to pug (Dynamic templates)
    DIRECTORY: {
        WORK_DIR: 'src',
        DIST_DIR: 'dist',
        TEST_DIR: 'test'
    },
    FTP_CONFIG: { // All variables required to upload files to FTP Server
        HOST: '',
        USER: '',
        PASSWORD: '',
        DESTINATION: '/public_html/'
    },
    API_KEYS: {
        TINIFY: ''
    }
};