module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            ["module:react-native-dotenv", {
                "moduleName": "@env",
                "path": ".env",
                "blacklist": null,
                "whitelist": null,
                "safe": false,
                "allowUndefined": true
            }],
            // ✅ Ajouter react-native-reanimated/plugin EN DERNIER
            'react-native-reanimated/plugin'
        ]
    };
};