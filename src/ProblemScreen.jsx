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
} from "lucide-react";

export default function ProblemScreen() {
  const [isCode, setIsCode] = useState(true);
  const [problem, setProblem] = useState(null);
  const [email, setEmail] = useState(null);
  const [name, setName] = useState(null);
  const { id } = useParams();
  const db = getFirestore();
  const auth = getAuth();
  const navigate = useNavigate();

  const [callId, setCallId] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    const fetchProblem = async () => {
      const docRef = doc(db, "codingProblems", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProblem(docSnap.data());
      }
    };

    fetchProblem();
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    setEmail(jwtDecode(token).email);
    setName(jwtDecode(token).email.split("@")[0]);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const [audioOnly, setAudioOnly] = useState(false);

  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: !audioOnly,
          audio: true,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        peerConnection.current = setupPeerConnection(stream);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        alert("Please allow access to microphone.");
      }
    };

    startMedia();

    return () => {
      if (callId) {
        const callDoc = doc(db, "videoCalls", callId);
        setDoc(callDoc, { ended: true }, { merge: true });
      }
    };
  }, [audioOnly, callId]);

  const setupPeerConnection = (stream) => {
    if (!peerConnection.current) {
      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      stream
        .getTracks()
        .forEach((track) => peerConnection.current.addTrack(track, stream));

      peerConnection.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnection.current.onicecandidate = async (event) => {
        if (event.candidate && callId) {
          await setDoc(
            doc(db, "videoCalls", callId),
            { iceCandidate: event.candidate },
            { merge: true }
          );
        }
      };
    }
    return peerConnection.current;
  };

  const startCall = async () => {
    const newCallId = Math.random().toString(36).substring(7);
    setCallId(newCallId);
    const callDoc = doc(db, "videoCalls", newCallId);

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    await setDoc(callDoc, { offer });

    onSnapshot(callDoc, async (snapshot) => {
      const data = snapshot.data();
      if (data?.answer) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
      if (data?.iceCandidate) {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(data.iceCandidate)
        );
      }
    });
  };

  useEffect(() => {
    if (!isCode && peerConnection.current) {
      startCall();
    }
  }, [isCode]);

  const joinCall = async () => {
    if (!callId) return;
    const callDoc = doc(db, "videoCalls", callId);
    const callData = (await getDoc(callDoc)).data();

    if (callData?.offer) {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(callData.offer)
      );
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      await setDoc(callDoc, { answer }, { merge: true });
    }

    onSnapshot(callDoc, async (snapshot) => {
      const data = snapshot.data();
      if (data?.iceCandidate) {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(data.iceCandidate)
        );
      }
    });
  };

  const toggleMute = () => {
    const stream = localVideoRef.current?.srcObject;
    if (!stream) {
      console.warn("No media stream found");
      return;
    }

    stream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsMuted(!isMuted);
  };

  useEffect(() => {
    if (!isCode && peerConnection.current) {
      startCall();
    }
  }, [isCode]);

  const toggleVideo = () => {
    const stream = localVideoRef.current?.srcObject;
    if (!stream) {
      console.warn("No media stream found");
      return;
    }

    stream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsVideoOff(!isVideoOff);
    setAudioOnly(!isVideoOff);
  };

  return (
    <div>
      <NavBar />
      {problem === null ? (
        <p className="mt-20 text-center py-20">Loading...</p>
      ) : (
        <div className="mt-20 p-8">
          <button
            onClick={() => setIsCode(true)}
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
          <div className="flex justify-between">
            <div className="mt-10 flex justify-between">
              {isCode ? (
                <div>
                  <h1 className="text-4xl font-bold">{problem.title}</h1>
                  <p className="mt-8 text-xl">{problem.description}</p>
                  <div className="mt-8 flex items-center gap-2">
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
                  <p className="mt-8">Tags: {problem.tags.join(", ")}</p>
                  <div>
                    <h2 className="mt-8 text-2xl font-medium">Test cases:</h2>
                    <ul className="mt-4">
                      {problem.testCases.map((testCase, index) => (
                        <li key={index} className="mb-2">
                          <h2 className="font-medium text-lg">
                            Test case {index + 1}
                          </h2>
                          <p>
                            Input:{" "}
                            <span className="font-medium">
                              {testCase.input}
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
                <div>
                  <div className="w-1/2 flex flex-col items-center">
                    <h2 className="text-2xl font-medium">Video Call</h2>
                    <div className="flex gap-4">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        className="w-1/2 border"
                        style={{ display: isVideoOff ? "none" : "block" }}
                      />
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-1/2 border"
                        style={{ display: isVideoOff ? "none" : "block" }}
                      />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={startCall}
                        className="px-4 py-2 bg-blue-500 text-white rounded"
                      >
                        Start Call
                      </button>
                      <input
                        type="text"
                        placeholder="Connect with your friends..."
                        onChange={(e) => setCallId(e.target.value)}
                        className="p-2 border"
                      />
                      <button
                        onClick={joinCall}
                        className="px-4 py-2 bg-green-500 text-white rounded"
                      >
                        Join Call
                      </button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={toggleMute}
                        className="p-4 bg-blue-500 text-white rounded-full hover:cursor-pointer hover:bg-blue-600 transition-colors"
                      >
                        {isMuted ? <MicOffIcon /> : <MicIcon />}
                      </button>
                      <button
                        onClick={toggleVideo}
                        className="p-4 bg-blue-500 text-white rounded-full hover:cursor-pointer hover:bg-blue-600 transition-colors"
                      >
                        {isVideoOff ? <VideoOffIcon /> : <VideoIcon />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <CodeEditor testCases={problem.testCases} />
          </div>
        </div>
      )}
    </div>
  );
}
