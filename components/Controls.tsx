import { useVoice, VoiceReadyState } from "@humeai/voice-react";
import { useEffect, useRef, useState } from "react";
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js';

export default function Controls() {
  const { connect, disconnect, readyState, sendUserInput } = useVoice();
  const [message, setMessage] = useState<string>("");
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const recordRef = useRef<any>(null);
  const micSelectRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let scrollingWaveform = false;

    const showWaveform = () => {
      if (waveformRef.current) {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }
        wavesurferRef.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: 'rgb(200, 0, 200)',
          progressColor: 'rgb(100, 0, 100)',
          renderFunction: (channels, ctx) => {
            const { width, height } = ctx.canvas;
            const scale = channels[0].length / width;
            const step = 10;

            ctx.translate(0, height / 2);
            ctx.strokeStyle = ctx.fillStyle;
            ctx.beginPath();

            for (let i = 0; i < width; i += step * 2) {
              const index = Math.floor(i * scale);
              const value = Math.abs(channels[0][index]);
              let x = i;
              let y = value * height;

              ctx.moveTo(x, 0);
              ctx.lineTo(x, y);
              ctx.arc(x + step / 2, y, step / 2, Math.PI, 0, true);
              ctx.lineTo(x + step, 0);

              x = x + step;
              y = -y;
              ctx.moveTo(x, 0);
              ctx.lineTo(x, y);
              ctx.arc(x + step / 2, y, step / 2, Math.PI, 0, false);
              ctx.lineTo(x + step, 0);
            }

            ctx.stroke();
            ctx.closePath();
          },
        });

        recordRef.current = wavesurferRef.current.registerPlugin(RecordPlugin.create({ scrollingWaveform, renderRecordedAudio: false }));

        RecordPlugin.getAvailableAudioDevices().then((devices: MediaDeviceInfo[]) => {
          console.log(devices);
          micSelectRef.current = devices[0].deviceId;
        });

        const deviceId = "default";
        recordRef.current.startRecording({ deviceId }).then(() => {
          console.log('Waveform started');
        });
      }
    };

    if (readyState === VoiceReadyState.OPEN) {
      showWaveform();
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [readyState]);

  return (
    <div className="w-full mt-10 p-4  flex justify-center align-bottom absolute bottom-0 flex-col">
      <div ref={waveformRef} />
      <input
        className="w-full bg-white"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            sendUserInput(message);
            setMessage("");
          }
        }}
      />
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full mb-3"
        onClick={() => {
          disconnect();
        }}
      >
        End Session
      </button>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full mb-3"
        onClick={() => {
          connect()
            .then(() => {
              // Handle success
            })
            .catch(() => {
              // Handle error
            });
        }}
      >
        Start Session
      </button>
    </div>
  );
}
