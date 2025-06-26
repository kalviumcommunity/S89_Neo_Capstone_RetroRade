// server/seeders/seed.js
require('dotenv').config({ path: './.env' }); // Load .env from the server directory
const mongoose = require('mongoose');
const User = require('../models/User'); // Assuming User model is needed for author IDs
const Guide = require('../models/Guide');
const slugify = require('slugify');

// **START OF FINAL, ROBUST FIX FOR FETCH**
let fetch; // Declare fetch in a scope where it can be assigned

// Check Node.js version to determine if native fetch is available
const nodeMajorVersion = parseInt(process.versions.node.split('.')[0], 10);

if (nodeMajorVersion >= 18) {
  // Node.js v18+ has native global fetch
  fetch = globalThis.fetch;
} else {
  // For older Node.js versions, attempt to use 'node-fetch'
  try {
    const nodeFetchModule = require('node-fetch');
    fetch = nodeFetchModule.default || nodeFetchModule;
  } catch (e) {
    console.error("Critical Error: 'node-fetch' is required for Node.js versions older than v18, but it's not installed or failed to load.");
    process.exit(1); // Exit if fetch isn't available
  }
}

// Ensure fetch is a function before proceeding
if (typeof fetch !== 'function') {
  console.error("Critical Error: 'fetch' API is not available. Please ensure 'node-fetch' is installed (npm install node-fetch) or use Node.js v18+ for native fetch support.");
  process.exit(1); // Exit the seeding process as it cannot proceed without fetch
}
// **END OF FINAL, ROBUST FIX FOR FETCH**


// MongoDB Connection URI from .env
const mongoURI = process.env.MONGO_URI;

// Gemini API Key (keep it empty as Canvas provides it at runtime)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""; // Add GEMINI_API_KEY to your .env
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// --- LLM Content Generation Function ---
// **START OF UPDATED CODE - Added Retry Logic with Exponential Backoff**
async function generateGuideContentWithLLM(topic, category, resourceType, retries = 5, delay = 1000) {
  let prompt = `Generate a detailed guide (at least 300 words) about "${topic}" in the category of "${category}" for the "${resourceType}" resource type.
  The guide should include:
  - An introduction to the topic.
  - Sections for tools/materials needed (if applicable).
  - Step-by-step instructions or key considerations.
  - A conclusion.
  Format the content using Markdown (including headings, bullet points, and code blocks if relevant).`;

  if (resourceType === 'software') {
    prompt += ` Include a section suggesting where to find *legitimate* and *safe* download links for related software (e.g., official archives, reputable emulation sites). Do NOT create fake URLs, just describe general locations.`;
  } else if (resourceType === 'tutorial') {
    prompt += ` Include a section suggesting where to find *relevant* tutorial videos (e.g., "Search YouTube for 'Atari 2600 joystick repair tutorial'"). Do NOT create fake video URLs or embed actual videos.`;
  }

  prompt += ` Avoid external links. Focus on practical advice for retro enthusiasts.`;

  console.log(`Generating content for: ${topic} (Type: ${resourceType})...`);

  for (let i = 0; i < retries; i++) {
    try {
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = { contents: chatHistory };

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorJson = JSON.parse(errorText);

        // Check for 429 (Quota Exceeded) or 503 (Service Unavailable)
        if (response.status === 429 || response.status === 503) {
          const retryAfter = errorJson.error?.details?.find(d => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo')?.retryDelay;
          const retryDelayMs = retryAfter ? parseInt(retryAfter.replace('s', '')) * 1000 : delay * (2 ** i) + Math.random() * 500; // Exponential backoff with jitter
          
          console.warn(`Attempt ${i + 1}/${retries} for ${topic}: LLM API error ${response.status}. Retrying in ${retryDelayMs / 1000} seconds. Message: ${errorJson.error.message}`);
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          continue; // Try again
        } else {
          // For other non-OK responses, throw immediately
          throw new Error(`LLM API error: ${response.status} - ${errorText}`);
        }
      }

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        console.log(`Successfully generated content for: ${topic}`);
        return text;
      } else {
        console.warn(`LLM did not return content for ${topic}. Response:`, result);
        return `Failed to generate content for ${topic}. Please try again or provide content manually.`;
      }
    } catch (error) {
      console.error(`Error generating content for ${topic}:`, error);
      // If it's a network error or parsing error, retry as well, but after logging.
      if (i < retries - 1) {
        const retryDelayMs = delay * (2 ** i) + Math.random() * 500;
        console.warn(`Attempt ${i + 1}/${retries} for ${topic}: Network or unexpected error. Retrying in ${retryDelayMs / 1000} seconds.`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      } else {
        // After all retries exhausted, throw the error
        throw error;
      }
    }
  }
  // If loop finishes, all retries failed
  throw new Error(`Failed to generate content for ${topic} after ${retries} attempts.`);
}
// **END OF UPDATED CODE**


// --- Sample Data for Guides ---
const sampleGuides = [
  {
    title: "Restoring Your First Game Boy (DMG-01)",
    description: "A comprehensive guide to cleaning, repairing, and modding the original Nintendo Game Boy.",
    content: `
      ## Introduction to Game Boy Restoration
      The Nintendo Game Boy (DMG-01) is an icon. Bringing one back to life is a rewarding experience. This guide covers basic cleaning to more advanced mods.

      ## Tools You'll Need
      * Tri-wing screwdriver
      * Small Phillips head screwdriver
      * Isopropyl alcohol (90%+)
      * Cotton swabs, soft brush, microfiber cloths
      * Soldering iron (for advanced mods)
      * Desoldering braid/pump
      * New screen (IPS mod, optional)
      * New capacitors (if recapping)

      ## Step 1: Disassembly
      1.  Remove batteries and battery cover.
      2.  Unscrew the six tri-wing screws on the back.
      3.  Carefully separate the front and back shells. Be gentle with the ribbon cable.
      4.  Disconnect the ribbon cable by flipping up its connector lock.
      5.  Remove the main PCB (Printed Circuit Board) by unscrewing any Phillips screws holding it.

      ## Step 2: Cleaning the PCB
      Clean any corrosion, especially around battery terminals and power switch, using isopropyl alcohol and a brush/cotton swab.

      ## Step 3: Screen Cleaning (Optional & Delicate)
      If dust is under the screen, you may need to carefully separate the LCD from the front housing. Clean with a microfiber cloth.

      ## Step 4: Recapping (Advanced)
      Old capacitors can leak and cause issues. Desolder old caps and replace with new ones of the correct rating.

      ## Step 5: IPS Screen Mod (Advanced)
      Replace the original screen with a vibrant IPS display for a modern look. This involves soldering and shell modification.

      ## Reassembly
      Reverse the steps. Test functionality before fully securing the case.
      `,
    category: "Gaming",
    tags: ["gameboy", "restoration", "modding", "nintendo", "console"],
  },
  {
    title: "Beginner's Guide to Setting up DOSBox",
    description: "Learn how to install and configure DOSBox to play classic DOS games on modern systems.",
    content: `
      ## What is DOSBox?
      DOSBox is an emulator that recreates a DOS environment, allowing you to run old DOS games and applications that won't work natively on modern operating systems.

      ## Installation
      1.  Download DOSBox from the official website ([www.dosbox.com](http://www.dosbox.com/)).
      2.  Run the installer and follow the prompts.

      ## Basic Configuration
      The most important step is 'mounting' your game directory as a drive.
      For example, if your games are in 'C:\\DOSGames':
      \`\`\`bash
      mount c C:\\DOSGames
      c:
      dir
      \`\`\`
      Then navigate to your game's directory and run its executable (e.g., \`cd wolf3d\` then \`wolf3d.exe\`).

      ## Advanced Settings
      Edit the \`dosbox.conf\` file for full-screen mode, specific CPU cycles, sound emulation, etc.
      `,
    category: "Computing",
    tags: ["dosbox", "emulator", "dos", "gaming", "software"],
    downloadLink: "https://www.dosbox.com/download.php" // Example download link
  },
  {
    title: "Understanding Vinyl Record Care",
    description: "Essential tips for cleaning, storing, and maintaining your vinyl record collection.",
    content: `
      ## Why Proper Vinyl Care Matters
      Vinyl records can last for decades if cared for properly. Dust, dirt, and improper handling are their biggest enemies, leading to surface noise and degradation.

      ## Cleaning Your Records
      * **Dry Cleaning:** Use a carbon fiber brush before each play to remove surface dust.
      * **Wet Cleaning:** For deeper cleaning, use a specialized vinyl record cleaning solution and a microfiber cloth. Apply solution sparingly and wipe in the direction of the grooves.
      * **Record Cleaning Machines:** For serious collectors, vacuum-based record cleaning machines offer the best results.

      ## Storage
      * Store records vertically in poly-lined inner sleeves and sturdy outer sleeves.
      * Avoid stacking records horizontally, which can cause warping.
      * Keep records away from direct sunlight, heat sources, and high humidity.

      ## Handling
      Always handle records by the edges or the label. Avoid touching the grooves directly with your fingers.
      `,
    category: "Audio",
    tags: ["vinyl", "records", "audio", "maintenance", "collection"],
  },
  {
    title: "Commodore 64 Schematics Overview",
    description: "An overview of the main board schematics for the Commodore 64.",
    content: `
      ## Commodore 64 Motherboard Components
      This guide provides a high-level overview of the Commodore 64 motherboard's key components and their interconnections, as found in common schematics.

      ## Key Chips
      * **MOS 6510:** CPU
      * **MOS 6567/6569 (VIC-II):** Video Interface Chip
      * **MOS 6581/8580 (SID):** Sound Interface Device
      * **MOS 6526 (CIA):** Complex Interface Adapter (x2)
      * **ROM Chips:** Kernal, Basic, Character ROMs

      ## Power Distribution
      The 9VAC and 5VDC from the power supply are distributed across the board. Pay attention to filtering capacitors near power inputs.

      ## Data Bus
      The 8-bit data bus connects most chips. Understanding its flow is key for diagnostics.
      `,
    resourceType: "schematic", // Explicitly set type
    category: "Computing",
    tags: ["commodore", "c64", "schematic", "hardware", "diagram"],
    downloadLink: "https://example.com/c64_schematic_download.pdf" // Example schematic download link
  },
  {
    title: "Basic Repair: Replacing a Console Power Adapter",
    description: "How to safely identify and replace a faulty power adapter for retro gaming consoles.",
    content: `
      ## Introduction
      Many retro consoles suffer from worn-out or lost power adapters. Replacing them is often straightforward, but requires attention to detail to avoid damaging your console.

      ## Identifying the Correct Adapter
      **Crucial Information:**
      1.  **Voltage (V):** Must match exactly (e.g., 9V, 12V).
      2.  **Amperage (A / mA):** Must meet or *exceed* the original (e.g., 850mA, 1A). Never use one with lower amperage.
      3.  **Polarity (Center Positive/Negative):** **MOST CRITICAL.** Incorrect polarity can instantly destroy your console. Check the symbol on the console or original adapter (circle with dot in middle, plus/minus signs).
      4.  **Plug Type:** Ensure the physical barrel plug fits.

      ## Where to Buy
      Look for reputable retro gaming suppliers or specialized electronics stores. Avoid generic "universal" adapters unless they explicitly list compatibility and allow you to set correct voltage/polarity.

      ## Safety First
      Always unplug both the console and the adapter from the wall outlet before connecting/disconnecting.
      `,
    category: "Gaming",
    tags: ["repair", "power adapter", "console", "safety", "hardware"],
  },
  {
    title: "Casio F-91W Battery Replacement Tutorial",
    description: "Simple steps to replace the battery in your classic Casio F-91W digital watch, with video reference.",
    content: `
      ## Tools Needed
      * Small Phillips screwdriver
      * Tweezers
      * CR2016 battery

      ## Steps
      1. Remove the four screws on the back.
      2. Carefully open the backplate.
      3. Locate the battery (CR2016).
      4. Use tweezers to unclip the metal retainer.
      5. Replace battery, clip retainer back.
      6. Perform AC reset (short circuit AC contact to battery positive).
      7. Reassemble.

      ## Video Tutorial
      Search YouTube for "Casio F-91W battery replacement tutorial" for a visual guide.
      `,
    resourceType: "tutorial", // Explicitly set type
    category: "Wearable Tech",
    tags: ["casio", "watch", "repair", "f91w"],
    videoLink: "https://www.youtube.com/watch?v=EXAMPLE_VIDEO_ID" // Example YouTube video link
  },
  {
    title: "PSP Custom Firmware Installation Walkthrough",
    description: "A step-by-step guide to installing custom firmware on your PSP 1000 for homebrew and backups.",
    content: `
      ## Warning!
      Modifying your PSP carries risks. Proceed at your own discretion.
      ... (Full content as previously provided) ...
      ## Video Tutorial
      You can find detailed walkthroughs by searching YouTube for "PSP 1000 Custom Firmware Installation".
      `,
    resourceType: "tutorial",
    category: "Gaming",
    tags: ["psp", "custom firmware", "modding", "sony", "handheld"],
    videoLink: "https://www.youtube.com/watch?v=ANOTHER_EXAMPLE_VIDEO" // Example YouTube video link
  },
  {
    title: "Cleaning and Maintaining Vintage Headphones",
    description: "Tips for extending the life and sound quality of your retro headphones.",
    content: `
      ## Introduction
      Vintage headphones often have unique designs and sound signatures. Proper care can keep them sounding great.
      ... (Full content as previously provided) ...
      `,
    resourceType: "manual",
    category: "Audio",
    tags: ["headphones", "vintage", "audio", "maintenance"],
  },
  {
    title: "GIMP 2.10.32 for Vintage OS",
    description: "Installation files and guide for GIMP 2.10.32, compatible with some older Windows/Linux distributions.",
    content: `
      ## About GIMP 2.10.32
      This version of GIMP offers a powerful image manipulation suite. This guide helps with installation on specific vintage operating systems that might struggle with newer versions.

      ## Installation Steps
      1.  Download the correct installer for your OS.
      2.  Run the executable and follow on-screen prompts.
      3.  Ensure necessary libraries are installed (check documentation).

      ## Where to Download
      Find official archived releases of GIMP on the GIMP project's download page, often under 'older releases' or 'archive'. Always download from official sources.
      `,
    resourceType: "software",
    category: "Computing",
    tags: ["gimp", "software", "image editing", "linux", "windows"],
    downloadLink: "https://download.gimp.org/gimp/older_releases/" // General link, not specific file
  },
  {
    title: "Retro Phone Ringtone Pack (MIDI)",
    description: "A collection of classic MIDI ringtones from early 2000s phones.",
    content: `
      ## Bring Back the Nostalgia!
      This pack contains iconic polyphonic and monophonic MIDI ringtones for your retro phone. Transfer via data cable or Bluetooth if supported.

      ## Installation
      1.  Download the MIDI pack.
      2.  Connect your phone to PC (if applicable).
      3.  Transfer files to the Ringtones folder.
      4.  Set as desired!

      ## Download Link
      [Download Retro Phone Ringtones Pack](https://example.com/retro-ringtones.zip) - *Example Link: Please replace with actual, safe download.*
      `,
    resourceType: "software",
    category: "Mobile Tech",
    tags: ["ringtones", "mobile", "nokia", "ericsson", "midi"],
    downloadLink: "https://example.com/retro-ringtones.zip"
  }
];

// Topics for LLM-generated guides (EXPANDED LIST with your new suggestions)
const llmTopics = [
  // Existing topics...
  { topic: "Atari 2600 joystick repair", category: "Gaming", resourceType: "tutorial" },
  { topic: "Cleaning techniques for old game cartridges", category: "Gaming", resourceType: "tutorial" },
  { topic: "Vintage amplifier tube replacement guide", category: "Audio", resourceType: "tutorial" },
  { topic: "Using external storage with a Sega Dreamcast", category: "Gaming", resourceType: "tutorial" },
  { topic: "Reviving old CRT computer monitors", category: "Display", resourceType: "tutorial" },
  { topic: "Guide to retro handheld emulation on Android", category: "Mobile Tech", resourceType: "software" },
  { topic: "Identifying original vs. reproduction NES cartridges", category: "Gaming", resourceType: "tutorial" },
  { topic: "How to fix a stuck button on a Super Nintendo controller", category: "Gaming", resourceType: "tutorial" },
  { topic: "Troubleshooting common issues with a Sega Master System", category: "Gaming", resourceType: "tutorial" },
  { topic: "Basic soldering for vintage console repairs", category: "Hardware", resourceType: "tutorial" },
  { topic: "Recapping a TurboGrafx-16 console", category: "Gaming", resourceType: "tutorial" },
  { topic: "Adjusting audio levels on a vintage stereo receiver", category: "Audio", resourceType: "tutorial" },
  { topic: "Calibrating an old arcade joystick", category: "Gaming", resourceType: "tutorial" },

  // Computing - Manuals/General
  { topic: "Setting up a vintage Macintosh SE/30", category: "Computing", resourceType: "manual" },
  { topic: "Basic upkeep for Nintendo Famicom", category: "Gaming", resourceType: "manual" },
  { topic: "Disassembling a classic iPod Nano (1st Gen)", category: "Mobile Tech", resourceType: "manual" },
  { topic: "Repairing common faults in a ZX Spectrum power supply", category: "Hardware", resourceType: "manual" },
  { topic: "Basic cleaning of an old SLR camera lens", category: "Photography", resourceType: "manual" },
  { topic: "Connecting a vintage printer to a modern computer", category: "Computing", resourceType: "manual" },
  { topic: "Commodore 64 Getting Started Manual", category: "Computing", resourceType: "manual" },
  { topic: "Amiga 500 Quick Start Guide", category: "Computing", resourceType: "manual" },
  { topic: "IBM PC XT Reference Manual", category: "Computing", resourceType: "manual" },
  { topic: "Vintage PC BIOS setup guide", category: "Computing", resourceType: "manual" },
  { topic: "Introduction to vintage camcorders", category: "Video", resourceType: "general" },
  { topic: "Sega Genesis Model 1 vs Model 2 differences", category: "Gaming", resourceType: "general" },
  { topic: "Best practices for storing retro video games", category: "Gaming", resourceType: "general" },
  { topic: "Tips for buying retro tech safely online", category: "General", resourceType: "general" },
  { topic: "History of the video game crash of 1983", category: "Gaming", resourceType: "general" },
  { topic: "Evolution of home computer operating systems", category: "Computing", resourceType: "general" },
  { topic: "Collecting vintage synthesizers", category: "Audio", resourceType: "general" },
  { topic: "The rise and fall of Blockbuster Video", category: "Video", resourceType: "general" },

  // Software - Downloads (simulated)
  { topic: "How to use an old floppy disk drive with modern PC", category: "Computing", resourceType: "software" },
  { topic: "MS-DOS 6.22 installation files", category: "Computing", resourceType: "software" },
  { topic: "Windows 3.1 installation media", category: "Computing", resourceType: "software" },
  { topic: "Classic Mac OS 9.2.2 installer", category: "Computing", resourceType: "software" },
  { topic: "NES Emulator for Windows", category: "Gaming", resourceType: "software" },
  { topic: "Sega Genesis Emulator for Linux", category: "Gaming", resourceType: "software" },
  { topic: "Amiga Workbench 3.1 ADF files", category: "Computing", resourceType: "software" },
  { topic: "C64 Game Compilation Disk Image", category: "Gaming", resourceType: "software" },
  { topic: "Atari ST TOS ROM image", category: "Computing", resourceType: "software" },
  { topic: "ZX Spectrum ROMs collection", category: "Gaming", resourceType: "software" },

  // Schematics - Diagrams
  { topic: "Fixing leaky capacitors in an Amiga 500", category: "Hardware", resourceType: "schematic" },
  { topic: "NES Power Supply Schematic", category: "Gaming", resourceType: "schematic" },
  { topic: "Super Nintendo Motherboard Diagram", category: "Gaming", resourceType: "schematic" },
  { topic: "Original Macintosh 128K Logic Board schematic", category: "Computing", resourceType: "schematic" },
  { topic: "Atari 2600 Console Circuit Diagram", category: "Gaming", resourceType: "schematic" },
  { topic: "Sony Walkman WM-DD9 Circuit Board Layout", category: "Audio", resourceType: "schematic" },
  { topic: "VCR Head Cleaning Mechanism Schematic", category: "Video", resourceType: "schematic" },
  { topic: "Vintage Arcade PCB Wiring Diagram (Pac-Man)", category: "Gaming", resourceType: "schematic" },
  { topic: "Game Boy DMG-01 Power Regulator Schematic", category: "Gaming", resourceType: "schematic" },
  { topic: "Classic Tube Amplifier Wiring Diagram", category: "Audio", resourceType: "schematic" },
  { topic: "IBM PC/AT Keyboard Controller Schematic", category: "Computing", resourceType: "schematic" },
  { topic: "ZX81 Main Board Layout", category: "Computing", resourceType: "schematic" },
  { topic: "Amstrad CPC 464 Power Circuit Diagram", category: "Computing", resourceType: "schematic" },
  { topic: "Sega Saturn PSU Schematic", category: "Gaming", resourceType: "schematic" },
  { topic: "Apple II Plus Keyboard Encoder Schematic", category: "Computing", resourceType: "schematic" },

  // More Tutorials
  { topic: "Replacing the drive belt in a vintage cassette deck", category: "Audio", resourceType: "tutorial" },
  { topic: "How to clean a dirty floppy disk drive head", category: "Computing", resourceType: "tutorial" },
  { topic: "Recapping a vintage console's power supply", category: "Hardware", resourceType: "tutorial" },
  { topic: "Restoring yellowed retro plastics using retrobrite", category: "General", resourceType: "tutorial" },
  { topic: "Basic repair of a mechanical keyboard switch", category: "Computing", resourceType: "tutorial" },
  { topic: "Adjusting a CRT monitor's geometry", category: "Display", resourceType: "tutorial" },
  { topic: "Performing a deep clean on a vintage VCR", category: "Video", resourceType: "tutorial" },
  { topic: "Upgrading RAM in an old desktop PC", category: "Computing", resourceType: "tutorial" },
  { topic: "Debugging sound issues on an old sound card", category: "Audio", resourceType: "tutorial" },
  { topic: "Converting VHS tapes to digital format", category: "Video", resourceType: "tutorial" },
  { topic: "Basic maintenance for a vintage record player", category: "Audio", resourceType: "tutorial" },
  { topic: "Cleaning and lubricating a vintage fan", category: "Hardware", resourceType: "tutorial" },
  { topic: "How to set up a serial port connection on a retro PC", category: "Computing", resourceType: "tutorial" },
  { topic: "Repairing a cracked vintage game console casing", category: "Gaming", resourceType: "tutorial" },
  { topic: "Using a degaussing coil on a CRT monitor", category: "Display", resourceType: "tutorial" },
  { topic: "Restoring the rubber feet on a vintage laptop", category: "Computing", resourceType: "tutorial" },
  { topic: "Troubleshooting a blank screen on an old console", category: "Gaming", resourceType: "tutorial" },
  { topic: "Replacing the battery in a Sega Saturn cartridge", category: "Gaming", resourceType: "tutorial" },
  { topic: "How to safely open a vintage computer case", category: "Computing", resourceType: "tutorial" },
  { topic: "Cleaning old vinyl records using wood glue", category: "Audio", resourceType: "tutorial" },

  // --- NEW TOPICS FROM YOUR LATEST SUGGESTIONS ---
  { topic: "Fixing Koss headphones", category: "Audio", resourceType: "tutorial" },
  { topic: "Modding Koss headphones", category: "Audio", resourceType: "tutorial" },
  { topic: "How to emulate games on mobile (general guide)", category: "Gaming", resourceType: "software" },
  { topic: "How to emulate games on PC (general guide)", category: "Gaming", resourceType: "software" },
  { topic: "Fixing common BlackBerry models", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "Fixing popular Nokia feature phones", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "Running Android on Windows Phone (e.g., Lumia) via custom ROMs", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "Why Windows XP is no longer secure for modern internet use", category: "Computing", resourceType: "general" },
  { topic: "Recreating Windows 7 aesthetics on Windows 10/11", category: "Computing", resourceType: "tutorial" },
  { topic: "Modding classic Motorola cell phones", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "Fixing common issues in vintage Motorola phones", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "Jailbreaking PSP: Installing custom firmware", category: "Gaming", resourceType: "tutorial" },
  { topic: "Jailbreaking Nintendo DS/3DS for homebrew", category: "Gaming", resourceType: "tutorial" },
  { topic: "Jailbreaking Nintendo Wii for homebrew and backups", category: "Gaming", resourceType: "tutorial" },
  { topic: "Modding vintage MP3 players (e.g., Rockbox installation)", category: "Audio", resourceType: "tutorial" },
  { topic: "Fixing common issues in old MP3 players", category: "Audio", resourceType: "tutorial" },
  { topic: "Making vintage MP3 players useful in modern setups", category: "Audio", resourceType: "general" },
  { topic: "Making old feature phones relevant in today's world", category: "Mobile Tech", resourceType: "general" },
  { topic: "Installation guide: Debian on an older PC", category: "Computing", resourceType: "manual" },
  { topic: "Installation guide: Ubuntu 12.04 on vintage hardware", category: "Computing", resourceType: "manual" },
  { topic: "Installation guide: Windows XP on retro build", category: "Computing", resourceType: "manual" },
  { topic: "Optimizing old graphics cards for modern retro gaming setups", category: "Computing", resourceType: "tutorial" },
  { topic: "Making a useful retro PC from spare parts", category: "Computing", resourceType: "tutorial" },
  { topic: "Repurposing old PCs as media centers or light servers", category: "Computing", resourceType: "general" },
  { topic: "Fixing water damage on Casio watches", category: "Wearable Tech", resourceType: "tutorial" },
  { topic: "Modding Casio F-91W with backlight improvements", category: "Wearable Tech", resourceType: "tutorial" },
  { topic: "Modding Casio scientific calculators for programming", category: "Computing", resourceType: "tutorial" },
  { topic: "Comprehensive guide to PPSSPP emulator on Android", category: "Gaming", resourceType: "tutorial" },
  { topic: "Setting up PCSX2 for PlayStation 2 emulation on PC", category: "Gaming", resourceType: "tutorial" },
  { topic: "Yuzu/Ryujinx: Nintendo Switch emulation guide for PC", category: "Gaming", resourceType: "tutorial" },
  { topic: "Xenia emulator: Emulating Xbox 360 games on PC", category: "Gaming", resourceType: "tutorial" },
  { topic: "Appreciation blog: The art of winding mechanical watches", category: "Wearable Tech", resourceType: "general" },
  { topic: "Review: Classic PC game - Doom (1993)", category: "Gaming", resourceType: "general" },
  { topic: "Review: Classic PC game - Half-Life 2", category: "Gaming", resourceType: "general" },
  { topic: "Modding Fallout 3 for modern systems", category: "Gaming", resourceType: "tutorial" },
  { topic: "Underrated PS1 RPGs you should play", category: "Gaming", resourceType: "general" },
  { topic: "Hidden gems of PC gaming from the 90s", category: "Gaming", resourceType: "general" },
  { topic: "Modern indie games that capture retro vibes", category: "Gaming", resourceType: "general" },
  { topic: "Fixing common issues in vintage Sony Alpha cameras", category: "Photography", resourceType: "tutorial" },
  { topic: "Repairing classic Sony Walkman cassette players", category: "Audio", resourceType: "tutorial" },
  { topic: "A brief history and impact of MS-DOS operating system", category: "Computing", resourceType: "general" },
  { topic: "Exploring the evolution of early Windows operating systems", category: "Computing", resourceType: "general" },
  { topic: "The unique user experience of AmigaOS: A deep dive", category: "Computing", resourceType: "general" },
  { topic: "Troubleshooting and fixing classic Apple iPods (Click Wheel models)", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "Nokia 3310 screen and case replacement guide", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "BlackBerry Bold 9900: Battery and keyboard replacement", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "Restoring the original software on an HTC Dream (G1)", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "Guide to disassembling vintage Sony Trinitron CRTs for repair", category: "Display", resourceType: "manual" },
  { topic: "Tips for safely storing old photographic film", category: "Photography", resourceType: "general" },
  { topic: "The appeal of vintage film cameras in the digital age", category: "Photography", resourceType: "general" },
  { topic: "Repairing common faults in old game console power supplies", category: "Hardware", resourceType: "tutorial" },
  { topic: "Modding the Nintendo GameCube with a GC Loader", category: "Gaming", resourceType: "tutorial" },
  { topic: "How to clean and lubricate an original Xbox DVD drive", category: "Gaming", resourceType: "tutorial" },
  { topic: "Setting up a retro gaming emulator frontend (e.g., RetroPie)", category: "Gaming", resourceType: "software" },
  { topic: "Installing custom firmware on a PlayStation Classic", category: "Gaming", resourceType: "tutorial" },
  { topic: "Guide to using a SCSI2SD adapter in vintage Macs", category: "Computing", resourceType: "hardware" }, // Assuming hardware for adapter
  { topic: "Building a custom mechanical keyboard with vintage switches", category: "Computing", resourceType: "tutorial" },
  { topic: "The history and impact of the Compact Disc (CD)", category: "Audio", resourceType: "general" },
  { topic: "Understanding audio codecs for vintage digital music players", category: "Audio", resourceType: "general" },
  { topic: "Repairing a broken headphone jack on a retro device", category: "Audio", resourceType: "tutorial" },
  { topic: "Modding a vintage boombox with Bluetooth connectivity", category: "Audio", resourceType: "tutorial" },
  { topic: "Guide to recovering data from old floppy disks", category: "Computing", resourceType: "tutorial" },
  { topic: "Using a serial-to-USB adapter for retro computing", category: "Computing", resourceType: "hardware" }, // Assuming hardware for adapter
  { topic: "The best retro-style PC cases for modern builds", category: "Computing", resourceType: "general" },
  { topic: "Understanding vintage CPU architectures (e.g., 8086, 68k)", category: "Computing", resourceType: "general" },
  { topic: "How to capture video from an old VHS camcorder", category: "Video", resourceType: "tutorial" },
  { topic: "Restoring the battery life of vintage camcorders", category: "Video", resourceType: "tutorial" },
  { topic: "Guide to classic video game preservation techniques", category: "Gaming", resourceType: "general" },
  { topic: "The cultural impact of arcade games in the 80s", category: "Gaming", resourceType: "general" },
  { topic: "Basic troubleshooting for classic mobile phone charging issues", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "Replacing the screen on a vintage flip phone", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "Customizing ringtones on older cell phones", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "Review of classic Nokia N-Gage games", category: "Gaming", resourceType: "general" },
  { topic: "The history of mobile phone operating systems (Symbian, Windows Mobile)", category: "Mobile Tech", resourceType: "general" },
  { topic: "Basic repair of a vintage digital alarm clock", category: "Electronics", resourceType: "tutorial" },
  { topic: "Understanding vintage vacuum tube radios", category: "Audio", resourceType: "general" },
  { topic: "Guide to basic electronic component identification (resistors, capacitors)", category: "Electronics", resourceType: "manual" },
  { topic: "Desoldering techniques for beginners in retro electronics", category: "Hardware", resourceType: "tutorial" },
  { topic: "How to clean corrosion from battery compartments", category: "Hardware", resourceType: "tutorial" },
  { topic: "Troubleshooting dead pixels on old LCD screens", category: "Display", resourceType: "tutorial" },
  { topic: "Guide to choosing the right power supply for retro projects", category: "Hardware", resourceType: "general" },
  { topic: "Understanding classic video game rendering techniques", category: "Gaming", resourceType: "general" },
  { topic: "The evolution of video game controllers", category: "Gaming", resourceType: "general" },
  { topic: "Basic repair of a vintage calculator screen", category: "Computing", resourceType: "tutorial" },
  { topic: "Modding a vintage calculator with custom firmware", category: "Computing", resourceType: "tutorial" },
  { topic: "The story behind iconic video game consoles (e.g., PlayStation)", category: "Gaming", resourceType: "general" },
  { topic: "Retro PC gaming peripherals: joysticks, gamepads, light guns", category: "Gaming", resourceType: "general" },
  { topic: "Guide to setting up a multi-boot system on an old PC", category: "Computing", resourceType: "tutorial" },
  { topic: "Troubleshooting sound issues on a vintage PC", category: "Computing", resourceType: "tutorial" },
  { topic: "Maintaining floppy disks and disk drives", category: "Computing", resourceType: "manual" },
  { topic: "Understanding vintage hard drive technologies (IDE, SCSI)", category: "Computing", resourceType: "general" },
  { topic: "How to clean and maintain vintage typewriters", category: "General", resourceType: "tutorial" },
  { topic: "The aesthetics of pixel art in retro games", category: "Gaming", resourceType: "general" },
  { topic: "Creating chiptune music using vintage computers", category: "Audio", resourceType: "tutorial" },
  { topic: "Restoring worn out buttons on old game controllers", category: "Gaming", resourceType: "tutorial" },
  { topic: "Guide to retro game console RGB modding", category: "Gaming", resourceType: "tutorial" },
  { topic: "Basic repair for vintage car radios", category: "Audio", resourceType: "tutorial" },
  { topic: "How to convert old audio cassettes to digital", category: "Audio", resourceType: "tutorial" },
  { topic: "Understanding different types of vintage audio connectors", category: "Audio", resourceType: "general" },
  { topic: "The golden age of portable music players (before iPod)", category: "Audio", resourceType: "general" },
  { topic: "Restoring the plastic shell of an old game console", category: "Gaming", resourceType: "tutorial" },
  { topic: "Fixing controller port issues on retro consoles", category: "Gaming", resourceType: "tutorial" },
  { topic: "Guide to using classic emulators on modern systems", category: "Gaming", resourceType: "software" },
  { topic: "Setting up a custom RetroPie build for Raspberry Pi", category: "Gaming", resourceType: "software" },
  { topic: "Troubleshooting vintage motherboard issues", category: "Hardware", resourceType: "tutorial" },
  { topic: "The history of computer graphics cards", category: "Computing", resourceType: "general" },
  { topic: "Repairing a broken battery door on a portable console", category: "Hardware", resourceType: "tutorial" },
  { topic: "Guide to cleaning out dust from vintage electronics", category: "General", resourceType: "tutorial" },
  { topic: "Understanding old data storage formats (Zip drives, Jaz drives)", category: "Computing", resourceType: "general" },
  { topic: "The appeal of CRT monitors for retro gaming", category: "Display", resourceType: "general" },
  { topic: "Basic photography tips for vintage digital cameras", category: "Photography", resourceType: "tutorial" },
  { topic: "Developing film at home (basic guide)", category: "Photography", resourceType: "tutorial" },
  { topic: "Understanding film types and formats (35mm, 120, APS)", category: "Photography", resourceType: "general" },
  { topic: "The history of instant cameras (Polaroid, Fuji Instax)", category: "Photography", resourceType: "general" },
  { topic: "Repairing a jammed film advance mechanism on an old camera", category: "Photography", resourceType: "tutorial" },
  { topic: "How to use a light meter with vintage cameras", category: "Photography", resourceType: "tutorial" },
  { topic: "Troubleshooting common issues with vintage camera flashes", category: "Photography", resourceType: "tutorial" },
  { topic: "The evolution of mobile phone cameras", category: "Mobile Tech", resourceType: "general" },
  { topic: "Review of classic mobile games (e.g., Snake, Space Impact)", category: "Gaming", resourceType: "general" },
  { topic: "Optimizing vintage PCs for speed", category: "Computing", resourceType: "tutorial" },
  { topic: "Building a retro gaming cabinet from scratch", category: "Gaming", resourceType: "tutorial" },
  { topic: "Understanding the different revisions of game consoles", category: "Gaming", resourceType: "general" },
  { topic: "Guide to finding replacement parts for retro electronics", category: "General", resourceType: "general" },
  { topic: "The impact of online communities on retro collecting", category: "General", resourceType: "general" },
  { topic: "Basic electrical safety for retro repair projects", category: "Hardware", resourceType: "general" },
  { topic: "How to clean and restore vinyl records without a machine", category: "Audio", resourceType: "tutorial" },
  { topic: "Troubleshooting audio output issues on vintage consoles", category: "Gaming", resourceType: "tutorial" },
  { topic: "Guide to modding console shells for custom designs", category: "Gaming", resourceType: "tutorial" },
  { topic: "The best retro gaming accessories you need to find", category: "Gaming", resourceType: "general" },
  { topic: "Understanding vintage audio formats (8-track, MiniDisc)", category: "Audio", resourceType: "general" },
  { topic: "The history and evolution of portable gaming devices", category: "Gaming", resourceType: "general" },
  { topic: "Basic network setup for vintage computers", category: "Computing", resourceType: "tutorial" },
  { topic: "Setting up a retro LAN party", category: "Gaming", resourceType: "tutorial" },
  { topic: "The use of floppy emulators in retro computing", category: "Computing", resourceType: "hardware" }, // Hardware for emulator
  { topic: "Restoring magnetic tape data (e.g., reel-to-reel, data cassettes)", category: "Computing", resourceType: "tutorial" },
  { topic: "Understanding early computer viruses and malware", category: "Computing", resourceType: "general" },
  { topic: "The impact of early home computing on society", category: "Computing", resourceType: "general" },
  { topic: "Collecting rare and obscure retro consoles", category: "Gaming", resourceType: "general" },
  { topic: "Basic diagnostics for a non-booting vintage computer", category: "Computing", resourceType: "tutorial" },
  { topic: "Repairing scratches on game discs (CD, DVD based consoles)", category: "Gaming", resourceType: "tutorial" },
  { topic: "Replacing the optical drive in a PlayStation 1", category: "Gaming", resourceType: "tutorial" },
  { topic: "Guide to making custom console cables (e.g., RGB SCART)", category: "Hardware", resourceType: "tutorial" },
  { topic: "The cultural significance of dial-up internet", category: "Computing", resourceType: "general" },
  { topic: "Modding a Game Boy Advance with a backlit screen", category: "Gaming", resourceType: "tutorial" },
  { topic: "Building a dedicated retro gaming PC", category: "Computing", resourceType: "tutorial" },
  { topic: "Understanding region locking in vintage consoles", category: "Gaming", resourceType: "general" },
  { topic: "The art of collecting vintage video game boxes and manuals", category: "Gaming", resourceType: "general" },
  { topic: "Basic cleaning for vintage computer keyboards", category: "Computing", resourceType: "tutorial" },
  { topic: "Replacing keycaps on an old mechanical keyboard", category: "Computing", resourceType: "tutorial" },
  { topic: "The history and evolution of video game magazines", category: "Gaming", resourceType: "general" },
  { topic: "Guide to setting up a vintage arcade machine", category: "Gaming", resourceType: "manual" },
  { topic: "Repairing a broken arcade joystick microswitch", category: "Gaming", resourceType: "tutorial" },
  { topic: "Understanding the differences between NTSC, PAL, and SECAM displays", category: "Display", resourceType: "general" },
  { topic: "Calibrating colors on a vintage CRT monitor", category: "Display", resourceType: "tutorial" },
  { topic: "The impact of shareware and public domain games", category: "Gaming", resourceType: "general" },
  { topic: "How to backup game saves from old memory cards", category: "Gaming", resourceType: "tutorial" },
  { topic: "Troubleshooting audio hum in vintage stereo equipment", category: "Audio", resourceType: "tutorial" },
  { topic: "The history and appeal of vintage radio sets", category: "Audio", resourceType: "general" },
  { topic: "Basic repair of a vintage alarm clock radio", category: "Electronics", resourceType: "tutorial" },
  { topic: "Understanding vintage printer technologies (dot matrix, inkjet)", category: "Computing", resourceType: "general" },
  { topic: "How to replace toner in an old laser printer", category: "Computing", resourceType: "tutorial" },
  { topic: "Guide to finding drivers for vintage computer hardware", category: "Computing", resourceType: "software" },
  { topic: "The cultural impact of early internet forums and bulletin boards", category: "Computing", resourceType: "general" },
  { topic: "Setting up a local web server on an old PC", category: "Computing", resourceType: "tutorial" },
  { topic: "The history of video game console wars", category: "Gaming", resourceType: "general" },
  { topic: "Appreciating the sound design of classic 8-bit games", category: "Gaming", resourceType: "general" },
  { topic: "Basic maintenance for vintage projection TVs", category: "Display", resourceType: "tutorial" },
  { topic: "Troubleshooting color issues on old CRT televisions", category: "Display", resourceType: "tutorial" },
  { topic: "The evolution of portable music players", category: "Audio", resourceType: "general" },
  { topic: "Understanding different headphone driver types (dynamic, planar magnetic)", category: "Audio", resourceType: "general" },
  { topic: "Repairing frayed headphone cables", category: "Audio", resourceType: "tutorial" },
  { topic: "Modding vintage headphones with new drivers", category: "Audio", resourceType: "tutorial" },
  { topic: "The impact of early digital photography", category: "Photography", resourceType: "general" },
  { topic: "Guide to cleaning CCD/CMOS sensors on older digital cameras", category: "Photography", resourceType: "tutorial" },
  { topic: "Using external flashes with vintage cameras", category: "Photography", resourceType: "tutorial" },
  { topic: "The history of point-and-shoot cameras", category: "Photography", resourceType: "general" },
  { topic: "Troubleshooting battery drain on older digital cameras", category: "Photography", resourceType: "tutorial" },
  { topic: "Basic repair of an old camera lens focus ring", category: "Photography", resourceType: "tutorial" },
  { topic: "Understanding different types of film (slide, print, black & white)", category: "Photography", resourceType: "general" },
  { topic: "Guide to developing black and white film at home", category: "Photography", resourceType: "tutorial" },
  { topic: "The history of mobile phone design", category: "Mobile Tech", resourceType: "general" },
  { topic: "Review of classic mobile phones (e.g., Motorola Razr, Sony Ericsson Walkman)", category: "Mobile Tech", resourceType: "general" },
  { topic: "Modding old phones with custom firmware (e.g., Symbian, Windows Mobile)", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "Repairing a broken antenna on a vintage cell phone", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "The cultural impact of flip phones", category: "Mobile Tech", resourceType: "general" },
  { topic: "Setting up an old phone for modern use (e.g., Wi-Fi Hotspot)", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "Troubleshooting charging issues on vintage mobile devices", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "Guide to data transfer from old phones to new devices", category: "Mobile Tech", resourceType: "tutorial" },
  { topic: "The history of wearable technology (early smartwatches)", category: "Wearable Tech", resourceType: "general" },
  { topic: "Repairing a cracked screen on a vintage digital watch", category: "Wearable Tech", resourceType: "tutorial" },
  { topic: "Modding a Casio calculator with custom programs", category: "Computing", resourceType: "tutorial" },
  { topic: "Understanding the limitations of vintage smartwatches", category: "Wearable Tech", resourceType: "general" },
  { topic: "The process of de-yellowing retro plastics (advanced guide)", category: "General", resourceType: "tutorial" },
  { topic: "Basic PCB troubleshooting for electronics repair", category: "Hardware", resourceType: "tutorial" },
  { topic: "Understanding surface-mount device (SMD) repair basics", category: "Hardware", resourceType: "tutorial" },
  { topic: "Guide to using a multimeter for electronics diagnostics", category: "Hardware", resourceType: "manual" },
  { topic: "The history of microcontrollers in retro devices", category: "Hardware", resourceType: "general" },
  { topic: "Repairing cold solder joints on vintage circuit boards", category: "Hardware", resourceType: "tutorial" },
  { topic: "Identifying different types of capacitors for replacement", category: "Hardware", resourceType: "manual" },
  { topic: "The impact of open-source software on retro computing", category: "Computing", resourceType: "general" },
  { topic: "Setting up a custom Linux distribution on older hardware", category: "Computing", resourceType: "software" },
  { topic: "Review of classic retro PC accessories (e.g., trackballs, joysticks)", category: "Computing", resourceType: "general" },
  { topic: "The history and significance of the Intel 8088 processor", category: "Computing", resourceType: "general" },
  { topic: "Basic guide to installing an operating system from floppy disk", category: "Computing", resourceType: "tutorial" },
  { topic: "Troubleshooting RAM issues in vintage computers", category: "Computing", resourceType: "tutorial" },
  { topic: "The history of video game character design", category: "Gaming", resourceType: "general" },
  { topic: "Review of the Sega Dreamcast game library", category: "Gaming", resourceType: "general" },
  { topic: "Modding a PlayStation 2 for network gaming", category: "Gaming", resourceType: "tutorial" },
  { topic: "Repairing stick drift on Nintendo 64 controllers", category: "Gaming", resourceType: "tutorial" },
  { topic: "The evolution of video game storytelling", category: "Gaming", resourceType: "general" },
  { topic: "Guide to preserving retro video game cartridges", category: "Gaming", resourceType: "general" },
  { topic: "Building custom arcade joysticks for retro consoles", category: "Gaming", resourceType: "tutorial" },
  { topic: "The history of portable DVD players", category: "Video", resourceType: "general" },
  { topic: "Review of classic Super 8 film projectors", category: "Video", resourceType: "general" },
  { topic: "Repairing a broken lamp in a vintage projector", category: "Video", resourceType: "tutorial" },
  { topic: "Converting Super 8 film to digital", category: "Video", resourceType: "tutorial" },
  { topic: "The history of vintage camcorders (VHS-C, 8mm, Hi8)", category: "Video", resourceType: "general" },
  { topic: "Review of iconic camcorder models (e.g., Sony Handycam)", category: "Video", resourceType: "general" },
  { topic: "Repairing a jammed tape mechanism in a camcorder", category: "Video", resourceType: "tutorial" },
  { topic: "Troubleshooting audio recording issues on old camcorders", category: "Video", resourceType: "tutorial" },
  { topic: "The history of vintage audio receivers and amplifiers", category: "Audio", resourceType: "general" },
  { topic: "Review of classic solid-state amplifiers", category: "Audio", resourceType: "general" },
  { topic: "Troubleshooting distortion in vintage amplifiers", category: "Audio", resourceType: "tutorial" },
  { topic: "Replacing potentiometers in old audio equipment", category: "Audio", resourceType: "tutorial" },
  { topic: "The history of vintage microphones", category: "Audio", resourceType: "general" },
  { topic: "Review of classic dynamic microphones (e.g., Shure SM58)", category: "Audio", resourceType: "general" },
  { topic: "Repairing a faulty cable on a vintage microphone", category: "Audio", resourceType: "tutorial" },
  { topic: "Modding vintage microphones for modern recording", category: "Audio", resourceType: "tutorial" },
  { topic: "The history of vintage synthesizers", category: "Audio", resourceType: "general" },
  { topic: "Review of iconic analog synthesizers (e.g., Moog Minimoog)", category: "Audio", resourceType: "general" },
  { topic: "Troubleshooting key contact issues on vintage synthesizers", category: "Audio", resourceType: "tutorial" },
  { topic: "Modding a vintage synth with MIDI capabilities", category: "Audio", resourceType: "tutorial" },
  { topic: "The history of vintage drum machines", category: "Audio", resourceType: "general" },
  { topic: "Review of classic drum machines (e.g., Roland TR-808)", category: "Audio", resourceType: "general" },
  { topic: "Repairing faulty pads on old drum machines", category: "Audio", resourceType: "tutorial" },
  { topic: "Modding a drum machine for individual outputs", category: "Audio", resourceType: "tutorial" },
  { topic: "The history of vintage hi-fi systems", category: "Audio", resourceType: "general" },
  { topic: "Review of classic component stereo systems", category: "Audio", resourceType: "general" },
  { topic: "Troubleshooting power issues in vintage hi-fi equipment", category: "Audio", resourceType: "tutorial" },
  { topic: "Connecting a vintage hi-fi system to smart speakers", category: "Audio", resourceType: "tutorial" },
  { topic: "The history of vintage guitar amplifiers", category: "Audio", resourceType: "general" },
  { topic: "Review of classic tube guitar amps", category: "Audio", resourceType: "general" },
  { topic: "Replacing vacuum tubes in a guitar amplifier", category: "Audio", resourceType: "tutorial" },
  { topic: "Troubleshooting hum and buzz in vintage guitar amps", category: "Audio", resourceType: "tutorial" },
  { topic: "The history of vintage car audio systems", category: "Audio", resourceType: "general" },
  { topic: "Review of classic car stereos (e.g., cassette decks)", category: "Audio", resourceType: "general" },
  { topic: "Repairing a stuck cassette in a vintage car stereo", category: "Audio", resourceType: "tutorial" },
  { topic: "Modding a vintage car stereo with aux input", category: "Audio", resourceType: "tutorial" }
];


// Main seeding function
const seedDatabase = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected for seeding!');

    let existingUser = await User.findOne({ username: 'RetroTechFan' });
    if (!existingUser) {
      existingUser = new User({
        username: 'SeederUser',
        email: 'seeder@example.com',
        password: 'dummy_hashed_password'
      });
      await existingUser.save();
      console.log('Created a new SeederUser for guide authorship.');
    }
    const authorId = existingUser._id;

    console.log('Clearing existing guides...');
    // IMPORTANT: Temporarily comment out the line below to resume seeding without clearing
    // await Guide.deleteMany({}); // Clear all existing guides

    console.log('Seeding initial manual guides...');
    for (const guideData of sampleGuides) {
      const guide = new Guide({
        ...guideData,
        author: authorId,
        slug: slugify(guideData.title, { lower: true, strict: true })
      });
      // This will attempt to save. If slug already exists (from a previous partial run),
      // it will throw a unique index error, which is caught by the outer try/catch.
      // This is generally fine for resuming, as it means the guide already exists.
      try {
        await guide.save();
      } catch (saveError) {
        if (saveError.code === 11000) { // Duplicate key error code
          console.warn(`Skipping manual guide "${guide.title}" due to duplicate slug.`);
        } else {
          throw saveError; // Re-throw other errors
        }
      }
    }
    console.log(`Attempted to seed ${sampleGuides.length} manual guides.`);

    console.log('Generating and seeding LLM-generated guides...');
    for (const llmTopic of llmTopics) {
      // Check if a guide with this slug already exists before trying to generate content
      const potentialSlug = slugify(llmTopic.topic, { lower: true, strict: true });
      const existingGuideBySlug = await Guide.findOne({ slug: potentialSlug });

      if (existingGuideBySlug) {
        console.log(`Skipping LLM topic "${llmTopic.topic}" as guide with slug "${potentialSlug}" already exists.`);
        continue; // Skip to the next topic
      }

      const generatedContent = await generateGuideContentWithLLM(llmTopic.topic, llmTopic.category, llmTopic.resourceType);
      // The generateGuideContentWithLLM function now handles its own retries.
      // The `if (!generatedContent.startsWith('Error generating content'))` check 
      // will still correctly handle cases where the content couldn't be generated after all retries.
      if (!generatedContent.startsWith('Failed to generate content')) { // Changed check to match the new error message
        const generatedTitle = llmTopic.topic.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        const generatedSlug = slugify(generatedTitle, { lower: true, strict: true });

        let uniqueSlug = generatedSlug;
        let counter = 1;
        while (await Guide.findOne({ slug: uniqueSlug })) {
          uniqueSlug = `${generatedSlug}-${counter}`;
          counter++;
        }

        const guide = new Guide({
          title: generatedTitle,
          description: `An LLM-generated guide on ${llmTopic.topic}.`,
          content: generatedContent,
          resourceType: llmTopic.resourceType, // Save the LLM generated resource type
          category: llmTopic.category,
          tags: llmTopic.topic.split(' ').map(t => t.toLowerCase()),
          author: authorId,
          slug: uniqueSlug
        });
        await guide.save();
        console.log(`Seeded LLM guide: ${generatedTitle} (Type: ${llmTopic.resourceType})`);
      }
      // Removed the fixed 1-second pause here, as the retry logic handles dynamic delays.
      // The overall loop will still progress topic-by-topic.
    }
    console.log(`Attempted to seed ${llmTopics.length} LLM-generated guides.`);


    console.log('Database seeding process completed!');
  } catch (error) {
    console.error('Fatal error during database seeding:', error);
    process.exit(1);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected from seeder.');
  }
};

seedDatabase();
