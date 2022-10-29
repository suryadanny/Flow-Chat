let userStream;
let remoteStream;

let client;
let dataChannel;

let token;
let calle ; 

let screen= false;

let queryParams = new URLSearchParams(window.location.search)
let roomId = queryParams.get('room-id')

if(!roomId || typeof roomId === 'undefined' )
{
    window.location = 'flow-chat.html'
}

let APPID = '40f304d354544639ad9de0957ec38eb0';

let sessionToken;
let uid = Date.now().toString(36) + Math.random().toString(36).substring(2);

const stunServers = {
    iceServers:[
        {
            urls:['stun:stun3.l.google.com:19302',
                'stun:stun4.l.google.com:19302']
        }
    ]
}


let init = async () => {
    console.log("member uuid : ", uid)
    client = await AgoraRTM.createInstance(APPID)
    await client.login({uid,token})
    console.log("room id : ",roomId)
    channel = client.createChannel(roomId)

    await channel.join()

    channel.on('MemberJoined',handleUserJoined)
    channel.on('MemberLeft',handleMemberLeft)

    client.on('MessageFromPeer', handleMsgFromRemote)
    userStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false})
    document.getElementById('feed-1').srcObject = userStream

    
}

let handleMemberLeft =  (memberId) => {
    document.getElementById('feed-2').style.display = 'none'
}

let handleMsgFromRemote = async (message,memberId) => {
    message = JSON.parse(message.text)
    console.log('Messege from peer : ',message)
    
    if(message.type === 'offer')
    {
        createSDPAnswer(memberId,message.offer)
    }

    if(message.type === 'answer')
    {
        setAnswer(message.answer)
    }

    if(message.type === 'candidate'){
        if(streamConnection){
            streamConnection.addIceCandidate(message.candidate)
        }
    }
}

let setAnswer = async (answer) =>{
     if(!streamConnection.currentRemoteDescription){
        streamConnection.setRemoteDescription(answer)
     }
}


let handleUserJoined = async (memberId) => {
   console.log("new User Joined : " ,memberId)
   calle = memberId
   createSDPOffer(memberId)
}

let setupPeerConnection = async(memberId) => {
    streamConnection = new RTCPeerConnection(stunServers)
    
    remoteStream = new MediaStream()

    document.getElementById('feed-2').srcObject = remoteStream
    document.getElementById('feed-2').style.display = 'block'


    if(!userStream){
        userStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true})
        document.getElementById('feed-1').srcObject = userStream
    }

    userStream.getTracks().forEach(mediaTrack => {
        streamConnection.addTrack(mediaTrack,userStream)
    })

    streamConnection.addEventListener("track", (trackEvent)=>{
       trackEvent.streams[0].getTracks().forEach((mediaTrack) => {
        remoteStream.addTrack(mediaTrack)

       })  
        
    })

    // streamConnection.addEventListener("icecandidate", (event) => {
    //     if(event.candidate){
    //         console.log('ice candidate: ', event.candidate)
    //         client.sendMessageToPeer({text:JSON.stringify({'type':'candidate', 'candidate': event.candidate})},memberId)
    //     }
    // })

    streamConnection.onicecandidate = async (event) => {
        if(event.candidate){
            console.log("Ice candidate : ", event.candidate)
            client.sendMessageToPeer({text:JSON.stringify({'type':'candidate', 'candidate': event.candidate})},memberId)
        }
    }

}

let createSDPOffer = async (memberId) => {
    
    await setupPeerConnection(memberId)
    
    
  //  await sendSDPOffer(memberId)
    let sdpOffer = await streamConnection.createOffer()
    await streamConnection.setLocalDescription(sdpOffer)

    console.log('offer: ',sdpOffer)
    client.sendMessageToPeer({text:JSON.stringify({'type': 'offer' , 'offer': sdpOffer})},memberId)
    console.log('done')
}

let sendSDPOffer = async (memberId) => {
    let sdpOffer = await streamConnection.createOffer()
    await streamConnection.setLocalDescription(sdpOffer)

    console.log('offer: ',sdpOffer)
    client.sendMessageToPeer({text:JSON.stringify({'type': 'offer' , 'offer': sdpOffer})},memberId)
    console.log('done')
}

let createSDPAnswer = async(memberId,offer) => {
     
    await setupPeerConnection(memberId)
    await streamConnection.setRemoteDescription(offer)
    let sdpAnswer = await streamConnection.createAnswer()
    await streamConnection.setLocalDescription(sdpAnswer)
    client.sendMessageToPeer({text:JSON.stringify({'type': 'answer' , 'answer': sdpAnswer})},memberId)
}

let toggleCamera = async () => {
      let videoStream = userStream.getTracks().find(track => track.kind === 'video')
      if(videoStream.enabled){
        videoStream.enabled = false
        document.getElementById('cam-btn').style.backgroundColor = 'rgb(255,65,65)'
      }else{
        videoStream.enabled = true
         document.getElementById('cam-btn').style.backgroundColor = 'rgb(14, 212, 7, 0.9)'
      }
}

let toggleScreen = async () => {
   let closeUserStream;
   if(!screen){
    closeUserStream = userStream
    userStream = await navigator.mediaDevices.getDisplayMedia({video: true,audio: true});
    document.getElementById('screen-btn').style.backgroundColor = 'rgb(255,65,65)'
    screen = true;
   }else{
    closeUserStream = userStream
    userStream = await navigator.mediaDevices.getUserMedia({video: true,audio: true});
    document.getElementById('screen-btn').style.backgroundColor = 'rgb(14, 212, 7, 0.9)'
    screen = false;
   }
   
  streamConnection.getSenders().forEach((s) => {
      console.log("sender : " , s)
   })
   
   const videoSender =  streamConnection.getSenders().find(sender => (sender.track) && sender.track.kind === 'video')
   const audioSender =  streamConnection.getSenders().find(sender => (sender.track) && sender.track.kind === 'audio')
   
   userStream.getTracks().forEach(mediaTrack => {
     if(mediaTrack.kind === 'video' && videoSender){
        videoSender.replaceTrack(mediaTrack)
     }else if (mediaTrack.kind === 'audio' && audioSender) {
        audioSender.replaceTrack(mediaTrack)
     } else {
        console.log("media track didn't match with either audio/video", mediaTrack)
     }
  })

   document.getElementById('feed-1').srcObject = userStream
   closeUserStream.getTracks().forEach(track => {
       console.log('stopping track')
       track.stop()
   })
} 

let toggleMic = async () => {
    let audioStream = userStream.getTracks().find(track => track.kind === 'audio')
    console.log("mic toggle triggered", audioStream)
   if(audioStream && typeof audioStream !== 'undefined'){ 
    if(audioStream.enabled){
        audioStream.enabled = false
       document.getElementById('voice-btn').style.backgroundColor = 'rgb(255,65,65)'
    }else{
        audioStream.enabled = true
        document.getElementById('voice-btn').style.backgroundColor = 'rgb(14, 212, 7, 0.9)'
    }
   }else{
      console.log("audio stream not present --- reinitiating the user stream")
      userStream = await navigator.mediaDevices.getUserMedia({video: true,audio: true});
    
 
       document.getElementById('feed-1').srcObject = userStream

   }
}


let userLeftRoom = async () =>{
    await channel.leave()
    await client.logout()
}

document.getElementById('cam-btn').addEventListener('click',toggleCamera)
document.getElementById('voice-btn').addEventListener('click',toggleMic)
document.getElementById('screen-btn').addEventListener('click',toggleScreen)



window.addEventListener('beforeunload',userLeftRoom)

init()