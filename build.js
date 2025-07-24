#!/usr/bin/env node
/**
 * Simple build script for O-EASY-TA Web Portal
 * Ensures all static files are in the public directory
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Building O-EASY-TA Web Portal...');

// Check if public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    console.log('❌ Public directory not found!');
    process.exit(1);
}

// Check required files
const requiredFiles = [
    'index.html',
    'dashboard.html',
    'attendance.html',
    'grades.html',
    'payments.html',
    'profile.html',
    'id-card.html',
    'reports.html',
    'test.html'
];

const requiredDirs = [
    'css',
    'js',
    'icons',
    'data'
];

console.log('📋 Checking required files...');
let allFilesExist = true;

// Check HTML files
requiredFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - Missing!`);
        allFilesExist = false;
    }
});

// Check directories
requiredDirs.forEach(dir => {
    const dirPath = path.join(publicDir, dir);
    if (fs.existsSync(dirPath)) {
        console.log(`✅ ${dir}/`);
    } else {
        console.log(`❌ ${dir}/ - Missing!`);
        allFilesExist = false;
    }
});

if (allFilesExist) {
    console.log('🎉 Build completed successfully!');
    console.log('📁 All files are ready in the public directory');
    process.exit(0);
} else {
    console.log('❌ Build failed - Missing required files');
    process.exit(1);
}
