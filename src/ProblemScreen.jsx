import { useNavigate, useParams } from "react-router-dom";
import CodeEditor from "./CodeEditor";
import NavBar from "./NavBar";
import { useEffect, useRef, useState } from "react";
import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { jwtDecode } from "jwt-decode";
import {
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  PhoneIcon,
  CodeIcon,
  PhoneOffIcon,
  CircleUserRound
} from "lucide-react";
import toast from "react-hot-toast";

export default function ProblemScreen() {
  const [friends, setFriends] = useState([]);
  const [isCode, setIsCode] = useState(true);
  const [problem, setProblem] = useState(null);
  const [email, setEmail] = useState(null);
  const [name, setName] = useState(null);
  const { id } = useParams();
  const db = getFirestore();
  const auth = getAuth();
  const navigate = useNavigate();

  const [callId, setCallId] = useState(null);
  const [callStatus, setCallStatus] = useState("idle");
  const [currentPeer, setCurrentPeer] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const callDocRef = useRef(null);
  const callListenerUnsubscribe = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);

  useEffect(() => {
    const fetchProblem = async () => {
      const docRef = doc(db, "codingProblems", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProblem(docSnap.data());
      }
    };

    fetchProblem();
  }, [id, db]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setEmail(jwtDecode(token).email);
    setName(jwtDecode(token).email.split("@")[0]);
    loadUserData(jwtDecode(token).email);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const loadUserData = async (userEmail) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      setFriends(userDoc.data().friends || []);
    } else {
      console.log("No user document found for:", userEmail);
    }
  };

  useEffect(() => {
    let mediaCleanup;

    const initializeMedia = async () => {
      if (!isCode) {
        try {
          console.log("Initializing media...");
          const constraints = {
            video: !audioOnly,
            audio: true,
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          localStream.current = stream;

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          console.log("Media initialized successfully");
        } catch (error) {
          console.error("Error accessing media devices:", error);
          toast.error("Please allow access to microphone and camera");
        }
      }
    };

    initializeMedia();

    mediaCleanup = () => {
      if (isCode && localStream.current) {
        console.log("Stopping local media tracks");
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      }
    };

    return mediaCleanup;
  }, [isCode, audioOnly]);

  useEffect(() => {
    return () => {
      if (callListenerUnsubscribe.current) {
        callListenerUnsubscribe.current();
      }

      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }

      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
      }

      if (callId) {
        const callDoc = doc(db, "videoCalls", callId);
        setDoc(callDoc, { ended: true }, { merge: true }).catch(console.error);
      }
    };
  }, [db]);

  const createPeerConnection = () => {
    console.log("Creating peer connection");

    if (peerConnection.current) {
      peerConnection.current.close();
    }

    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
          ],
        },
        {
          urls: [
            "turn:openrelay.metered.ca:80",
            "turn:openrelay.metered.ca:443",
          ],
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
      iceCandidatePoolSize: 10,
    });

    console.log("Peer connection created");

    if (localStream.current) {
      console.log("Adding local tracks to peer connection");
      localStream.current.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream.current);
      });
    }

    peerConnection.current.ontrack = (event) => {
      console.log("Received remote track", event);
      if (remoteVideoRef.current && event.streams[0]) {
        console.log("Setting remote video stream");
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnection.current.onicecandidate = async (event) => {
      if (event.candidate && callDocRef.current) {
        console.log("Generated local ICE candidate", event.candidate);
        try {
          const candidatesCollection = collection(
            callDocRef.current,
            "candidates"
          );
          await addDoc(candidatesCollection, {
            ...event.candidate.toJSON(),
            source: email,
            added: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    };

    peerConnection.current.onconnectionstatechange = () => {
      console.log(
        "Connection state changed:",
        peerConnection.current.connectionState
      );
      switch (peerConnection.current.connectionState) {
        case "connected":
          setCallStatus("connected");
          toast.success("Call connected!");
          break;
        case "disconnected":
        case "failed":
        case "closed":
          if (callStatus === "connected") {
            toast.error("Call disconnected");
            setCallStatus("idle");
          }
          break;
        default:
          break;
      }
    };

    peerConnection.current.oniceconnectionstatechange = () => {
      console.log(
        "ICE connection state:",
        peerConnection.current.iceConnectionState
      );
    };

    return peerConnection.current;
  };

  const startCall = async (friendEmail) => {
    try {
      console.log("Starting call to", friendEmail);
      setCallStatus("calling");
      setCurrentPeer(friendEmail);

      if (!localStream.current) {
        console.log("Getting media for call...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: !audioOnly,
          audio: true,
        });

        localStream.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }

      const pc = createPeerConnection();

      const newCallId = `call_${Math.random().toString(36).substring(2, 15)}`;
      setCallId(newCallId);

      const callDoc = doc(db, "videoCalls", newCallId);
      callDocRef.current = callDoc;

      const callerCandidatesCollection = collection(callDoc, "candidates");

      console.log("Creating offer");
      const offerDescription = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offerDescription);

      const callData = {
        offer: {
          type: offerDescription.type,
          sdp: offerDescription.sdp,
        },
        createdAt: serverTimestamp(),
        caller: email,
        receiver: friendEmail,
        status: "pending",
        ended: false,
      };

      console.log("Saving call data to Firestore");
      await setDoc(callDoc, callData);

      await addDoc(collection(db, "videoCallRequests"), {
        caller: email,
        receiver: friendEmail,
        callId: newCallId,
        status: "pending",
        timestamp: serverTimestamp(),
      });

      console.log("Setting up listeners for remote answer and candidates");
      const unsubscribe = onSnapshot(callDoc, async (snapshot) => {
        const data = snapshot.data();

        if (data?.ended) {
          console.log("Call was marked as ended");
          toast.info("Call ended");
          cleanupCall();
          unsubscribe();
          return;
        }

        if (data?.status === "rejected") {
          console.log("Call was rejected");
          toast.info(`${friendEmail} declined the call`);
          cleanupCall();
          unsubscribe();
          return;
        }

        if (!pc.currentRemoteDescription && data?.answer) {
          console.log("Received remote answer");
          try {
            const answerDescription = new RTCSessionDescription(data.answer);
            await pc.setRemoteDescription(answerDescription);
            console.log("Set remote description from answer");
          } catch (error) {
            console.error("Error setting remote description:", error);
          }
        }
      });

      console.log("Setting up listener for remote ICE candidates");
      const candidatesUnsubscribe = onSnapshot(
        callerCandidatesCollection,
        (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              if (data && data.source !== email && pc.remoteDescription) {
                console.log("Adding remote ICE candidate");
                try {
                  await pc.addIceCandidate(
                    new RTCIceCandidate({
                      candidate: data.candidate,
                      sdpMid: data.sdpMid,
                      sdpMLineIndex: data.sdpMLineIndex,
                    })
                  );
                } catch (error) {
                  console.error("Error adding received ICE candidate:", error);
                }
              }
            }
          });
        }
      );

      callListenerUnsubscribe.current = () => {
        unsubscribe();
        candidatesUnsubscribe();
      };

      toast.success(`Calling ${friendEmail}...`);
    } catch (error) {
      console.error("Error starting call:", error);
      toast.error("Failed to start call. Please try again.");
      setCallStatus("idle");
      setCurrentPeer(null);
    }
  };

  useEffect(() => {
    if (!email) return;

    console.log("Setting up listener for incoming call requests");
    const q = query(
      collection(db, "videoCallRequests"),
      where("receiver", "==", email),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          console.log("Received call request from", data.caller);
          toast(
            (t) => (
              <span>
                📞 Incoming call from <b>{data.caller}</b>
                <br />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setIsCode(false);
                      joinIncomingCall(data.callId, data.caller);
                      updateDoc(change.doc.ref, { status: "accepted" });
                      toast.dismiss(t.id);
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => {
                      rejectCall(data.callId);
                      updateDoc(change.doc.ref, { status: "rejected" });
                      toast.dismiss(t.id);
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Decline
                  </button>
                </div>
              </span>
            ),
            {
              duration: 30000,
            }
          );
        }
      });
    });

    return () => unsubscribe();
  }, [email, db]);

  const joinIncomingCall = async (incomingCallId, callerEmail) => {
    try {
      console.log("Joining incoming call", incomingCallId, "from", callerEmail);
      setCallId(incomingCallId);
      setCallStatus("connecting");
      setCurrentPeer(callerEmail);

      if (!localStream.current) {
        console.log("Getting media for incoming call...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: !audioOnly,
          audio: true,
        });

        localStream.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }

      const pc = createPeerConnection();

      const callDoc = doc(db, "videoCalls", incomingCallId);
      callDocRef.current = callDoc;

      const callData = (await getDoc(callDoc)).data();
      console.log("Retrieved call data", callData);

      if (!callData) {
        console.error("No call data found");
        toast.error("Call data not found");
        cleanupCall();
        return;
      }

      await updateDoc(callDoc, {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });

      if (callData.offer) {
        console.log("Setting remote description from offer");
        await pc.setRemoteDescription(
          new RTCSessionDescription(callData.offer)
        );

        console.log("Creating answer");
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        await updateDoc(callDoc, {
          answer: {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
          },
        });

        console.log("Answer created and saved");
      }

      const candidatesCollection = collection(callDoc, "candidates");
      console.log("Setting up listener for ICE candidates");

      const candidatesUnsubscribe = onSnapshot(
        candidatesCollection,
        (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            if (change.type === "added") {
              const data = change.doc.data();
              if (data && data.source !== email && pc.remoteDescription) {
                console.log("Adding remote ICE candidate");
                try {
                  await pc.addIceCandidate(
                    new RTCIceCandidate({
                      candidate: data.candidate,
                      sdpMid: data.sdpMid,
                      sdpMLineIndex: data.sdpMLineIndex,
                    })
                  );
                } catch (error) {
                  console.error("Error adding received ICE candidate:", error);
                }
              }
            }
          });
        }
      );

      const callStatusUnsubscribe = onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (data?.ended) {
          console.log("Call was marked as ended");
          toast.info("Call ended");
          cleanupCall();
        }
      });

      callListenerUnsubscribe.current = () => {
        candidatesUnsubscribe();
        callStatusUnsubscribe();
      };

      toast.success(`Connected to call with ${callerEmail}`);
    } catch (error) {
      console.error("Error joining call:", error);
      toast.error("Failed to join call");
      cleanupCall();
    }
  };

  const rejectCall = async (rejectedCallId) => {
    try {
      console.log("Rejecting call", rejectedCallId);
      const callDoc = doc(db, "videoCalls", rejectedCallId);
      await updateDoc(callDoc, {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });
      toast.success("Call declined");
    } catch (error) {
      console.error("Error rejecting call:", error);
    }
  };

  const endCall = async () => {
    if (callId) {
      try {
        console.log("Ending call", callId);
        const callDoc = doc(db, "videoCalls", callId);
        await updateDoc(callDoc, {
          ended: true,
          endedAt: serverTimestamp(),
          endedBy: email,
        });

        cleanupCall();
        toast.success("Call ended");
      } catch (error) {
        console.error("Error ending call:", error);
        toast.error("Failed to end call properly");
        cleanupCall();
      }
    }
  };

  const cleanupCall = () => {
    console.log("Cleaning up call resources");

    if (callListenerUnsubscribe.current) {
      callListenerUnsubscribe.current();
      callListenerUnsubscribe.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    setCallId(null);
    setCallStatus("idle");
    setCurrentPeer(null);
    callDocRef.current = null;
  };

  const toggleMute = () => {
    if (!localStream.current) return;

    localStream.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (!localStream.current) return;

    localStream.current.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsVideoOff(!isVideoOff);
  };

  return (
    <div>
      <NavBar />
      {problem === null ? (
        <p className="mt-20 text-center py-20">Loading...</p>
      ) : (
        <div className="mt-20 p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-8">
            <div className="sm:flex-1">
              <div className="flex space-x-0 sm:space-x-0">
                <button
                  onClick={() => {
                    if (callStatus !== "idle") {
                      if (
                        window.confirm(
                          "You're in an active call. Switch to problem view?"
                        )
                      ) {
                        endCall();
                        setIsCode(true);
                      }
                    } else {
                      setIsCode(true);
                    }
                  }}
                  className={`px-4 w-36 py-2 ${
                    isCode == true ? "bg-blue-600" : "bg-blue-500"
                  } text-white border border-r-white rounded-l-xl hover:cursor-pointer transition-colors`}
                >
                  <div className="flex justify-center items-center gap-2">
                    <CodeIcon />
                    Problem
                  </div>
                </button>
                <button
                  onClick={() => setIsCode(false)}
                  className={`px-4 w-36 py-2 ${
                    isCode == false ? "bg-blue-600" : "bg-blue-500"
                  } text-white border border-l-white rounded-r-xl hover:cursor-pointer transition-colors`}
                >
                  <div className="flex justify-center items-center gap-2">
                    <PhoneIcon />
                    Call
                  </div>
                </button>
              </div>
              {isCode ? (
                <div className="mt-4 sm:mt-8 ">
                  <h1 className="text-3xl sm:text-4xl font-bold">
                    {problem.title}
                  </h1>
                  <p className="mt-4 sm:mt-8 text-lg sm:text-xl">
                    {problem.description}
                  </p>
                  <div className="mt-4 sm:mt-8 flex items-center gap-2">
                    Difficulty:{" "}
                    <p
                      className={`${
                        problem.difficulty === "Easy"
                          ? "text-green-500"
                          : problem.difficulty === "Medium"
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}
                    >
                      {problem.difficulty}
                    </p>
                  </div>
                  <p className="mt-4 sm:mt-8">
                    Tags: {problem.tags.join(", ")}
                  </p>
                  <div>
                    <h2 className="mt-4 sm:mt-8 text-xl sm:text-2xl font-medium">
                      Test cases:
                    </h2>
                    <ul className="mt-2 sm:mt-4">
                      {problem.testCases.map((testCase, index) => (
                        <li key={index} className="mb-2">
                          <h2 className="font-medium text-lg">
                            Test case {index + 1}
                          </h2>
                          <p>
                            Input:{" "}
                            <span className="font-medium">
                              {testCase.input.replace("\\n",", ")}
                            </span>
                          </p>
                          <p>
                            Output:{" "}
                            <span className="font-medium">
                              {testCase.expectedOutput}
                            </span>
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex mt-10 flex-col items-center">
                  <h2 className="text-2xl font-medium mb-4">
                    {callStatus === "idle"
                      ? "Video Call"
                      : callStatus === "calling"
                      ? `Calling ${currentPeer}...`
                      : `Call with ${currentPeer}`}
                  </h2>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative w-full">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-56 bg-gray-100 border rounded-lg object-cover"
                        style={{ display: isVideoOff ? "none" : "block" }}
                      />
                      {isVideoOff && (
                        <div className="w-full h-56 bg-gray-200 border rounded-lg flex items-center justify-center">
                          <p className="text-black">Your Camera is Off</p>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 text-sm rounded">
                        You {isMuted && "(Muted)"}
                      </div>
                    </div>

                    <div className="relative w-full">
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-56 bg-gray-100 border rounded-lg object-cover"
                      />
                      {callStatus !== "connected" && (
                        <div className="absolute top-0 left-0 w-full h-56 bg-gray-200 border rounded-lg flex items-center justify-center">
                          <p className="text-black">
                            {callStatus === "calling"
                              ? "Connecting..."
                              : <CircleUserRound className="h-20 w-20" />}
                          </p>
                        </div>
                      )}
                      {callStatus === "connected" && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 text-sm rounded">
                          {currentPeer}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      onClick={toggleMute}
                      className={`p-4 ${
                        isMuted
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white rounded-full hover:cursor-pointer transition-colors`}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <MicOffIcon /> : <MicIcon />}
                    </button>
                    <button
                      onClick={toggleVideo}
                      className={`p-4 ${
                        isVideoOff
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-blue-500 hover:bg-blue-600"
                      } text-white rounded-full hover:cursor-pointer transition-colors`}
                      title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                    >
                      {isVideoOff ? <VideoOffIcon /> : <VideoIcon />}
                    </button>
                    {callStatus !== "idle" && (
                      <button
                        onClick={endCall}
                        className="p-4 bg-red-500 text-white rounded-full hover:cursor-pointer hover:bg-red-600 transition-colors"
                        title="End call"
                      >
                        <PhoneOffIcon />
                      </button>
                    )}
                  </div>

                  {callStatus === "idle" && (
                    <div className="mt-6 w-full">
                      <h3 className="text-xl font-semibold mb-2">
                        Call a Friend
                      </h3>
                      <div className="flex flex-col gap-4">
                        {friends.length === 0 ? (
                          <p className="text-gray-500">
                            You have no friends yet.
                          </p>
                        ) : (
                          friends.map((friend) => (
                            <div
                              key={friend}
                              className="flex items-center justify-between w-full gap-8 p-4 rounded-xl bg-blue-100"
                            >
                              <div>{friend}</div>
                              <button
                                onClick={() => startCall(friend)}
                                disabled={callStatus !== "idle"}
                                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <PhoneIcon className="w-5 h-5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 text-xs text-gray-400">
                    Call Status: {callStatus} {callId && `| ID: ${callId}`}
                  </div>
                </div>
              )}
            </div>
            <div className="sm:flex-1 flex flex-col items-center">
              <CodeEditor testCases={problem.testCases} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
