/**
 * Firebase Cloud Messaging (FCM) can be used to send messages to clients on iOS, Android and Web.
 *
 * This sample uses FCM to send two types of messages to clients that are subscribed to the `news`
 * topic. One type of message is a simple notification message (display message). The other is
 * a notification message (display notification) with platform specific customizations. For example,
 * a badge is added to messages that are sent to iOS devices.
 */
const https = require('https');
const { google } = require('googleapis');
const axios = require('axios');


// const PROJECT_ID = '<YOUR-PROJECT-ID>';
// const PROJECT_ID = 'nurebo-79b68';
const PROJECT_ID = 'nurebo-admin';
const HOST = 'fcm.googleapis.com';
const PATH = '/v1/projects/' + PROJECT_ID + '/messages:send';
const MESSAGING_SCOPE = [
    'https://www.googleapis.com/auth/firebase.messaging',
    // 'https://www.googleapis.com/auth/userinfo.email',
    // 'https://www.googleapis.com/auth/firebase.database',
];
const SCOPES = [MESSAGING_SCOPE];

/**
 * Get a valid access token.
 */
// [START retrieve_access_token]
function getNureboAccessToken() {
  return new Promise(function(resolve, reject) {
    const key = require('./nurebo-79b68-firebase-adminsdk-3mfcv-bd9d65d38b.json');
    const jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      SCOPES,
      null
    );
    jwtClient.authorize(function(err, tokens) {
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens.access_token);
    });
  });
}

function getNureboAdminAccessToken() {
  return new Promise(function(resolve, reject) {
    const key = require('./nurebo-admin-firebase-adminsdk-hal67-a3fddf6301.json');
    const jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      SCOPES,
      null
    );
    jwtClient.authorize(function(err, tokens) {
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens.access_token);
    });
  });
}
// [END retrieve_access_token]

/**
 * Send HTTP request to FCM with given message.
 *
 * @param {object} fcmMessage will make up the body of the request.
 */
function sendFcmMessage(fcmMessage) {
  getAccessToken().then(function(accessToken) {
    const options = {
      hostname: HOST,
      path: PATH,
      method: 'POST',
      // [START use_access_token]
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
      // [END use_access_token]
    };

    const request = https.request(options, function(resp) {
      resp.setEncoding('utf8');
      resp.on('data', function(data) {
        console.log('Message sent to Firebase for delivery, response:');
        console.log(data);
      });
    });

    request.on('error', function(err) {
      console.log('Unable to send message to Firebase');
      console.log(err);
    });

    request.write(JSON.stringify(fcmMessage));
    request.end();
  });
}

async function sendFirebaseNureboNotification() {
  const accessToken = await getAccessToken();
  const message = {
    message: {
      "name": "Nometring",
      "data": {
        "mass": "1.3kg",
        "count": "3",
        // count23: '36652',
      },
      "notification": {
        title: 'Hello World',
        body: 'This is a Firebase Cloud Messaging notification',
        image: 'https://images.pexels.com/photos/8448578/pexels-photo-8448578.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      },
      "android": {
        // "collapse_key": string,
        "priority": "HIGH",
        // "priority": "NORMAL",
        // "ttl": '153s',
        // "restricted_package_name": string,
        "data": {
          string: 'string',
        },
        "notification": {
          "title": 'string6r5555555f5f5',
          // "body": string,
          // "icon": 'android12splash',
          // "icon": 'splash',
          // "icon": 'calendar_1',
          "icon": 'ic_launcher',
          // "color": '#0020FF',
          "sound": 'piece_of_cake_611',
          // "tag": 'stringbbbb',
          // "click_action": string,
          // "body_loc_key": string,
          // "body_loc_args": [
          //   string
          // ],
          // "title_loc_key": string,
          // "title_loc_args": [
          //   string
          // ],
          // "channel_id": string,
          // "ticker": string,
          // "sticky": true,
          // "event_time": string,
          // "local_only": boolean,
          // "notification_priority": "PRIORITY_MAX",
          "default_sound": true,
          "default_vibrate_timings": true,
          "default_light_settings": true,
          // "vibrate_timings": [
          //   "3.0s",
          //   "1.0s",
          //   "3.0s",
          //   "2.0s",
          // ],
          // "visibility": "PUBLIC",
          // "notification_count": integer,
          // "light_settings": {
          //   "color": {
          //     "red": 125,
          //     "green": 126,
          //     "blue": 200,
          //     // "alpha": number
          //   },
          //   light_on_duration: "2s",
          //   light_off_duration: "4s"
          // },
          // "image": string,
        },
        "fcm_options": {
          // object (AndroidFcmOptions)
        },
        "direct_boot_ok": true
      },
      "webpush": {
        // object (WebpushConfig)
      },
      "apns": {
        // object (ApnsConfig)
      },
      "fcm_options": {
        // object (FcmOptions)
      },
      // token:"efXp9S1mSyWvh9TaJpeSM3:APA91bGSTmYZm9ZjH-lQW28qgK0Z621xMa25qk5wr3ZGx1nzvMYMTZtZQzq_lMeraW3RhlOzpDtb7M3zxOTjKUFvz2T4iYuhSqbyt2oeW-Ae7ulE1doz-y0t3VuKjDVByeRdQJu7J8n5",
      // "token":"dmo98wNbTxa_wuNiLJ3F0G:APA91bEiUP2X_CopBCerjDl61i_hHRMP3IpsDgn3Vr7zsG1XsHtEX4y-fgEjT2s4ZRcTecmvdva5hF4gZpvS2UOGbUZtD5-M50BmZnvH7QyzhKo8avly4U4FIzm-5UoUWdfkROmMpp2L",
      token:"cGicYG7eSD2s-CWTfp2F-m:APA91bGrb5WJAsjpSMg5sW31hIlx2TQbvYopDc4Zn8OgkhroZKHY9JgLelZl0AGiSHk83_PWsXKztV2lztsE9b8a84OXrl8iju1-kdVpd7cZ_ZLD_a_E-bzLdJ1MS6ZvblHW4boAi-Bw",
      // "topic": 'string2g2gg2g2',
      // "condition": string
    },
  };

  const response = await axios.post(
      // `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
      `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
      message,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
  );

  console.log('Notification sent successfully:', response.data);
}

async function sendFirebaseNureboAdminNotification() {
  const accessToken = await getAccessToken();
  const message = {
    message: {
      "name": "Nometring",
      "data": {
        "mass": "1.3kg",
        "count": "3",
        // count23: '36652',
      },
      "notification": {
        title: 'Hello World',
        body: 'This is a Firebase Cloud Messaging notification',
        image: 'https://images.pexels.com/photos/8448578/pexels-photo-8448578.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      },
      "android": {
        // "collapse_key": string,
        "priority": "HIGH",
        // "priority": "NORMAL",
        // "ttl": '153s',
        // "restricted_package_name": string,
        "data": {
          string: 'string',
        },
        "notification": {
          "title": 'string6r5555555f5f5',
          // "body": string,
          // "icon": 'android12splash',
          // "icon": 'splash',
          // "icon": 'calendar_1',
          "icon": 'ic_launcher',
          // "color": '#0020FF',
          "sound": 'piece_of_cake_611',
          // "tag": 'stringbbbb',
          // "click_action": string,
          // "body_loc_key": string,
          // "body_loc_args": [
          //   string
          // ],
          // "title_loc_key": string,
          // "title_loc_args": [
          //   string
          // ],
          // "channel_id": string,
          // "ticker": string,
          // "sticky": true,
          // "event_time": string,
          // "local_only": boolean,
          // "notification_priority": "PRIORITY_MAX",
          "default_sound": true,
          "default_vibrate_timings": true,
          "default_light_settings": true,
          // "vibrate_timings": [
          //   "3.0s",
          //   "1.0s",
          //   "3.0s",
          //   "2.0s",
          // ],
          // "visibility": "PUBLIC",
          // "notification_count": integer,
          // "light_settings": {
          //   "color": {
          //     "red": 125,
          //     "green": 126,
          //     "blue": 200,
          //     // "alpha": number
          //   },
          //   light_on_duration: "2s",
          //   light_off_duration: "4s"
          // },
          // "image": string,
        },
        "fcm_options": {
          // object (AndroidFcmOptions)
        },
        "direct_boot_ok": true
      },
      "webpush": {
        // object (WebpushConfig)
      },
      "apns": {
        // object (ApnsConfig)
      },
      "fcm_options": {
        // object (FcmOptions)
      },
      // token:"efXp9S1mSyWvh9TaJpeSM3:APA91bGSTmYZm9ZjH-lQW28qgK0Z621xMa25qk5wr3ZGx1nzvMYMTZtZQzq_lMeraW3RhlOzpDtb7M3zxOTjKUFvz2T4iYuhSqbyt2oeW-Ae7ulE1doz-y0t3VuKjDVByeRdQJu7J8n5",
      // "token":"dmo98wNbTxa_wuNiLJ3F0G:APA91bEiUP2X_CopBCerjDl61i_hHRMP3IpsDgn3Vr7zsG1XsHtEX4y-fgEjT2s4ZRcTecmvdva5hF4gZpvS2UOGbUZtD5-M50BmZnvH7QyzhKo8avly4U4FIzm-5UoUWdfkROmMpp2L",
      token:"cGicYG7eSD2s-CWTfp2F-m:APA91bGrb5WJAsjpSMg5sW31hIlx2TQbvYopDc4Zn8OgkhroZKHY9JgLelZl0AGiSHk83_PWsXKztV2lztsE9b8a84OXrl8iju1-kdVpd7cZ_ZLD_a_E-bzLdJ1MS6ZvblHW4boAi-Bw",
      // "topic": 'string2g2gg2g2',
      // "condition": string
    },
  };

  const response = await axios.post(
      // `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
      `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
      message,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
  );

  console.log('Notification sent successfully:', response.data);
}

/**
 * Construct a JSON object that will be used to customize
 * the messages sent to iOS and Android devices.
 */
// function buildOverrideMessage() {
//   const fcmMessage = buildCommonMessage();
//   const apnsOverride = {
//     'payload': {
//       'aps': {
//         'badge': 1
//       }
//     },
//     'headers': {
//       'apns-priority': '10'
//     }
//   };
//
//   fcmMessage['message']['android'] = {
//     'notification': {
//       'click_action': 'android.intent.action.MAIN'
//     }
//   };
//   fcmMessage['message']['apns'] = apnsOverride;
//
//   return fcmMessage;
// }

/**
 * Construct a JSON object that will be used to define the
 * common parts of a notification message that will be sent
 * to any app instance subscribed to the news topic.
 */
// function buildCommonMessage() {
//   // return {
//   //   'message': {
//   //     'topic': 'news',
//   //     'notification': {
//   //       'title': 'FCM Notification',
//   //       'body': 'Notification from FCM'
//   //     }
//   //   }
//   // };
//   return {
//     "message": {
//       "token":"efXp9S1mSyWvh9TaJpeSM3:APA91bGSTmYZm9ZjH-lQW28qgK0Z621xMa25qk5wr3ZGx1nzvMYMTZtZQzq_lMeraW3RhlOzpDtb7M3zxOTjKUFvz2T4iYuhSqbyt2oeW-Ae7ulE1doz-y0t3VuKjDVByeRdQJu7J8n5",
//       // "token":"dmo98wNbTxa_wuNiLJ3F0G:APA91bEiUP2X_CopBCerjDl61i_hHRMP3IpsDgn3Vr7zsG1XsHtEX4y-fgEjT2s4ZRcTecmvdva5hF4gZpvS2UOGbUZtD5-M50BmZnvH7QyzhKo8avly4U4FIzm-5UoUWdfkROmMpp2L",
//       // "token":"cGicYG7eSD2s-CWTfp2F-m:APA91bGrb5WJAsjpSMg5sW31hIlx2TQbvYopDc4Zn8OgkhroZKHY9JgLelZl0AGiSHk83_PWsXKztV2lztsE9b8a84OXrl8iju1-kdVpd7cZ_ZLD_a_E-bzLdJ1MS6ZvblHW4boAi-Bw",
//       // "registration_ids": [
//       //   "efXp9S1mSyWvh9TaJpeSM3:APA91bGSTmYZm9ZjH-lQW28qgK0Z621xMa25qk5wr3ZGx1nzvMYMTZtZQzq_lMeraW3RhlOzpDtb7M3zxOTjKUFvz2T4iYuhSqbyt2oeW-Ae7ulE1doz-y0t3VuKjDVByeRdQJu7J8n5",
//       //   "dmo98wNbTxa_wuNiLJ3F0G:APA91bEiUP2X_CopBCerjDl61i_hHRMP3IpsDgn3Vr7zsG1XsHtEX4y-fgEjT2s4ZRcTecmvdva5hF4gZpvS2UOGbUZtD5-M50BmZnvH7QyzhKo8avly4U4FIzm-5UoUWdfkROmMpp2L",
//       // ],
//       "notification": {
//         "body":"This is an FCM notification message!",
//         "title":"FCM Message"
//       }
//     }
//   };
// }

// const message = process.argv[2];
// if (message && message === 'common-message') {
//   const commonMessage = buildCommonMessage();
//   console.log('FCM request body for message using common notification object:');
//   console.log(JSON.stringify(commonMessage, null, 2));
//   // sendFcmMessage(buildCommonMessage());
//   sendFirebaseNureboNotification();
// } else if (message && message === 'override-message') {
//   // const overrideMessage = buildOverrideMessage();
//   console.log('FCM request body for override message:');
//   console.log(JSON.stringify(overrideMessage, null, 2));
//   // sendFcmMessage(buildOverrideMessage());
//   sendFirebaseNureboNotification();
// } else {
//   console.log('Invalid command. Please use one of the following:\n'
//       + 'node index.js common-message\n'
//       + 'node index.js override-message');
// }

module.exports = {
  getNureboAccessToken,
  getNureboAdminAccessToken,
};