import path from 'path';
import { fileURLToPath } from 'url';

import CopyPlugin from 'copy-webpack-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        background: './src/background/background.js',
        content: './src/content/content.js',
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: "src",
                    to: "." // Copies to build folder
                },
            ],
        })
    ],
};

export default config;
