import * as wc from '@layr-labs/agentkit-witnesschain';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Verify required environment variables are present
if (!process.env.WITNESSCHAIN_API_URL || !process.env.WITNESSCHAIN_BLOCKCHAIN_API_URL || !process.env.WITNESSCHAIN_PRIVATE_KEY) {
    throw new Error('Missing required environment variables. Please check your .env file has WITNESSCHAIN_API_URL, WITNESSCHAIN_BLOCKCHAIN_API_URL, and WITNESSCHAIN_PRIVATE_KEY');
}

const witnesschain_client = new wc.WitnesschainAdapter(
	process.env.WITNESSCHAIN_API_URL,
	process.env.WITNESSCHAIN_BLOCKCHAIN_API_URL,
	process.env.WITNESSCHAIN_PRIVATE_KEY
);

// Logging utility
function log(type: 'info' | 'error' | 'success', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const prefix = {
        info: '📝',
        error: '❌',
        success: '✅'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    if (data) {
        console.log('  └─>', data);
    }
}

async function SLEEP(for_seconds: number)
{
	await new Promise((sx) => {setTimeout(sx, for_seconds*1000);});
}


async function downloadImage(url: string, filepath: string): Promise<void> {
  const response = await axios({
    url,
    responseType: 'stream',
  });
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

const LATITUDE		= 37.441023;  // Stanford University latitude
const LONGITUDE		= -122.12686; // Stanford University longitude
const MY_CAMPAIGN	= "TreeHacks 2025 - Gaj";

async function main()
{
	const logged_in = await witnesschain_client.login();

	let	since		= null;
	const	analyzed_photos: { [key: string]: boolean } = {};

	if (! logged_in)
	{
		log('error', 'Could not login to witnesschain');
		return;
	}

	log('success', 'Successfully logged in to witnesschain');

	// Create a campaign if it does not exist

	const existing_campaigns	= await witnesschain_client.getCampaigns();
	const campaign_exist		= existing_campaigns.some((v: any) => v.id === MY_CAMPAIGN);

	if (! campaign_exist)
	{
		log('info', 'Creating new campaign', MY_CAMPAIGN);
		const start	= new Date();
		let end		= new Date();
		end		= new Date(end.setDate(end.getDate() + 10));

		const starts_at = start.toISOString();
		const ends_at	= end.toISOString();

		const r = await witnesschain_client.createCampaign ({
			campaign			: MY_CAMPAIGN,
			description			: "This is example campaign for TreeHacks 2025. You can use this campaign to test the InfinityWatch app. You can take photo of anything you want and get rewarded for it.",
			type				: "individual",	// "group", "individual", OR "task"

			// Individual campaigns allow app users to perform one action at a time
			// Only "individual" campaigns are enabled at this point
			// ---- Group campaigns may require 2 values ---
			// location_limit_in_meters	: 100,		// how far can people in a group can be
			// time_limit_in_minutes	: 60,		// how long the referral link is valid

			tags			: [
				"campaign",
				"tags"
			],

			// lat, long, and radius is not mandatory, but highly recommended 
			// Please select your lat-long for campaigns to appear in the InfinityWatch app near you
			latitude		: LATITUDE,
			longitude		: LONGITUDE,
			radius			: 100, // in kms the radius of circle within which the campaign is valid

			banner_url		: "https://cdn.prod.website-files.com/646f3aca43cb308828caa9f2/6475bcaa03a904b42a3a8515_Next%20Frontier.png",	// images shown to user
			poster_url		: "https://d112y698adiu2z.cloudfront.net/photos/production/challenge_thumbnails/001/380/660/datas/original.png",

			currency		: "POINTS",	// What currency will be rewarded to participants, we only allow virtual in-app "POINTS" at this moment
			total_rewards		: 10.0,		// The MAX/total rewards the campaign can give
			reward_per_task		: 2.0,		// rewards per task
			fuel_required		: 1.0,		// Fuel that will be spent by the user for this task (recommended to set it to 1)

			starts_at		: starts_at,	//  When campaign starts and ends
			ends_at			: ends_at,

			max_submissions		: 2,// Max submissions that this campaign can accept

			is_active		: true	// true makes it immediately available to all users
		});

		if (r.success !== true)
		{
			log('error', 'Failed to create campaign', MY_CAMPAIGN);
		}
		else
		{
			log('success', 'Successfully created campaign', MY_CAMPAIGN);
		}
	}
	else {
		log('info', 'Using existing campaign', MY_CAMPAIGN);
	}

	let photos = [];

	while (true)
	{
		if (since)
		{
			log('info', 'Fetching photos since', since);
		}

		try // Receive geo-verified photos taken from InfinityWatch 
		{
			photos = await witnesschain_client.getCampaignPhotos (
					MY_CAMPAIGN,
					since
			);
		}
		catch (e)
		{
			log('error', 'Failed to fetch photos', e);
			photos = [];
		}

		if (photos.length > 0)
		{
			const new_since = (photos as any)[0]?.created_at;

			if (new_since)
				since = new_since;
		}

		log('info', `Found ${photos.length} new photos`);

		for (const p of photos as any)
		{
			if (! analyzed_photos[p.id])
			{
				log('info', 'Processing new photo', {
					id: p.id,
					url: p.photo_url
				});

				// Classify p.photo_url

				const filepath = path.join(__dirname, `photo_${p.id}.jpg`);
				await downloadImage(p.photo_url, filepath);
				const verified = await witnesschain_client.classifyPhotos([filepath], 'Photo verification task');
				if (verified)
				{
					log('success', 'Photo verified and accepted', p.id);
					await witnesschain_client.acceptPhoto(p.id);
				}
				else
				{
					log('error', 'Photo verification failed', p.id);
				}

				analyzed_photos[p.id] = true;
			}
		}

		await SLEEP(5);
	}
}

main()
	.then(() => log('success', 'Process completed'))
	.catch((error) => log('error', 'Process failed', error));
