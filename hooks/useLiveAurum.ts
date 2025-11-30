import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AURUM_SYSTEM_INSTRUCTION } from '../services/geminiService';

export const useLiveAurum = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isError, setIsError] = useState(false);
  const [volume, setVolume] = useState(0); // 0 to 1
  const [transcript, setTranscript] = useState<{user: string, model: string}>({ user: '', model: '' });
  const [isMuted, setIsMuted] = useState(false);
  
  // Audio contexts and processing refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Mute state ref to be accessible in script processor callback
  const isMutedRef = useRef(false);

  // Helper: Create PCM Blob
  const createBlob = (data: Float32Array): { data: string; mimeType: string } => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);

    return {
      data: b64,
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  // Helper: Decode Base64 to ArrayBuffer
  const decodeAudioData = async (
    base64: string,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  // Analyze volume for visualization
  const analyzeVolume = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      // Normalize somewhat (0-255 -> 0-1)
      const normalizedVolume = Math.min(1, average / 50); 
      setVolume(prev => prev * 0.8 + normalizedVolume * 0.2); // Smooth it out
    }
    animationFrameRef.current = requestAnimationFrame(analyzeVolume);
  };

  const toggleMute = () => {
    const nextState = !isMutedRef.current;
    isMutedRef.current = nextState;
    setIsMuted(nextState);
  };

  const connect = useCallback(async () => {
    if (!process.env.API_KEY) {
      console.error("API Key missing");
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      
      // Output setup
      const outputNode = outputAudioContextRef.current.createGain();
      outputNode.connect(outputAudioContextRef.current.destination);
      
      // Input Setup
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Analyser for visualization (Input)
      analyserRef.current = inputAudioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Aurum Live Connection Opened");
            setIsConnected(true);
            setIsError(false);

            // Start Visualizer
            analyzeVolume();

            // Setup Input Stream
            if (!inputAudioContextRef.current) return;
            
            sourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
            
            // Connect source to analyser for visualization
            if (analyserRef.current) {
                sourceRef.current.connect(analyserRef.current);
            }

            scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (e) => {
              // If muted, send silence (zeros)
              if (isMutedRef.current) {
                // We still send packets to keep connection alive, but empty/silent
                // Or we can choose not to send. Sending silence is safer for connection.
                const l = e.inputBuffer.getChannelData(0).length;
                const silentData = new Float32Array(l); // zeroes
                const pcmBlob = createBlob(silentData);
                sessionPromise.then((session) => {
                   session.sendRealtimeInput({ media: pcmBlob });
                });
                return;
              }

              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                 session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            sourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
                setTranscript(prev => ({ ...prev, model: prev.model + message.serverContent?.outputTranscription?.text }));
            }
            if (message.serverContent?.inputTranscription) {
                 setTranscript(prev => ({ ...prev, user: prev.user + message.serverContent?.inputTranscription?.text }));
            }

            if (message.serverContent?.turnComplete) {
                setTimeout(() => {
                   setTranscript({ user: '', model: '' });
                }, 5000); 
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(base64Audio, ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode); 
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
               sourcesRef.current.forEach(src => src.stop());
               sourcesRef.current.clear();
               nextStartTimeRef.current = 0;
               setTranscript({ user: '', model: '' });
            }
          },
          onclose: () => {
            console.log("Aurum Live Connection Closed");
            setIsConnected(false);
          },
          onerror: (err) => {
            console.error("Aurum Live Error", err);
            setIsError(true);
            setIsConnected(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: { model: "gemini-2.5-flash-native-audio-preview-09-2025" },
          outputAudioTranscription: { model: "gemini-2.5-flash-native-audio-preview-09-2025" },
          systemInstruction: AURUM_SYSTEM_INSTRUCTION + "\n\nIMPORTANT : Tu es dans une conversation téléphonique intime. Parle avec une voix très lente, douce et chaleureuse. Fais des pauses souvent. TU PARLES UNIQUEMENT EN FRANÇAIS.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error("Failed to connect to Live API", e);
      setIsError(true);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (sessionRef.current) {
       sessionRef.current.then((session: any) => session.close());
       sessionRef.current = null;
    }

    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();

    if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }

    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }

    setIsConnected(false);
    setVolume(0);
    setTranscript({ user: '', model: '' });
    isMutedRef.current = false;
    setIsMuted(false);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { connect, disconnect, isConnected, isError, volume, transcript, isMuted, toggleMute };
};