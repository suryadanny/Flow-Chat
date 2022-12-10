# Flow Chat - A peer to peer video chat application #
A peer to peer video sharing &amp; screen sharing service, made using WebRTC, JavaScript and Agora. 


It is a video call and screen sharing service based on WebRTC technology. we use Agora Service for signaling services - Signaling forms the bridge between both browsers that want to communicate with each other. Agora helps us with creating a channel between these two browsers to communicate  details like ICE candidates and SDP offers/answers. once the browsers has these relevant details pertaining to the other peer browser, they are able to form the connection via WebRTC API's.

**Note:** we are currently using open source stun & turn servers, to identify ICE candidates, i would suggest to recheck if stun and turn address are functional while using the repository

**Note:** would suggest to provide turn server details, to complement and augement issues one might face with just stun servers in the case of Symmetric NATs.

You can look into these resource to further understand what signaling means - https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling


**To use live deployed video conferencing application  -**

Live Video Service available at - https://suryadanny.github.io/Flow-Chat/

Steps to use:

assign/fill in any random value in create or join room slot.
provide the other user with the same room id to join the video conferencing session.
