// Simple test to verify the system is ready
const fs = require('fs');
const path = require('path');

console.log('🦑 Squid Game Registration System - Setup Test');
console.log('==============================================\n');

// Check if all required files exist
const requiredFiles = [
    'package.json',
    'server.js',
    'index.html',
    '.env',
    'README.md',
    'setup.bat'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

console.log('\n📋 System Status:');
console.log('================');

if (allFilesExist) {
    console.log('✅ All required files are present');
    console.log('✅ System is ready for deployment');

    // Check package.json structure
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        console.log('✅ package.json is valid JSON');
        console.log(`✅ Project: ${packageJson.name} v${packageJson.version}`);

        if (packageJson.dependencies) {
            console.log(`✅ Dependencies configured: ${Object.keys(packageJson.dependencies).length} packages`);
        }
    } catch (error) {
        console.log('❌ package.json has invalid JSON');
        allFilesExist = false;
    }

} else {
    console.log('❌ Some required files are missing');
    console.log('Please ensure all files are present before running setup');
}

console.log('\n🚀 Next Steps:');
console.log('==============');
console.log('1. Install Node.js from https://nodejs.org/');
console.log('2. Run setup.bat to install dependencies');
console.log('3. Configure your .env file');
console.log('4. Start the server with: npm start');

if (allFilesExist) {
    console.log('\n✅ System is ready to run!');
} else {
    console.log('\n❌ Please fix the missing files before proceeding');
}

console.log('\n📖 For more information, see README.md');
