require('dotenv').config({ path: '.env.local' });

const token = process.env.TELEGRAM_BOT_TOKEN;
const baseUrl = `https://api.telegram.org/bot${token}`;

let offset = 0;

async function getUpdates() {
  try {
    console.log('Polling for updates...');
    const response = await fetch(`${baseUrl}/getUpdates?timeout=10&offset=${offset}`);
    const data = await response.json();
    
    if (!data.ok) {
      console.error('API Error:', data);
      return;
    }
    
    if (data.result.length > 0) {
      console.log(`Got ${data.result.length} updates:`);
      
      for (const update of data.result) {
        console.log('\nUpdate:', JSON.stringify(update, null, 2));
        
        // Update offset
        offset = update.update_id + 1;
        
        // Reply to messages
        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const text = `Echo: ${update.message.text}`;
          
          console.log(`Sending reply to ${chatId}: ${text}`);
          
          const sendResponse = await fetch(`${baseUrl}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: text
            })
          });
          
          const sendResult = await sendResponse.json();
          console.log('Send result:', sendResult);
        }
      }
    } else {
      console.log('No new updates');
    }
    
    // Continue polling
    setTimeout(getUpdates, 1000);
    
  } catch (error) {
    console.error('Error:', error);
    setTimeout(getUpdates, 5000);
  }
}

console.log('Starting manual polling...');
getUpdates();