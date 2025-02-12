import { WitnesschainAdapter } from '../src/WitnesschainAdapter';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const LATITUDE		= 10.0;
const LONGITUDE		= 10.0;
const MY_CAMPAIGN	= "MyCampaign";

async function main() {

  if (! process.env.WITNESSCHAIN_PRIVATE_KEY)
  {
	console.error("===> WITNESSCHAIN_PRIVATE_KEY environment variable not defined");
        process.exit(-1);
  }

  // Initialize the Witnesschain adapter
  const witnesschain = new WitnesschainAdapter(
    process.env.WITNESSCHAIN_API_URL,
    process.env.WITNESSCHAIN_BLOCKCHAIN_API_URL,
    process.env.WITNESSCHAIN_PRIVATE_KEY
  );

  try {
    console.log('Initializing Witnesschain adapter...');

    // Verify images
    console.log('\nVerifying images...');
    const imagePaths = ['IMG_1347.jpeg', 'IMG_1348.jpeg'];
    const task = 'Reduce electricity consumption';
    const verificationResponse = await witnesschain.verifyPhotos(imagePaths, task);
    console.log('Verification Response:', verificationResponse?.data);

    // Authenticate with Witnesschain
    console.log('\nAuthenticating with Witnesschain...');
    const authenticated = await witnesschain.authenticate(
      12.9,
      77.5
    );
    console.log('Authentication successful:', authenticated);

    if (authenticated) {
      // Get balance
      console.log('\nChecking balance...');
      const balance = await witnesschain.getBalance();
      console.log('Current balance:', balance);

      // Fetch campaigns
      console.log('\nFetching campaigns...');
      const campaigns = await witnesschain.getCampaigns();
      console.log('Campaigns:', campaigns);

      const start	= new Date();
      let end		= new Date();
      end		= new Date(end.setDate(end.getDate() + 10));

      const starts_at = start.toISOString(); 
      const ends_at	= end.toISOString();

      // Create a new campaign
      console.log('\nCreating a new campaign...');
      const campaignResponse = await witnesschain.createCampaign ({
			campaign			: MY_CAMPAIGN,
			description			: "my-campaign-description",
			type				: "individual",	// "group", "individual", OR "task"

			// ---- Group campaigns may require 2 values ---
			// location_limit_in_meters	: 100,		// how far can people in a group can be
			// time_limit_in_minutes	: 60,		// how long the referral link is valid

			tags			: [
				"campaign",
				"tags"
			],

			// lat, long, and radius is not mandatory
			latitude		: LONGITUDE,
			longitude		: LATITUDE,
			radius			: 100, // in kms the radius of circle within which the campaign is valid

			banner_url		: "https://www.google.com/x.png",	// images shown to user 
			poster_url		: "https://www.google.com/x.png",

			currency		: "POINTS",	// What currency will be rewarded to participants
			total_rewards		: 10.0,		// The MAX/total rewards the campaign can give
			reward_per_task		: 2.0,		// rewards per task
			fuel_required		: 1.0,		// Fuel that will be spent by the user for this task

			starts_at		: starts_at,	//  When campaign starts and ends
			ends_at			: ends_at,

			max_submissions		: 10000,// Max submissions that this campaign can accept

			is_active		: true	// true makes it immediately available to all users
	});

      console.log('Campaign Created:', campaignResponse);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
