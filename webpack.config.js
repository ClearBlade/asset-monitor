// note: this config is meant to be used with the 'npm run bundle' command.
var path = require('path');

module.exports = env => {
    if (!env || !env.ENTRY_FILE || !env.OUTPUT_FILE_NAME) {
        throw new Error(
            'Invalid usage. Must supply ENTRY_FILE and OUTPUT_FILE_NAME. e.g., npm run bundle --env.ENTRY_FILE=./src/backend/Normalizer/index.ts',
        );
    }
    console.log(`Building '${env.ENTRY_FILE}' and outputting to 'dist/${env.OUTPUT_FILE_NAME}.bundle.js'`);
    return {
        // Change to your "entry-point".
        entry: env.ENTRY_FILE,
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: `${env.OUTPUT_FILE_NAME}.bundle.js`,
        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.json'],
        },
        module: {
            rules: [
                {
                    // Include ts, tsx, js, and jsx files.
                    test: /\.(ts|js)x?$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                },
            ],
        },
    };
};
