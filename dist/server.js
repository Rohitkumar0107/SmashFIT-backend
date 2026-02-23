"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const cors_1 = __importDefault(require("cors"));
const cors_config_1 = require("./config/cors.config");
function startServer() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)(cors_config_1.corsConfig));
    dotenv_1.default.config();
    app.use((0, cookie_parser_1.default)()); // Cookie parser middleware for handling cookies
    app.use(express_1.default.json());
    // for auth routes
    app.use('/api/auth', auth_routes_1.default);
    // Define a basic route
    app.get('/', (req, res) => {
        res.send('Welcome to Smashit API!');
    });
    // Start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
