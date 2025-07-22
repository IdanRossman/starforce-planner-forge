const https = require('https');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const CSV_FILE = 'C:\\Users\\ADMIN\\Documents\\equipment_upload.csv'; // CSV file with name and maplestory_io_id columns
const DOWNLOAD_DIR = './public/images/equipment/downloaded';
const DELAY_BETWEEN_REQUESTS = 750; // ms

// Create download directory if it doesn't exist
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  console.log(`Created download directory: ${DOWNLOAD_DIR}`);
}

// Sanitize filename for file system
function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .trim();
}

// Download image from URL
function downloadImage(url, filepath, equipmentName) {
  return new Promise((resolve) => {
    // Check if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skipping ${equipmentName} - file already exists`);
      resolve({ success: true, skipped: true });
      return;
    }

    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Downloaded: ${equipmentName}`);
          resolve({ success: true, skipped: false });
        });
      } else {
        file.close();
        fs.unlink(filepath, () => {}); // Delete partial file
        console.log(`❌ Failed to download ${equipmentName}: HTTP ${response.statusCode}`);
        resolve({ success: false, skipped: false });
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(filepath, () => {}); // Delete partial file
      console.log(`❌ Error downloading ${equipmentName}: ${err.message}`);
      resolve({ success: false, skipped: false });
    });
  });
}

// Add delay between requests
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Read equipment data from CSV file
async function readEquipmentFromCSV() {
  return new Promise((resolve, reject) => {
    const equipment = [];
    
    if (!fs.existsSync(CSV_FILE)) {
      reject(new Error(`CSV file not found: ${CSV_FILE}`));
      return;
    }

    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (row) => {
        // Handle different possible column names
        const name = row.name || row.Name || row.equipment_name || row['Equipment Name'];
        const id = row.maplestory_io_id || row.id || row.ID || row.item_id || row['MapleStory ID'];
        
        if (name && id) {
          equipment.push({
            name: name.trim(),
            maplestory_io_id: id.toString().trim()
          });
        }
      })
      .on('end', () => {
        console.log(`📄 Read ${equipment.length} equipment items from CSV`);
        resolve(equipment);
      })
      .on('error', (error) => {
        reject(new Error(`Error reading CSV: ${error.message}`));
      });
  });
}

// Main download function
async function downloadAllIcons() {
  console.log('🚀 Starting MapleStory equipment icon download...');
  console.log(`📁 Download directory: ${DOWNLOAD_DIR}`);
  console.log(`📄 CSV file: ${CSV_FILE}`);
  console.log('');

  try {
    // Read equipment data from CSV file
    console.log('📡 Reading equipment data from CSV...');
    const equipmentData = await readEquipmentFromCSV();
    
    const validEquipment = equipmentData.filter(item => 
      item.maplestory_io_id && 
      item.name
    );
    
    console.log(`📋 Found ${equipmentData.length} total equipment items in CSV`);
    console.log(`🎯 ${validEquipment.length} items have valid name and MapleStory ID`);
    console.log('');

    if (validEquipment.length === 0) {
      console.log('✨ No equipment needs downloading!');
      return;
    }

    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    // Download each icon
    for (let i = 0; i < validEquipment.length; i++) {
      const equipment = validEquipment[i];
      const sanitizedName = sanitizeFilename(equipment.name);
      const filename = `${sanitizedName}.png`;
      const filepath = path.join(DOWNLOAD_DIR, filename);
      const iconUrl = `https://maplestory.io/api/GMS/255/item/${equipment.maplestory_io_id}/icon`;
      
      console.log(`[${i + 1}/${validEquipment.length}] ${equipment.name} (ID: ${equipment.maplestory_io_id})`);
      
      const result = await downloadImage(iconUrl, filepath, equipment.name);
      
      if (result.success) {
        if (result.skipped) {
          skippedCount++;
        } else {
          successCount++;
        }
      } else {
        failureCount++;
      }
      
      // Add delay between requests to be respectful to the API
      if (i < validEquipment.length - 1) {
        await delay(DELAY_BETWEEN_REQUESTS);
      }
    }

    console.log('');
    console.log('📊 Download Summary:');
    console.log(`✅ Successful downloads: ${successCount}`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount}`);
    console.log(`❌ Failed downloads: ${failureCount}`);
    console.log(`📁 Total files in directory: ${fs.readdirSync(DOWNLOAD_DIR).length}`);
    
    if (successCount > 0) {
      console.log('');
      console.log('💡 Next steps:');
      console.log('1. Update your database to point storage_url to the downloaded files');
      console.log('2. Modify your equipmentService to use local images');
      console.log(`   Example: /images/equipment/downloaded/${sanitizeFilename('Equipment Name')}.png`);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

// Run the script
downloadAllIcons();
