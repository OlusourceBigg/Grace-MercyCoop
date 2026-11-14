const axios = require('axios');

const sendTermiiSMS = async (to, message) => {
  try {
    const apiKey = process.env.TERMII_API_KEY;
    if (!apiKey) {
      console.log(`[SMS Mock] To: ${to} | Message: ${message}`);
      return { success: true, mocked: true };
    }

    let formattedPhone = to.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '234' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }

    const payload = {
      to: formattedPhone,
      from: process.env.TERMII_SENDER_ID || 'GraceMercy',
      sms: message,
      type: 'plain',
      channel: 'generic',
      api_key: apiKey,
    };

    const response = await axios.post(
      `${process.env.TERMII_BASE_URL || 'https://api.ng.termii.com/api'}/sms/send`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error('[Termii SMS Error]:', error.response ? error.response.data : error.message);
    return { success: false, error: error.message };
  }
};

const sendExpoPushNotification = async (expoPushToken, title, body) => {
  if (!expoPushToken) return;

  try {
    await axios.post(
      'https://exp.host/--/api/v2/push/send',
      {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
      },
      {
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[Expo Push Error]:', error.response ? error.response.data : error.message);
  }
};

module.exports = { sendTermiiSMS, sendExpoPushNotification };