// server/seeders/seedCommunityPosts.js
require('dotenv').config({ path: './.env' }); // Load .env from the server directory
const mongoose = require('mongoose');
const User = require('../models/User');
const ForumPost = require('../models/ForumPost');
const slugify = require('slugify'); // Re-add slugify if needed for post titles, though not used for images

let fetch;
const nodeMajorVersion = parseInt(process.versions.node.split('.')[0], 10);
if (nodeMajorVersion >= 18) {
  fetch = globalThis.fetch;
} else {
  try {
    const nodeFetchModule = require('node-fetch');
    fetch = nodeFetchModule.default || nodeFetchModule;
  } catch (e) {
    console.error("Critical Error: 'node-fetch' is required for Node.js versions older than v18, but it's not installed or failed to load.");
    process.exit(1);
  }
}
if (typeof fetch !== 'function') {
  console.error("Critical Error: 'fetch' API is not available. Please ensure 'node-fetch' is installed (npm install node-fetch) or use Node.js v18+ for native fetch support.");
  process.exit(1);
}

const mongoURI = process.env.MONGO_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// --- Generic API Caller with Retry Logic (for Gemini) ---
async function callApiWithRetry(apiUrl, payload, options = {}, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        ...options
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          console.error(`Full API Error Response (Attempt ${i + 1}/${retries}, Non-JSON): ${errorText}`);
          errorJson = { error: { message: errorText || 'Unknown API error (non-JSON response)' } };
        }

        if (errorJson.error) {
            console.error(`Full API Error Response (Attempt ${i + 1}/${retries}):`, JSON.stringify(errorJson, null, 2));
        }

        if (response.status === 429 || response.status === 503) {
          const retryAfter = errorJson.error?.details?.find(d => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo')?.retryDelay;
          const retryDelayMs = retryAfter ? parseInt(retryAfter.replace('s', '')) * 1000 : delay * (2 ** i) + Math.random() * 1000;
          
          console.warn(`Attempt ${i + 1}/${retries}: API error ${response.status}. Retrying in ${retryDelayMs / 1000}s. Message: ${errorJson.error?.message || 'No specific error message.'}`);
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          continue;
        } else {
          throw new Error(`API error: ${response.status} - ${errorJson.error?.message || 'Unknown error. Check full error log above.'}`);
        }
      }

      return await response.json();

    } catch (error) {
      console.error(`Error calling API (${apiUrl}):`, error.message);
      if (i < retries - 1) {
        const retryDelayMs = delay * (2 ** i) + Math.random() * 1000;
        console.warn(`Attempt ${i + 1}/${retries}: Network or unexpected error. Retrying in ${retryDelayMs / 1000}s.`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Failed to call API (${apiUrl}) after ${retries} attempts.`);
}


// --- Generate Forum Post Content using Gemini ---
async function generatePostContent(topic, category) {
  const prompt = `Generate a compelling and engaging forum post about "${topic}" in the category of "${category}". The post should be at least 200 words.
  Provide the output in JSON format with the following structure:
  {
    "title": "Generated Post Title",
    "content": "Detailed post content...",
    "tags": ["tag1", "tag2"],
    "category": "Selected Category"
  }
  Ensure the content is well-formatted for a forum (e.g., paragraphs, lists). Keep the title engaging.`;

  console.log(`Generating content for forum post: "${topic}"...`);

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          content: { type: "STRING" },
          tags: { type: "ARRAY", items: { type: "STRING" } },
          category: { type: "STRING" }
        },
        required: ["title", "content", "tags", "category"]
      }
    }
  };

  try {
    const result = await callApiWithRetry(GEMINI_API_URL, payload);
    const jsonString = result.candidates[0].content.parts[0].text;
    const postData = JSON.parse(jsonString);
    console.log(`Successfully generated content for: "${postData.title}"`);
    return postData;
  } catch (error) {
    console.error(`Error generating post content for "${topic}":`, error.message);
    return {
      title: `Failed to Generate: ${topic}`,
      content: `Failed to generate content for this post. Error: ${error.message}`,
      tags: ['error', 'generation'],
      category: category
    };
  }
}

// --- Generate Placeholder Image URL ---
function generatePlaceholderImageUrl(topic) {
  // Simple slugification for the text on the image
  const text = encodeURIComponent(topic.replace(/\s+/g, ' ').trim().substring(0, 20)); // Max 20 chars for text
  // Return a URL for a 512x512 image, with a random background color (for visual variety) and white text
  const colors = ['FF5733', '33FF57', '3357FF', 'FF33A1', 'A133FF', 'FF8C33', '33FF8C', '8C33FF'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  return `https://placehold.co/512x512/${randomColor}/FFFFFF?text=${text}`;
}

const communityPostTopics = [
  { topic: "My first retro console restoration project: A Game Boy DMG-01", category: "Restoration Logs" },
  { topic: "Tips for cleaning yellowed plastics (RetroBrite results!)", category: "Restoration Logs" },
  { topic: "What's your go-to CRT setup for retro gaming?", category: "General Discussion" },
  { topic: "Show off your vintage audio collection!", category: "Showcase" },
  { topic: "Troubleshooting: My NES won't power on, looking for advice.", category: "Troubleshooting" },
  { topic: "Building a custom arcade cabinet from scratch", category: "DIY Projects" },
  { topic: "Favorite hidden gems on the Sega Dreamcast", category: "Gaming" },
  { topic: "Just picked up an IBM PC/XT, what should I do first?", category: "Retro Computing" },
  { topic: "The best cheap tools for electronics repair", category: "Tools & Equipment" },
  { topic: "Poll: Vinyl vs. Cassette Tapes - which has more charm?", category: "General Discussion" },
  { topic: "My latest thrift store find: A working Sony Walkman!", category: "Thrift Finds" },
  { topic: "Recapping a Commodore 64 - my painful but rewarding journey", category: "Restoration Logs" },
  { topic: "Looking for resources on vintage camera lens repair", category: "Photography" },
  { topic: "Discussing the impact of early mobile phones on society", category: "Mobile Tech" },
  { topic: "Review: The legendary Nokia 3310 - still indestructible?", category: "Mobile Tech" },
  { topic: "How to safely store old floppy disks and magnetic media", category: "Preservation" },
  { topic: "My favorite DOS games from the early 90s", category: "Retro Computing" },
  { topic: "Comparing emulators: RetroArch vs. standalones", category: "Gaming" },
  { topic: "The beauty of pixel art in modern indie games", category: "Gaming" },
  { topic: "DIY: Turning an old laptop into a retro gaming machine", category: "DIY Projects" },
  { topic: "Question about sourcing replacement parts for a vintage stereo receiver", category: "Troubleshooting" },
  { topic: "Show us your retro gaming room setup!", category: "Showcase" },
  { topic: "The nostalgia of old operating system startup sounds", category: "General Discussion" },
  { topic: "Is it worth modding a PlayStation 1 for optical drive emulation?", category: "Gaming" },
  { topic: "Guide: Basic desoldering techniques for beginners", category: "Tutorials" },
  { topic: "Exploring the history of early internet bulletin board systems (BBS)", category: "Retro Computing" },
  { topic: "My obsession with vintage digital watches: Casio F-91W and beyond", category: "Wearable Tech" },
  { topic: "What makes a game \"retro\"? Defining the term.", category: "General Discussion" },
  { topic: "Repairing stick drift on a Nintendo 64 controller: A how-to", category: "Troubleshooting" },
  { topic: "The charm of old school PC cases and tower builds", category: "Retro Computing" },
  { topic: "Just bought a vintage camcorder, any tips for transferring footage?", category: "Video" },
  { topic: "The importance of backing up old game saves", category: "Preservation" },
  { topic: "Collecting old electronics advertisements and brochures", category: "Collecting" },
  { topic: "Which retro console had the best controller design?", category: "Gaming" },
  { topic: "My latest project: Building a custom mechanical keyboard with vintage switches", category: "DIY Projects" },
  { topic: "Seeking advice on fixing a broken tape deck mechanism", category: "Troubleshooting" },
  { topic: "The unsung heroes: Underrated retro peripherals", category: "General Discussion" },
  { topic: "Review: The tactile joy of a vintage typewriter", category: "General Discussion" },
  { topic: "Building a powerful retro PC for Windows 98 gaming", category: "Retro Computing" },
  { topic: "My favorite chiptune artists and how they make their music", category: "Audio" },
  { topic: "Disassembling a classic iPod (1st Gen) for battery replacement", category: "Restoration Logs" },
  { topic: "The challenges of connecting vintage computers to modern displays", category: "Troubleshooting" },
  { topic: "Share your most bizarre retro tech finds!", category: "Thrift Finds" },
  { topic: "Tips for photographing your retro collection (lighting, setup)", category: "Photography" },
  { topic: "The evolution of mobile phone ringtones", category: "Mobile Tech" },
  { topic: "What's the best way to get rid of dust in old electronics?", category: "Restoration Logs" },
  { topic: "A tribute to the lost art of the video rental store (Blockbuster memories)", category: "General Discussion" },
  { topic: "The appeal of monochrome displays in retro handhelds", category: "Gaming" },
  { topic: "My journey into vintage radio restoration", category: "Audio" },
  { topic: "Advice needed: My CRT monitor has weird color issues", category: "Troubleshooting" },
  { topic: "First steps in restoring an old tube amplifier", category: "Restoration Logs" },
  { topic: "Emulating classic Macintosh games on modern macOS", category: "Retro Computing" },
  { topic: "Best practices for calibrating vintage joysticks", category: "Tutorials" },
  { topic: "Show us your compact disc (CD) collection!", category: "Showcase" },
  { topic: "Is it safe to use old power adapters with new retro consoles?", category: "Safety" },
  { topic: "Learning about early computer programming languages (BASIC, FORTRAN)", category: "Retro Computing" },
  { topic: "My experience setting up a multi-boot DOS/Windows 95 PC", category: "Retro Computing" },
  { topic: "How to fix a stuck cassette in an old car stereo", category: "Troubleshooting" },
  { topic: "The charm of old school PC cases and tower builds", category: "Retro Computing" },
  { topic: "Just bought a vintage camcorder, any tips for transferring footage?", category: "Video" },
  { topic: "The importance of backing up old game saves", category: "Preservation" },
  { topic: "Collecting old electronics advertisements and brochures", category: "Collecting" },
  { topic: "Which retro console had the best controller design?", category: "Gaming" },
  { topic: "My latest project: Building a custom mechanical keyboard with vintage switches", category: "DIY Projects" },
  { topic: "Seeking advice on fixing a broken tape deck mechanism", category: "Troubleshooting" },
  { topic: "The unsung heroes: Underrated retro peripherals", category: "General Discussion" },
  { topic: "Review: The tactile joy of a vintage typewriter", category: "General Discussion" },
  { topic: "Building a powerful retro PC for Windows 98 gaming", category: "Retro Computing" },
  { topic: "My favorite chiptune artists and how they make their music", category: "Audio" },
  { topic: "Disassembling a classic iPod (1st Gen) for battery replacement", category: "Restoration Logs" },
  { topic: "The challenges of connecting vintage computers to modern displays", category: "Troubleshooting" },
  { topic: "Share your most bizarre retro tech finds!", category: "Thrift Finds" },
  { topic: "Tips for photographing your retro collection (lighting, setup)", category: "Photography" },
  { topic: "The evolution of mobile phone ringtones", category: "Mobile Tech" },
  { topic: "What's the best way to get rid of dust in old electronics?", category: "Restoration Logs" },
  { topic: "A tribute to the lost art of the video rental store (Blockbuster memories)", category: "General Discussion" },
  { topic: "The appeal of monochrome displays in retro handhelds", category: "Gaming" },
  { topic: "My journey into vintage radio restoration", category: "Audio" },
  { topic: "Advice needed: My CRT monitor has weird color issues", category: "Troubleshooting" },
  { topic: "Best ways to preserve old video game boxes and manuals", category: "Preservation" },
  { topic: "Finding drivers for vintage graphics cards in Windows XP", category: "Retro Computing" },
  { topic: "My experience with Recalbox for Raspberry Pi retro gaming", category: "Gaming" },
  { topic: "Showcase: My restored Nokia 3310 collection", category: "Showcase" },
  { topic: "The charm and pitfalls of early digital cameras", category: "Photography" },
  { topic: "Tips for safely desoldering components on old PCBs", category: "Tutorials" },
  { topic: "What's your favorite retro game soundtrack?", category: "Gaming" },
  { topic: "The cultural impact of the Walkman", category: "Audio" },
  { topic: "Modding a Game Boy Advance with a backlit screen", category: "DIY Projects" },
  { topic: "Troubleshooting common power supply issues in vintage consoles", category: "Troubleshooting" },
  { topic: "Exploring the hidden features of early graphing calculators", category: "Retro Computing" },
  { topic: "DIY: Creating custom labels for your game cartridges", category: "DIY Projects" },
  { topic: "The history of video game console 'wars'", category: "Gaming" },
  { topic: "Advice on fixing buzzing/humming sounds in vintage speakers", category: "Troubleshooting" },
  { topic: "My journey collecting retro PC magazines", category: "Collecting" },
  { topic: "The enduring appeal of floppy disks", category: "General Discussion" },
  { topic: "Comparing different types of CRT monitors for retro gaming", category: "Display" },
  { topic: "Guide to setting up a local network for vintage computers", category: "Retro Computing" },
  { topic: "My most challenging retro repair story (and how I fixed it!)", category: "Restoration Logs" },
  { topic: "Best practices for using old capacitors in new builds", category: "Safety" },
  { topic: "The surprising power of 8-bit processors", category: "Retro Computing" },
  { topic: "Collecting vintage alarm clocks with interesting features", category: "Collecting" },
  { topic: "Troubleshooting: My vintage VCR eats tapes!", category: "Troubleshooting" },
  { topic: "How to clean and lubricate old game console disc drives", category: "Tutorials" },
  { topic: "The evolution of computer mice", category: "General Discussion" },
  { topic: "My favorite retro computing forums and communities", category: "Community Resources" },
  { topic: "Building a media center PC from a decommissioned desktop", category: "DIY Projects" },
  { topic: "The charm of old school PC cases and tower builds", category: "Retro Computing" },
  { topic: "Just bought a vintage camcorder, any tips for transferring footage?", category: "Video" },
  { topic: "The importance of backing up old game saves", category: "Preservation" },
  { topic: "Collecting old electronics advertisements and brochures", category: "Collecting" },
  { topic: "Which retro console had the best controller design?", category: "Gaming" },
  { topic: "My latest project: Building a custom mechanical keyboard with vintage switches", category: "DIY Projects" },
  { topic: "Seeking advice on fixing a broken tape deck mechanism", category: "Troubleshooting" },
  { topic: "The unsung heroes: Underrated retro peripherals", category: "General Discussion" },
  { topic: "Review: The tactile joy of a vintage typewriter", category: "General Discussion" },
  { topic: "Building a powerful retro PC for Windows 98 gaming", category: "Retro Computing" },
  { topic: "My favorite chiptune artists and how they make their music", category: "Audio" },
  { topic: "Disassembling a classic iPod (1st Gen) for battery replacement", category: "Restoration Logs" },
  { topic: "The challenges of connecting vintage computers to modern displays", category: "Troubleshooting" },
  { topic: "Share your most bizarre retro tech finds!", category: "Thrift Finds" },
  { topic: "Tips for photographing your retro collection (lighting, setup)", category: "Photography" },
  { topic: "The evolution of mobile phone ringtones", category: "Mobile Tech" },
  { topic: "What's the best way to get rid of dust in old electronics?", category: "Restoration Logs" },
  { topic: "A tribute to the lost art of the video rental store (Blockbuster memories)", category: "General Discussion" },
  { topic: "The appeal of monochrome displays in retro handhelds", category: "Gaming" },
  { topic: "My journey into vintage radio restoration", category: "Audio" },
  { topic: "Advice needed: My CRT monitor has weird color issues", category: "Troubleshooting" }
];


// Main seeding function for Community Posts
const seedCommunityPosts = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected for seeding community posts!');

    let seederUser = await User.findOne({ username: 'SeederUser' });
    if (!seederUser) {
      seederUser = new User({
        username: 'SeederUser',
        email: 'seeder_community@example.com',
        password: 'dummy_hashed_password'
      });
      await seederUser.save();
      console.log('Created a new SeederUser for community post authorship.');
    }
    const authorId = seederUser._id;

    console.log('Starting to seed LLM-generated community posts...');
    let seededCount = 0;
    for (const postTopic of communityPostTopics) {
      const existingPost = await ForumPost.findOne({ title: postTopic.topic });

      if (existingPost) {
        console.log(`Skipping community post "${postTopic.topic}" as it already exists.`);
        continue;
      }

      let postData;
      // Generate placeholder image URL instead of calling Imagen API
      const imageUrl = generatePlaceholderImageUrl(postTopic.topic);

      try {
        postData = await generatePostContent(postTopic.topic, postTopic.category);
      } catch (apiError) {
        console.error(`Failed to generate text content for "${postTopic.topic}" after all retries:`, apiError.message);
        postData = {
            title: `Failed to Generate: ${postTopic.topic}`,
            content: `Could not generate text content for this post due to API error: ${apiError.message}`,
            tags: ['error', 'generation'],
            category: postTopic.category
        };
      }

      if (postData.title && postData.content) {
        const forumPost = new ForumPost({
          title: postData.title,
          content: postData.content,
          author: authorId,
          category: postData.category || postTopic.category,
          tags: postData.tags || [],
          images: [imageUrl] // Use the placeholder image URL
        });

        try {
          await forumPost.save();
          seededCount++;
          console.log(`Seeded community post: "${forumPost.title}"`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Small pause between posts
        } catch (saveError) {
          if (saveError.code === 11000) {
            console.warn(`Skipping saving post "${postData.title}" due to duplicate title.`);
          } else {
            console.error(`Error saving community post "${postData.title}":`, saveError.message);
          }
        }
      }
    }
    console.log(`Completed seeding of community posts. Total new posts seeded: ${seededCount}`);
    console.log(`Attempted to seed ${communityPostTopics.length} total topics.`);

  } catch (error) {
    console.error('Fatal error during community post seeding:', error);
    process.exit(1);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB disconnected from community post seeder.');
  }
};

seedCommunityPosts();
