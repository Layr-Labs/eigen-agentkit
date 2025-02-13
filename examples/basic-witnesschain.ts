import * as wc from '../src/WitnesschainAdapter';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as dotenv from 'dotenv';

const witnesschain_client = new wc.WitnesschainAdapter(
	process.env.WITNESSCHAIN_API_URL,
	process.env.WITNESSCHAIN_BLOCKCHAIN_API_URL,
	process.env.WITNESSCHAIN_PRIVATE_KEY
);

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

const LATITUDE		= 10.0;
const LONGITUDE		= 10.0;
const MY_CAMPAIGN	= "MyCampaign";

async function main()
{
	const logged_in = await witnesschain_client.authenticate (
				LATITUDE,
				LONGITUDE
	);

	let	since		= null;
	const	analyzed_photos = {};

	if (! logged_in)
	{
		console.error("Could not login to witnesschain");
		return;
	}

	// Create a campaign if it does not exist

	const existing_campaigns	= await witnesschain_client.getCampaigns();
	const campaign_exist		= existing_campaigns.some((v) => v.id === MY_CAMPAIGN);

	if (! campaign_exist)
	{
		const start	= new Date();
		let end		= new Date();
		end		= new Date(end.setDate(end.getDate() + 10));

		const starts_at = start.toISOString();
		const ends_at	= end.toISOString();

		const r = await witnesschain_client.createCampaign ({
			campaign			: MY_CAMPAIGN,
			description			: "my-campaign-description",
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
			latitude		: LONGITUDE,
			longitude		: LATITUDE,
			radius			: 100, // in kms the radius of circle within which the campaign is valid

			banner_url		: "https://www.google.com/x.png",	// images shown to user
			poster_url		: "https://www.google.com/x.png",

			currency		: "POINTS",	// What currency will be rewarded to participants, we only allow virtual in-app "POINTS" at this moment
			total_rewards		: 10.0,		// The MAX/total rewards the campaign can give
			reward_per_task		: 2.0,		// rewards per task
			fuel_required		: 1.0,		// Fuel that will be spent by the user for this task (recommended to set it to 1)

			starts_at		: starts_at,	//  When campaign starts and ends
			ends_at			: ends_at,

			max_submissions		: 10000,// Max submissions that this campaign can accept

			is_active		: true	// true makes it immediately available to all users
		});

		if (r.success !== true)
			console.error("Failed to create a campaign");
	}

	let photos = [];

	while (true)
	{
		if (since)
			console.log("===> Getting photos since",since);

		try // Receive geo-verified photos taken from InfinityWatch 
		{
			photos = await witnesschain_client.getCampaignPhotos (
					MY_CAMPAIGN,
					since
			);
		}
		catch (e)
		{
			console.error(e);
			photos = [];
		}

		if (photos.length > 0)
		{
			const new_since = (photos as any)[0]?.created_at;

			if (new_since)
				since = new_since;
		}

		console.log("Got",photos.length,"photos ...");

		for (const p of photos as any)
		{
			if (! analyzed_photos[p.id])
			{
				console.log("Analyzing", p.photo_url);

				// Classify p.photo_url

				const filepath = path.join(__dirname, `photo_${p.id}.jpg`);
				await downloadImage(p.photo_url, filepath);
				const verified = await witnesschain_client.classifyPhotos([filepath], 'Photo verification task');
				if (verified)
				{
					console.log("Verified");
					await witnesschain_client.acceptPhoto(p.id);
				}

				analyzed_photos[p.id] = true;
			}
		}

		await SLEEP(5);
	}
}

main()
	.then(() => console.log("Done"));
