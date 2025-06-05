import mongoose from 'mongoose';
import SiteContent from './src/models/siteContentModel.js'; // Adjust path if necessary
import dotenv from 'dotenv';

dotenv.config({ path: './.env.production' }); // Or .env.development depending on your environment

// ----- CONFIGURATION -----
// Using the same MONGO_URI as the update script, assuming it's correctly set there or in .env
const MONGO_URI = process.env.MONGODB_URI_PROD || 'mongodb+srv://hoang:Ab1234567@dataweb.bptnx.mongodb.net/test?retryWrites=true&w=majority&appName=DataWeb';

const typesToInspect = ['about', 'header', 'footer'];

async function inspectContentStructure() {
    if (MONGO_URI === 'mongodb+srv://hoang:Ab1234567@dataweb.bptnx.mongodb.net/test?retryWrites=true&w=majority&appName=DataWeb' && !process.env.MONGODB_URI_PROD) {
        // This check is a bit redundant if the URI is hardcoded above but good for consistency
        // If you have a different placeholder for MONGO_URI in your actual .env or update script, adjust this check.
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected for inspection.');

        for (const type of typesToInspect) {
            console.log(`\n--- Inspecting content structure for type: ${type} ---`);
            const doc = await SiteContent.findOne({ type });

            if (doc) {
                if (doc.content) {
                    console.log(`Full content object for ${type}:`);
                    console.log(JSON.stringify(doc.content, null, 2));
                    if (doc.content.vi) {
                        console.log(`\nStructure of 'content.vi' for ${type}:`);
                        console.log(JSON.stringify(doc.content.vi, null, 2));
                    } else {
                        console.log(`'content.vi' not found for ${type}.`);
                    }
                } else {
                    console.log(`Document for ${type} found, but 'content' field is missing or null.`);
                }
            } else {
                console.log(`Document for type "${type}" not found.`);
            }
        }

    } catch (error) {
        console.error('Error during content inspection:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nMongoDB Disconnected after inspection.');
    }
}

inspectContentStructure();
