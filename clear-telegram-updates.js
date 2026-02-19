require('dotenv').config({ path: '.env.local' });

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('No token found!');
  process.exit(1);
}

// Clear webhook and pending updates
async function clearUpdates() {
  console.log('Clearing Telegram updates...');
  
  try {
    // Delete webhook with drop_pending_updates
    const response = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`);
    const result = await response.json();
    console.log('Delete webhook result:', result);
    
    // Get updates to clear the queue
    const updatesResponse = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=-1`);
    const updates = await updatesResponse.json();
    console.log('Pending updates:', updates.result?.length || 0);
    
    console.log('✅ Updates cleared!');
  } catch (error) {
    console.error('Error:', error);
  }
}

clearUpdates();