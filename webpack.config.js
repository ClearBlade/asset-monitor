var path = require('path');

module.exports = {
    // Change to your "entry-point".
    entry: './src/backend/Normalizer/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'normalizer.bundle.js',
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
