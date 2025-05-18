import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function VideoUpload() {
  const [video, setVideo] = useState(null);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState("");
  const [videoUrl, setVideoUrl] = useState(null);
  const [frameUrl, setFrameUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [videoKey, setVideoKey] = useState(0);
  const videoRef = useRef(null);
  const [payloadLog, setPayloadLog] = useState(null);

  useEffect(() => {
    return () => {
      if (videoUrl?.startsWith("blob:")) URL.revokeObjectURL(videoUrl);
      if (frameUrl?.startsWith("blob:")) URL.revokeObjectURL(frameUrl);
    };
  }, [videoUrl, frameUrl]);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setVideo(selectedFile);
      setVideoUrl(null);
      setFrameUrl(null);
      setResult("");
      setStatus("");
      setPayloadLog(null);
    }
  };

  const uploadVideo = async () => {
    if (!video) {
      setStatus("⚠️ Please select a video file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", video);

    setIsLoading(true);
    setStatus("⏳ Analyzing video...");
    setResult("");
    setVideoUrl(null);
    setFrameUrl(null);
    setPayloadLog(null);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/upload/",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("FastAPI response:", response.data);

      const { accident_detected, frame_base64, video_path, frame_path } =
        response.data;

      if (accident_detected) {
        setStatus("✅ Accident Detected!");

        if (frame_base64) {
          setFrameUrl(`data:image/jpeg;base64,${frame_base64}`);
        } else if (frame_path) {
          setFrameUrl(`http://127.0.0.1:8000${frame_path}`);
        }

        if (video_path) {
          const fullVideoUrl = `http://127.0.0.1:8000${video_path}`;
          setVideoUrl(fullVideoUrl);
          setVideoKey((prev) => prev + 1);
        }
      } else {
        setStatus("✅ Analysis complete");
        setResult("No accident detected in the video");
      }

    } catch (error) {
      console.error("FastAPI error:", error.message);
      setStatus(`❌ Error processing video: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoError = () => {
    setStatus("⚠️ Video playback error. Try downloading it instead.");
  };

  const tryAlternativeMethod = async () => {
    if (!videoUrl) return;
    try {
      const res = await axios.get(videoUrl, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "video/mp4" });
      setVideoUrl(URL.createObjectURL(blob));
      setVideoKey((prev) => prev + 1);
    } catch (error) {
      console.error("Blob fallback error:", error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Accident Detection System
          </h1>

          <label
            htmlFor="video-upload"
            className="block mb-6 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors"
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-600">
              {video ? video.name : "Choose a video file"}
            </span>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          <button
            onClick={uploadVideo}
            disabled={!video || isLoading}
            className={`w-full px-4 py-2 rounded-lg font-medium text-white ${
              !video || isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } transition-colors`}
          >
            {isLoading ? (
              <span className="flex justify-center items-center gap-2">
                <Loader2 className="animate-spin" /> Processing...
              </span>
            ) : (
              "Analyze Video"
            )}
          </button>

          {status && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm flex items-center justify-center gap-2 ${
                status.includes("❌") || status.includes("⚠️")
                  ? "bg-red-100 text-red-700"
                  : status.includes("✅")
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {status.includes("❌") || status.includes("⚠️") ? (
                <AlertCircle className="h-5 w-5" />
              ) : status.includes("✅") ? (
                <CheckCircle className="h-5 w-5" />
              ) : null}
              {status}
            </div>
          )}

          {frameUrl && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3">Accident Frame</h2>
              <img
                src={frameUrl}
                alt="Accident Frame"
                className="w-full rounded-lg border border-gray-200"
              />
            </div>
          )}

          {videoUrl && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-3">
                Detected Accident Clip
              </h2>
              <video
                ref={videoRef}
                key={videoKey}
                controls
                autoPlay
                className="w-full rounded-lg border border-gray-200"
                preload="auto"
                onError={handleVideoError}
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="mt-2 text-sm text-gray-500">
                <p>If the video doesn't play:</p>
                <button
                  onClick={tryAlternativeMethod}
                  className="text-blue-600 hover:underline"
                >
                  Fix playback
                </button>{" "}
                |{" "}
                <a
                  href={videoUrl}
                  download="accident_clip.mp4"
                  className="text-blue-600 hover:underline"
                >
                  Download
                </a>
              </div>
            </div>
          )}

          {result && !videoUrl && (
            <div className="mt-4 p-3 bg-yellow-100 text-yellow-700 rounded-lg text-sm">
              {result}
            </div>
          )}

          {payloadLog && (
            <div className="mt-6 text-left text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">
              <strong>Forwarded Payload:</strong>
              <pre className="overflow-x-auto text-xs text-gray-800 mt-2">
                {JSON.stringify(payloadLog, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
