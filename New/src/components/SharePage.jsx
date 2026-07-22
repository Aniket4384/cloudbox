import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  FileText,
  Download,
  HardDrive,
  FileImage,
  FileVideo,
  Archive,
} from "lucide-react";

const API_BASE_URL =  import.meta.env.VITE_BACKEND_URL;

const SharePage = () => {
  
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchSharedFile();
  }, []);

  const fetchSharedFile = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/file/shared/${token}`
      );

      setFile(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid or expired share link"
      );
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return <FileText size={70} />;

    if (file.type.startsWith("image"))
      return <FileImage size={70} className="text-green-500" />;

    if (file.type.startsWith("video"))
      return <FileVideo size={70} className="text-red-500" />;

    if (file.type.includes("zip"))
      return <Archive size={70} className="text-yellow-500" />;

    return <FileText size={70} className="text-blue-500" />;
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 Bytes";

    const kb = 1024;
    const mb = kb * 1024;
    const gb = mb * 1024;

    if (bytes >= gb) return (bytes / gb).toFixed(2) + " GB";
    if (bytes >= mb) return (bytes / mb).toFixed(2) + " MB";
    if (bytes >= kb) return (bytes / kb).toFixed(2) + " KB";

    return bytes + " Bytes";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-100">
        <div className="text-xl font-semibold animate-pulse">
          Loading shared file...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-slate-100 flex justify-center items-center">
        <div className="bg-white shadow-xl rounded-xl p-10 text-center">
          <h2 className="text-3xl font-bold text-red-600">
            Invalid Link
          </h2>

          <p className="mt-4 text-gray-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center px-5">

      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-lg">

        <div className="flex justify-center">
          {getFileIcon()}
        </div>

        <h1 className="text-2xl font-bold text-center mt-6">
          Shared File
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Someone shared this file with you.
        </p>

        <div className="mt-8 space-y-4">

          <div>
            <p className="text-gray-500 text-sm">
              File Name
            </p>

            <p className="font-semibold break-all">
              {file.fileName}
            </p>
          </div>

          <div className="flex justify-between">

            <div>
              <p className="text-gray-500 text-sm">
                Size
              </p>

              <p className="font-medium flex items-center gap-2">
                <HardDrive size={18} />
                {formatSize(file.size)}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Type
              </p>

              <p className="font-medium">
                {file.type}
              </p>
            </div>

          </div>

        </div>

        <button
          onClick={() => window.open(file.downloadUrl, "_blank")}
          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 transition text-white py-3 rounded-xl font-semibold flex justify-center items-center gap-3"
        >
          <Download size={20} />
          Download File
        </button>

      </div>

    </div>
  );
};

export default SharePage;