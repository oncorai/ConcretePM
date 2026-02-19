require('dotenv').config({ path: '.env.local' });

const token = process.env.TELEGRAM_BOT_TOKEN;
const baseUrl = `https://api.telegram.org/bot${token}`;

// Your chat ID from the screenshots
const YOUR_CHAT_ID = '6995463189';

async function sendTestMessage() {
  console.log('Sending test message to you...');
  
  try {
    const response = await fetch(`${baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: YOUR_CHAT_ID,
        text: '🤖 Test message from bot!\n\nIf you see this, the bot CAN send messages.\n\nNow try replying with any text.',
        parse_mode: 'Markdown'
      })
    });
    
    const result = await response.json();
    console.log('Send result:', result);
    
    if (result.ok) {
      console.log('✅ Message sent successfully!');
      console.log('Now starting to listen for your replies...\n');
      
      // Start polling after sending
      let offset = 0;
      
      async function poll() {
        const pollResponse = await fetch(`${baseUrl}/getUpdates?timeout=30&offset=${offset}`);
        const updates = await pollResponse.json();
        
        if (updates.result && updates.result.length > 0) {
          for (const update of updates.result) {
            offset = update.update_id + 1;
            console.log('📨 Received update:', JSON.stringify(update, null, 2));
            
            if (update.message && update.message.text) {
              console.log(`\n✅ Got your message: "${update.message.text}"\n`);
              
              // Send confirmation
              await fetch(`${baseUrl}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: update.message.chat.id,
                  text: `Got it! You said: "${update.message.text}"`
                })
              });
            }
          }
        } else {
          process.stdout.write('.');
        }
        
        setTimeout(poll, 1000);
      }
      
      poll();
      
    } else {
      console.error('❌ Failed to send message:', result);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

sendTestMessage();