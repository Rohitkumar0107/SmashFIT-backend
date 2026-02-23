"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server"); //- your main express app
console.log('Running under IISNode, starting server without clustering.');
(0, server_1.startServer)();
