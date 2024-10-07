const importPlugin = require('eslint-plugin-import'); 

module.exports = [
    {
        languageOptions: {
            ecmaVersion: 12,
            sourceType: 'module',
            globals: {
                jest: 'readonly',
            },
        },
        files: ['*.js',
            '*/*.js',
            '*/*/*.js',
        ], 
        plugins: {
            import: importPlugin, // plugin om inmorts te sorteren
        },
        rules: {
            'import/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index',
                    ],
                    'newlines-between': 'always',
                },
            ],
            'no-unused-vars': 'error',
            'indent': ['error', 4], // Indentatie
            'linebreak-style': ['error', 'unix'], // UNIX line endings
            'quotes': ['error', 'single'], // Single quotes
            'semi': ['error', 'always'], // Puntkomma's 
            'comma-dangle': ['error', 'always-multiline'], // keys over meerdere lijnen moet op elke lijn een komma
            'no-tabs': 'error', // Geen tabs
            'max-len': ['error', { code: 120, ignoreStrings: true }], // Maximum lengte 120 characters, strings genegeerd
            'arrow-parens': ['error', 'always'], // haakjes rond parameters van arrow function
            'brace-style': ['error', '1tbs', { allowSingleLine: true }], // Accolades uniform, inline toegestaan 
        },
    },
];