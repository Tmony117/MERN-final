const nodemailer = require('nodemailer');

console.log('Nodemailer version:', nodemailer.version);
console.log('Node.js version:', process.version);

// Check if the version is compatible with Node.js 16
const [major, minor, patch] = nodemailer.version.split('.').map(Number);
if (major === 6 && minor >= 6) {
    console.log('This version of Nodemailer is compatible with Node.js 16');
} else {
    console.log('Warning: This version of Nodemailer might not be fully compatible with Node.js 16');
}

// Simple test to ensure basic functionality
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: false,
    auth: {
        user: 'testimonyatsu99@gmail.com',
        pass: 'ubomqglbllhwoklf'
    }
});

console.log('Transporter created successfully');